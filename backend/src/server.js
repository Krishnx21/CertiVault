import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { createShutdownHandler } from "./utils/gracefulShutdown.js";

const env = getEnv();
const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`CertiVault API listening on port ${env.port}`);
});

const shutdown = createShutdownHandler(server);

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
