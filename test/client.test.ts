import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import Routune, {
  APIConnectionError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  RateLimitError,
  RoutuneError,
  VERSION,
} from '../src';

type Call = { url: URL; init: RequestInit & { headers: Record<string, string> } };

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function fakeFetch(...responses: Array<Response | Error>) {
  const calls: Call[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: new URL(String(input)), init: init as Call['init'] });
    const next = responses.shift();
    if (!next) throw new Error('unexpected request');
    if (next instanceof Error) throw next;
    return next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const KEY = 'rtn_test_not_a_real_key_for_tests';
const ORDER = { object: 'order', id: 'b3c1a1de-0000-4000-8000-000000000001', status: 'created' };

function client(f: ReturnType<typeof fakeFetch>, extra: Partial<ConstructorParameters<typeof Routune>[0]> = {}) {
  return new Routune({ apiKey: KEY, fetch: f.fetch, maxRetries: 2, ...extra });
}

describe('client setup', () => {
  it('needs an API key and reads ROUTUNE_API_KEY', () => {
    vi.stubEnv('ROUTUNE_API_KEY', '');
    expect(() => new Routune({ fetch: fakeFetch().fetch })).toThrow(/Missing API key/);
    vi.stubEnv('ROUTUNE_API_KEY', KEY);
    expect(() => new Routune({ fetch: fakeFetch().fetch })).not.toThrow();
    vi.unstubAllEnvs();
  });

  it('never serialises or prints the key', () => {
    const c = client(fakeFetch());
    expect(JSON.stringify(c)).not.toContain(KEY);
    expect(inspect(c, { depth: 5, showHidden: true })).not.toContain(KEY);
  });

  it('keeps VERSION in sync with package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(VERSION).toBe(pkg.version);
  });
});

describe('requests', () => {
  it('sends the key, JSON and a user agent to api.routune.com', async () => {
    const f = fakeFetch(json(200, ORDER));
    const order = await client(f).orders.retrieve(ORDER.id);
    expect(order).toEqual(ORDER);
    const { url, init } = f.calls[0]!;
    expect(url.toString()).toBe(`https://api.routune.com/v1/orders/${ORDER.id}`);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(init.headers['User-Agent']).toMatch(/^routune-node\/\d+\.\d+\.\d+ /);
    expect(init.headers['Idempotency-Key']).toBeUndefined();
  });

  it('encodes path ids and refuses empty ones', async () => {
    const f = fakeFetch(json(200, ORDER));
    await client(f).orders.retrieve('a/b?c');
    expect(f.calls[0]!.url.pathname).toBe('/v1/orders/a%2Fb%3Fc');
    expect(() => client(f).orders.retrieve('')).toThrow(RoutuneError);
  });

  it('sends one Idempotency-Key per POST and reuses it on retries', async () => {
    const f = fakeFetch(json(503, { error: { type: 'api_error', message: 'busy' } }), json(201, ORDER));
    const c = client(f);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await c.orders.create({} as never, { timeout: 1000 });
    const keys = f.calls.map((call) => call.init.headers['Idempotency-Key']);
    expect(keys[0]).toMatch(/^routune-node-/);
    expect(keys[1]).toBe(keys[0]);
    expect(f.calls[1]!.init.headers['X-Routune-Retry-Count']).toBe('1');
    expect(JSON.parse(String(f.calls[0]!.init.body))).toEqual({});
  });

  it('uses the caller Idempotency-Key when given', async () => {
    const f = fakeFetch(json(200, { object: 'leg_assignment' }));
    await client(f).orders.legs.assign('o1', 'l1', { driver_id: 'd1' }, { idempotencyKey: 'my-key' });
    expect(f.calls[0]!.url.pathname).toBe('/v1/orders/o1/legs/l1/assign');
    expect(f.calls[0]!.init.headers['Idempotency-Key']).toBe('my-key');
  });

  it('drops undefined query values', async () => {
    const f = fakeFetch(json(200, { object: 'list', data: [], has_more: false, next_cursor: null }));
    await client(f).orders.list({ status: 'delivered', customer_id: undefined, limit: 50 });
    expect(Object.fromEntries(f.calls[0]!.url.searchParams)).toEqual({ status: 'delivered', limit: '50' });
  });
});

