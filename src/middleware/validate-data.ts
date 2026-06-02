import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Generic middleware to validate request data against a Zod schema.
 */
export const validateData = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
};
