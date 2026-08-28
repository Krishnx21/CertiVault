import { Worker } from "bullmq";
import { createBullMQConnection } from "../config/redis.js";
import { DOCUMENT_QUEUE_NAME, processDocumentJob } from "../queues/document.queue.js";

export const startDocumentWorker = () => {
  const connection = createBullMQConnection();
  if (!connection) {
    console.warn("Document worker: Redis not configured — worker is disabled");
    return null;
  }

  const worker = new Worker(
    DOCUMENT_QUEUE_NAME,
    async (job) => {
      return processDocumentJob(job.data);
    },
    {
      connection,
      concurrency: 5,
      lockDuration: 30000,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Document processing job ${job?.id} completed for doc ${job?.data?.documentId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Document processing job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("Document worker error:", err.message);
  });

  return worker;
};
