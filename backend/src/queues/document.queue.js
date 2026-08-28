import { Queue } from "bullmq";
import { createHash } from "node:crypto";
import { createBullMQConnection } from "../config/redis.js";
import { Document } from "../modules/documents/document.model.js";
import * as defaultStorage from "../services/storage.service.js";
import { eventBus } from "../utils/eventBus.js";

export const DOCUMENT_QUEUE_NAME = "document-processing";

let storage = defaultStorage;
export const _setQueueStorage = (s) => {
  storage = s;
};

let _documentQueue = null;

export const getDocumentQueue = () => {
  if (_documentQueue) return _documentQueue;

  const connection = createBullMQConnection();
  if (!connection) {
    return null;
  }

  try {
    _documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    _documentQueue.on("error", (err) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn("Document queue error:", err.message);
      }
    });

    return _documentQueue;
  } catch (err) {
    return null;
  }
};

/**
 * Process a document processing job:
 * 1. Computes SHA-256 hash off the main request thread
 * 2. Uploads file buffer to S3 storage
 * 3. Updates Document in MongoDB (status: pending, processing_status: completed, checksum, s3Bucket)
 * 4. Emits documentUpdated and documentProcessed events
 */
export const processDocumentJob = async (jobData) => {
  const { documentId, fileBuffer, mimeType, s3Key } = jobData;
  const buffer = Buffer.isBuffer(fileBuffer)
    ? fileBuffer
    : fileBuffer?.data
      ? Buffer.from(fileBuffer.data)
      : fileBuffer
        ? Buffer.from(fileBuffer)
        : Buffer.from("");

  try {
    await Document.findByIdAndUpdate(documentId, {
      processing_status: "processing",
    });

    // 1. Compute SHA-256 checksum asynchronously off the HTTP request
    const checksum = createHash("sha256").update(buffer).digest("hex");

    // 2. Upload to S3 storage
    const { bucket } = await storage.uploadToS3({
      key: s3Key,
      buffer,
      mimeType,
    });

    // 3. Update document record in database
    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      {
        checksum,
        s3Key,
        s3Bucket: bucket,
        processing_status: "completed",
      },
      { new: true }
    ).lean();

    if (updatedDoc) {
      eventBus.emit("documentUpdated", updatedDoc);
      eventBus.emit("documentProcessed", updatedDoc);
    }

    return updatedDoc;
  } catch (err) {
    console.error(`Document processing failed for ${documentId}:`, err);
    await Document.findByIdAndUpdate(documentId, {
      processing_status: "failed",
    });
    eventBus.emit("documentProcessingFailed", { documentId, error: err.message });
    throw err;
  }
};

/**
 * Enqueues document processing. If BullMQ / Redis is available, adds to queue.
 * If Redis is unavailable (e.g. testing / local fallback), processes asynchronously via setImmediate.
 */
export const queueDocumentProcessing = async ({ documentId, fileBuffer, mimeType, s3Key }) => {
  const q = getDocumentQueue();
  if (q) {
    await q.add("process-document", {
      documentId,
      fileBuffer: Buffer.isBuffer(fileBuffer)
        ? fileBuffer
        : fileBuffer
          ? Buffer.from(fileBuffer)
          : null,
      mimeType,
      s3Key,
    });
  } else {
    // Asynchronous background execution (non-blocking off request loop)
    setImmediate(() => {
      processDocumentJob({
        documentId,
        fileBuffer,
        mimeType,
        s3Key,
      }).catch((err) => {
        if (process.env.NODE_ENV !== "test") {
          console.error("Background document processing error:", err);
        }
      });
    });
  }
};
