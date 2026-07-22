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

export const getEnv = () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.API_PORT),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  mongoUri:
    process.env.MONGODB_URI ??
    (() => {
      throw new Error("MONGODB_URI is required");
    })(),
  jwtSecret:
    process.env.JWT_SECRET ??
    (() => {
      throw new Error("JWT_SECRET is required");
    })(),
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsBucket: process.env.AWS_S3_BUCKET ?? "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  presignedUrlExpiry: Number(process.env.PRESIGNED_URL_EXPIRY_SECONDS ?? 3600),
});
