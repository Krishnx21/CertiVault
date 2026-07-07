import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`CertiVault API listening on port ${env.port}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close the HTTP server", error);
      process.exitCode = 1;
    }
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
