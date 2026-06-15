import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SpendTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(dateString);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getSpendTier(totalSpend: number): SpendTier {
  if (totalSpend >= 10000) return 'Platinum';
  if (totalSpend >= 5000) return 'Gold';
  if (totalSpend >= 1000) return 'Silver';
  return 'Bronze';
}

export function getSpendTierColor(tier: SpendTier): string {
  switch (tier) {
    case 'Platinum':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    case 'Gold':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Silver':
      return 'bg-slate-400/20 text-slate-300 border-slate-400/30';
    case 'Bronze':
      return 'bg-orange-600/20 text-orange-300 border-orange-600/30';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'SENT':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'SENDING':
    case 'PENDING':
    case 'SCHEDULED':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'DRAFT':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    case 'FAILED':
    case 'BOUNCED':
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'OPENED':
    case 'READ':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'CLICKED':
      return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

export function getChannelColor(channel: string): string {
  switch (channel.toUpperCase()) {
    case 'EMAIL':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'SMS':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'WHATSAPP':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'RCS':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}
