import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  RoutuneError,
  type APIErrorBody,
} from './errors';
import { VERSION } from './version';

export const DEFAULT_BASE_URL = 'https://api.routune.com';
export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 60_000;

export interface ClientOptions {
  /** Workspace API key (`rtn_live_…`). Defaults to `process.env.ROUTUNE_API_KEY`. */
  apiKey?: string;
  /** Defaults to `process.env.ROUTUNE_BASE_URL`, then `https://api.routune.com`. */
  baseURL?: string;
  /** Per-attempt timeout in milliseconds. Default 60 seconds. */
  timeout?: number;
  /** Retries for connection errors, timeouts, 429 and 5xx. Default 2. */
  maxRetries?: number;
  /** Headers sent with every request. */
  defaultHeaders?: Record<string, string>;
  /** A custom fetch (proxies, tests). Defaults to the global fetch. */
  fetch?: typeof fetch;
  /**
   * API keys are secrets: the client refuses to run in a browser, where anyone could read the key.
   * Set this only if you really know the page is never served to others.
   */
  dangerouslyAllowBrowser?: boolean;
}

export interface RequestOptions {
  /**
   * Sent as `Idempotency-Key` on POST requests. The client generates one per call when you do
   * not, so its own retries never create a second record; pass yours to make retries across
   * process restarts safe too.
   */
  idempotencyKey?: string;
  timeout?: number;
  maxRetries?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

type QueryValue = string | number | boolean | null | undefined;

export interface FinalRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, QueryValue> | object;
  body?: unknown;
  options?: RequestOptions;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as { document?: unknown }).document !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
}

function readEnv(name: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  const value = g.process?.env?.[name]?.trim();
  return value || undefined;
}

function runtimeTag(): string {
  const g = globalThis as { process?: { version?: string } };
  return g.process?.version ? `node/${g.process.version}` : 'runtime/unknown';
}

function newIdempotencyKey(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return `routune-node-${c.randomUUID()}`;
  return `routune-node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Encodes one path parameter; an empty id would silently hit a different endpoint. */
export function pathParam(name: string, value: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RoutuneError(`Expected a non-empty string for ${name}.`);
  }
  return encodeURIComponent(value);
}

export class APIClient {
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly #apiKey: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions = {}) {
    if (isBrowser() && !options.dangerouslyAllowBrowser) {
      throw new RoutuneError(
        'Routune API keys are secrets and must not be used in a browser. Call the API from your server.',
      );
    }
    const apiKey = options.apiKey ?? readEnv('ROUTUNE_API_KEY');
    if (!apiKey) {
      throw new RoutuneError(
        'Missing API key. Pass { apiKey } or set ROUTUNE_API_KEY. Create one in Routune: Settings > API keys.',
      );
    }
    this.#apiKey = apiKey;
    this.baseURL = (options.baseURL ?? readEnv('ROUTUNE_BASE_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.defaultHeaders = { ...(options.defaultHeaders ?? {}) };
    const f = options.fetch ?? (globalThis.fetch as typeof fetch | undefined);
    if (!f) throw new RoutuneError('No fetch available. Use Node.js 18 or later, or pass { fetch }.');
    this.fetchImpl = f;
  }

  /** Never print the key, even by accident. */
  toJSON(): Record<string, unknown> {
    return { baseURL: this.baseURL, timeout: this.timeout, maxRetries: this.maxRetries };
  }

  buildURL(path: string, query?: FinalRequest['query']): string {
    const url = new URL(`${this.baseURL}${path}`);
    for (const [key, value] of Object.entries((query ?? {}) as Record<string, QueryValue>)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async request<T>(req: FinalRequest): Promise<T> {
    const opts = req.options ?? {};
    const maxRetries = opts.maxRetries ?? this.maxRetries;
    const idempotencyKey = req.method === 'POST' ? (opts.idempotencyKey ?? newIdempotencyKey()) : undefined;
    const url = this.buildURL(req.path, req.query);

    for (let attempt = 0; ; attempt += 1) {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': `routune-node/${VERSION} ${runtimeTag()}`,
        ...this.defaultHeaders,
        ...(opts.headers ?? {}),
        Authorization: `Bearer ${this.#apiKey}`,
      };
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      if (attempt > 0) headers['X-Routune-Retry-Count'] = String(attempt);
      if (req.body !== undefined) headers['Content-Type'] = 'application/json';

      const controller = new AbortController();
      const timeoutMs = opts.timeout ?? this.timeout;
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      const onUserAbort = () => controller.abort();
      if (opts.signal) {
        if (opts.signal.aborted) {
          clearTimeout(timer);
          throw new APIUserAbortError('Request was aborted.');
        }
        opts.signal.addEventListener('abort', onUserAbort, { once: true });
      }

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: req.method,
          headers,
          body: req.body === undefined ? undefined : JSON.stringify(req.body),
          signal: controller.signal,
        });
      } catch (cause) {
        clearTimeout(timer);
        opts.signal?.removeEventListener('abort', onUserAbort);
        if (opts.signal?.aborted) throw new APIUserAbortError('Request was aborted.');
        if (attempt < maxRetries) {
          await sleep(this.backoff(attempt));
          continue;
        }
        if (timedOut) throw new APIConnectionTimeoutError(`Request timed out after ${timeoutMs} ms.`, { cause });
        throw new APIConnectionError('Could not reach the Routune API.', { cause });
      }
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onUserAbort);

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        return (text ? JSON.parse(text) : undefined) as T;
      }

      const errorBody = await readErrorBody(response);
      if (attempt < maxRetries && shouldRetry(response, errorBody)) {
        await sleep(this.retryDelay(response, attempt));
        continue;
      }
      throw APIError.from(response.status, errorBody, response.headers, response.statusText || undefined);
    }
  }

  private backoff(attempt: number): number {
    const base = Math.min(500 * 2 ** attempt, 8_000);
    return base * (1 - Math.random() * 0.25);
  }

  private retryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter !== null) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
      const date = Date.parse(retryAfter);
      if (Number.isFinite(date)) return Math.min(Math.max(0, date - Date.now()), MAX_RETRY_DELAY_MS);
    }
    return this.backoff(attempt);
  }
}

function shouldRetry(response: Response, body: APIErrorBody | undefined): boolean {
  const status = response.status;
  if (status === 408 || status === 429 || status >= 500) return true;
  // Another call with the same Idempotency-Key is still running: its result will be replayed.
  if (status === 409 && body?.code === 'idempotency_in_progress') return true;
  return false;
}

async function readErrorBody(response: Response): Promise<APIErrorBody | undefined> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    const parsed = JSON.parse(text) as { error?: APIErrorBody } & APIErrorBody;
    return parsed.error ?? parsed;
  } catch {
    return undefined;
  }
}
