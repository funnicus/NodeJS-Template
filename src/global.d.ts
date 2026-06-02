import type { WideEvent } from "./types.ts";

declare global {
  namespace Express {
    interface Request {
      event: WideEvent;
    }
  }
}
