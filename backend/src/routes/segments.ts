import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { materializeSegment, previewSegment } from '../services/segment.service.js';
import { suggestSegment } from '../services/ai.service.js';
import type { CreateSegmentBody, SegmentRule } from '../types/index.js';

const router = Router();

/**
 * GET /api/segments
 * List all segments with customerCount.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, campaigns: true } },
      },
    });

    res.json({ data: segments });
  } catch (error) {
    console.error('[Segments] GET / error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

/**
 * POST /api/segments
 * Create a segment with rules JSON, auto-materialize.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateSegmentBody = req.body;

    if (!body.name || !body.rules || !Array.isArray(body.rules)) {
      res.status(400).json({ error: 'name and rules (array) are required' });
      return;
    }

    const segment = await prisma.segment.create({
      data: {
        name: body.name,
        description: body.description,
        rules: body.rules as any,
        aiGenerated: body.aiGenerated || false,
      },
    });

    // Auto-materialize: evaluate rules and populate segment members
    const count = await materializeSegment(segment.id);

    const updated = await prisma.segment.findUnique({
      where: { id: segment.id },
      include: {
        _count: { select: { members: true } },
      },
    });

    res.status(201).json({ data: { ...updated, materializedCount: count } });
  } catch (error) {
    console.error('[Segments] POST / error:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

/**
 * POST /api/segments/ai
 * Natural language to segment rules using AI service.
 */
router.post('/ai', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const suggestion = await suggestSegment(description);

    // Also get a preview count for the suggested rules
    const count = await previewSegment(suggestion.rules);

    res.json({
      data: {
        ...suggestion,
        previewCount: count,
      },
    });
  } catch (error) {
    console.error('[Segments] POST /ai error:', error);
    res.status(500).json({ error: 'Failed to generate segment suggestion' });
  }
});

/**
 * GET /api/segments/:id/preview
 * Dry-run count of matching customers without materializing.
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const segment = await prisma.segment.findUnique({
      where: { id: req.params.id },
    });

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    const rules = segment.rules as unknown as SegmentRule[];
    const count = await previewSegment(rules);

    res.json({ data: { segmentId: segment.id, name: segment.name, previewCount: count } });
  } catch (error) {
    console.error('[Segments] GET /:id/preview error:', error);
    res.status(500).json({ error: 'Failed to preview segment' });
  }
});

/**
 * POST /api/segments/:id/materialize
 * Refresh segment membership by re-evaluating rules.
 */
router.post('/:id/materialize', async (req: Request, res: Response) => {
  try {
    const segment = await prisma.segment.findUnique({
      where: { id: req.params.id },
    });

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    const count = await materializeSegment(segment.id);

    res.json({ data: { segmentId: segment.id, name: segment.name, customerCount: count } });
  } catch (error) {
    console.error('[Segments] POST /:id/materialize error:', error);
    res.status(500).json({ error: 'Failed to materialize segment' });
  }
});

export default router;
