import { Customer, Segment, Campaign, Communication, AnalyticsOverview, ChannelStats, CampaignPerformance } from '@/types';

export const mockCustomers: Customer[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah.chen@email.com', phone: '+1-555-0101', city: 'San Francisco', totalSpend: 15420, visitCount: 48, lastVisitAt: '2026-06-10T14:30:00Z', tags: ['vip', 'early-adopter'], createdAt: '2025-01-15T10:00:00Z', updatedAt: '2026-06-10T14:30:00Z' },
  { id: '2', name: 'Marcus Johnson', email: 'marcus.j@email.com', phone: '+1-555-0102', city: 'New York', totalSpend: 8750, visitCount: 32, lastVisitAt: '2026-06-08T09:15:00Z', tags: ['loyal', 'premium'], createdAt: '2025-02-20T12:00:00Z', updatedAt: '2026-06-08T09:15:00Z' },
  { id: '3', name: 'Aisha Patel', email: 'aisha.p@email.com', phone: '+1-555-0103', city: 'Chicago', totalSpend: 22100, visitCount: 65, lastVisitAt: '2026-06-12T16:45:00Z', tags: ['vip', 'influencer'], createdAt: '2024-11-10T08:00:00Z', updatedAt: '2026-06-12T16:45:00Z' },
  { id: '4', name: 'James Wilson', email: 'james.w@email.com', phone: '+1-555-0104', city: 'Austin', totalSpend: 3200, visitCount: 15, lastVisitAt: '2026-05-28T11:20:00Z', tags: ['new'], createdAt: '2026-01-05T14:00:00Z', updatedAt: '2026-05-28T11:20:00Z' },
  { id: '5', name: 'Elena Rodriguez', email: 'elena.r@email.com', phone: '+1-555-0105', city: 'Miami', totalSpend: 6800, visitCount: 28, lastVisitAt: '2026-06-11T10:00:00Z', tags: ['loyal'], createdAt: '2025-04-18T09:00:00Z', updatedAt: '2026-06-11T10:00:00Z' },
  { id: '6', name: 'David Kim', email: 'david.kim@email.com', phone: '+1-555-0106', city: 'Seattle', totalSpend: 12350, visitCount: 42, lastVisitAt: '2026-06-09T13:00:00Z', tags: ['vip', 'tech-savvy'], createdAt: '2025-03-01T11:00:00Z', updatedAt: '2026-06-09T13:00:00Z' },
  { id: '7', name: 'Olivia Brown', email: 'olivia.b@email.com', phone: '+1-555-0107', city: 'Denver', totalSpend: 950, visitCount: 5, lastVisitAt: '2026-06-01T08:30:00Z', tags: ['new'], createdAt: '2026-04-20T15:00:00Z', updatedAt: '2026-06-01T08:30:00Z' },
  { id: '8', name: 'Raj Mehta', email: 'raj.m@email.com', phone: '+1-555-0108', city: 'San Francisco', totalSpend: 18900, visitCount: 55, lastVisitAt: '2026-06-13T07:00:00Z', tags: ['vip', 'premium', 'loyal'], createdAt: '2024-08-12T10:00:00Z', updatedAt: '2026-06-13T07:00:00Z' },
  { id: '9', name: 'Sophie Turner', email: 'sophie.t@email.com', phone: '+1-555-0109', city: 'Los Angeles', totalSpend: 4500, visitCount: 20, lastVisitAt: '2026-06-05T17:45:00Z', tags: ['casual'], createdAt: '2025-06-30T12:00:00Z', updatedAt: '2026-06-05T17:45:00Z' },
  { id: '10', name: 'Alex Nguyen', email: 'alex.n@email.com', phone: '+1-555-0110', city: 'Portland', totalSpend: 7200, visitCount: 30, lastVisitAt: '2026-06-07T14:00:00Z', tags: ['loyal', 'referrer'], createdAt: '2025-05-15T08:00:00Z', updatedAt: '2026-06-07T14:00:00Z' },
  { id: '11', name: 'Mia Chang', email: 'mia.c@email.com', phone: '+1-555-0111', city: 'New York', totalSpend: 11200, visitCount: 38, lastVisitAt: '2026-06-12T09:30:00Z', tags: ['premium'], createdAt: '2025-02-01T10:00:00Z', updatedAt: '2026-06-12T09:30:00Z' },
  { id: '12', name: 'Tyler Brooks', email: 'tyler.b@email.com', phone: '+1-555-0112', city: 'Boston', totalSpend: 2100, visitCount: 10, lastVisitAt: '2026-05-20T16:00:00Z', tags: ['new', 'student'], createdAt: '2026-03-10T14:00:00Z', updatedAt: '2026-05-20T16:00:00Z' },
];

