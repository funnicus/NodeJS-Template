import config from "./config.ts";
import { logger } from "./logger.ts";
import createApp from "./app.ts";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});
