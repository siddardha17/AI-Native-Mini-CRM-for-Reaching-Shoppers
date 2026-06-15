import prisma from '../lib/prisma.js';
import { campaignQueue } from '../lib/queue.js';
import type { CampaignStats } from '../types/index.js';

/**
 * Triggers a campaign send by adding it to the BullMQ queue.
 * Updates campaign status to SENDING.
 */
export async function sendCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      segment: {
        include: {
          members: { select: { customerId: true } },
        },
      },
    },
  });

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new Error(`Campaign ${campaignId} is in ${campaign.status} status and cannot be sent`);
  }

  if (campaign.segment.members.length === 0) {
    throw new Error(`Campaign ${campaignId} has no segment members. Materialize the segment first.`);
  }

  // Update status to SENDING
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  // Add job to queue
  await campaignQueue.add(
    'send-campaign',
    { campaignId },
    {
      jobId: `campaign-${campaignId}`,
    }
  );
}

/**
 * Aggregates communication statuses into campaign stats.
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const [total, sent, delivered, failed, opened, read, clicked] = await Promise.all([
    prisma.communication.count({ where: { campaignId } }),
    prisma.communication.count({ where: { campaignId, status: 'SENT' } }),
    prisma.communication.count({ where: { campaignId, status: 'DELIVERED' } }),
    prisma.communication.count({ where: { campaignId, status: 'FAILED' } }),
    prisma.communication.count({ where: { campaignId, status: 'OPENED' } }),
    prisma.communication.count({ where: { campaignId, status: 'READ' } }),
    prisma.communication.count({ where: { campaignId, status: 'CLICKED' } }),
  ]);

  return { total, sent, delivered, failed, opened, read, clicked };
}

/**
 * Recalculates and persists campaign stats to the campaign record.
 */
export async function updateCampaignStats(campaignId: string): Promise<CampaignStats> {
  const stats = await getCampaignStats(campaignId);

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { stats: stats as any },
  });

  return stats;
}
