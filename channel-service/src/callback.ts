// =============================================================================
// CALLBACK HELPER — Fire-and-forget webhook delivery with retries
// =============================================================================
// TRADEOFF: Fire-and-forget with 3 retries. Production would use a persistent
// webhook queue with dead-letter handling (e.g., BullMQ + Redis) to guarantee
// delivery even across process restarts.

export interface CallbackPayload {
  communicationId: string;
  status: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sends a delivery status callback to the CRM backend.
 *
 * Retries up to 3 times with exponential backoff (500ms → 1000ms → 2000ms).
 * Never throws — all failures are logged and swallowed so the simulation
 * pipeline is never interrupted by a callback failure.
 */
export async function sendCallback(
  callbackUrl: string,
  data: CallbackPayload
): Promise<void> {
  const MAX_RETRIES = 3;
  const BACKOFF_DELAYS = [500, 1000, 2000]; // ms — exponential backoff steps

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log(
          `[callback] ✓ ${data.status} for ${data.communicationId} → ${callbackUrl} (attempt ${attempt})`
        );
        return;
      }

      // Non-2xx response — treat as retriable failure
      const body = await response.text().catch(() => "<unreadable>");
      console.warn(
        `[callback] ✗ ${data.status} for ${data.communicationId} — HTTP ${response.status}: ${body} (attempt ${attempt}/${MAX_RETRIES})`
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[callback] ✗ ${data.status} for ${data.communicationId} — ${message} (attempt ${attempt}/${MAX_RETRIES})`
      );
    }

    // Wait before retrying (skip wait after last attempt)
    if (attempt < MAX_RETRIES) {
      const delay = BACKOFF_DELAYS[attempt - 1] ?? 2000;
      await sleep(delay);
    }
  }

  // All retries exhausted — log and move on
  console.error(
    `[callback] ✗✗ DROPPED ${data.status} for ${data.communicationId} after ${MAX_RETRIES} retries`
  );
}

/** Promise-based sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
