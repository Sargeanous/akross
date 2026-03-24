# Akross (Proximity) — Project Summary

**Last Updated:** March 24, 2026
**Project Type:** Proximity-based dating application
**Stage:** MVP (functional backend, mobile UI, admin dashboard)

---

## 1. Concept

Akross is a proximity-based dating app where users discover matches through **verified Bluetooth Low Energy (BLE) physical encounters**. Unlike swipe-first apps, Akross validates that two users were actually near each other at a real-world event before allowing them to match and chat. The flow is:

1. An admin creates a real-world event (e.g., a bar, concert, meetup)
2. Users join the event in-app and receive BLE tokens from the server
3. Their phones advertise and scan for nearby users' tokens
4. Observations are uploaded; the backend validates mutual encounters
5. Only verified encounters appear as swipe candidates
6. Mutual likes unlock 1:1 real-time chat

---

## 2. Architecture

### Monorepo Structure (pnpm workspaces)

```
akross/
├── apps/
│   ├── api/            — Fastify 5 backend (TypeScript)
│   ├── mobile/         — React Native / Expo 52 app
│   └── admin/          — Next.js 15 admin dashboard
├── packages/
│   ├── shared/         — Types, Zod schemas, constants, utilities
│   ├── proximity-protocol/ — BLE encounter validation algorithm
│   └── config/         — Shared TypeScript configuration
├── docker/             — PostgreSQL 16 + Redis 7
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥20, pnpm ≥9 |
| API | Fastify 5, TypeScript (strict) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache / Jobs | Redis 7 + BullMQ |
| Auth | JWT (access + refresh tokens) |
| Real-time | Fastify WebSocket |
| File Storage | S3-compatible (presigned upload URLs) |
| Validation | Zod |
| Mobile | Expo 52, React Native, Expo Router |
| Mobile State | Zustand |
| Admin | Next.js 15, React 19, Tailwind CSS |
| Containerization | Docker Compose |

---

## 3. Database Schema (Prisma)

### Authentication
- **User** — Core record (phone/email, auth method, verified flag, admin role)
- **OtpCode** — OTP tracking (target, code, attempts, expiry)
- **RefreshToken** — Token revocation tracking
- **DeviceToken** — Push notification tokens (iOS/Android)

### Profile
- **Profile** — Name, DOB, gender, preferences, bio, completion status
- **ProfilePhoto** — Up to 6 photos per user, with verification flag

### Proximity / BLE
- **ProximityEvent** — Event definition (name, venue, lat/long, time window, status: DRAFT/ACTIVE/ENDED/CANCELLED)
- **ProximitySession** — User participation in an event
- **ProximityTokenRecord** — Maps server-issued BLE tokens to users with validity windows
- **ObservationUpload** — Raw BLE observations uploaded by the device (JSON array)

### Social
- **Encounter** — Verified mutual encounter (two users, quality tier: HIGH/MEDIUM/LOW, timestamp rounded to nearest minute for privacy)
- **Swipe** — Individual swipe action (LIKE/PASS on an encounter)
- **Match** — Result of mutual LIKE (creates a chat thread)
- **ChatThread** — 1:1 conversation between matched users
- **Message** — Individual messages (TEXT/IMAGE/SYSTEM types, read tracking)

### Moderation
- **Report** — User report (reason, status: PENDING/REVIEWING/RESOLVED/DISMISSED)
- **Block** — Bidirectional user blocking

### Subscription
- **Subscription** — Tier (FREE/PLUS/PREMIUM), provider (APPLE/GOOGLE/STRIPE)

---

## 4. API Routes

All routes require authentication unless noted.

### Auth (`/auth`) — Public
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/request` | Send OTP or magic link |
| POST | `/auth/otp/verify` | Verify code, create user if new, return JWT pair |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |

### Profile (`/profile`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/profile` | Create profile (18+ age gate) |
| GET | `/profile/me` | Get own profile with photos |
| PATCH | `/profile` | Update profile fields |
| POST | `/profile/photos` | Get presigned upload URL |
| DELETE | `/profile/photos/:id` | Remove photo |
| POST | `/profile/device-token` | Register push token |
| DELETE | `/profile/device-token` | Unregister push token |
| GET | `/profile/:id` | View another user's profile (encounter-gated) |

### Events (`/events`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/events` | List active/upcoming events |
| GET | `/events/:id` | Event detail |
| POST | `/events/:id/join` | Join event, start session, receive 20 BLE tokens |

