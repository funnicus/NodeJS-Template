import type { RequestHandler, Router } from "express";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { logger } from "../logger.ts";

const newHealthRouter = () => {
  const healthRouter: Router = express.Router();

  healthRouter.post("/", healthHandler);

  return healthRouter;
};

export const healthHandler: RequestHandler = (_req, res): void => {
  logger.debug("Server is healthy");
  res.sendStatus(StatusCodes.OK);
};

export default newHealthRouter;
