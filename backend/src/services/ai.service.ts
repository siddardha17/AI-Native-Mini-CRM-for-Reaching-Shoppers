import Anthropic from '@anthropic-ai/sdk';
import type { SegmentInfo, SegmentRule, MessageSuggestion, SegmentSuggestion, CampaignPlan, Channel } from '../types/index.js';

// Lazy-init the client only when API key is available
let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-xxx' || apiKey.length < 20) {
    return null;
  }
  client = new Anthropic({ apiKey });
  return client;
}

const MODEL = 'claude-sonnet-4-6';

// ─── Mock Data ──────────────────────────────────────────────────────────────
// Returned when ANTHROPIC_API_KEY is not configured, so the app remains functional.

const MOCK_MESSAGE_SUGGESTION: MessageSuggestion = {
  messageTemplate: 'Hi {{name}}! We miss you at our store. Come back and enjoy 20% off your next purchase. Use code WELCOME20 at checkout!',
  subject: 'We miss you! Here\'s 20% off 🎉',
  reasoning: 'This template uses personalization, urgency, and a clear incentive to re-engage lapsed customers.',
  variants: [
    {
      messageTemplate: 'Hey {{name}}, it\'s been a while! Swing by and grab your favorite coffee — first one\'s on us this week.',
      subject: 'Your free coffee awaits ☕',
      tone: 'casual',
    },
    {
      messageTemplate: 'Dear {{name}}, as a valued customer, we\'d like to offer you an exclusive 25% discount on your next visit. We look forward to seeing you again.',
      subject: 'Exclusive offer just for you',
      tone: 'formal',
    },
  ],
};

const MOCK_SEGMENT_SUGGESTION: SegmentSuggestion = {
  rules: [
    { field: 'totalSpend', operator: 'gt', value: 5000, connector: 'AND' },
    { field: 'visitCount', operator: 'gte', value: 10 },
  ],
  name: 'High-Value Regulars',
  description: 'Customers who have spent over ₹5000 and visited at least 10 times',
  estimatedReach: 'Typically 15-25% of your customer base',
};

const MOCK_CAMPAIGN_PLAN: CampaignPlan = {
  segmentRules: [
    { field: 'lastVisitAt', operator: 'before', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), connector: 'AND' },
    { field: 'totalSpend', operator: 'gt', value: 1000 },
  ],
  segmentName: 'Lapsed High-Value Customers',
  segmentDescription: 'Customers who haven\'t visited in 30+ days but have spent over ₹1000',
  channel: 'EMAIL',
  messageTemplate: 'Hi {{name}}, we noticed it\'s been a while since your last visit. We\'d love to welcome you back with a special 15% discount. Your loyalty means everything to us!',
  subject: 'We miss you! Come back for 15% off',
  timing: 'Send Tuesday or Wednesday between 10am-12pm for optimal open rates',
  reasoning: 'Re-engagement campaigns targeting high-value lapsed customers typically yield 8-12% conversion rates. Email is best for this segment as it allows for richer content and trackable offers.',
};

// ─── AI Functions ───────────────────────────────────────────────────────────

/**
 * Generates a personalized message template for a campaign.
 */
export async function suggestMessage(
  segmentInfo: SegmentInfo,
  campaignGoal: string,
  channel: Channel
): Promise<MessageSuggestion> {
  const ai = getClient();
  if (!ai) {
    console.log('[AI] API key not configured, returning mock message suggestion');
    return MOCK_MESSAGE_SUGGESTION;
  }

  try {
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a CRM marketing expert. Generate a message template for a campaign.

Segment: ${segmentInfo.name} (${segmentInfo.customerCount} customers)
${segmentInfo.description ? `Description: ${segmentInfo.description}` : ''}
Segment Rules: ${JSON.stringify(segmentInfo.rules)}

Campaign Goal: ${campaignGoal}
Channel: ${channel}

Return JSON only (no markdown) in this exact format:
{
  "messageTemplate": "message with {{name}} placeholder for personalization",
  "subject": "email subject line (only for EMAIL channel, null otherwise)",
  "reasoning": "brief explanation of why this message works",
  "variants": [
    { "messageTemplate": "variant 1", "subject": "subject 1 or null", "tone": "casual" },
    { "messageTemplate": "variant 2", "subject": "subject 2 or null", "tone": "formal" }
  ]
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as MessageSuggestion;
  } catch (error) {
    console.error('[AI] suggestMessage error:', error);
    return MOCK_MESSAGE_SUGGESTION;
  }
}

/**
 * Converts a natural language description into structured SegmentRule[].
 */
export async function suggestSegment(
  naturalLanguageDescription: string
): Promise<SegmentSuggestion> {
  const ai = getClient();
  if (!ai) {
    console.log('[AI] API key not configured, returning mock segment suggestion');
    return MOCK_SEGMENT_SUGGESTION;
  }

  try {
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a CRM data expert. Convert this natural language description into structured segment rules.

Available fields:
- name (string): customer name
- email (string): customer email
- city (string): customer city
- totalSpend (number): total amount spent in INR
- visitCount (number): total visits
- lastVisitAt (date ISO string): last visit date
- tags (string[]): customer tags like "vip", "regular", "lapsed", "coffee-lover", "tea-lover", "morning-person", "weekend-visitor", "loyalty-member", "new"

Available operators: gt, gte, lt, lte, eq, neq, contains, not_contains, in, not_in, between, before, after

Description: "${naturalLanguageDescription}"

Return JSON only (no markdown) in this exact format:
{
  "rules": [
    { "field": "fieldName", "operator": "op", "value": "val", "connector": "AND" }
  ],
  "name": "Suggested segment name",
  "description": "Human-readable description",
  "estimatedReach": "Rough estimate of reach"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as SegmentSuggestion;
  } catch (error) {
    console.error('[AI] suggestSegment error:', error);
    return MOCK_SEGMENT_SUGGESTION;
  }
}

/**
 * Generates a full campaign plan from a goal description.
 */
export async function generateCampaignPlan(
  goalDescription: string
): Promise<CampaignPlan> {
  const ai = getClient();
  if (!ai) {
    console.log('[AI] API key not configured, returning mock campaign plan');
    return MOCK_CAMPAIGN_PLAN;
  }

  try {
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a CRM marketing strategist. Create a complete campaign plan for this goal.

Available customer fields:
- name, email, city (strings)
- totalSpend (number, INR), visitCount (number)
- lastVisitAt (ISO date string)
- tags: "vip", "regular", "lapsed", "coffee-lover", "tea-lover", "morning-person", "weekend-visitor", "loyalty-member", "new"

Available channels: EMAIL, SMS, WHATSAPP, RCS
Available operators: gt, gte, lt, lte, eq, neq, contains, not_contains, in, not_in, between, before, after

Goal: "${goalDescription}"

Return JSON only (no markdown) in this exact format:
{
  "segmentRules": [{ "field": "f", "operator": "op", "value": "v", "connector": "AND" }],
  "segmentName": "name",
  "segmentDescription": "description",
  "channel": "EMAIL",
  "messageTemplate": "template with {{name}}",
  "subject": "subject or null",
  "timing": "when to send",
  "reasoning": "why this plan"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text) as CampaignPlan;
  } catch (error) {
    console.error('[AI] generateCampaignPlan error:', error);
    return MOCK_CAMPAIGN_PLAN;
  }
}
