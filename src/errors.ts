/** Base class for every error this library throws. */
export class RoutuneError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The body of an API error: `{ "error": { type, code, message, request_id, details } }`. */
export interface APIErrorBody {
  type?: string;
  code?: string;
  message?: string;
  request_id?: string | null;
  details?: Record<string, unknown>;
}

/** The API answered with an error status. */
export class APIError extends RoutuneError {
  /** HTTP status code. */
  readonly status: number;
  /** Broad category, e.g. `invalid_request_error`, `authentication_error`, `rate_limit_error`. */
  readonly type: string | undefined;
  /** Machine-readable reason, e.g. `api_key_revoked`, `insufficient_scope`, `assignment_changed`. */
  readonly code: string | undefined;
  /** Quote this when you contact Routune support. */
  readonly requestId: string | undefined;
  /** Extra context, such as the fields that failed validation. */
  readonly details: Record<string, unknown> | undefined;
  /** Response headers (rate limit headers among them). */
  readonly headers: Headers;

  constructor(status: number, body: APIErrorBody | undefined, headers: Headers, fallbackMessage?: string) {
    const message = body?.message || fallbackMessage || `Request failed with status ${status}`;
    super(message);
    this.status = status;
    this.type = body?.type;
    this.code = body?.code;
    this.requestId = body?.request_id ?? headers.get('x-request-id') ?? undefined;
    this.details = body?.details;
    this.headers = headers;
  }

  /** Picks the subclass for a status code. */
  static from(status: number, body: APIErrorBody | undefined, headers: Headers, fallbackMessage?: string): APIError {
    const Cls =
      status === 400
        ? BadRequestError
        : status === 401
          ? AuthenticationError
          : status === 402
            ? PaymentRequiredError
            : status === 403
              ? PermissionDeniedError
              : status === 404
                ? NotFoundError
                : status === 409
                  ? ConflictError
                  : status === 422
                    ? UnprocessableEntityError
                    : status === 429
                      ? RateLimitError
                      : status >= 500
                        ? InternalServerError
                        : APIError;
    return new Cls(status, body, headers, fallbackMessage);
  }
}

/** 400: the request was malformed or failed validation (see `details`). */
export class BadRequestError extends APIError {}
/** 401: missing, invalid, revoked or expired API key. */
export class AuthenticationError extends APIError {}
/** 402: the workspace's plan or trial does not cover this request. */
export class PaymentRequiredError extends APIError {}
/** 403: the key lacks the scope, or the request came from an IP the key does not allow. */
export class PermissionDeniedError extends APIError {}
/** 404: the resource does not exist in this workspace. */
export class NotFoundError extends APIError {}
/** 409: a conflict, e.g. `assignment_changed` or `idempotency_conflict`. */
export class ConflictError extends APIError {}
/** 422: the request was understood but cannot be carried out. */
export class UnprocessableEntityError extends APIError {}
/** 429: too many requests. The client already retried with backoff before throwing this. */
export class RateLimitError extends APIError {
  /** Seconds to wait before retrying, from `Retry-After`. */
  get retryAfter(): number | undefined {
    const raw = this.headers.get('retry-after');
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
}
/** 5xx: something went wrong on Routune's side. Already retried. */
export class InternalServerError extends APIError {}

/** The request never got an answer (DNS, TLS, connection reset, …). Already retried. */
export class APIConnectionError extends RoutuneError {}
/** No answer within the timeout. Already retried. */
export class APIConnectionTimeoutError extends APIConnectionError {}
/** The caller aborted the request with an AbortSignal. Never retried. */
export class APIUserAbortError extends RoutuneError {}
