import { PrismaClient, CampaignStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ── Roast & Co. domain data ──────────────────────────────────────────────────

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

const DRINKS = [
  { name: 'Espresso', price: 180 },
  { name: 'Americano', price: 220 },
  { name: 'Cappuccino', price: 280 },
  { name: 'Latte', price: 300 },
  { name: 'Flat White', price: 320 },
  { name: 'Cold Brew', price: 350 },
  { name: 'Mocha', price: 340 },
  { name: 'Macchiato', price: 260 },
  { name: 'Cortado', price: 240 },
  { name: 'Affogato', price: 380 },
  { name: 'Matcha Latte', price: 360 },
  { name: 'Chai Latte', price: 250 },
  { name: 'Iced Caramel Frappé', price: 400 },
  { name: 'Nitro Cold Brew', price: 420 },
  { name: 'Vanilla Bean Frappuccino', price: 380 },
];

const FOOD_ITEMS = [
  { name: 'Almond Croissant', price: 220 },
  { name: 'Blueberry Muffin', price: 180 },
  { name: 'Avocado Toast', price: 320 },
  { name: 'Chocolate Brownie', price: 200 },
  { name: 'Banana Bread', price: 190 },
  { name: 'Grilled Panini', price: 350 },
  { name: 'Caesar Salad', price: 380 },
  { name: 'Cookie (Choc Chip)', price: 120 },
];

const TAGS = [
  'coffee-lover', 'tea-enthusiast', 'morning-regular', 'weekend-visitor',
  'loyalty-member', 'premium-tier', 'student', 'remote-worker',
  'foodie', 'health-conscious', 'decaf-only', 'seasonal-visitor',
  'birthday-month', 'referred-friend', 'app-user', 'newsletter-subscriber',
];

const ORDER_CHANNELS = ['in-store', 'mobile-app', 'online', 'delivery'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOrderItems(): { name: string; price: number; quantity: number }[] {
  const drinkCount = randomBetween(1, 3);
  const foodCount = Math.random() > 0.4 ? randomBetween(1, 2) : 0;

  const items: { name: string; price: number; quantity: number }[] = [];

  pickRandom(DRINKS, drinkCount).forEach((drink) => {
    items.push({ ...drink, quantity: randomBetween(1, 2) });
  });

  if (foodCount > 0) {
    pickRandom(FOOD_ITEMS, foodCount).forEach((food) => {
      items.push({ ...food, quantity: 1 });
    });
  }

  return items;
}

// ── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Xeno CRM database for Roast & Co...\n');

  // Clean existing data
  console.log('  🗑️  Clearing existing data...');
  await prisma.communication.deleteMany();
  await prisma.segmentMember.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  // ── 1. Create Customers ──────────────────────────────────────────────────
  console.log('  👥 Creating 200 customers...');
  const customers = [];

  for (let i = 0; i < 200; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const city = pickRandom(CITIES)[0];
    const tagCount = randomBetween(1, 4);
    const tags = pickRandom(TAGS, tagCount).map(String);
    const visitCount = randomBetween(1, 60);

    // Create varied customer profiles
    let totalSpend: number;
    const tier = Math.random();
    if (tier < 0.1) {
      // VIP: 10% of customers
      totalSpend = randomBetween(15000, 50000);
    } else if (tier < 0.35) {
      // Regular: 25%
      totalSpend = randomBetween(3000, 15000);
    } else if (tier < 0.65) {
      // Occasional: 30%
      totalSpend = randomBetween(500, 3000);
    } else {
      // New/Inactive: 35%
      totalSpend = randomBetween(0, 500);
    }

    const monthsAgo = randomBetween(0, 18);
    const lastVisitAt = new Date();
    lastVisitAt.setMonth(lastVisitAt.getMonth() - monthsAgo);
    lastVisitAt.setDate(lastVisitAt.getDate() - randomBetween(0, 28));

    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - randomBetween(monthsAgo, 24));

    const customer = await prisma.customer.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number({ style: 'international' }),
        city,
        totalSpend,
        visitCount,
        lastVisitAt,
        tags,
        createdAt,
      },
    });

    customers.push(customer);
  }
  console.log(`  ✅ Created ${customers.length} customers\n`);

  // ── 2. Create Orders ─────────────────────────────────────────────────────
  console.log('  🛒 Creating ~500 orders...');
  let orderCount = 0;

  for (const customer of customers) {
    const numOrders = randomBetween(1, 8);

    for (let j = 0; j < numOrders; j++) {
      if (orderCount >= 500) break;

      const items = generateOrderItems();
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const channel = pickRandom(ORDER_CHANNELS)[0];

      const orderDate = new Date();
      orderDate.setMonth(orderDate.getMonth() - randomBetween(0, 12));
      orderDate.setDate(orderDate.getDate() - randomBetween(0, 28));

      await prisma.order.create({
        data: {
          customerId: customer.id,
          items: items as any,
          totalAmount,
          channel,
          createdAt: orderDate,
        },
      });

      orderCount++;
    }
    if (orderCount >= 500) break;
  }
  console.log(`  ✅ Created ${orderCount} orders\n`);

  // ── 3. Create Segments ───────────────────────────────────────────────────
  console.log('  📊 Creating sample segments...');

  const segmentDefs = [
    {
      name: 'High-Value Regulars',
      description: 'Customers who spend over ₹10,000 and visit frequently',
      rules: {
        operator: 'AND',
        conditions: [
          { field: 'totalSpend', operator: 'gte', value: 10000 },
          { field: 'visitCount', operator: 'gte', value: 10 },
        ],
      },
    },
    {
      name: 'Lapsed Coffee Lovers',
      description: 'Customers who haven\'t visited in the last 3 months',
      rules: {
        operator: 'AND',
        conditions: [
          { field: 'lastVisitAt', operator: 'before', value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
          { field: 'visitCount', operator: 'gte', value: 3 },
        ],
      },
    },
    {
      name: 'New Customers (Last 30 Days)',
      description: 'Recently acquired customers to onboard',
      rules: {
        operator: 'AND',
        conditions: [
          { field: 'createdAt', operator: 'after', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        ],
      },
    },
    {
      name: 'Mumbai Premium',
      description: 'High-spending customers in Mumbai',
      rules: {
        operator: 'AND',
        conditions: [
          { field: 'city', operator: 'eq', value: 'Mumbai' },
          { field: 'totalSpend', operator: 'gte', value: 5000 },
        ],
      },
    },
    {
      name: 'Loyalty Program Members',
      description: 'Customers tagged as loyalty members',
      rules: {
        operator: 'AND',
        conditions: [
          { field: 'tags', operator: 'contains', value: 'loyalty-member' },
        ],
      },
    },
  ];

  for (const def of segmentDefs) {
    const segment = await prisma.segment.create({
      data: {
        name: def.name,
        description: def.description,
        rules: def.rules as any,
      },
    });

    // Materialize segment members
    const whereClause = buildWhereClause(def.rules as any);
    const matchingCustomers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (matchingCustomers.length > 0) {
      await prisma.segmentMember.createMany({
        data: matchingCustomers.map((c) => ({
          segmentId: segment.id,
          customerId: c.id,
        })),
      });

      await prisma.segment.update({
        where: { id: segment.id },
        data: { customerCount: matchingCustomers.length },
      });
    }

    console.log(`    📌 "${def.name}" — ${matchingCustomers.length} members`);
  }
  console.log(`  ✅ Created ${segmentDefs.length} segments\n`);

  // ── 4. Create Sample Campaigns ───────────────────────────────────────────
  console.log('  📢 Creating sample campaigns...');

  const segments = await prisma.segment.findMany();

  const campaignDefs = [
    {
      name: 'Weekend Espresso Special',
      segmentIndex: 0, // High-Value Regulars
      channel: 'WhatsApp',
      messageTemplate: 'Hey {{firstName}}! 🎉 This weekend, get 30% off any espresso-based drink at Roast & Co. Show this message at the counter. Valid Sat-Sun only!',
      status: 'SENT' as CampaignStatus,
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'We Miss You ☕',
      segmentIndex: 1, // Lapsed Coffee Lovers
      channel: 'Email',
      messageTemplate: 'Hi {{firstName}}, we noticed you haven\'t visited us lately! Come back and enjoy a free pastry with any drink purchase. We\'ve also added 5 new specialty brews you\'ll love.',
      subject: 'We miss you at Roast & Co. — here\'s a free treat 🎁',
      status: 'SENT' as CampaignStatus,
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Welcome to Roast & Co.',
      segmentIndex: 2, // New Customers
      channel: 'SMS',
      messageTemplate: 'Welcome to the Roast & Co. family, {{firstName}}! Your next order is 20% off. Use code HELLO20 in-store or on the app.',
      status: 'DRAFT' as CampaignStatus,
    },
    {
      name: 'Mumbai Monsoon Special',
      segmentIndex: 3, // Mumbai Premium
      channel: 'RCS',
      messageTemplate: '🌧️ Monsoon calls for something warm! {{firstName}}, try our new Monsoon Masala Chai at your nearest Roast & Co. in Mumbai. Exclusive for our premium members.',
      status: 'DRAFT' as CampaignStatus,
    },
  ];

  for (const def of campaignDefs) {
    if (!segments[def.segmentIndex]) continue;

    const campaign = await prisma.campaign.create({
      data: {
        name: def.name,
        segmentId: segments[def.segmentIndex].id,
        channel: def.channel,
        messageTemplate: def.messageTemplate,
        subject: def.subject || null,
        status: def.status,
        sentAt: def.sentAt || null,
        stats: {
          total: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          read: 0,
          clicked: 0,
          failed: 0,
        },
      },
    });

    // For SENT campaigns, create mock communication records
    if (def.status === 'SENT') {
      const members = await prisma.segmentMember.findMany({
        where: { segmentId: segments[def.segmentIndex].id },
        include: { customer: true },
      });

      let sent = 0, delivered = 0, opened = 0, read = 0, clicked = 0, failed = 0;

      for (const member of members) {
        const roll = Math.random();
        let status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'READ' | 'CLICKED';
        let failedReason: string | null = null;

        if (roll < 0.08) {
          status = 'FAILED';
          failed++;
          failedReason = pickRandom(['Invalid number', 'Unsubscribed', 'Rate limited', 'Bounced'])[0];
        } else if (roll < 0.15) {
          status = 'SENT';
          sent++;
        } else if (roll < 0.35) {
          status = 'DELIVERED';
          delivered++;
        } else if (roll < 0.60) {
          status = 'OPENED';
          opened++;
        } else if (roll < 0.82) {
          status = 'READ';
          read++;
        } else {
          status = 'CLICKED';
          clicked++;
        }

        const message = def.messageTemplate.replace(
          /\{\{firstName\}\}/g,
          member.customer.name.split(' ')[0]
        );

        await prisma.communication.create({
          data: {
            campaignId: campaign.id,
            customerId: member.customerId,
            channel: def.channel,
            message,
            status,
            sentAt: def.sentAt,
            deliveredAt: ['DELIVERED', 'OPENED', 'READ', 'CLICKED'].includes(status) ? def.sentAt : null,
            openedAt: ['OPENED', 'READ', 'CLICKED'].includes(status) ? def.sentAt : null,
            readAt: ['READ', 'CLICKED'].includes(status) ? def.sentAt : null,
            clickedAt: status === 'CLICKED' ? def.sentAt : null,
            failedReason,
          },
        });
      }

      const total = members.length;
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          stats: { total, sent, delivered, opened, read, clicked, failed },
        },
      });

      console.log(`    📧 "${def.name}" — ${total} recipients (${delivered + opened + read + clicked} delivered)`);
    } else {
      console.log(`    📝 "${def.name}" — DRAFT`);
    }
  }
  console.log(`  ✅ Created ${campaignDefs.length} campaigns\n`);

  // ── Summary ──────────────────────────────────────────────────────────────
  const counts = {
    customers: await prisma.customer.count(),
    orders: await prisma.order.count(),
    segments: await prisma.segment.count(),
    campaigns: await prisma.campaign.count(),
    communications: await prisma.communication.count(),
  };

  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   🌱 Seed Complete!                  ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║   👥 Customers:      ${String(counts.customers).padStart(6)}        ║`);
  console.log(`  ║   🛒 Orders:         ${String(counts.orders).padStart(6)}        ║`);
  console.log(`  ║   📊 Segments:       ${String(counts.segments).padStart(6)}        ║`);
  console.log(`  ║   📢 Campaigns:      ${String(counts.campaigns).padStart(6)}        ║`);
  console.log(`  ║   📨 Communications: ${String(counts.communications).padStart(6)}        ║`);
  console.log('  ╚══════════════════════════════════════╝\n');
}

// ── Segment rule evaluator (same logic as segment.service.ts) ────────────────

function buildWhereClause(rules: { operator: string; conditions: any[] }): any {
  const conditions = rules.conditions.map(buildCondition);
  return rules.operator === 'AND' ? { AND: conditions } : { OR: conditions };
}

function buildCondition(condition: { field: string; operator: string; value: any }): any {
  const { field, operator, value } = condition;
  switch (operator) {
    case 'gt':   return { [field]: { gt: Number(value) } };
    case 'lt':   return { [field]: { lt: Number(value) } };
    case 'gte':  return { [field]: { gte: Number(value) } };
    case 'lte':  return { [field]: { lte: Number(value) } };
    case 'eq':   return { [field]: { equals: value } };
    case 'neq':  return { [field]: { not: value } };
    case 'contains':
      if (field === 'tags') return { [field]: { has: value } };
      return { [field]: { contains: value, mode: 'insensitive' } };
    case 'before': return { [field]: { lt: new Date(value) } };
    case 'after':  return { [field]: { gt: new Date(value) } };
    default:     return { [field]: { equals: value } };
  }
}

// ── Execute ──────────────────────────────────────────────────────────────────

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