export const mockSegments: Segment[] = [
  {
    id: '1', name: 'High-Value Customers', description: 'Customers who spent over $5,000',
    rules: { logic: 'AND', rules: [{ field: 'totalSpend', operator: '>', value: 5000 }] },
    customerCount: 847, createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: '2', name: 'Inactive Users', description: 'Users who haven\'t visited in 30+ days',
    rules: { logic: 'AND', rules: [{ field: 'lastVisitAt', operator: '<', value: '2026-05-14T00:00:00Z' }, { field: 'visitCount', operator: '>', value: 3 }] },
    customerCount: 1234, createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: '3', name: 'NYC VIPs', description: 'VIP customers in New York',
    rules: { logic: 'AND', rules: [{ field: 'city', operator: '=', value: 'New York' }, { field: 'totalSpend', operator: '>=', value: 10000 }] },
    customerCount: 312, createdAt: '2026-05-20T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: '4', name: 'Frequent Shoppers', description: 'Visited 20+ times',
    rules: { logic: 'AND', rules: [{ field: 'visitCount', operator: '>=', value: 20 }] },
    customerCount: 2156, createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: '5', name: 'New Signups', description: 'Customers who joined in the last 30 days',
    rules: { logic: 'AND', rules: [{ field: 'totalSpend', operator: '<', value: 500 }, { field: 'visitCount', operator: '<=', value: 5 }] },
    customerCount: 489, createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-10T10:00:00Z',
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1', name: 'Summer Sale Blast', segmentId: '1', segmentName: 'High-Value Customers', channel: 'EMAIL',
    message: 'Exclusive summer deals just for you! Up to 40% off on premium products.',
    subject: '🌴 Your Exclusive Summer Sale Access', status: 'SENT', sentAt: '2026-06-10T09:00:00Z',
    stats: { total: 847, sent: 847, delivered: 812, opened: 634, read: 580, clicked: 245, failed: 35, deliveryRate: 0.959, openRate: 0.781, clickRate: 0.302 },
    createdAt: '2026-06-09T14:00:00Z', updatedAt: '2026-06-10T09:00:00Z',
  },
  {
    id: '2', name: 'Win-Back Campaign', segmentId: '2', segmentName: 'Inactive Users', channel: 'SMS',
    message: 'We miss you! Come back and enjoy 20% off your next purchase. Use code COMEBACK20',
    status: 'SENT', sentAt: '2026-06-08T10:00:00Z',
    stats: { total: 1234, sent: 1234, delivered: 1180, opened: 890, read: 756, clicked: 312, failed: 54, deliveryRate: 0.956, openRate: 0.754, clickRate: 0.265 },
    createdAt: '2026-06-07T16:00:00Z', updatedAt: '2026-06-08T10:00:00Z',
  },
  {
    id: '3', name: 'VIP NYC Event Invite', segmentId: '3', segmentName: 'NYC VIPs', channel: 'WHATSAPP',
    message: 'You\'re invited to our exclusive NYC event on June 25th! RSVP now for complimentary cocktails.',
    status: 'SENDING', sentAt: '2026-06-13T08:00:00Z',
    stats: { total: 312, sent: 210, delivered: 195, opened: 142, read: 120, clicked: 78, failed: 8, deliveryRate: 0.929, openRate: 0.728, clickRate: 0.4 },
    createdAt: '2026-06-12T11:00:00Z', updatedAt: '2026-06-13T08:00:00Z',
  },
  {
    id: '4', name: 'Loyalty Rewards Update', segmentId: '4', segmentName: 'Frequent Shoppers', channel: 'EMAIL',
    message: 'Your loyalty points are expiring soon! Redeem them now for exclusive rewards.',
    subject: '⭐ Your Loyalty Rewards Await!', status: 'DRAFT',
    stats: { total: 2156, sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, failed: 0, deliveryRate: 0, openRate: 0, clickRate: 0 },
    createdAt: '2026-06-13T10:00:00Z', updatedAt: '2026-06-13T10:00:00Z',
  },
  {
    id: '5', name: 'Welcome Series #1', segmentId: '5', segmentName: 'New Signups', channel: 'RCS',
    message: 'Welcome to Xeno! Here\'s everything you need to know to get started.',
    status: 'SENT', sentAt: '2026-06-06T12:00:00Z',
    stats: { total: 489, sent: 489, delivered: 465, opened: 398, read: 345, clicked: 189, failed: 24, deliveryRate: 0.951, openRate: 0.856, clickRate: 0.406 },
    createdAt: '2026-06-05T15:00:00Z', updatedAt: '2026-06-06T12:00:00Z',
  },
];

