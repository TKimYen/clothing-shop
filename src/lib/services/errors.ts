/**
 * Errors thrown by services so the UI can distinguish "your input was rejected"
 * from "something went wrong".
 */
export class ServiceError extends Error {
  readonly status: number;
  /** Field-level messages keyed by form field name. */
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    options: { status?: number; fields?: Record<string, string>; cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ServiceError";
    this.status = options.status ?? 400;
    this.fields = options.fields ?? {};
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = "Record not found") {
    super(message, { status: 404 });
    this.name = "NotFoundError";
  }
}

/** Referenced by other records, so deletion is refused. */
export class ConflictError extends ServiceError {
  constructor(message: string, fields?: Record<string, string>) {
    super(message, { status: 409, fields });
    this.name = "ConflictError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
