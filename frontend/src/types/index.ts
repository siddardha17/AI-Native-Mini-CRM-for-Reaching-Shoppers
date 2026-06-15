// ============================================================
// Xeno Mini CRM — Core TypeScript Types
// ============================================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  totalSpend: number;
  visitCount: number;
  lastVisitAt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  amount: number;
  items: OrderItem[];
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface SegmentRule {
  field: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface SegmentRuleGroup {
  logic: 'AND' | 'OR';
  rules: SegmentRule[];
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRuleGroup;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED' | 'SCHEDULED';
export type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'RCS';

export interface Campaign {
  id: string;
  name: string;
  segmentId: string;
  segmentName?: string;
  channel: Channel;
  message: string;
  subject?: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  stats?: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  read: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface Communication {
  id: string;
  campaignId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  channel: Channel;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'READ' | 'CLICKED' | 'FAILED' | 'BOUNCED';
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
}

export interface AnalyticsOverview {
  totalCustomers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalRevenue: number;
  avgDeliveryRate: number;
  avgOpenRate: number;
  customerGrowth: number;
  campaignGrowth: number;
}

export interface ChannelStats {
  channel: Channel;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
}

export interface CampaignPerformance {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type SpendTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
