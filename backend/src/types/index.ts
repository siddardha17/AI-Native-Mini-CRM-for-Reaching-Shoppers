// ─── Segment Rule Types ─────────────────────────────────────────────────────

export interface SegmentRule {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between' | 'before' | 'after';
  value: any;
  connector?: 'AND' | 'OR';
}

// ─── Campaign Stats ─────────────────────────────────────────────────────────

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
}

// ─── Channel Type ───────────────────────────────────────────────────────────

export type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'RCS';

// ─── API Response Envelope ──────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

// ─── AI Service Types ───────────────────────────────────────────────────────

export interface SegmentInfo {
  name: string;
  description?: string;
  customerCount: number;
  rules: SegmentRule[];
}

export interface CampaignPlan {
  segmentRules: SegmentRule[];
  segmentName: string;
  segmentDescription: string;
  channel: Channel;
  messageTemplate: string;
  subject?: string;
  timing: string;
  reasoning: string;
}

export interface MessageSuggestion {
  messageTemplate: string;
  subject?: string;
  reasoning: string;
  variants: Array<{
    messageTemplate: string;
    subject?: string;
    tone: string;
  }>;
}

export interface SegmentSuggestion {
  rules: SegmentRule[];
  name: string;
  description: string;
  estimatedReach: string;
}

// ─── Channel Service Types ──────────────────────────────────────────────────

export interface ChannelSendRequest {
  communicationId: string;
  channel: string;
  to: {
    email?: string;
    phone?: string;
    name: string;
  };
  message: string;
  subject?: string;
  callbackUrl: string;
}

export interface DeliveryReceipt {
  communicationId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'READ' | 'CLICKED';
  timestamp: string;
  failedReason?: string;
}

// ─── Request Body Types ─────────────────────────────────────────────────────

export interface CreateCustomerBody {
  name: string;
  email: string;
  phone?: string;
  city: string;
  totalSpend?: number;
  visitCount?: number;
  lastVisitAt?: string;
  tags?: string[];
}

export interface CreateOrderBody {
  customerId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  channel: string;
}

export interface CreateSegmentBody {
  name: string;
  description?: string;
  rules: SegmentRule[];
  aiGenerated?: boolean;
}

export interface CreateCampaignBody {
  name: string;
  segmentId: string;
  channel: Channel;
  messageTemplate: string;
  subject?: string;
  scheduledAt?: string;
}
