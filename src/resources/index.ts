import { pathParam, type APIClient, type RequestOptions } from '../core';
import { PagePromise, type ListResponse } from '../pagination';
import type {
  Customer,
  CustomerListParams,
  Driver,
  DriverListParams,
  LegAssignment,
  LegAssignParams,
  Location,
  LocationCreateParams,
  LocationListParams,
  Order,
  OrderCreateParams,
  OrderListParams,
  OrderUpdateParams,
  PriceSet,
  PriceSetListParams,
} from '../types';

abstract class Resource {
  constructor(protected readonly client: APIClient) {}

  protected paginate<T>(path: string, params: object | undefined, options?: RequestOptions): PagePromise<T> {
    const { cursor, ...rest } = (params ?? {}) as { cursor?: string } & Record<string, unknown>;
    return new PagePromise<T>(
      (next) =>
        this.client.request<ListResponse<T>>({
          method: 'GET',
          path,
          query: { ...rest, cursor: next },
          options,
        }),
      cursor,
    );
  }
}

export class OrderLegs extends Resource {
  /**
   * Assigns a driver to one leg of an order. Pass `expected_current_driver_id` to reassign: if the
   * leg's driver changed in the meantime the API answers 409 `assignment_changed` and nothing moves.
   * Scope: `orders.assign`.
   */
  assign(orderId: string, legId: string, body: LegAssignParams, options?: RequestOptions): Promise<LegAssignment> {
    return this.client.request({
      method: 'POST',
      path: `/v1/orders/${pathParam('orderId', orderId)}/legs/${pathParam('legId', legId)}/assign`,
      body,
      options,
    });
  }
}

export class Orders extends Resource {
  readonly legs = new OrderLegs(this.client);

  /** Lists orders, newest first. Scope: `orders.read`. */
  list(params?: OrderListParams, options?: RequestOptions): PagePromise<Order> {
    return this.paginate<Order>('/v1/orders', params, options);
  }

  /** Creates an order. Retries are safe: an Idempotency-Key is sent automatically. Scope: `orders.write`. */
  create(body: OrderCreateParams, options?: RequestOptions): Promise<Order> {
    return this.client.request({ method: 'POST', path: '/v1/orders', body, options });
  }

  /** Retrieves an order with its legs. Scope: `orders.read`. */
  retrieve(id: string, options?: RequestOptions): Promise<Order> {
    return this.client.request({ method: 'GET', path: `/v1/orders/${pathParam('id', id)}`, options });
  }

  /** Updates an order's notes, reference or stop times. Scope: `orders.write`. */
  update(id: string, body: OrderUpdateParams, options?: RequestOptions): Promise<Order> {
    return this.client.request({ method: 'PATCH', path: `/v1/orders/${pathParam('id', id)}`, body, options });
  }
}

export class Customers extends Resource {
  /** Lists customers, newest first. Scope: `customers.read`. */
  list(params?: CustomerListParams, options?: RequestOptions): PagePromise<Customer> {
    return this.paginate<Customer>('/v1/customers', params, options);
  }

  /** Scope: `customers.read`. */
  retrieve(id: string, options?: RequestOptions): Promise<Customer> {
    return this.client.request({ method: 'GET', path: `/v1/customers/${pathParam('id', id)}`, options });
  }
}

export class Drivers extends Resource {
  /** Lists active drivers you can assign to legs. Scope: `drivers.read`. */
  list(params?: DriverListParams, options?: RequestOptions): PagePromise<Driver> {
    return this.paginate<Driver>('/v1/drivers', params, options);
  }
}

export class Locations extends Resource {
  /** Lists saved locations, newest first. Scope: `locations.read`. */
  list(params?: LocationListParams, options?: RequestOptions): PagePromise<Location> {
    return this.paginate<Location>('/v1/locations', params, options);
  }

  /** Saves a location (coordinates required). Scope: `locations.write`. */
  create(body: LocationCreateParams, options?: RequestOptions): Promise<Location> {
    return this.client.request({ method: 'POST', path: '/v1/locations', body, options });
  }

  /** Scope: `locations.read`. */
  retrieve(id: string, options?: RequestOptions): Promise<Location> {
    return this.client.request({ method: 'GET', path: `/v1/locations/${pathParam('id', id)}`, options });
  }
}

export class PriceSets extends Resource {
  /** Lists price sets; use one's id as `price_set_id` when creating orders. Scope: `pricing.read`. */
  list(params?: PriceSetListParams, options?: RequestOptions): PagePromise<PriceSet> {
    return this.paginate<PriceSet>('/v1/price_sets', params, options);
  }

  /** Scope: `pricing.read`. */
  retrieve(id: string, options?: RequestOptions): Promise<PriceSet> {
    return this.client.request({ method: 'GET', path: `/v1/price_sets/${pathParam('id', id)}`, options });
  }
}
