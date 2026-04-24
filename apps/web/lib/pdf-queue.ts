import { Queue } from "bullmq";
import redis from "./redis";

let pdfQueue: Queue | undefined;

function getPdfQueue(): Queue {
  if (!pdfQueue) {
    pdfQueue = new Queue("pdf-generation", {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return pdfQueue;
}

export async function enqueuePdfGeneration(orderId: string) {
  return getPdfQueue().add("generate-pdf", { orderId }, { jobId: `pdf_${orderId}` });
}
