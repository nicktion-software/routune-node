import { APIClient, type ClientOptions } from './core';
import { Customers, Drivers, Locations, Orders, PriceSets } from './resources';

/**
 * Routune API client.
 *
 *     import Routune from '@routune/node';
 *     const routune = new Routune(); // reads ROUTUNE_API_KEY
 *     const order = await routune.orders.retrieve('…');
 */
export class Routune extends APIClient {
  readonly orders: Orders;
  readonly customers: Customers;
  readonly drivers: Drivers;
  readonly locations: Locations;
  readonly priceSets: PriceSets;

  constructor(options: ClientOptions = {}) {
    super(options);
    this.orders = new Orders(this);
    this.customers = new Customers(this);
    this.drivers = new Drivers(this);
    this.locations = new Locations(this);
    this.priceSets = new PriceSets(this);
  }
}

export default Routune;

export type { ClientOptions, RequestOptions } from './core';
export { DEFAULT_BASE_URL } from './core';
export { Page, PagePromise, type ListResponse } from './pagination';
export {
  RoutuneError,
  APIError,
  BadRequestError,
  AuthenticationError,
  PaymentRequiredError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  type APIErrorBody,
} from './errors';
export * from './types';
export { VERSION } from './version';
