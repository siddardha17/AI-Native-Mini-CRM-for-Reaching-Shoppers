import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/analytics/overview
 * High-level metrics: total customers, orders, campaigns, revenue, delivery rate.
 */
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [
      totalCustomers,
      totalOrders,
      totalCampaigns,
      revenueResult,
      totalCommunications,
      deliveredCommunications,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.campaign.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.communication.count(),
      prisma.communication.count({ where: { status: { in: ['DELIVERED', 'OPENED', 'READ', 'CLICKED'] } } }),
    ]);

    const totalRevenue = revenueResult._sum.totalAmount || 0;
    const deliveryRate = totalCommunications > 0
      ? Math.round((deliveredCommunications / totalCommunications) * 10000) / 100
      : 0;

    res.json({
      data: {
        totalCustomers,
        totalOrders,
        totalCampaigns,
        totalRevenue,
        totalCommunications,
        deliveredCommunications,
        deliveryRate,
      },
    });
  } catch (error) {
    console.error('[Analytics] GET /overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

/**
 * GET /api/analytics/campaigns
 * Per-campaign performance metrics.
 */
router.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: { in: ['SENT', 'SENDING'] } },
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        name: true,
        channel: true,
        status: true,
        sentAt: true,
        stats: true,
        segment: { select: { name: true, customerCount: true } },
        _count: { select: { communications: true } },
      },
    });

    // Enrich with computed rates
    const enriched = campaigns.map((c) => {
      const stats = (c.stats as any) || { total: 0, sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0 };
      const total = stats.total || 1;
      return {
        ...c,
        deliveryRate: Math.round((stats.delivered / total) * 10000) / 100,
        openRate: Math.round((stats.opened / total) * 10000) / 100,
        clickRate: Math.round((stats.clicked / total) * 10000) / 100,
        failureRate: Math.round((stats.failed / total) * 10000) / 100,
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    console.error('[Analytics] GET /campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

/**
 * GET /api/analytics/channels
 * Per-channel delivery/open/click rates.
 */
router.get('/channels', async (_req: Request, res: Response) => {
  try {
    // Get unique channels used
    const channels = await prisma.communication.groupBy({
      by: ['channel'],
      _count: { id: true },
    });

    const channelStats = await Promise.all(
      channels.map(async (ch) => {
        const [total, sent, delivered, failed, opened, read, clicked] = await Promise.all([
          prisma.communication.count({ where: { channel: ch.channel } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'SENT' } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'DELIVERED' } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'FAILED' } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'OPENED' } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'READ' } }),
          prisma.communication.count({ where: { channel: ch.channel, status: 'CLICKED' } }),
        ]);

        const safeTotal = total || 1;
        return {
          channel: ch.channel,
          total,
          sent,
          delivered,
          failed,
          opened,
          read,
          clicked,
          deliveryRate: Math.round((delivered / safeTotal) * 10000) / 100,
          openRate: Math.round((opened / safeTotal) * 10000) / 100,
          clickRate: Math.round((clicked / safeTotal) * 10000) / 100,
        };
      })
    );

    res.json({ data: channelStats });
  } catch (error) {
    console.error('[Analytics] GET /channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channel analytics' });
  }
});

export default router;
