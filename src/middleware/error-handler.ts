import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { DatabaseError } from "pg";
import { PG_ERROR_CODES } from "../utils/constants.ts";
import { ApiError } from "../errors.ts";
import type { WideEventError } from "../types.ts";

/**
 * Centralized error handler.
 *
 * Express 5 automatically forwards thrown errors (except in async callbacks)
 * and rejected Promises to the next function.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof Error) {
    req.event.error = {
      ...error,
      level: "warn",
    };

    if (error instanceof ApiError) {
      const handledError = handleApiError(error);
      if (handledError) req.event.error = handledError;

      return res.status(error.statusCode).json({
        error: getReasonPhrase(error.statusCode),
        message: error.message,
      });
    }

    if (error instanceof DatabaseError) {
      switch (error.code) {
        case PG_ERROR_CODES.UNIQUE_VIOLATION:
          return res.status(StatusCodes.CONFLICT).json({
            error: "Conflict",
            message: "A record with the given data already exists.",
          });

        case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
          return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            error: "Unprocessable Entity",
            message: "Referenced record does not exist.",
          });

        case PG_ERROR_CODES.NOT_NULL_VIOLATION:
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Bad Request",
            message: "A required field is missing.",
          });

        case PG_ERROR_CODES.CHECK_VIOLATION:
          return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Bad Request",
            message: "A field value failed a database constraint check.",
          });

        default:
          req.event.error.level = "error";
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Internal Server Error",
            message: "Internal server error.",
          });
      }
    }

    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Bad Request", details });
    }
  }

  req.event.error = {
    ...req.event.error,
    name: "Unknown Error",
    message: String(error),
    level: "error",
  };

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: "Internal Server Error",
    message: "Internal server error.",
  });
};

const handleApiError = (error: ApiError): WideEventError | undefined => {
  if (error.log.enabled) {
    return {
      ...error,
      message: error.log.message,
      level: error.log.level,
    };
  }

  return undefined;
};
