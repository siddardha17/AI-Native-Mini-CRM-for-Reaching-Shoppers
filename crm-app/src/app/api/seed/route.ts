import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Charlie', 'Drew', 'Avery'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST() {
  try {
    // Clear existing data
    await prisma.communication.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.segment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.shopper.deleteMany();

    const shoppers = [];
    for (let i = 0; i < 20; i++) {
      const fName = getRandomItem(firstNames);
      const lName = getRandomItem(lastNames);
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@${getRandomItem(domains)}`;
      const phone = `+1555${Math.floor(100000 + Math.random() * 900000)}`;

      shoppers.push({
        name: `${fName} ${lName}`,
        email,
        phone,
      });
    }

    const createdShoppers = await Promise.all(
      shoppers.map(s => prisma.shopper.create({ data: s }))
    );

    const orders = [];
    for (const shopper of createdShoppers) {
      // 0 to 3 orders per shopper
      const numOrders = Math.floor(Math.random() * 4);
      for (let i = 0; i < numOrders; i++) {
        orders.push({
          shopperId: shopper.id,
          amount: parseFloat((Math.random() * 200 + 10).toFixed(2)),
          status: Math.random() > 0.1 ? 'COMPLETED' : 'CANCELLED',
        });
      }
    }

    await Promise.all(
      orders.map(o => prisma.order.create({ data: o }))
    );

    return NextResponse.json({ message: 'Database seeded successfully', shoppersCount: createdShoppers.length, ordersCount: orders.length });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
