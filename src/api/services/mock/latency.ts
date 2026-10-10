/** Simulate network latency (300–600 ms) so loading states are exercised. */
export function simulateLatency(min = 300, max = 600): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function nowIso(): string {
  return new Date().toISOString();
}