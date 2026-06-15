import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendCampaign, getCampaignStats } from '../services/campaign.service.js';
import type { CreateCampaignBody } from '../types/index.js';

const router = Router();

/**
 * GET /api/campaigns
 * List campaigns with status and segment info.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        segment: { select: { id: true, name: true, customerCount: true } },
        _count: { select: { communications: true } },
      },
    });

    res.json({ data: campaigns });
  } catch (error) {
    console.error('[Campaigns] GET / error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/campaigns/:id
 * Single campaign with communications.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        segment: {
          select: { id: true, name: true, customerCount: true, description: true },
        },
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            customer: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { communications: true } },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({ data: campaign });
  } catch (error) {
    console.error('[Campaigns] GET /:id error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * POST /api/campaigns
 * Create a campaign in DRAFT status.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateCampaignBody = req.body;

    if (!body.name || !body.segmentId || !body.channel || !body.messageTemplate) {
      res.status(400).json({ error: 'name, segmentId, channel, and messageTemplate are required' });
      return;
    }

    // Verify segment exists
    const segment = await prisma.segment.findUnique({
      where: { id: body.segmentId },
    });

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        segmentId: body.segmentId,
        channel: body.channel,
        messageTemplate: body.messageTemplate,
        subject: body.subject,
        status: 'DRAFT',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
      include: {
        segment: { select: { id: true, name: true, customerCount: true } },
      },
    });

    res.status(201).json({ data: campaign });
  } catch (error) {
    console.error('[Campaigns] POST / error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * POST /api/campaigns/:id/send
 * Trigger a campaign send via BullMQ queue.
 */
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    await sendCampaign(campaignId);

    res.json({ data: { campaignId, status: 'SENDING', message: 'Campaign queued for sending' } });
  } catch (error: any) {
    console.error('[Campaigns] POST /:id/send error:', error);
    res.status(400).json({ error: error.message || 'Failed to send campaign' });
  }
});

/**
 * GET /api/campaigns/:id/stats
 * Real-time campaign statistics.
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const stats = await getCampaignStats(req.params.id);

    res.json({
      data: {
        campaignId: req.params.id,
        campaignName: campaign.name,
        status: campaign.status,
        stats,
      },
    });
  } catch (error) {
    console.error('[Campaigns] GET /:id/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

export default router;
