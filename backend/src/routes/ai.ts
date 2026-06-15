import { Router, Request, Response } from 'express';
import { suggestMessage, suggestSegment, generateCampaignPlan } from '../services/ai.service.js';
import { previewSegment } from '../services/segment.service.js';
import type { SegmentInfo, Channel } from '../types/index.js';

const router = Router();

/**
 * POST /api/ai/suggest-message
 * AI-powered message template generation.
 */
router.post('/suggest-message', async (req: Request, res: Response) => {
  try {
    const { segmentInfo, campaignGoal, channel } = req.body;

    if (!campaignGoal || !channel) {
      res.status(400).json({ error: 'campaignGoal and channel are required' });
      return;
    }

    const defaultSegmentInfo: SegmentInfo = segmentInfo || {
      name: 'All Customers',
      customerCount: 0,
      rules: [],
    };

    const suggestion = await suggestMessage(
      defaultSegmentInfo,
      campaignGoal,
      channel as Channel
    );

    res.json({ data: suggestion });
  } catch (error) {
    console.error('[AI] POST /suggest-message error:', error);
    res.status(500).json({ error: 'Failed to generate message suggestion' });
  }
});

/**
 * POST /api/ai/suggest-segment
 * Convert natural language to structured segment rules.
 */
router.post('/suggest-segment', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const suggestion = await suggestSegment(description);

    // Get preview count for the suggested rules
    const previewCount = await previewSegment(suggestion.rules);

    res.json({
      data: {
        ...suggestion,
        previewCount,
      },
    });
  } catch (error) {
    console.error('[AI] POST /suggest-segment error:', error);
    res.status(500).json({ error: 'Failed to generate segment suggestion' });
  }
});

/**
 * POST /api/ai/campaign-plan
 * Full AI campaign plan from a goal description.
 */
router.post('/campaign-plan', async (req: Request, res: Response) => {
  try {
    const { goalDescription } = req.body;

    if (!goalDescription) {
      res.status(400).json({ error: 'goalDescription is required' });
      return;
    }

    const plan = await generateCampaignPlan(goalDescription);

    // Get preview count for the suggested segment rules
    const previewCount = await previewSegment(plan.segmentRules);

    res.json({
      data: {
        ...plan,
        previewCount,
      },
    });
  } catch (error) {
    console.error('[AI] POST /campaign-plan error:', error);
    res.status(500).json({ error: 'Failed to generate campaign plan' });
  }
});

export default router;
