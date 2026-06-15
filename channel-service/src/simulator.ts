// =============================================================================
// DELIVERY SIMULATOR — Simulates realistic message delivery across channels
// =============================================================================
// TRADEOFF: Delays are scaled down 10x for demo purposes. In production,
// these would reflect real-world delivery timings (seconds to hours depending
// on channel and user engagement patterns).

import { sendCallback } from "./callback.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DelayRange {
  /** [minMs, maxMs] — the raw delay range before scaling */
  0: number;
  1: number;
}

interface ChannelProfile {
  deliveryRate: number; // Probability of successful delivery (0–1)
  openRate: number; // Probability of being opened (given delivered)
  readRate: number; // Probability of being read (given opened)
  clickRate: number; // Probability of being clicked (given read)
  deliveryDelay: DelayRange; // Delay range before delivery callback (ms)
  openDelay: DelayRange; // Delay range before open callback (ms)
  readDelay: DelayRange; // Delay range before read callback (ms)
  clickDelay: DelayRange; // Delay range before click callback (ms)
  failureReasons: string[]; // Possible failure reason strings
}

export interface DeliveryParams {
  communicationId: string;
  recipient: {
    email?: string;
    phone?: string;
    name: string;
  };
  message: string;
  subject?: string;
  channel: string;
  callbackUrl: string;
}

// ---------------------------------------------------------------------------
// Channel Profiles — Realistic engagement rates per channel
// ---------------------------------------------------------------------------

const CHANNEL_PROFILES: Record<string, ChannelProfile> = {
  EMAIL: {
    deliveryRate: 0.92, // 92% delivered
    openRate: 0.35, // 35% of delivered are opened
    readRate: 0.2, // 20% of opened are read
    clickRate: 0.08, // 8% of read are clicked
    deliveryDelay: [500, 3000] as DelayRange,
    openDelay: [5000, 60000] as DelayRange,
    readDelay: [1000, 10000] as DelayRange,
    clickDelay: [1000, 5000] as DelayRange,
    failureReasons: [
      "invalid_email",
      "mailbox_full",
      "spam_filtered",
      "unsubscribed",
    ],
  },
  SMS: {
    deliveryRate: 0.95,
    openRate: 0.9, // SMS has very high open rate
    readRate: 0.75,
    clickRate: 0.05, // Low click rate — no easy links in SMS
    deliveryDelay: [200, 2000] as DelayRange,
    openDelay: [1000, 30000] as DelayRange,
    readDelay: [500, 5000] as DelayRange,
    clickDelay: [2000, 10000] as DelayRange,
    failureReasons: [
      "invalid_number",
      "unreachable",
      "opted_out",
      "rate_limited",
    ],
  },
  WHATSAPP: {
    deliveryRate: 0.93,
    openRate: 0.85,
    readRate: 0.7, // WhatsApp shows read receipts
    clickRate: 0.15, // Decent click rate with rich messages
    deliveryDelay: [300, 2000] as DelayRange,
    openDelay: [2000, 45000] as DelayRange,
    readDelay: [500, 8000] as DelayRange,
    clickDelay: [1000, 8000] as DelayRange,
    failureReasons: [
      "invalid_number",
      "not_on_whatsapp",
      "blocked",
      "rate_limited",
    ],
  },
  RCS: {
    deliveryRate: 0.88, // Lower delivery — not all phones support RCS
    openRate: 0.8,
    readRate: 0.55,
    clickRate: 0.2, // Highest click rate with rich cards
    deliveryDelay: [400, 2500] as DelayRange,
    openDelay: [3000, 50000] as DelayRange,
    readDelay: [500, 8000] as DelayRange,
    clickDelay: [1000, 6000] as DelayRange,
    failureReasons: [
      "unsupported_device",
      "invalid_number",
      "carrier_error",
      "opted_out",
    ],
  },
};

// ---------------------------------------------------------------------------
// Delay scaling factor — 10x faster for demo
// ---------------------------------------------------------------------------

const DELAY_SCALE = 0.1; // 10x speed-up for demo responsiveness

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a random integer in [min, max] (inclusive) */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Picks a random element from an array */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Promise-based sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Returns a scaled delay from the given range */
function scaledDelay(range: DelayRange): number {
  const raw = randomInRange(range[0], range[1]);
  return Math.max(50, Math.round(raw * DELAY_SCALE)); // Floor at 50ms
}

// ---------------------------------------------------------------------------
// Core Simulation
// ---------------------------------------------------------------------------

