import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { z, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { logger } from "./logger.ts";

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
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      message: `${issue.path.join(".")} is ${issue.message}`,
    }));

    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid data", details });
  }

  logger.error(error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
  });
};
