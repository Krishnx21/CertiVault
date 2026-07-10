const parsePort = (value?: string | number): number => {
  if (value === undefined || value === null) {
    return 5000;
  }

  if (typeof value === "string" && value.trim() === "") {
    throw new Error("API_PORT must be an integer between 1 and 65535");
  }

  const port = Number(value);

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
  jwtSecret: string;
  jwtExpires: string;
}

export const getEnv = (): Env => {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const jwtSecret = process.env.JWT_SECRET;

  if (nodeEnv === "production" && !jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required in production");
  }

  return {
    nodeEnv,
    port: parsePort(process.env.API_PORT),
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/certivault",
    jwtSecret: jwtSecret ?? "development_secret_key_change_me",
    jwtExpires: process.env.JWT_EXPIRES ?? "1d",
  };
};
