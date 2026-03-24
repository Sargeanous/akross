# Proximity MVP

A proximity-based dating app where users can only discover and match with people they've recently been physically near, verified via Bluetooth Low Energy (BLE) encounter proofs validated by the backend.

## Architecture

```
proximity-mvp/
├── apps/
│   ├── api/              # Fastify backend (TypeScript)
│   ├── mobile/           # React Native app (prompt 2)
│   └── admin/            # Admin dashboard (prompt 2)
├── packages/
│   ├── shared/           # Types, Zod schemas, constants, utils
│   ├── proximity-protocol/  # BLE encounter validation algorithm
│   └── config/           # Shared TS configs
└── docker/               # Postgres + Redis
```

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start Postgres and Redis
pnpm docker:up

# Copy environment variables
cp .env.example .env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:push

# Start the development server
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run encounter validation tests only
pnpm --filter @proximity/protocol test

# Run API tests only
pnpm --filter @proximity/api test
```

## Key Concepts

### Encounter Flow

1. **Event Creation** — An admin creates a proximity event with a venue and time window
2. **Join Event** — Users join the event and receive a batch of BLE tokens from the backend
3. **BLE Scanning** — The mobile app advertises tokens via BLE and scans for nearby tokens
4. **Upload Observations** — The app periodically uploads observed tokens to the backend
5. **Validation** — A background job cross-references all participants' observations to find mutual encounters
6. **Swipe** — Users can swipe (LIKE/PASS) on people they've been verified near
7. **Match** — Mutual LIKEs create a match and unlock chat

### Security Model

- BLE tokens are generated server-side and mapped to users — the client never creates its own tokens
- Encounters require **mutual verification** — both users must have observed each other's tokens
- Exact timestamps and RSSI distances are never exposed to other users
- Chat is only available after a mutual match on a verified encounter
- Swipes are only allowed on backend-verified encounters

## API Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | Phone OTP + email magic link, JWT tokens |
| Profile | `/profile` | Create/update profile, photo uploads |
| Events | `/events` | List events, join event |
| Encounters | `/encounters` | Token requests, observation uploads, verified encounters |
| Swipe | `/swipe` | Swipe on encounters, list matches |
| Chat | `/chat` | Threads, messages, WebSocket real-time |
| Report | `/report`, `/block` | Report users, block/unblock |
| Admin | `/admin` | Manage reports, users, events |

## Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **API Framework**: Fastify 5
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache/Queue**: Redis 7 + BullMQ
- **Auth**: JWT (access + refresh tokens)
- **Realtime**: Fastify WebSocket
- **Storage**: S3-compatible (presigned uploads)
- **Validation**: Zod schemas (shared package)
