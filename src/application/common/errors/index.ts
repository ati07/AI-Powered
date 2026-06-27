/**
 * Base application error. All use-case errors should extend this.
 */
export abstract class AppError extends Error {
  public abstract readonly code: string;
  public abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/* ──────────────── Concrete Errors ──────────────── */

export class NotFoundError extends AppError {
  public readonly code = "NOT_FOUND";
  public readonly httpStatus = 404;

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
  }
}

export class UnauthorizedError extends AppError {
  public readonly code = "UNAUTHORIZED";
  public readonly httpStatus = 401;

  constructor(message = "You must be authenticated to perform this action") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  public readonly code = "FORBIDDEN";
  public readonly httpStatus = 403;

  constructor(message = "You do not have permission to perform this action") {
    super(message);
  }
}

export class ValidationError extends AppError {
  public readonly code = "VALIDATION_ERROR";
  public readonly httpStatus = 422;
  public readonly details: Record<string, string[]>;

  constructor(details: Record<string, string[]>) {
    super("Validation failed");
    this.details = details;
  }
}

export class ConflictError extends AppError {
  public readonly code = "CONFLICT";
  public readonly httpStatus = 409;

  constructor(message: string) {
    super(message);
  }
}

export class InternalServerError extends AppError {
  public readonly code = "INTERNAL_SERVER_ERROR";
  public readonly httpStatus = 500;

  constructor(message = "An unexpected error occurred") {
    super(message);
  }
}
