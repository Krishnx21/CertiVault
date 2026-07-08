import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { seedDatabase } from "./modules/documents/document.store.js";
import http from "http";

const env = getEnv();
const app = createApp();

let server: http.Server;

const start = async () => {
  try {
    // Connect to database
    await connectDB(env.mongodbUri);

    // Seed database if necessary
    await seedDatabase();

    // Start listening
    server = app.listen(env.port, () => {
      console.log(`CertiVault API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`${signal} received; shutting down`);
  if (server) {
    server.close(async (error) => {
      if (error) {
        console.error("Failed to close the HTTP server", error);
        process.exitCode = 1;
      }
      await disconnectDB();
      process.exit();
    });
  } else {
    await disconnectDB();
    process.exit();
  }
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

start();
