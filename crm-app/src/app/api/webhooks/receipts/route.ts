import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { communicationId, status, externalId } = await req.json();

    if (!communicationId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await prisma.communication.update({
      where: { id: communicationId },
      data: {
        status,
        ...(externalId && { externalId })
      }
    });

    return NextResponse.json({ success: true, communication: updated });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
