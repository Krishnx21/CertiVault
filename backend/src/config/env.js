const parsePort = (value) => {
  const port = Number(value ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("API_PORT must be an integer between 1 and 65535");
  }

  return port;
};

export const getEnv = () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.API_PORT),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
});
