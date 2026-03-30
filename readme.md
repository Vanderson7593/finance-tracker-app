# Finance Tracker

Expo app for personal finance tracking.

## Requirements

- Node.js 24+
- pnpm

## Setup

```bash
corepack enable
pnpm install
```

## Run

```bash
pnpm dev
```

To open it on a phone, install Expo Go and scan the QR code shown in the terminal.

If local network discovery fails:

```bash
pnpm exec expo start --tunnel
```

## Static Preview

```bash
pnpm build
pnpm serve
```

If `PUBLIC_URL` is not set, the static preview defaults to `http://localhost:3000`.
