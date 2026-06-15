import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { receiptQueue } from '../lib/queue.js';
import { updateCampaignStats } from '../services/campaign.service.js';
import type { DeliveryReceipt } from '../types/index.js';

const router = Router();

/**
 * POST /api/receipts
 * Callback endpoint for channel service delivery receipts.
 * Accepts a DeliveryReceipt and updates the communication status.
 *
 * For high volume, we queue the receipt for async processing.
 * For low volume / real-time needs, we process inline.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const receipt: DeliveryReceipt = req.body;

    if (!receipt.communicationId || !receipt.status) {
      res.status(400).json({ error: 'communicationId and status are required' });
      return;
    }

    // Validate the communication exists
    const communication = await prisma.communication.findUnique({
      where: { id: receipt.communicationId },
    });

    if (!communication) {
      res.status(404).json({ error: 'Communication not found' });
      return;
    }

    const timestamp = new Date(receipt.timestamp || new Date().toISOString());

    // Update communication status and timestamp inline for immediate consistency
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

    // Queue stats recalculation asynchronously to avoid blocking the response
    // The receipt-processor worker handles this
    await receiptQueue.add('process-receipt', receipt, {
      jobId: `receipt-${receipt.communicationId}-${receipt.status}`,
    });

    // Also trigger immediate stats update for the campaign
    await updateCampaignStats(communication.campaignId);

    res.json({ data: { status: 'received', communicationId: receipt.communicationId } });
  } catch (error) {
    console.error('[Receipts] POST / error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

export default router;
