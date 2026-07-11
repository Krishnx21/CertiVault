import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { getEnv } from "./config/env.js";
import { createShutdownHandler } from "./utils/gracefulShutdown.js";

const env = getEnv();
const app = createApp();

const start = async () => {
  await connectDb(env.mongoUri);

  const server = app.listen(env.port, () => {
    console.log(`CertiVault API listening on port ${env.port}`);
  });

  const shutdown = createShutdownHandler(server);
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
