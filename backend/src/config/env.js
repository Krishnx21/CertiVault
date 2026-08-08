const parsePort = (value) => {
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

/**
 * Parse FRONTEND_ORIGIN env value into a usable form:
 * - undefined -> default 'http://localhost:5173'
 * - '*' -> '*' (wildcard)
 * - comma-separated string -> array of trimmed origins
 * - single origin string -> trimmed string
 */
const parseCorsOrigin = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "http://localhost:5173";
  }

  const s = String(value).trim();
  if (s === "*") return "*";
  if (s.includes(",")) {
    return s.split(",").map((p) => p.trim()).filter(Boolean);
  }
  return s;
};

export const isDevelopment = (process.env.NODE_ENV ?? "development") === "development";
export const isProduction = (process.env.NODE_ENV ?? "development") === "production";

export const getEnv = () => {
  const frontend = parseCorsOrigin(process.env.FRONTEND_ORIGIN);

  return {
    // Uppercase keys (compat with env.ts usage)
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: parsePort(process.env.API_PORT || process.env.PORT),
    FRONTEND_ORIGIN: frontend,
    MONGODB_URI:
      process.env.MONGODB_URI ??
      (() => {
        throw new Error("MONGODB_URI is required");
      })(),
    JWT_SECRET:
      (process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET) ??
      (() => {
        throw new Error("JWT_SECRET or JWT_ACCESS_SECRET is required");
      })(),
    AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ?? "",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    PRESIGNED_URL_EXPIRY_SECONDS: Number(process.env.PRESIGNED_URL_EXPIRY_SECONDS ?? 3600),
    // Lowercase aliases for compatibility with older code/tests
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsePort(process.env.API_PORT || process.env.PORT),
    frontendOrigin: frontend,
    mongoUri:
      process.env.MONGODB_URI ??
      (() => {
        throw new Error("MONGODB_URI is required");
      })(),
    jwtSecret:
      (process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET) ??
      (() => {
        throw new Error("JWT_SECRET or JWT_ACCESS_SECRET is required");
      })(),
    awsRegion: process.env.AWS_REGION ?? "us-east-1",
    awsBucket: process.env.AWS_S3_BUCKET ?? "",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    presignedUrlExpiry: Number(process.env.PRESIGNED_URL_EXPIRY_SECONDS ?? 3600),
  };
};

