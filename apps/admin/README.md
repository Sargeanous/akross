# Proximity Admin Dashboard

Next.js admin dashboard for moderation and event management.

## Setup

```bash
# From the monorepo root
pnpm install

# Start the admin dashboard dev server (port 3001)
pnpm --filter @proximity/admin dev
```

## Environment

Set `NEXT_PUBLIC_API_URL` to point to your running API server (defaults to `http://localhost:3000`).

## Pages

- **Dashboard** — Overview stats (pending reports, active events)
- **Users** — Search and manage users, ban controls
- **Reports** — Report queue with filtering, resolve/dismiss actions
- **Events** — Create, edit, and manage proximity events
- **Moderation** — Tools overview and guidelines

## Auth

Uses the same JWT auth as the mobile app. Admin role check should be added before production deployment.
