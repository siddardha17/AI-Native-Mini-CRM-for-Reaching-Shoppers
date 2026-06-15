import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import type { CreateCustomerBody, ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/customers
 * Paginated list with search (name/email), filter by city/tags, and sort.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || '';
    const city = req.query.city as string;
    const tags = req.query.tags as string; // comma-separated
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    const response: ApiResponse<typeof customers> = {
      data: customers,
      meta: { page, pageSize, total },
    };

    res.json(response);
  } catch (error) {
    console.error('[Customers] GET / error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/customers/:id
 * Single customer with recent orders.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        segmentMembers: {
          include: { segment: { select: { id: true, name: true } } },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json({ data: customer });
  } catch (error) {
    console.error('[Customers] GET /:id error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

/**
 * POST /api/customers
 * Create a single customer.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateCustomerBody = req.body;

    if (!body.name || !body.email || !body.city) {
      res.status(400).json({ error: 'name, email, and city are required' });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        city: body.city,
        totalSpend: body.totalSpend || 0,
        visitCount: body.visitCount || 0,
        lastVisitAt: body.lastVisitAt ? new Date(body.lastVisitAt) : null,
        tags: body.tags || [],
      },
    });

    res.status(201).json({ data: customer });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'A customer with this email already exists' });
      return;
    }
    console.error('[Customers] POST / error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

/**
 * POST /api/customers/import
 * Bulk import customers from a JSON array body.
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const customers: CreateCustomerBody[] = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      res.status(400).json({ error: 'Request body must be a non-empty array of customers' });
      return;
    }

    const result = await prisma.customer.createMany({
      data: customers.map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        totalSpend: c.totalSpend || 0,
        visitCount: c.visitCount || 0,
        lastVisitAt: c.lastVisitAt ? new Date(c.lastVisitAt) : null,
        tags: c.tags || [],
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      data: { imported: result.count, total: customers.length },
    });
  } catch (error) {
    console.error('[Customers] POST /import error:', error);
    res.status(500).json({ error: 'Failed to import customers' });
  }
});

export default router;
