// Cache warming disabled — all data fetched fresh from DB on every request
// At 1500 users/day (2hr peak window) the DB handles this without caching
export async function warmCache() {
  return { success: true, warmed: 0, duration: 0 };
}
