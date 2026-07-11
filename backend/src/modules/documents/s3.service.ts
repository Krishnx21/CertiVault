/**
 * S3 Service - AWS S3 file upload and management
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "../../config/env.js";
import crypto from "crypto";
import path from "path";

const env = getEnv();

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = env.AWS_S3_BUCKET || "certivault-documents";

/**
 * Upload file to S3
 */
export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ key: string; url: string }> => {
  // Generate unique key
  const fileExtension = path.extname(fileName);
  const baseName = path.basename(fileName, fileExtension);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const key = `documents/${timestamp}-${randomString}-${baseName}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ServerSideEncryption: "AES256",
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { key, url };
};

/**
 * Generate presigned download URL
 */
export const getPresignedDownloadUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  return url;
};

/**
 * Delete file from S3
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
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
