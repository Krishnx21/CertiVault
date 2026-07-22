import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production", "staging"])
    .default("development"),
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default(5000),
  FRONTEND_ORIGIN: z.string().url(),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default("certivault-api"),
  JWT_AUDIENCE: z.string().default("certivault-web"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_KMS_KEY_ID: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  BULL_BOARD_USERNAME: z.string().optional(), // UPDATED
  BULL_BOARD_PASSWORD: z.string().optional(), // UPDATED
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  MAX_UPLOAD_BYTES: z.string().transform(Number).pipe(z.number().positive()).default(10485760),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default(900000),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default(100),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default(12),
  SESSION_COOKIE_NAME: z.string().default("refreshToken"),
  TRUST_PROXY: z.string().transform(v => v === "true").default(() => true),
});

export type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues
      .map((e: any) => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.error("❌ Environment validation failed:\n" + errors);
    console.error("\nRequired environment variables:");
    console.error("  MONGODB_URI - MongoDB connection string");
    console.error("  JWT_ACCESS_SECRET - JWT access token secret (min 32 chars)");
    console.error("  JWT_REFRESH_SECRET - JWT refresh token secret (min 32 chars)");
    console.error("  FRONTEND_ORIGIN - Frontend URL (e.g., https://certi-vault-alpha.vercel.app)");
    if (process.env.NODE_ENV === "test") {
      throw new Error("Environment validation failed:\n" + errors);
    }
    process.exit(1);
  }
  
  return result.data;
};

export const env = validateEnv();

export const getEnv = (): Env => env;

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";