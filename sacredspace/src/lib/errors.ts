/**
 * Custom error classes for server functions.
 *
 * These carry a `statusCode` so callers (routes, middleware, error boundaries)
 * can distinguish 401 vs 404 vs 429 without parsing error messages.
 */

export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(429, `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`);
    this.retryAfterMs = retryAfterMs;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}
