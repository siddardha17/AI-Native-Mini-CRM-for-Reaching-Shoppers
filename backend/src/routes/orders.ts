import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import type { CreateOrderBody, ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/orders
 * Paginated list with optional customer filter.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const customerId = req.query.customerId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    const response: ApiResponse<typeof orders> = {
      data: orders,
      meta: { page, pageSize, total },
    };

    res.json(response);
  } catch (error) {
    console.error('[Orders] GET / error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/orders
 * Create a single order.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateOrderBody = req.body;

    if (!body.customerId || !body.items || !body.totalAmount) {
      res.status(400).json({ error: 'customerId, items, and totalAmount are required' });
      return;
    }

    // Create order and update customer stats in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: body.customerId,
          items: body.items as any,
          totalAmount: body.totalAmount,
          channel: body.channel || 'ONLINE',
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
        },
      });

      // Update customer aggregate stats
      await tx.customer.update({
        where: { id: body.customerId },
        data: {
          totalSpend: { increment: body.totalAmount },
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });

      return newOrder;
    });

    res.status(201).json({ data: order });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    console.error('[Orders] POST / error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * POST /api/orders/import
 * Bulk import orders from a JSON array body.
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const orders: CreateOrderBody[] = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({ error: 'Request body must be a non-empty array of orders' });
      return;
    }

    const result = await prisma.order.createMany({
      data: orders.map((o) => ({
        customerId: o.customerId,
        items: o.items as any,
        totalAmount: o.totalAmount,
        channel: o.channel || 'ONLINE',
      })),
    });

    res.status(201).json({
      data: { imported: result.count, total: orders.length },
    });
  } catch (error) {
    console.error('[Orders] POST /import error:', error);
    res.status(500).json({ error: 'Failed to import orders' });
  }
});

export default router;
