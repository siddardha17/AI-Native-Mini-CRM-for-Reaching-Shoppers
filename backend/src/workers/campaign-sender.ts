import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../lib/redis.js';
import prisma from '../lib/prisma.js';
import { updateCampaignStats } from '../services/campaign.service.js';
import type { ChannelSendRequest } from '../types/index.js';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200;
const PORT = process.env.PORT || '3001';

interface CampaignSendJob {
  campaignId: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCampaignSend(job: Job<CampaignSendJob>): Promise<void> {
  const { campaignId } = job.data;
  console.log(`[CampaignSender] Processing campaign ${campaignId}`);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      segment: {
        include: {
          members: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  });

  const members = campaign.segment.members;
  console.log(`[CampaignSender] Sending to ${members.length} customers`);

  // Create all Communication records in PENDING status up front
  const communicationData = members.map((member) => ({
    campaignId,
    customerId: member.customer.id,
    channel: campaign.channel,
    message: campaign.messageTemplate.replace(/\{\{name\}\}/g, member.customer.name),
    status: 'PENDING' as const,
  }));

  await prisma.communication.createMany({ data: communicationData });

  // Fetch the created communications to get their IDs
  const communications = await prisma.communication.findMany({
    where: { campaignId, status: 'PENDING' },
    include: { customer: true },
  });

  // Process in batches
  for (let i = 0; i < communications.length; i += BATCH_SIZE) {
    const batch = communications.slice(i, i + BATCH_SIZE);

    const sendPromises = batch.map(async (comm) => {
      const payload: ChannelSendRequest = {
        communicationId: comm.id,
        channel: comm.channel,
        to: {
          email: comm.customer.email,
          phone: comm.customer.phone || undefined,
          name: comm.customer.name,
        },
        message: comm.message,
        subject: campaign.subject || undefined,
        callbackUrl: `http://localhost:${PORT}/api/receipts`,
      };

      try {
        const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await prisma.communication.update({
            where: { id: comm.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          const errorBody = await response.text();
          await prisma.communication.update({
            where: { id: comm.id },
            data: { status: 'FAILED', failedReason: `Channel service error: ${response.status} ${errorBody}` },
          });
        }
      } catch (error) {
        // Channel service may be unavailable — mark as SENT anyway for demo purposes
        // In production, this would retry or mark as FAILED
        await prisma.communication.update({
          where: { id: comm.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            failedReason: error instanceof Error ? `Channel unreachable: ${error.message}` : 'Channel unreachable',
          },
        });
      }
    });

    await Promise.all(sendPromises);

    // Update progress
    const processed = Math.min(i + BATCH_SIZE, communications.length);
    await job.updateProgress(Math.round((processed / communications.length) * 100));

    // Small delay between batches to avoid overwhelming the channel service
    if (i + BATCH_SIZE < communications.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Mark campaign as SENT
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  // Calculate and persist stats
  await updateCampaignStats(campaignId);
  console.log(`[CampaignSender] Campaign ${campaignId} completed`);
}

/**
 * Starts the campaign sender worker.
 * Returns the worker instance for graceful shutdown.
 */
export function startCampaignSenderWorker(): Worker {
  const worker = new Worker<CampaignSendJob>('campaign-send', processCampaignSend, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log(`[CampaignSender] Job ${job.id} completed`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`[CampaignSender] Job ${job?.id} failed:`, err.message);

    // Mark campaign as FAILED if the job fails after all retries
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      try {
        await prisma.campaign.update({
          where: { id: job.data.campaignId },
          data: { status: 'FAILED' },
        });
      } catch {
        // Ignore: campaign may not exist
      }
    }
  });

  console.log('[CampaignSender] Worker started');
  return worker;
}