export const mockCommunications: Communication[] = [
  { id: 'c1', campaignId: '1', customerId: '1', customerName: 'Sarah Chen', customerEmail: 'sarah.chen@email.com', channel: 'EMAIL', status: 'CLICKED', sentAt: '2026-06-10T09:00:00Z', deliveredAt: '2026-06-10T09:01:00Z' },
  { id: 'c2', campaignId: '1', customerId: '2', customerName: 'Marcus Johnson', customerEmail: 'marcus.j@email.com', channel: 'EMAIL', status: 'DELIVERED', sentAt: '2026-06-10T09:00:00Z', deliveredAt: '2026-06-10T09:01:00Z' },
  { id: 'c3', campaignId: '1', customerId: '3', customerName: 'Aisha Patel', customerEmail: 'aisha.p@email.com', channel: 'EMAIL', status: 'OPENED', sentAt: '2026-06-10T09:00:00Z', deliveredAt: '2026-06-10T09:02:00Z' },
  { id: 'c4', campaignId: '1', customerId: '6', customerName: 'David Kim', customerEmail: 'david.kim@email.com', channel: 'EMAIL', status: 'FAILED', sentAt: '2026-06-10T09:00:00Z', failureReason: 'Mailbox full' },
  { id: 'c5', campaignId: '1', customerId: '8', customerName: 'Raj Mehta', customerEmail: 'raj.m@email.com', channel: 'EMAIL', status: 'CLICKED', sentAt: '2026-06-10T09:00:00Z', deliveredAt: '2026-06-10T09:01:00Z' },
  { id: 'c6', campaignId: '1', customerId: '10', customerName: 'Alex Nguyen', customerEmail: 'alex.n@email.com', channel: 'EMAIL', status: 'SENT', sentAt: '2026-06-10T09:00:00Z' },
  { id: 'c7', campaignId: '1', customerId: '11', customerName: 'Mia Chang', customerEmail: 'mia.c@email.com', channel: 'EMAIL', status: 'OPENED', sentAt: '2026-06-10T09:00:00Z', deliveredAt: '2026-06-10T09:03:00Z' },
  { id: 'c8', campaignId: '1', customerId: '5', customerName: 'Elena Rodriguez', customerEmail: 'elena.r@email.com', channel: 'EMAIL', status: 'BOUNCED', sentAt: '2026-06-10T09:00:00Z', failureReason: 'Invalid email address' },
];

export const mockAnalyticsOverview: AnalyticsOverview = {
  totalCustomers: 12847,
  totalCampaigns: 48,
  activeCampaigns: 3,
  totalRevenue: 2450000,
  avgDeliveryRate: 0.954,
  avgOpenRate: 0.782,
  customerGrowth: 12.5,
  campaignGrowth: 8.3,
};

export const mockChannelStats: ChannelStats[] = [
  { channel: 'EMAIL', sent: 15420, delivered: 14750, opened: 11520, clicked: 4680, deliveryRate: 0.957, openRate: 0.781 },
  { channel: 'SMS', sent: 8930, delivered: 8640, opened: 7120, clicked: 2840, deliveryRate: 0.968, openRate: 0.824 },
  { channel: 'WHATSAPP', sent: 5210, delivered: 5020, opened: 4380, clicked: 2190, deliveryRate: 0.964, openRate: 0.873 },
  { channel: 'RCS', sent: 2340, delivered: 2210, opened: 1870, clicked: 890, deliveryRate: 0.944, openRate: 0.846 },
];

export const mockCampaignPerformance: CampaignPerformance[] = [
  { date: '2026-01-01', sent: 2400, delivered: 2300, opened: 1800, clicked: 720 },
  { date: '2026-02-01', sent: 3100, delivered: 2980, opened: 2340, clicked: 940 },
  { date: '2026-03-01', sent: 4200, delivered: 4020, opened: 3150, clicked: 1260 },
  { date: '2026-04-01', sent: 3800, delivered: 3640, opened: 2850, clicked: 1140 },
  { date: '2026-05-01', sent: 5100, delivered: 4890, opened: 3820, clicked: 1530 },
  { date: '2026-06-01', sent: 6200, delivered: 5950, opened: 4650, clicked: 1860 },
];
