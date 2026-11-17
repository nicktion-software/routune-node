import type { components, operations } from './generated/openapi';

type Schemas = components['schemas'];
type Query<K extends keyof operations> = NonNullable<operations[K]['parameters']['query']>;

export type Order = Schemas['Order'];
export type OrderLeg = Schemas['OrderLeg'];
export type OrderStop = Schemas['OrderStop'];
export type OrderAmounts = Schemas['OrderAmounts'];
export type OrderStatus = Order['status'];
export type Address = Schemas['Address'];
export type Dimensions = Schemas['Dimensions'];
export type DriverRef = Schemas['DriverRef'];
export type OrderCreateParams = Schemas['CreateOrder'];
export type OrderStopInput = Schemas['OrderStopInput'];
export type OrderStopTimesInput = Schemas['OrderStopTimesInput'];
export type OrderItemInput = Schemas['OrderItemInput'];
export type OrderUpdateParams = Schemas['UpdateOrder'];
export type OrderListParams = Query<'listOrders'>;
export type LegAssignParams = Schemas['AssignLegDriver'];
export type LegAssignment = Schemas['LegAssignment'];

export type Customer = Schemas['Customer'];
export type CustomerListParams = Query<'listCustomers'>;

export type Driver = Schemas['Driver'];
export type DriverListParams = Query<'listDrivers'>;

export type Location = Schemas['Location'];
export type LocationCreateParams = Schemas['CreateLocation'];
export type LocationListParams = Query<'listLocations'>;

export type PriceSet = Schemas['PriceSet'];
export type PriceSetListParams = Query<'listPriceSets'>;

/** The error envelope the API returns. */
export type ErrorResponse = Schemas['Error'];

export type { components, operations, paths } from './generated/openapi';
