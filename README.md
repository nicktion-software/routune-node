# Routune Node.js library

The official Node.js and TypeScript library for the [Routune API](https://routune.com/developers): create and track deliveries in your Routune workspace from your own systems.

- Typed requests and responses, generated from the public OpenAPI spec
- Automatic retries with backoff for timeouts, rate limits and server errors
- Safe retries for creates: every POST carries an `Idempotency-Key`
- `for await` over any list to walk every page
- No runtime dependencies (uses the built-in `fetch`, Node.js 18+)

## Install

```sh
npm install @routune/node
```

## Authentication

Create an API key in Routune under **Settings > API keys** and give it only the scopes you need. Keys are secrets: keep them on your server, in an environment variable or a secret manager. The library refuses to run in a browser.

```sh
export ROUTUNE_API_KEY="rtn_live_…"
```

## Usage

```ts
import Routune from '@routune/node';

const routune = new Routune(); // reads ROUTUNE_API_KEY

const [priceSet] = (await routune.priceSets.list({ active: true, limit: 1 })).data;

const order = await routune.orders.create({
  customer_id: '2f1d7c8e-…',
  price_set_id: priceSet!.id,
  gross_weight: 12.5,
  chargeable_weight: 12.5,
  reference_number: 'ERP-10042',
  pickup: {
    location_id: '7b0f…',
    earliest_time: '2026-11-20T14:00:00Z',
    latest_time: '2026-11-20T16:00:00Z',
  },
  dropoff: {
    location_id: '9c41…',
    earliest_time: '2026-11-20T17:00:00Z',
    latest_time: '2026-11-20T19:00:00Z',
    signature_required: true,
  },
});

console.log(order.number, order.status);
```

### Assign a driver to a leg

```ts
const full = await routune.orders.retrieve(order.id);
const leg = full.legs![0]!;
const [driver] = (await routune.drivers.list({ limit: 1 })).data;

await routune.orders.legs.assign(order.id, leg.id, { driver_id: driver!.id });
```

To reassign, pass the driver you expect on the leg now. If someone changed it in the meantime the API answers `409 assignment_changed` and nothing moves:

```ts
await routune.orders.legs.assign(order.id, leg.id, {
  driver_id: newDriverId,
  expected_current_driver_id: leg.assigned_driver_id,
});
```

### Lists and pagination

Lists are newest first. `await` a list call for one page, or `for await` over it to walk every item; the library follows `next_cursor` for you.

```ts
const page = await routune.orders.list({ status: 'delivered', limit: 100 });
console.log(page.data.length, page.has_more);

for await (const order of routune.orders.list({ created_gte: '2026-11-01T00:00:00Z' })) {
  console.log(order.id);
}
```

### Errors

Failed requests throw a subclass of `APIError` with the API's `code` and a `requestId` to quote to support:

```ts
import { APIError, ConflictError, RateLimitError } from '@routune/node';

try {
  await routune.orders.legs.assign(orderId, legId, { driver_id });
} catch (err) {
  if (err instanceof ConflictError && err.code === 'assignment_changed') {
    // reload the order and decide again
  } else if (err instanceof APIError) {
    console.error(err.status, err.code, err.message, err.requestId);
  } else {
    throw err;
  }
}
```

| Status | Error class |
| --- | --- |
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 402 | `PaymentRequiredError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 422 | `UnprocessableEntityError` |
| 429 | `RateLimitError` |
| 5xx | `InternalServerError` |
| no answer | `APIConnectionError`, `APIConnectionTimeoutError` |

### Retries, timeouts and idempotency

Connection errors, timeouts, `429` and `5xx` answers are retried twice with exponential backoff (honouring `Retry-After`). POST requests carry an `Idempotency-Key`, the same on every retry, so a retried create never makes a second order. Pass your own key to stay safe across process restarts too:

```ts
const routune = new Routune({ maxRetries: 4, timeout: 20_000 });

await routune.orders.create(params, { idempotencyKey: `erp-order-${erpId}` });
```

### Configuration

| Option | Default |
| --- | --- |
| `apiKey` | `process.env.ROUTUNE_API_KEY` |
| `baseURL` | `process.env.ROUTUNE_BASE_URL`, then `https://api.routune.com` |
| `timeout` | `60000` ms per attempt |
| `maxRetries` | `2` |
| `defaultHeaders` | none |
| `fetch` | global `fetch` |

Per-request options: `idempotencyKey`, `timeout`, `maxRetries`, `signal`, `headers`.

## Rate limits and usage

600 requests a minute per key and 1,200 per workspace. Successful requests count towards your plan's monthly API requests.

## Versioning

This library follows semantic versioning. The API itself is versioned in the URL (`/v1`); additive changes (new fields, new endpoints) can arrive at any time, so do not fail on unknown fields.

## License

MIT