### Encounters (`/encounters`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/encounters/tokens` | Request new BLE token batch |
| POST | `/encounters/upload` | Upload raw BLE observations |
| GET | `/encounters` | List verified encounters (swipe candidates) |

### Swipe (`/swipe`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/swipe` | Submit LIKE or PASS |
| GET | `/swipe/matches` | List active matches |

### Chat (`/chat`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/threads` | List conversation threads |
| GET | `/chat/threads/:id/messages` | Paginated message history |
| POST | `/chat/threads/:id/messages` | Send message (real-time via WS) |
| POST | `/chat/threads/:id/read` | Mark messages as read |
| GET | `/chat/ws` | WebSocket endpoint for real-time delivery |

### Moderation (`/report`, `/block`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/report` | Report user (HARASSMENT, SPAM, FAKE_PROFILE, INAPPROPRIATE_CONTENT, UNDERAGE, OTHER) |
| POST | `/block` | Block user |
| DELETE | `/block/:id` | Unblock user |
| GET | `/blocks` | List blocked users |

### Admin (`/admin`) — Admin-only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/reports` | List reports with filters |
| PATCH | `/admin/reports/:id` | Update report status/resolution |
| POST | `/admin/users/:id/ban` | Ban user |
| GET | `/admin/events` | List all events |
| POST | `/admin/events` | Create event |
| PATCH | `/admin/events/:id` | Update event |

---

## 5. BLE Proximity Protocol

### Constants
| Parameter | Value |
|-----------|-------|
| Token rotation interval | 15 seconds |
| Token TTL | 30 seconds |
| Batch size | 20 tokens per request |
| Mutual encounter window | 5 minutes |
| Minimum RSSI | -75 dBm |
| Minimum duration | 10 seconds |
| Service UUID | `0000FE50-0000-1000-8000-00805F9B34FB` |
| Characteristic UUID | `0000FE51-0000-1000-8000-00805F9B34FB` |

### Quality Tiers
| Tier | RSSI Threshold | Duration Threshold |
|------|---------------|-------------------|
| HIGH | ≥ -55 dBm | ≥ 60 seconds |
| MEDIUM | ≥ -65 dBm | ≥ 30 seconds |
| LOW | Meets minimum | Meets minimum |

### Validation Algorithm (`@proximity/protocol`)
1. Filter observations from user A matching user B's valid tokens (with TTL grace)
2. Filter observations from user B matching user A's valid tokens
3. Verify **mutual** observation (both sides have at least one valid observation)
4. Check temporal overlap within 5-minute window
5. Filter by minimum RSSI (-75 dBm)
6. Calculate average RSSI using linear energy averaging
7. Verify total duration meets minimum threshold
8. Determine quality tier
9. Round encounter timestamp to nearest minute (privacy)
10. Return result with quality, average RSSI, duration, and occurred time — or rejection reason

### Batch Processing
- Evaluates all unique pairs of event participants: O(N²) complexity
- Runs after observation uploads via BullMQ background job
- Only creates Encounter records for valid pairs

### Token Rotation Manager (Client-side)
- Cycles through server-issued tokens at 15-second intervals
- Fires callback when tokens run low (< 3 remaining)
- Client cannot generate its own tokens — backend-issued only

---

## 6. Background Jobs (BullMQ + Redis)

| Job | Trigger | What It Does |
|-----|---------|-------------|
| Encounter Validation | After observation upload | Fetches unprocessed uploads, resolves tokens/observations, runs batch encounter finder, creates Encounter records, emits notifications |
| Notification | New match or message | Sends push notifications to registered devices |
| Session Cleanup | Event ends | Marks sessions inactive, cleans up stale BLE tokens |

---

## 7. Mobile App (Expo / React Native)

### Screens

**Auth Flow:**
- `(auth)/welcome` — Entry screen
- `(auth)/phone` — Phone number input
- `(auth)/magic-link` — Email input (alternative)
- `(auth)/verify` — OTP code verification

**Onboarding (sequential):**
- `(onboarding)/name` — Display name
- `(onboarding)/birthday` — Birth date (18+ gate)
- `(onboarding)/gender` — Gender selection
- `(onboarding)/preferences` — Gender preferences
- `(onboarding)/photos` — Photo upload (max 6)
- `(onboarding)/bio` — Bio text

**Main App:**
- **Feed** — Swipeable card interface (Reanimated pan gesture), profile pre-loading, match celebration modal
- **Nearby** — Join event UI, active BLE session display, token batch requests
- **Matches** — List of matched users, match detail view
- **Chat** — Thread list with unread counts, real-time messaging via WebSocket, image support
- **Profile** — View/edit own profile, privacy settings
- **Report** — Report user form with block option

