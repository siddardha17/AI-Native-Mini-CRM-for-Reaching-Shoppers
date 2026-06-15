import { Queue } from 'bullmq';
import { getRedisConnection } from './redis.js';

const connection = getRedisConnection();

/**
 * Queue for campaign send jobs.
 * Jobs contain { campaignId } and are processed by the campaign-sender worker.
 */
export const campaignQueue = new Queue('campaign-send', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Queue for delivery receipt processing.
 * Jobs contain DeliveryReceipt data from the channel service.
 */
export const receiptQueue = new Queue('receipt-process', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
});

export { connection as queueConnection };
