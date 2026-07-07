export const createShutdownHandler = (server, options = {}) => {
  const { logger = console, processRef = process } = options;
  let isShuttingDown = false;

  return (signal) => {
    if (isShuttingDown) {
      if (logger && typeof logger.log === "function") {
        logger.log(`Shutdown already in progress; ignoring ${signal}`);
      }
      return;
    }
    isShuttingDown = true;
    if (logger && typeof logger.log === "function") {
      logger.log(`${signal} received; shutting down`);
    }

    server.close((error) => {
      if (error) {
        if (logger && typeof logger.error === "function") {
          logger.error("Failed to close the HTTP server", error);
        }
        processRef.exitCode = 1;
      }
    });
  };
};
