import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, segmentId, message, channel } = await req.json();

    if (!name || !segmentId || !message || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Segment
    const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // 2. Execute Segment Query to get shoppers
    const queryRules = JSON.parse(segment.queryRules);
    const shoppers = await prisma.shopper.findMany(queryRules);

    if (shoppers.length === 0) {
      return NextResponse.json({ error: 'Segment has no shoppers' }, { status: 400 });
    }

    // 3. Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId,
        message,
        channel,
        status: 'SENDING'
      }
    });

    // 4. Create Communications
    const communications = await Promise.all(
      shoppers.map((shopper: { id: any; }) => prisma.communication.create({
        data: {
          campaignId: campaign.id,
          shopperId: shopper.id,
          channel,
          message,
          status: 'PENDING'
        }
      }))
    );

    // 5. Call Channel Service Asynchronously
    // Note: We don't await this so the request returns quickly.
    fetch('http://localhost:4000/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaign.id,
        communications: communications.map(c => ({
          id: c.id,
          recipient: c.shopperId, // real app would send phone/email
          message: c.message,
          channel: c.channel
        }))
      })
    }).catch(err => console.error('Failed to call channel service:', err));

    return NextResponse.json({ campaign, communicationsCount: communications.length });

  } catch (error: any) {
    console.error('Campaign create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: true,
        communications: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
