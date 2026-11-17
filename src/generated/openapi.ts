// Generated from openapi/routune-public.v1.json (API 1.0.0) by scripts/generate.mjs.
// Do not edit by hand: run `npm run generate`.
/* eslint-disable */

export interface paths {
    "/v1/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List customers */
        get: operations["listCustomers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/customers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retrieve a customer */
        get: operations["retrieveCustomer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/drivers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List active drivers
         * @description Drivers you can assign to order legs.
         */
        get: operations["listDrivers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List locations */
        get: operations["listLocations"];
        put?: never;
        /**
         * Create a location
         * @description Send an Idempotency-Key header to retry safely. Coordinates are required so orders can use the location.
         */
        post: operations["createLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retrieve a location */
        get: operations["retrieveLocation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List orders
         * @description Newest first. Page with `limit` and `cursor`.
         */
        get: operations["listOrders"];
        put?: never;
        /**
         * Create an order
         * @description Prices the order with the given price set and creates one leg from pickup to dropoff. Both locations need coordinates.
         */
        post: operations["createOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retrieve an order */
        get: operations["retrieveOrder"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update an order */
        patch: operations["updateOrder"];
        trace?: never;
    };
    "/v1/orders/{id}/legs/{leg_id}/assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Assign or reassign a leg's driver */
        post: operations["assignLegDriver"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/price_sets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List price sets */
        get: operations["listPriceSets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/price_sets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retrieve a price set */
        get: operations["retrievePriceSet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Address: {
            address_line1?: string | null;
            address_line2?: string | null;
            city?: string | null;
            /** @example US */
            country?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            name?: string | null;
            postal_code?: string | null;
            state?: string | null;
        };
        AssignLegDriver: {
            /**
             * Format: uuid
             * @description GET /v1/drivers.
             */
            driver_id: string;
            /**
             * Format: uuid
             * @description The driver you expect on the leg now. Omit or null to assign an unassigned leg; set it to reassign. A mismatch returns 409 assignment_changed.
             */
            expected_current_driver_id?: string | null;
        };
        CreateLocation: {
            address_line1: string;
            address_line2?: string;
            city: string;
            /** @description Your own unique code. */
            code?: string;
            /**
             * @description ISO 3166-1 alpha-2.
             * @example US
             */
            country: string;
            /**
             * Format: uuid
             * @description Belongs to this customer.
             */
            customer_id?: string;
            /** @description Required: orders need coordinates to route and price. */
            latitude: number;
            longitude: number;
            name: string;
            notes?: string;
            postal_code: string;
            service_time_minutes?: number;
            /** @example CA */
            state?: string;
        };
        CreateOrder: {
            /** @description Weight used for pricing. */
            chargeable_weight: number;
            /** Format: uuid */
            customer_id: string;
            dimensions?: components["schemas"]["Dimensions"];
            dispatcher_notes?: string;
            driver_notes?: string;
            dropoff: components["schemas"]["OrderStopInput"];
            /** @description In the workspace weight unit. */
            gross_weight: number;
            items?: components["schemas"]["OrderItemInput"][];
            pickup: components["schemas"]["OrderStopInput"];
            /**
             * Format: uuid
             * @description GET /v1/price_sets.
             */
            price_set_id: string;
            /** @description Number of pieces. */
            quantity?: number;
            /** @description Your own reference (e.g. ERP order number). */
            reference_number?: string;
            volumetric_weight?: number;
        };
        Customer: {
            active: boolean;
            code?: string | null;
            /** Format: date-time */
            created_at: string;
            /** @example usd */
            currency: string;
            email?: string | null;
            /** Format: uuid */
            id: string;
            name: string;
            /** @enum {string} */
            object: "customer";
            payment_term: string;
            phone?: string | null;
            tax_number?: string | null;
            /** Format: date-time */
            updated_at: string;
        };
        CustomerList: {
            data: components["schemas"]["Customer"][];
            has_more: boolean;
            next_cursor?: string | null;
            /** @enum {string} */
            object: "list";
        };
        Dimensions: {
            height?: number;
            length?: number;
            width?: number;
        };
        Driver: {
            /** Format: date-time */
            created_at: string;
            email?: string | null;
            /** Format: uuid */
            id: string;
            name?: string | null;
            /** @enum {string} */
            object: "driver";
        };
        DriverList: {
            data: components["schemas"]["Driver"][];
            has_more: boolean;
            next_cursor?: string | null;
            /** @enum {string} */
            object: "list";
        };
        DriverRef: {
            /** Format: uuid */
            id: string;
            name?: string | null;
        };
        Error: {
            error: {
                /** @example api_key_revoked */
                code: string;
                details?: {
                    [key: string]: unknown;
                };
                message: string;
                request_id?: string | null;
                /** @enum {string} */
                type: "authentication_error" | "permission_error" | "invalid_request_error" | "billing_error" | "rate_limit_error" | "api_error";
            };
        };
        LegAssignment: {
            /** Format: date-time */
            assigned_at: string;
            /** Format: uuid */
            driver_id: string;
            /** Format: uuid */
            leg_id: string;
            /** @enum {string} */
            object: "leg_assignment";
            /** Format: uuid */
            order_id: string;
            /** Format: uuid */
            previous_driver_id?: string | null;
        };
        Location: {
            address: components["schemas"]["Address"];
            code?: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: uuid */
            customer_id?: string | null;
            /** Format: uuid */
            id: string;
            notes?: string | null;
            /** @enum {string} */
            object: "location";
            service_time_minutes?: number | null;
            type?: string | null;
            /** Format: date-time */
            updated_at: string;
        };
        LocationList: {
            data: components["schemas"]["Location"][];
            has_more: boolean;
            next_cursor?: string | null;
            /** @enum {string} */
            object: "list";
        };
        Order: {
            amounts: components["schemas"]["OrderAmounts"];
            assigned_driver?: components["schemas"]["DriverRef"] | null;
            chargeable_weight: number;
            /** Format: date-time */
            created_at: string;
            /** Format: uuid */
            customer_id?: string | null;
            dimensions?: components["schemas"]["Dimensions"] | null;
            dispatcher_notes?: string | null;
            driver_notes?: string | null;
            dropoff: components["schemas"]["OrderStop"];
            gross_weight: number;
            /** Format: uuid */
            id: string;
            /** @description Only on GET /v1/orders/{id}, POST and PATCH responses. */
            legs?: components["schemas"]["OrderLeg"][];
            /** @example ORD-000123 */
            number: string;
            /** @enum {string} */
            object: "order";
            pickup: components["schemas"]["OrderStop"];
            /** Format: uuid */
            price_set_id?: string | null;
            quantity: number;
            reference_number?: string | null;
            /** @enum {string} */
            status: "created" | "in_progress" | "delivered" | "returned" | "cancelled" | "on_hold";
            sub_status?: string | null;
            /** Format: date-time */
            updated_at: string;
            volumetric_weight?: number | null;
            /** @example kg */
            weight_unit?: string | null;
        };
        OrderAmounts: {
            accessorials: number;
            /** @description Minor units (cents). */
            base: number;
            /** @example usd */
            currency: string;
            fuel_surcharge: number;
            tax: number;
            total: number;
        };
        OrderItemInput: {
            barcode?: string;
            /** @description In major units, e.g. 129.99. */
            declared_value?: number;
            /** @example USD */
            declared_value_currency?: string;
            description?: string;
            gross_weight_kg: number;
            height_cm?: number;
            length_cm?: number;
            quantity?: number;
            sku_code?: string;
            width_cm?: number;
        };
        OrderLeg: {
            /** Format: uuid */
            assigned_driver_id?: string | null;
            /** Format: date-time */
            completed_at?: string | null;
            /** Format: uuid */
            dropoff_location_id?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            pickup_location_id?: string | null;
            sequence: number;
            /** @enum {string} */
            status: "pending" | "in_transit" | "completed" | "cancelled";
        };
        OrderList: {
            data: components["schemas"]["Order"][];
            has_more: boolean;
            next_cursor?: string | null;
            /** @enum {string} */
            object: "list";
        };
        OrderStop: {
            /** Format: date-time */
            actual_time?: string | null;
            address?: components["schemas"]["Address"] | null;
            /** Format: date-time */
            earliest_time?: string | null;
            /** Format: date-time */
            latest_time?: string | null;
            /** Format: uuid */
            location_id?: string | null;
        };
        OrderStopInput: {
            /** Format: date-time */
            earliest_time: string;
            /** Format: date-time */
            latest_time: string;
            /**
             * Format: uuid
             * @description A location id (GET /v1/locations or POST /v1/locations).
             */
            location_id: string;
            min_photos?: number;
            /** @description Ask the driver for photos here. */
            photo_required?: boolean;
            /** @description Ask the driver for a signature here. */
            signature_required?: boolean;
        };
        OrderStopTimesInput: {
            /** Format: date-time */
            earliest_time?: string;
            /** Format: date-time */
            latest_time?: string;
        };
        PriceSet: {
            active: boolean;
            /** Format: date */
            active_from?: string | null;
            /** Format: date */
            active_until?: string | null;
            /** Format: date-time */
            created_at: string;
            /** @example usd */
            currency: string;
            /** @description Customers this price set is limited to; empty = everyone. */
            customer_ids: string[];
            description?: string | null;
            display_name?: string | null;
            /** Format: uuid */
            id: string;
            name: string;
            /** @enum {string} */
            object: "price_set";
            /** Format: date-time */
            updated_at: string;
        };
        PriceSetList: {
            data: components["schemas"]["PriceSet"][];
            has_more: boolean;
            next_cursor?: string | null;
            /** @enum {string} */
            object: "list";
        };
        UpdateOrder: {
            chargeable_weight?: number;
            dimensions?: components["schemas"]["Dimensions"];
            dispatcher_notes?: string;
            driver_notes?: string;
            dropoff?: components["schemas"]["OrderStopTimesInput"];
            gross_weight?: number;
            pickup?: components["schemas"]["OrderStopTimesInput"];
            quantity?: number;
            reference_number?: string;
            /**
             * @description Put the order on hold, cancel it, or resume it from hold (created / in_progress). Delivery progress comes from the driver.
             * @enum {string}
             */
            status?: "on_hold" | "cancelled" | "created" | "in_progress";
            /** @description Required with on_hold and cancelled. */
            status_reason?: string;
            volumetric_weight?: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listCustomers: {
        parameters: {
            query?: {
                /** @description next_cursor from the previous page. Omit for the first page. */
                cursor?: string;
                limit?: number;
                /** @description Matches company name, code, email or tax number. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerList"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    retrieveCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Customer"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listDrivers: {
        parameters: {
            query?: {
                /** @description next_cursor from the previous page. Omit for the first page. */
                cursor?: string;
                limit?: number;
                /** @description Matches name or email. */
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DriverList"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listLocations: {
        parameters: {
            query?: {
                /** @description next_cursor from the previous page. Omit for the first page. */
                cursor?: string;
                customer_id?: string;
                /** @description true: only locations with coordinates (usable on orders). */
                has_coordinates?: boolean;
                limit?: number;
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LocationList"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createLocation: {
        parameters: {
            query?: never;
            header?: {
                /** @description Any unique string (at most 200 characters). Retrying with the same key and body returns the original result instead of doing the work twice. Kept for 24 hours. */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateLocation"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Location"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    retrieveLocation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Location"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listOrders: {
        parameters: {
            query?: {
                /** @description Only orders created at or after this time. */
                created_gte?: string;
                /** @description Only orders created at or before this time. */
                created_lte?: string;
                /** @description next_cursor from the previous page. Omit for the first page. */
                cursor?: string;
                customer_id?: string;
                limit?: number;
                status?: "created" | "in_progress" | "delivered" | "returned" | "cancelled" | "on_hold";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderList"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createOrder: {
        parameters: {
            query?: never;
            header?: {
                /** @description Any unique string (at most 200 characters). Retrying with the same key and body returns the original result instead of doing the work twice. Kept for 24 hours. */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateOrder"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    retrieveOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOrder"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Order"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    assignLegDriver: {
        parameters: {
            query?: never;
            header?: {
                /** @description Any unique string (at most 200 characters). Retrying with the same key and body returns the original result instead of doing the work twice. Kept for 24 hours. */
                "Idempotency-Key"?: string;
            };
            path: {
                id: string;
                leg_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignLegDriver"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LegAssignment"];
                };
            };
            /** @description `already_assigned`, `not_assigned` or `assignment_changed` (someone changed the driver; read the order and retry). */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listPriceSets: {
        parameters: {
            query?: {
                /** @description true: only active price sets. */
                active?: boolean;
                /** @description next_cursor from the previous page. Omit for the first page. */
                cursor?: string;
                /** @description Only price sets available to this customer. */
                customer_id?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceSetList"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    retrievePriceSet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceSet"];
                };
            };
            /** @description Error */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
}
