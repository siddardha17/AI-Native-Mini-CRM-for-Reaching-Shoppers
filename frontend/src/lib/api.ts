import {
  Customer, Segment, Campaign, Communication,
  AnalyticsOverview, ChannelStats, CampaignPerformance, CampaignStats,
  ApiResponse, SegmentRuleGroup,
} from '@/types';
import {
  mockCustomers, mockSegments, mockCampaigns, mockCommunications,
  mockAnalyticsOverview, mockChannelStats, mockCampaignPerformance,
} from './mock-data';

const API_BASE = 'http://localhost:3001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  } catch {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
}

// ─── Customers ────────────────────────────────────────────────────────────
export async function getCustomers(page = 1, limit = 10, search?: string): Promise<{ data: Customer[]; total: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    const res = await fetchApi<ApiResponse<Customer[]>>(`/customers?${params}`);
    return { data: res.data, total: res.pagination?.total ?? res.data.length };
  } catch {
    let filtered = mockCustomers;
    if (search) {
      const q = search.toLowerCase();
      filtered = mockCustomers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q));
    }
    return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
  }
}

export async function getCustomer(id: string): Promise<Customer> {
  try {
    const res = await fetchApi<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data;
  } catch {
    const c = mockCustomers.find(c => c.id === id);
    if (!c) throw new Error('Customer not found');
    return c;
  }
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  return fetchApi<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Segments ─────────────────────────────────────────────────────────────
export async function getSegments(): Promise<Segment[]> {
  try {
    const res = await fetchApi<ApiResponse<Segment[]>>('/segments');
    return res.data;
  } catch {
    return mockSegments;
  }
}

export async function createSegment(data: { name: string; description?: string; rules: SegmentRuleGroup }): Promise<Segment> {
  return fetchApi<Segment>('/segments', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSegmentPreview(id: string): Promise<{ count: number }> {
  try {
    return await fetchApi<{ count: number }>(`/segments/${id}/preview`);
  } catch {
    const seg = mockSegments.find(s => s.id === id);
    return { count: seg?.customerCount ?? Math.floor(Math.random() * 2000) };
  }
}

export async function suggestSegment(prompt: string): Promise<{ rules: SegmentRuleGroup; description: string }> {
  try {
    return await fetchApi<{ rules: SegmentRuleGroup; description: string }>('/segments/ai', { method: 'POST', body: JSON.stringify({ prompt }) });
  } catch {
    return {
      description: `AI-generated segment based on: "${prompt}"`,
      rules: { logic: 'AND', rules: [{ field: 'totalSpend', operator: '>', value: 5000 }, { field: 'visitCount', operator: '>=', value: 10 }] },
    };
  }
}

// ─── Campaigns ────────────────────────────────────────────────────────────
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetchApi<ApiResponse<Campaign[]>>('/campaigns');
    return res.data;
  } catch {
    return mockCampaigns;
  }
}

export async function getCampaign(id: string): Promise<Campaign> {
  try {
    const res = await fetchApi<ApiResponse<Campaign>>(`/campaigns/${id}`);
    return res.data;
  } catch {
    const c = mockCampaigns.find(c => c.id === id);
    if (!c) throw new Error('Campaign not found');
    return c;
  }
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  return fetchApi<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) });
}

export async function sendCampaign(id: string): Promise<void> {
  await fetchApi<void>(`/campaigns/${id}/send`, { method: 'POST' });
}

export async function getCampaignStats(id: string): Promise<CampaignStats> {
  try {
    return await fetchApi<CampaignStats>(`/campaigns/${id}/stats`);
  } catch {
    const c = mockCampaigns.find(c => c.id === id);
    return c?.stats ?? { total: 0, sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, failed: 0, deliveryRate: 0, openRate: 0, clickRate: 0 };
  }
}

export async function getCampaignCommunications(id: string): Promise<Communication[]> {
  try {
    const res = await fetchApi<ApiResponse<Communication[]>>(`/campaigns/${id}/communications`);
    return res.data;
  } catch {
    return mockCommunications.filter(c => c.campaignId === id);
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    return await fetchApi<AnalyticsOverview>('/analytics/overview');
  } catch {
    return mockAnalyticsOverview;
  }
}

export async function getChannelAnalytics(): Promise<ChannelStats[]> {
  try {
    return await fetchApi<ChannelStats[]>('/analytics/channels');
  } catch {
    return mockChannelStats;
  }
}

export async function getCampaignAnalytics(): Promise<CampaignPerformance[]> {
  try {
    return await fetchApi<CampaignPerformance[]>('/analytics/campaigns');
  } catch {
    return mockCampaignPerformance;
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────
export async function suggestMessage(channel: string, segment: string, tone?: string): Promise<{ message: string; subject?: string }> {
  try {
    return await fetchApi<{ message: string; subject?: string }>('/ai/suggest-message', {
      method: 'POST',
      body: JSON.stringify({ channel, segment, tone }),
    });
  } catch {
    const messages: Record<string, string> = {
      EMAIL: `Dear valued customer,\n\nWe have an exclusive offer just for you! As a member of our ${segment} segment, you're eligible for special benefits.\n\nDon't miss out — this offer expires soon!\n\nBest regards,\nThe Xeno Team`,
      SMS: `🎉 Hey! Exclusive deal for ${segment}: Get 25% off your next purchase. Use code XENO25. Limited time only! Reply STOP to opt out.`,
      WHATSAPP: `Hi there! 👋\n\nAs a valued ${segment} member, we wanted to share something special with you.\n\n✨ Exclusive 30% discount on your favorites\n🎁 Free shipping on orders over $50\n⏰ Valid for 48 hours only\n\nTap here to shop now!`,
      RCS: `🌟 Special offer for ${segment}!\n\nYou've been selected for early access to our new collection. Enjoy premium benefits and exclusive pricing.\n\nShop now →`,
    };
    return {
      message: messages[channel] || messages.EMAIL,
      subject: channel === 'EMAIL' ? `✨ Exclusive Offer for ${segment}` : undefined,
    };
  }
}
