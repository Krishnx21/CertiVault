import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { redis, disconnectRedis } from "./config/redis.js"; // UPDATED
import { seedDatabase } from "./modules/documents/document.store.js";
import { createShutdownHandler } from "./utils/gracefulShutdown.js";
import http from "http";

const env = getEnv();
const app = createApp();

let server: http.Server;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB(env.MONGODB_URI);

    // Wait for Redis to be ready before accepting traffic.
    // Redis is optional — a connection failure (or absent config) logs a warning
    // but does NOT abort startup.
    if (redis) {
      const r = redis; // capture for TS narrowing inside callbacks
      await new Promise<void>((resolve) => {
        if (r.status === "ready") {
          resolve();
          return;
        }
        const onReady = () => { cleanup(); resolve(); };
        const onError = (err: Error) => {
          cleanup();
          console.warn(`Redis connection failed at startup (${err.message}) — continuing without cache`);
          resolve(); // degrade gracefully instead of crashing
        };
        const cleanup = () => {
          r.off("ready", onReady);
          r.off("error", onError);
        };
        r.once("ready", onReady);
        r.once("error", onError);
        setTimeout(() => {
          cleanup();
          console.warn("Redis did not become ready within 10 s — continuing without cache");
          resolve();
        }, 10_000);
      });
    }

    // Seed database if necessary
    await seedDatabase();

    // Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`CertiVault API listening on port ${env.PORT}`);
    });

    const shutdown = createShutdownHandler(server);

    // UPDATED — graceful shutdown also closes Redis
    const handleSignal = async (signal: string) => {
      shutdown(signal);
      try {
        await disconnectDB();
      } catch (err) {
        console.error("Error during database disconnection:", err);
      }
      try {
        await disconnectRedis();
      } catch (err) {
        console.error("Error during Redis disconnection:", err);
      }
      process.exit(process.exitCode || 0);
    };

    process.once("SIGINT", () => handleSignal("SIGINT"));
    process.once("SIGTERM", () => handleSignal("SIGTERM"));
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

start();
