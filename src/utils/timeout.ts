/**
 * Wait for a specified amount of time, before rejecting with an error.
 *
 * **Does not block process.exit.**
 *
 * @param ms The number of milliseconds to wait before rejecting.
 * @param message The error message to reject with.
 * @returns A promise that rejects after the specified time.
 */
const timeout = (ms: number, message: string) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms).unref(),
  );

export default timeout;
