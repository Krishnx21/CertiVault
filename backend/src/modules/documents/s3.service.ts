/**
 * File Storage Service - AWS S3 → Local Storage
 * Uses AWS S3 for production, falls back to local storage in development
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "../../config/env.js";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const env = getEnv();

// Check if AWS S3 credentials are configured (must be non-empty strings)
const hasS3Credentials = 
  env.AWS_ACCESS_KEY_ID && 
  env.AWS_SECRET_ACCESS_KEY && 
  env.AWS_S3_BUCKET &&
  env.AWS_ACCESS_KEY_ID.length > 0 &&
  env.AWS_SECRET_ACCESS_KEY.length > 0 &&
  env.AWS_S3_BUCKET.length > 0;

// Initialize S3 client only if credentials are available
let s3Client: S3Client | null = null;
if (hasS3Credentials) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET_NAME = env.AWS_S3_BUCKET || "certivault-documents";

// Local storage directory for development
const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads", "documents");

// Storage provider enum
export enum StorageProvider {
  S3 = "s3",
  LOCAL = "local",
}

/**
 * Upload file to S3 → Local Storage (fallback priority)
 */
export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ key: string; url: string; provider: StorageProvider }> => {
  // Generate unique key
  const fileExtension = path.extname(fileName);
  const baseName = path.basename(fileName, fileExtension);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const key = `documents/${timestamp}-${randomString}-${baseName}${fileExtension}`;

  // Try S3 first
  if (s3Client && hasS3Credentials) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: mimeType,
        ServerSideEncryption: "AES256",
      });

      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
      return { key, url, provider: StorageProvider.S3 };
    } catch (error) {
      console.error("S3 upload failed, trying local storage:", error);
    }
  }

  // Fallback to local storage
  const localDir = path.join(LOCAL_STORAGE_DIR, path.dirname(key));
  if (!existsSync(localDir)) {
    await fs.mkdir(localDir, { recursive: true });
  }

  const localPath = path.join(LOCAL_STORAGE_DIR, key);
  await fs.writeFile(localPath, file);

  const url = `/api/files/${key}`;
  return { key, url, provider: StorageProvider.LOCAL };
};

/**
 * Generate download URL (S3 → Local Storage)
 */
export const getPresignedDownloadUrl = async (
  key: string,
  provider?: StorageProvider,
  originalFilename?: string
): Promise<string> => {
  // If provider is specified, use it directly
  if (provider === StorageProvider.S3 && s3Client && hasS3Credentials) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: originalFilename 
          ? `attachment; filename="${originalFilename}"`
          : 'attachment',
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      return url;
    } catch (error) {
      console.error("S3 URL generation failed, trying local:", error);
    }
  }

  // If provider is LOCAL or not specified, try in order
  // Try S3 first
  if (s3Client && hasS3Credentials) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: originalFilename 
          ? `attachment; filename="${originalFilename}"`
          : 'attachment',
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      return url;
    } catch (error) {
      console.error("S3 URL generation failed, trying local:", error);
    }
  }

  // Fallback to local file URL with filename parameter
  const filenameParam = originalFilename ? `?filename=${encodeURIComponent(originalFilename)}` : '';
  return `/api/files/${key}${filenameParam}`;
};

/**
 * Delete file from S3 → Local Storage
 */
export const deleteFromS3 = async (
  key: string,
  provider?: StorageProvider
): Promise<void> => {
  // If provider is specified, use it directly
  if (provider === StorageProvider.S3 && s3Client && hasS3Credentials) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return;
    } catch (error) {
      console.error("S3 deletion failed, trying local:", error);
    }
  }

  // If provider is LOCAL or not specified, try in order
  // Try S3 first
  if (s3Client && hasS3Credentials) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return;
    } catch (error) {
      console.error("S3 deletion failed, trying local:", error);
    }
  }

  // Fallback to local storage
  const localPath = path.join(LOCAL_STORAGE_DIR, key);
  if (existsSync(localPath)) {
    await fs.unlink(localPath);
  }
};

/**
 * Generate checksum for file
 */
export const generateChecksum = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Generate hash for file
 */
export const generateHash = (buffer: Buffer): string => {
  return crypto.createHash("md5").update(buffer).digest("hex");
};

/**
 * Validate file type
 */
export const validateFileType = (mimeType: string): boolean => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/zip",
    "application/x-zip-compressed",
  ];

  return allowedTypes.includes(mimeType);
};

/**
 * Get file category from MIME type
 */
export const getFileCategory = (mimeType: string): string => {
  if (mimeType.includes("pdf")) return "certificate";
  if (mimeType.includes("word") || mimeType.includes("document")) return "contract";
  if (mimeType.includes("image")) return "identity";
  if (mimeType.includes("zip")) return "other";
  return "other";
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
};
