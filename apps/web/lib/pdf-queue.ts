import { Queue } from "bullmq";
import redis from "./redis";

export const pdfQueue = new Queue("pdf-generation", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function enqueuePdfGeneration(orderId: string) {
  return pdfQueue.add("generate-pdf", { orderId }, { jobId: `pdf_${orderId}` });
}
