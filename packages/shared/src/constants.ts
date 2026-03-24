// ─── BLE Protocol ────────────────────────────────────────────────────────────

export const BLE = {
  /** How often the advertised token rotates (seconds) */
  TOKEN_ROTATION_INTERVAL_S: 15,
  /** How long a token remains valid after issuance (seconds) */
  TOKEN_TTL_S: 30,
  /** Number of tokens issued per batch request */
  BATCH_SIZE: 20,
  /** Maximum time window in which both users must observe each other (seconds) */
  MUTUAL_ENCOUNTER_WINDOW_S: 300, // 5 minutes
  /** Minimum acceptable RSSI for a valid encounter (dBm) */
  MIN_RSSI: -75,
  /** Minimum total duration of observations to count as an encounter (seconds) */
  MIN_DURATION_S: 10,
  /** Custom BLE service UUID for the proximity protocol */
  SERVICE_UUID: '0000FE50-0000-1000-8000-00805F9B34FB',
  /** Characteristic UUID for the rotating token */
  TOKEN_CHARACTERISTIC_UUID: '0000FE51-0000-1000-8000-00805F9B34FB',
} as const;

// ─── Encounter Quality Thresholds ────────────────────────────────────────────
// Quality is determined by average RSSI and total observation duration.
// These thresholds define the tiers.

export const ENCOUNTER_QUALITY = {
  HIGH: { minAvgRssi: -55, minDurationS: 60 },
  MEDIUM: { minAvgRssi: -65, minDurationS: 30 },
  // LOW is the fallback above the absolute minimums (BLE.MIN_RSSI, BLE.MIN_DURATION_S)
} as const;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AUTH = {
  OTP_LENGTH: 6,
  OTP_TTL_S: 300, // 5 minutes
  OTP_MAX_ATTEMPTS: 5,
  ACCESS_TOKEN_TTL_S: 900, // 15 minutes
  REFRESH_TOKEN_TTL_S: 2_592_000, // 30 days
  MAGIC_LINK_TTL_S: 600, // 10 minutes
} as const;

// ─── Rate Limits ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Global per-IP limit (requests per minute) */
  GLOBAL_RPM: 120,
  /** OTP request limit per target per hour */
  OTP_REQUEST_PER_HOUR: 5,
  /** Swipe limit per user per day */
  SWIPES_PER_DAY: 50,
  /** Message send limit per user per minute */
  MESSAGES_PER_MINUTE: 30,
  /** Encounter upload limit per session per minute */
  ENCOUNTER_UPLOAD_PER_MINUTE: 10,
} as const;

// ─── Profile ─────────────────────────────────────────────────────────────────

export const PROFILE = {
  MIN_AGE: 18,
  MAX_PHOTOS: 6,
  MAX_BIO_LENGTH: 500,
  MAX_DISPLAY_NAME_LENGTH: 50,
} as const;

// ─── Pagination ──────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
