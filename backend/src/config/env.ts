const parsePort = (value?: string | number): number => {
  const port = Number(value ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("API_PORT must be an integer between 1 and 65535");
  }

  return port;
};

export interface Env {
  nodeEnv: string;
  port: number;
  frontendOrigin: string;
  mongodbUri: string;
}

export const getEnv = (): Env => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.API_PORT),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/certivault",
});