### Key Components
- `ProfileCard`, `SwipeCard`, `SwipeableCard` (Reanimated-powered drag-to-like/pass)
- `ChatInput`, `MessageBubble`, `ThreadPreview`
- `ScanningAnimation`, `SessionStatus`
- `Avatar`, `Badge`, `Button`, `Card`, `Input`, `Loading`, `Modal`

### Services
- **API Client** — Automatic JWT injection, token refresh on 401, typed endpoints
- **Auth** — Token storage (SecureStore on native, localStorage on web)
- **BLE** — Scanner + Advertiser (placeholder wrappers for native modules)
- **Chat** — WebSocket manager for real-time delivery
- **Upload** — Photo upload with presigned URLs

### State Management (Zustand)
- **auth** — User state, login/logout, errors
- **profile** — User profile, photo management
- **encounter** — Verified encounters, swipe logic, match detection
- **match** — Active matches, details
- **chat** — Threads, messages, unread counts, WebSocket
- **session** — BLE session state, token rotation

---

## 8. Admin Dashboard (Next.js)

### Pages
- `/` — Dashboard with stats cards and quick actions
- `/events` — Event list (CRUD)
- `/events/[id]` — Event detail
- `/events/new` — Create event form
- `/reports` — Report list (filterable by status)
- `/reports/[id]` — Report detail with resolution controls
- `/users` — User list
- `/users/[id]` — User detail with ban option
- `/moderation` — General moderation panel
- `/login` — Admin login

### Features
- Event creation/editing with date, time, and location
- Report review and resolution workflow
- User ban functionality
- Responsive layout with Tailwind CSS
- Color-coded status badges

---

## 9. Shared Package (`@proximity/shared`)

### Types & Enums
- `AuthMethod`, `Gender`, `EventStatus`, `EncounterQuality`, `SwipeDirection`, `MessageType`, `ReportReason`, `ReportStatus`, `SubscriptionTier`, `SubscriptionProvider`
- Core types: `User`, `Profile`, `ProximityEvent`, `ProximitySession`, `BleObservation`, `Encounter`, `Swipe`, `Match`, `ChatThread`, `Message`, `Report`, `Block`, `Subscription`
- DTOs: `AuthTokenPair`, `PaginatedResponse<T>`, `ChatThreadWithMeta`

### Zod Validation Schemas
- Auth: `OtpRequestSchema`, `OtpVerifySchema`, `RefreshTokenSchema`
- Profile: `CreateProfileSchema`, `UpdateProfileSchema`
- BLE: `BleObservationSchema`, `EncounterUploadSchema`
- Social: `SwipeSchema`, `SendMessageSchema`
- Moderation: `CreateReportSchema`, `BlockSchema`
- Admin: `CreateEventSchema`, `UpdateEventSchema`, `UpdateReportSchema`
- Shared: `PaginationSchema`

### Constants
| Category | Key Values |
|----------|-----------|
| Auth | OTP length: 6, TTL: 5 min, max attempts: 5, access token: 15 min, refresh token: 30 days |
| Rate Limits | 120 global RPM, 5 OTP/hour, 50 swipes/day, 30 msgs/min, 10 uploads/min |
| Profile | Min age: 18, max photos: 6, max bio: 500 chars, max name: 50 chars |
| Pagination | Default: 20, max: 100 per page |

### Utilities
- `calculateAge(birthDate)` — Age calculation
- `rssiToDistance(rssi)` — RSSI to meters (log-distance model)
- `computeAverageRssi(rssiValues)` — Linear energy averaging
- `isWithinWindow(timestamp, reference, seconds)` — Time window check
- `timeAgo(date)` — Relative time strings

---

## 10. Authentication & Security

### Auth Flow
1. User requests OTP (phone or email) → 6-digit code generated (5 min TTL)
2. User verifies code → user created if new, JWT pair returned
3. Access token (15 min) + refresh token (30 days) stored in SecureStore
4. User creates profile (name, DOB, gender, preferences, photos)
5. User joins event → BLE session created, token batch issued

### Token Refresh
- Client detects 401 → automatic refresh attempt
- Success → new token pair returned
- Failure → tokens cleared, redirect to login

### Security Measures
- **BLE validation**: Both users must independently observe each other's tokens
- **Server-side tokens**: Client cannot forge BLE tokens
- **Privacy**: Encounter timestamps rounded to nearest minute
- **Rate limiting**: Per-IP (120 RPM), per-OTP (5/hour), swipes (50/day)
- **Blocking**: Bidirectional user blocking
- **Moderation**: Admin review and user banning
- **JWT**: Separate short-lived access + long-lived refresh tokens
- **Headers**: Helmet security headers enabled
- **CORS**: Permissive for MVP (`origin: true`)

