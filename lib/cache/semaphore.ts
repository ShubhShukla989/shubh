/**
 * Redis Token-Based Semaphore
 *
 * Limits concurrent execution of expensive operations (e.g. image generation).
 * Callers that cannot acquire a token wait and retry until a slot opens or
 * the timeout expires — they are never silently dropped.
 *
 * Design:
 *   - Redis key holds a counter of active slots (starts at MAX_SLOTS)
 *   - Acquire: DECR key, if result >= 0 → token held, proceed
 *              if result < 0  → INCR back (undo), wait RETRY_INTERVAL, retry
 *   - Release: INCR key (always, even on error)
 *   - Key has a TTL so a crashed process never starves the semaphore forever
 *
 * Graceful degradation: if Redis is unavailable the semaphore is bypassed
 * and all requests proceed (same behaviour as before).
 */

import redis from './redis';

const SEMAPHORE_KEY = 'semaphore:area-generation';
const MAX_SLOTS = 10;          // max concurrent image generation jobs
const SLOT_TTL_SEC = 60;       // safety TTL — reclaimed if process crashes
const RETRY_INTERVAL_MS = 300; // how often a waiting request retries
const MAX_WAIT_MS = 12_000;    // give up after 12 seconds

/**
 * Ensure the semaphore key exists with the correct slot count.
 * Uses SET NX so it only initialises once.
 */
async function ensureInitialised(): Promise<void> {
  // SET key MAX_SLOTS EX TTL NX  — only sets if key doesn't exist
  await redis.set(SEMAPHORE_KEY, MAX_SLOTS, 'EX', SLOT_TTL_SEC, 'NX');
}

/**
 * Acquire a generation slot.
 * Returns true if a slot was acquired, false if timed out.
 * On Redis failure returns true (bypass — graceful degradation).
 */
export async function acquireSlot(): Promise<boolean> {
  try {
    await ensureInitialised();

    const deadline = Date.now() + MAX_WAIT_MS;

    while (Date.now() < deadline) {
      // Atomically decrement — if result >= 0 we have a slot
      const remaining = await redis.decr(SEMAPHORE_KEY);

      if (remaining >= 0) {
        // Refresh TTL so the key doesn't expire while we hold the slot
        await redis.expire(SEMAPHORE_KEY, SLOT_TTL_SEC);
        return true;
      }

      // No slot available — undo the decrement and wait
      await redis.incr(SEMAPHORE_KEY);
      await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS));
    }

    // Timed out
    return false;
  } catch {
    // Redis unavailable — bypass semaphore
    return true;
  }
}

/**
 * Release a previously acquired slot.
 * Always call this in a finally block.
 */
export async function releaseSlot(): Promise<void> {
  try {
    const current = await redis.incr(SEMAPHORE_KEY);
    // Cap at MAX_SLOTS to prevent drift from double-releases
    if (current > MAX_SLOTS) {
      await redis.set(SEMAPHORE_KEY, MAX_SLOTS, 'EX', SLOT_TTL_SEC);
    }
  } catch {
    // Ignore — slot will be reclaimed by TTL
  }
}
