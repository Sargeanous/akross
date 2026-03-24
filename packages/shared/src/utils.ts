/**
 * Calculate age from a birth date.
 */
export function calculateAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Rough conversion of RSSI to distance in meters using the log-distance path loss model.
 * txPower is the expected RSSI at 1 meter (typically -59 for BLE).
 * n is the path loss exponent (2.0 for free space, 2.5–4.0 indoors).
 */
export function rssiToDistance(rssi: number, txPower: number = -59, n: number = 2.5): number {
  if (rssi >= 0) return 0;
  return Math.pow(10, (txPower - rssi) / (10 * n));
}

/**
 * Compute the average RSSI from an array of RSSI readings.
 * Uses linear averaging (convert to mW, average, convert back).
 */
export function computeAverageRssi(rssiValues: number[]): number {
  if (rssiValues.length === 0) return -100;
  const linearSum = rssiValues.reduce((sum, rssi) => sum + Math.pow(10, rssi / 10), 0);
  return 10 * Math.log10(linearSum / rssiValues.length);
}

/**
 * Check if a timestamp is within a given window (in seconds) of a reference time.
 */
export function isWithinWindow(
  timestamp: Date,
  reference: Date,
  windowSeconds: number,
): boolean {
  const diff = Math.abs(timestamp.getTime() - reference.getTime());
  return diff <= windowSeconds * 1000;
}

/**
 * Human-readable relative time string (e.g. "5 minutes ago").
 */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} minute${m > 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h > 1 ? 's' : ''} ago`;
  }
  const d = Math.floor(seconds / 86400);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}
