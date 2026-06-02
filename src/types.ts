export type WideEventError = {
  name: string;
  message: string;
  level: "error" | "warn" | "debug" | "fatal";
  params?: Record<string, unknown> | undefined;
  stack?: string | undefined;
};

/**
 * WideEvent object.
 *
 * Snake case is used since logs are consumed outside nodejs.
 */
export type WideEvent = {
  event: string;
  request_id: string;
  method: string;
  url: string;
  trace_id?: string;
  span_id?: string;
  route?: string;
  status_code?: number;
  duration_ms?: number;
  user_id?: string;
  error?: WideEventError;
};

export type ExpressRoute =
  | {
      path?: string;
    }
  | undefined;