/**
 * Simulates the full delivery lifecycle for a single message.
 *
 * Lifecycle progression: SENT → DELIVERED → OPENED → READ → CLICKED
 * Each stage is probabilistic — a message may stop at any stage based on
 * the channel's engagement rates.
 *
 * This function runs asynchronously (fire-and-forget from the caller's
 * perspective). It sends callbacks to the CRM backend at each stage transition.
 */
export async function simulateDelivery(params: DeliveryParams): Promise<void> {
  const {
    communicationId,
    recipient,
    message,
    subject,
    channel,
    callbackUrl,
  } = params;

  // Normalize channel name to uppercase for lookup
  const channelKey = channel.toUpperCase();
  const profile = CHANNEL_PROFILES[channelKey];

  if (!profile) {
    console.error(
      `[simulator] Unknown channel "${channel}" for communication ${communicationId}`
    );
    await sendCallback(callbackUrl, {
      communicationId,
      status: "FAILED",
      timestamp: new Date().toISOString(),
      metadata: {
        reason: "unsupported_channel",
        channel,
        recipientName: recipient.name,
      },
    });
    return;
  }

  const logPrefix = `[simulator] [${channelKey}] ${communicationId}`;
  console.log(
    `${logPrefix} → Starting simulation for ${recipient.name} (${recipient.email ?? recipient.phone ?? "no-contact"})`
  );

  // -------------------------------------------------------------------------
  // Stage 1: Delivery attempt
  // -------------------------------------------------------------------------
  const deliveryWait = scaledDelay(profile.deliveryDelay);
  await sleep(deliveryWait);

  const delivered = Math.random() < profile.deliveryRate;

  if (!delivered) {
    const reason = randomPick(profile.failureReasons);
    console.log(`${logPrefix} ✗ FAILED (${reason}) after ${deliveryWait}ms`);

    await sendCallback(callbackUrl, {
      communicationId,
      status: "FAILED",
      timestamp: new Date().toISOString(),
      metadata: {
        reason,
        channel: channelKey,
        recipientName: recipient.name,
        recipientContact: recipient.email ?? recipient.phone,
      },
    });
    return;
  }

  // Delivery succeeded
  console.log(`${logPrefix} ✓ DELIVERED after ${deliveryWait}ms`);
  await sendCallback(callbackUrl, {
    communicationId,
    status: "DELIVERED",
    timestamp: new Date().toISOString(),
    metadata: {
      channel: channelKey,
      recipientName: recipient.name,
      recipientContact: recipient.email ?? recipient.phone,
      subject: subject ?? undefined,
      messagePreview: message.slice(0, 100),
    },
  });

  // -------------------------------------------------------------------------
  // Stage 2: Opened
  // -------------------------------------------------------------------------
  const opened = Math.random() < profile.openRate;
  if (!opened) {
    console.log(`${logPrefix} — Not opened (simulation ended)`);
    return;
  }

  const openWait = scaledDelay(profile.openDelay);
  await sleep(openWait);
  console.log(`${logPrefix} ✓ OPENED after +${openWait}ms`);

  await sendCallback(callbackUrl, {
    communicationId,
    status: "OPENED",
    timestamp: new Date().toISOString(),
    metadata: {
      channel: channelKey,
      recipientName: recipient.name,
    },
  });

  // -------------------------------------------------------------------------
  // Stage 3: Read
  // -------------------------------------------------------------------------
  const read = Math.random() < profile.readRate;
  if (!read) {
    console.log(`${logPrefix} — Not read (simulation ended)`);
    return;
  }

  const readWait = scaledDelay(profile.readDelay);
  await sleep(readWait);
  console.log(`${logPrefix} ✓ READ after +${readWait}ms`);

  await sendCallback(callbackUrl, {
    communicationId,
    status: "READ",
    timestamp: new Date().toISOString(),
    metadata: {
      channel: channelKey,
      recipientName: recipient.name,
    },
  });

  // -------------------------------------------------------------------------
  // Stage 4: Clicked
  // -------------------------------------------------------------------------
  const clicked = Math.random() < profile.clickRate;
  if (!clicked) {
    console.log(`${logPrefix} — Not clicked (simulation ended)`);
    return;
  }

  const clickWait = scaledDelay(profile.clickDelay);
  await sleep(clickWait);
  console.log(`${logPrefix} ✓ CLICKED after +${clickWait}ms`);

  await sendCallback(callbackUrl, {
    communicationId,
    status: "CLICKED",
    timestamp: new Date().toISOString(),
    metadata: {
      channel: channelKey,
      recipientName: recipient.name,
    },
  });

  console.log(`${logPrefix} — Simulation complete (reached CLICKED)`);
}
