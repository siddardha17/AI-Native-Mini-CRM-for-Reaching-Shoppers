import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton Redis connection with reconnect and error logging.
// ioredis handles reconnection automatically; we just log events for observability.
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000);
    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

/**
 * Returns a fresh Redis connection config object for BullMQ workers/queues.
 * BullMQ requires its own connections — do NOT reuse the singleton.
 */
export function getRedisConnection() {
  return {
    host: new URL(REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(REDIS_URL).port || '6379', 10),
    maxRetriesPerRequest: null as null,
  };
}

export default redis;
