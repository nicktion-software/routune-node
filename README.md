# Routune Node.js Library

[![npm version](https://img.shields.io/npm/v/@routune/node.svg)](https://www.npmjs.com/package/@routune/node)
[![CI](https://github.com/nicktion-software/routune-node/actions/workflows/ci.yml/badge.svg)](https://github.com/nicktion-software/routune-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

The official Node.js library for the [Routune API](https://routune.com/developers). Create orders, assign drivers and read your customers, locations and price sets from server-side JavaScript and TypeScript.

## Documentation

API reference and guides: [routune.com/developers](https://routune.com/developers).

## Requirements

- Node.js 18 or later (the library uses the built-in `fetch`)
- A Routune workspace on a plan that includes API access
- An API key from **Settings → API keys** in Routune

## Installation

```sh
npm install @routune/node
```

## Usage

The client reads your key from the `ROUTUNE_API_KEY` environment variable:

```ts
import Routune from '@routune/node';

const routune = new Routune();

const order = await routune.orders.create({
  customer_id: 'cus_uuid',
  price_set_id: 'price_set_uuid',
  gross_weight: 12.5,
  chargeable_weight: 12.5,
  reference_number: 'ERP-10042',
  pickup: {
    location_id: 'pickup_location_uuid',
    earliest_time: '2026-11-20T14:00:00Z',
    latest_time: '2026-11-20T16:00:00Z',
  },
  dropoff: {
    location_id: 'dropoff_location_uuid',
    earliest_time: '2026-11-20T17:00:00Z',
    latest_time: '2026-11-20T19:00:00Z',
    signature_required: true,
  },
});

console.log(order.number); // ORD-000123
```

Request parameters and responses are fully typed. Field names match the API (`snake_case`), IDs are UUID strings, times are ISO 8601 in UTC and amounts are integers in the currency's smallest unit.

> **Keep your API key secret.** Use it only on your server. Never ship it in a browser bundle or a mobile app. The library refuses to run in a browser.

## Resources

| Resource | Methods | Scope |
| --- | --- | --- |
| `orders` | `list`, `create`, `retrieve`, `update` | `orders.read`, `orders.write` |
| `orders.legs` | `assign` | `orders.assign` |
| `customers` | `list`, `retrieve` | `customers.read` |
| `drivers` | `list` | `drivers.read` |
| `locations` | `list`, `create`, `retrieve` | `locations.read`, `locations.write` |
| `priceSets` | `list`, `retrieve` | `pricing.read` |

### Assigning a driver

```ts
const { legs = [] } = await routune.orders.retrieve(orderId);

await routune.orders.legs.assign(orderId, legs[0].id, {
  driver_id: driverId,
});
```

To reassign a leg safely, send the driver you expect on it now. If the leg changed in the meantime, the API responds with `409 assignment_changed` and nothing is moved:

```ts
await routune.orders.legs.assign(orderId, leg.id, {
  driver_id: newDriverId,
  expected_current_driver_id: leg.assigned_driver_id,
});
```

## Pagination

List methods return results newest first. Awaiting a list call returns a single page:

```ts
const page = await routune.orders.list({ status: 'delivered', limit: 100 });

page.data;          // Order[]
page.has_more;      // boolean
page.hasNextPage(); // boolean
await page.getNextPage();
```

Iterate with `for await` to fetch every page automatically:

```ts
for await (const order of routune.orders.list({ created_gte: '2026-11-01T00:00:00Z' })) {
  console.log(order.number);
}
```

## Error handling

When the API returns an error, the library throws a subclass of `APIError`:

```ts
import { APIError, ConflictError } from '@routune/node';

try {
  await routune.orders.legs.assign(orderId, legId, { driver_id: driverId });
} catch (err) {
  if (err instanceof ConflictError && err.code === 'assignment_changed') {
    // Reload the order and decide again.
  } else if (err instanceof APIError) {
    console.error(err.status, err.code, err.message, err.requestId);
  } else {
    throw err;
  }
}
```

| Status | Error |
| --- | --- |
| 400 | `BadRequestError` |
| 401 | `AuthenticationError` |
| 402 | `PaymentRequiredError` |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 422 | `UnprocessableEntityError` |
| 429 | `RateLimitError` |
| ≥ 500 | `InternalServerError` |
| No response | `APIConnectionError`, `APIConnectionTimeoutError` |

Every `APIError` carries `status`, `type`, `code`, `message`, `details` and `requestId`. Include the `requestId` when you contact support.

## Retries

Connection errors, timeouts, `408`, `429` and `5xx` responses are retried twice by default with exponential backoff. `Retry-After` is respected. Configure the number of retries for the client or for a single request:

```ts
const routune = new Routune({ maxRetries: 4 });

await routune.orders.list({}, { maxRetries: 0 });
```

## Idempotency

Every `POST` request is sent with an `Idempotency-Key`, and retries reuse the same key, so a retried create never produces a duplicate. To stay safe across process restarts, pass a key derived from your own record:

```ts
await routune.orders.create(params, { idempotencyKey: `erp-order-${erpOrder.id}` });
```

## Timeouts

Each attempt times out after 60 seconds by default:

```ts
const routune = new Routune({ timeout: 20_000 }); // milliseconds

await routune.orders.retrieve(orderId, { timeout: 5_000 });
```

Pass an `AbortSignal` to cancel a request:

```ts
const controller = new AbortController();
await routune.orders.list({}, { signal: controller.signal });
```

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `apiKey` | `process.env.ROUTUNE_API_KEY` | Workspace API key |
| `baseURL` | `https://api.routune.com` | Also read from `ROUTUNE_BASE_URL` |
| `timeout` | `60000` | Milliseconds per attempt |
| `maxRetries` | `2` | Retries for retryable failures |
| `defaultHeaders` | `{}` | Headers sent with every request |
| `fetch` | `globalThis.fetch` | Custom `fetch` implementation |

Per-request options: `idempotencyKey`, `timeout`, `maxRetries`, `signal` and `headers`.

## Rate limits

Each API key can make 600 requests per minute, and each workspace 1,200. Responses include `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` headers. Successful requests count towards your plan's monthly API requests.

## Versioning

This package follows [Semantic Versioning](https://semver.org). The API is versioned in its URL (`/v1`). New fields and endpoints may be added at any time without a new API version, so your code should ignore fields it does not recognise.

## Support

- API documentation: [routune.com/developers](https://routune.com/developers)
- Bugs in this library: [open an issue](https://github.com/nicktion-software/routune-node/issues)
- Security issues: see [SECURITY.md](SECURITY.md). Do not open a public issue.

## License

[MIT](LICENSE). Routune is a product of Nicktion LLC.