describe('errors and retries', () => {
  it('maps the error envelope to typed errors', async () => {
    const f = fakeFetch(
      json(401, {
        error: { type: 'authentication_error', code: 'api_key_revoked', message: 'This API key was revoked.', request_id: 'req_1' },
      }),
    );
    const err = await client(f).orders.retrieve('x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err).toMatchObject({ status: 401, code: 'api_key_revoked', requestId: 'req_1', message: 'This API key was revoked.' });
    expect(f.calls).toHaveLength(1); // 4xx is not retried
  });

  it('does not retry a 409 assignment_changed but does retry idempotency_in_progress', async () => {
    const changed = fakeFetch(json(409, { error: { code: 'assignment_changed', message: 'Changed.' } }));
    await expect(client(changed).orders.legs.assign('o', 'l', { driver_id: 'd' })).rejects.toBeInstanceOf(ConflictError);
    expect(changed.calls).toHaveLength(1);

    const inProgress = fakeFetch(
      json(409, { error: { code: 'idempotency_in_progress' } }, { 'retry-after': '0' }),
      json(201, ORDER),
    );
    await expect(client(inProgress).orders.create({} as never)).resolves.toEqual(ORDER);
    expect(inProgress.calls).toHaveLength(2);
  });

  it('waits Retry-After on 429 and gives up after maxRetries', async () => {
    const limited = () => json(429, { error: { type: 'rate_limit_error', code: 'rate_limited' } }, { 'retry-after': '0' });
    const f = fakeFetch(limited(), limited(), limited());
    const err = await client(f).drivers.list().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBe(0);
    expect(f.calls).toHaveLength(3);
  });

  it('retries connection errors, then throws APIConnectionError', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const f = fakeFetch(new TypeError('fetch failed'), new TypeError('fetch failed'));
    const err = await client(f, { maxRetries: 1 })
      .customers.retrieve('c1')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(APIConnectionError);
    expect(f.calls).toHaveLength(2);
  });

  it('surfaces 404 as NotFoundError with the request id header', async () => {
    const f = fakeFetch(json(404, { error: { message: 'Not found' } }, { 'x-request-id': 'req_h' }));
    const err = await client(f).locations.retrieve('nope').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotFoundError);
    expect((err as NotFoundError).requestId).toBe('req_h');
  });
});

describe('pagination', () => {
  const page = (ids: string[], next: string | null) =>
    json(200, { object: 'list', data: ids.map((id) => ({ id })), has_more: next !== null, next_cursor: next });

  it('awaits to the first page', async () => {
    const f = fakeFetch(page(['a', 'b'], 'cur_2'));
    const first = await client(f).orders.list({ limit: 2 });
    expect(first.data.map((o) => o.id)).toEqual(['a', 'b']);
    expect(first.hasNextPage()).toBe(true);
    expect(first.next_cursor).toBe('cur_2');
  });

  it('iterates every item across pages with the cursor', async () => {
    const f = fakeFetch(page(['a', 'b'], 'cur_2'), page(['c'], null));
    const ids: string[] = [];
    for await (const order of client(f).orders.list({ limit: 2, status: 'created' })) ids.push(order.id);
    expect(ids).toEqual(['a', 'b', 'c']);
    expect(f.calls[0]!.url.searchParams.get('cursor')).toBeNull();
    expect(f.calls[1]!.url.searchParams.get('cursor')).toBe('cur_2');
    expect(f.calls[1]!.url.searchParams.get('status')).toBe('created');
  });

  it('starts from a given cursor', async () => {
    const f = fakeFetch(page(['z'], null));
    await client(f).priceSets.list({ cursor: 'cur_9' });
    expect(f.calls[0]!.url.searchParams.get('cursor')).toBe('cur_9');
  });
});
