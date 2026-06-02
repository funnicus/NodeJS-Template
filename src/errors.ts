import { StatusCodes, getReasonPhrase } from "http-status-codes";

type ApiErrorOptions = {
  message?: string;
  params?: Record<string, unknown>;
  log?: {
    level?: "error" | "warn" | "debug" | "fatal";
    enabled?: boolean;
    message?: string;
  };
};

type ApiErrorConstructorOptions = ApiErrorOptions & {
  statusCode: StatusCodes;
};

export class ApiError extends Error {
  readonly statusCode: StatusCodes;
  readonly log: {
    level: "error" | "warn" | "debug" | "fatal";
    enabled: boolean;
    message: string;
  };
  readonly params?: Record<string, unknown> | undefined;

  private constructor(options: ApiErrorConstructorOptions) {
    const {
      statusCode,
      message = getReasonPhrase(statusCode),
      params,
      log,
    } = options;

    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.params = params;
    this.log = {
      level: log?.level ?? "error",
      enabled: log?.enabled ?? true,
      message: log?.message ?? message,
    };
  }

  private static create(
    statusCode: StatusCodes,
    options: ApiErrorOptions = {},
  ): ApiError {
    return new ApiError({ statusCode, ...options });
  }

  static badGateway(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.BAD_GATEWAY, options);
  }

  static badRequest(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.BAD_REQUEST, options);
  }

  static conflict(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.CONFLICT, options);
  }

  static forbidden(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.FORBIDDEN, options);
  }

  static internalServer(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.INTERNAL_SERVER_ERROR, options);
  }

  static notFound(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.NOT_FOUND, options);
  }

  static unauthorized(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.UNAUTHORIZED, options);
  }

  static unprocessableEntity(options?: ApiErrorOptions): ApiError {
    return ApiError.create(StatusCodes.UNPROCESSABLE_ENTITY, options);
  }
}
