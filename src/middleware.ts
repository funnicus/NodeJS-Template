import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { z, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { DatabaseError } from "pg";
import { logger } from "./logger.ts";

// PostgreSQL error codes
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_ERROR_CODES = {
  NOT_NULL_VIOLATION: "23502",
  FOREIGN_KEY_VIOLATION: "23503",
  UNIQUE_VIOLATION: "23505",
  CHECK_VIOLATION: "23514",
} as const;

/**
 * Generic middleware to validate request data against a Zod schema.
 */
export function validateData(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

/**
 * Centralized error handler.
 *
 * Express 5 automatically forwards thrown errors (except in async callbacks)
 * and rejected Promises to the next function.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
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
        logger.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          error: "Internal Server Error",
          message: "An unexpected database error occurred.",
        });
    }
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      message: `${issue.path.join(".")} is ${issue.message}`,
    }));

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Bad Request", details });
  }

  logger.error(error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: "Internal Server Error",
    message: "Internal server error",
  });
};