---

## 11. Testing

### Test Files
| File | Coverage |
|------|---------|
| `apps/api/test/onboarding-e2e.test.ts` | Auth flow, profile creation, token refresh |
| `apps/api/test/swipe-match.test.ts` | Swipe and match logic |
| `apps/api/test/auth-guard.test.ts` | Authentication middleware |
| `packages/proximity-protocol/test/encounter-validation.test.ts` | BLE validation algorithm (quality tiers, edge cases) |

---

## 12. Development Setup

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose

### Commands
```bash
pnpm install                            # Install all dependencies
pnpm docker:up                          # Start PostgreSQL + Redis
cp .env.example .env                    # Configure environment
pnpm db:generate                        # Generate Prisma client
pnpm db:push                            # Push schema to database
pnpm dev                                # Start API on port 3000

# Individual apps
pnpm --filter @proximity/api dev        # API only
pnpm --filter @proximity/mobile dev     # Mobile (Expo)
pnpm --filter @proximity/admin dev      # Admin (Next.js)

# Other
pnpm build                              # Build all packages
pnpm test                               # Run all tests
pnpm lint                               # Lint all packages
pnpm db:migrate                         # Create migration
pnpm docker:down                        # Stop containers
```

---

## 13. Current Status

### Complete
- Backend API (Fastify) — all routes and business logic
- Database schema and Prisma integration
- BLE encounter validation algorithm
- Mobile app UI — all screens and navigation
- Admin dashboard — event and report management
- Authentication (OTP + JWT)
- Swipe/match logic
- Real-time chat via WebSocket
- Background job scaffolding (encounter validation, notifications, cleanup)
- Shared types, schemas, and constants

### Stubbed / Placeholder
- **BLE native modules** — placeholder wrappers; real iOS (Swift) and Android (Kotlin) implementations required
- **OTP provider** — logs to console instead of sending SMS/email
- **Push notification provider** — stubbed
- **Photo moderation** — stubbed
- **S3 integration** — presigned URL flow needs S3/MinIO connection

### Known Issues
- Expo web rendering — recent commits address white/blank screen debugging
- pnpm symlink issues with Metro bundler (workarounds applied)

---

## 14. Git History (Key Commits)

| Hash | Description |
|------|-------------|
| `5dffcc5` | Debug: simplify root layout to isolate blank screen issue |
| `2f1dc5b` | Fix: resolve pnpm symlink issues in Metro bundler |
| `8695c16` | Fix: add root index route for Expo Router web rendering |
| `965a411` | Fix: enable hierarchical lookup in Metro for pnpm |
| `89b40d9` | Fix: resolve white screen by switching pnpm to hoisted node_modules |
| `8406ea6` | Add web platform support to Expo app |
| `e5faa4e` | Wire photo uploads, admin role enforcement |
| `121e3b7` | Add native BLE module stubs (iOS/Android) |
| `0d003c8` | Add mobile app (Expo) + admin dashboard (Next.js) |
| `061dc3c` | Initial MVP scaffold — API, shared package, proximity protocol |

---

## 15. Key File Locations

```
# Core API
apps/api/src/server.ts                  — Main server entry point
apps/api/prisma/schema.prisma           — Database schema
apps/api/src/routes/                    — All API route handlers
apps/api/src/config/env.ts              — Environment configuration

# Shared
packages/shared/src/types.ts            — Shared TypeScript types
packages/shared/src/schemas.ts          — Zod validation schemas
packages/shared/src/constants.ts        — App-wide constants
packages/shared/src/utils.ts            — Utility functions

# BLE Protocol
packages/proximity-protocol/src/encounter-validation.ts  — Core algorithm
packages/proximity-protocol/src/token-rotation.ts        — Client token manager

# Mobile
apps/mobile/src/app/                    — Expo Router screens
apps/mobile/src/components/             — React Native components
apps/mobile/src/stores/                 — Zustand state stores
apps/mobile/src/services/               — API client, BLE, chat, upload

# Admin
apps/admin/src/app/                     — Next.js pages
apps/admin/src/components/              — Dashboard components

# Infrastructure
docker/docker-compose.yml               — PostgreSQL + Redis
.env.example                            — Environment template

# Tests
apps/api/test/                          — API tests
packages/proximity-protocol/test/       — Protocol tests
```
