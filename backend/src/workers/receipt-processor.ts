import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis.js';
import prisma from '../lib/prisma.js';
import { updateCampaignStats } from '../services/campaign.service.js';
import type { DeliveryReceipt } from '../types/index.js';

async function processReceipt(job: Job<DeliveryReceipt>): Promise<void> {
  const receipt = job.data;
  console.log(`[ReceiptProcessor] Processing receipt for comm ${receipt.communicationId}: ${receipt.status}`);

  const communication = await prisma.communication.findUnique({
    where: { id: receipt.communicationId },
  });

  if (!communication) {
    console.warn(`[ReceiptProcessor] Communication ${receipt.communicationId} not found, skipping`);
    return;
  }

  const timestamp = new Date(receipt.timestamp);

  // Build the update data based on the delivery status
  const updateData: Record<string, any> = {
    status: receipt.status,
  };

  switch (receipt.status) {
    case 'SENT':
      updateData.sentAt = timestamp;
      break;
    case 'DELIVERED':
      updateData.deliveredAt = timestamp;
      break;
    case 'OPENED':
      updateData.openedAt = timestamp;
      break;
    case 'READ':
      updateData.readAt = timestamp;
      break;
    case 'CLICKED':
      updateData.clickedAt = timestamp;
      break;
    case 'FAILED':
      updateData.failedReason = receipt.failedReason || 'Unknown failure';
      break;
  }

  await prisma.communication.update({
    where: { id: receipt.communicationId },
    data: updateData,
  });

  // Recalculate campaign stats after each receipt
  await updateCampaignStats(communication.campaignId);
}

/**
 * Starts the receipt processor worker.
 * Returns the worker instance for graceful shutdown.
 */
export function startReceiptProcessorWorker(): Worker {
  const worker = new Worker<DeliveryReceipt>('receipt-process', processReceipt, {
    connection: getRedisConnection(),
    concurrency: 10, // Receipts are lightweight, can process many concurrently
  });

  worker.on('completed', (job) => {
    console.log(`[ReceiptProcessor] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ReceiptProcessor] Job ${job?.id} failed:`, err.message);
  });

  console.log('[ReceiptProcessor] Worker started');
  return worker;
}
