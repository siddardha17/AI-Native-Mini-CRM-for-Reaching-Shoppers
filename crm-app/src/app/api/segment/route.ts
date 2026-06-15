import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { prompt, name, description } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Mock AI Logic: translate prompt into Prisma query conditions
    let queryRules: any = { include: { orders: true } };
    let conditionDesc = [];

    const lowerPrompt = prompt.toLowerCase();

    // Condition 1: Spent more than $X
    const spentMatch = lowerPrompt.match(/spent (?:more than |over )?\$?(\d+)/);
    const boughtMatch = lowerPrompt.match(/bought (?:more than |over )?\$?(\d+)/);
    const amount = spentMatch ? spentMatch[1] : (boughtMatch ? boughtMatch[1] : null);

    if (amount) {
      queryRules.where = {
        ...queryRules.where,
        orders: {
          some: {
            amount: {
              gte: parseFloat(amount),
            },
            status: 'COMPLETED'
          }
        }
      };
      conditionDesc.push(`spent over $${amount}`);
    }

    // Condition 2: Cancelled orders
    if (lowerPrompt.includes('cancel')) {
      queryRules.where = {
        ...queryRules.where,
        orders: {
          some: {
            status: 'CANCELLED'
          }
        }
      };
      conditionDesc.push(`have cancelled orders`);
    }

    // Condition 3: Default (All shoppers)
    if (Object.keys(queryRules.where || {}).length === 0) {
      // no specific where clause
      conditionDesc.push(`all shoppers`);
    }

    // Save the segment
    const segment = await prisma.segment.create({
      data: {
        name: name || `Segment: ${conditionDesc.join(' and ')}`,
        description: description || `AI Generated from: "${prompt}"`,
        queryRules: JSON.stringify(queryRules),
      }
    });

    return NextResponse.json({ segment });

  } catch (error: any) {
    console.error('Segment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ segments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
