# FinTrack

FinTrack is a local-first personal finance tracker built with Expo, React Native, and Expo Router. It runs as a mobile app, works in Expo Go during development, and includes a static preview pipeline for sharing a built version without adding a backend.

The current app focuses on the core personal finance loop:

- track income and expenses
- organize entries by category
- define monthly budgets
- review charts and summaries
- inspect a simple end-of-month forecast
- persist everything locally on the device

## Highlights

- Dashboard with monthly balance, recent transactions, and budget progress
- Transactions screen with month navigation and type/category filters
- Budgets screen with per-category limits and spending progress
- Reports screen with trend, category, and savings views
- Settings screen with profile preferences and notification toggles
- Category management for both income and expense flows
- Forecast screen with projected end-of-month balance and confidence level
- Local persistence with seeded starter data on first launch

## Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router for file-based navigation
- Zustand for local state stores
- AsyncStorage for persistence
- `react-native-chart-kit` for reports and forecast charts
- Expo Notifications, Haptics, Safe Area, and related mobile APIs

## Product Scope

This project is currently a single local app.

- No backend is required for normal use
- No database setup is required
- Data is stored on-device with AsyncStorage
- Seed data is inserted automatically the first time the stores load

That makes the repo straightforward to run locally and easy to extend into either:

- a fully offline-first personal app
- a synced app with a future API layer

## Requirements

- Node.js 24+
- `pnpm`
- Expo Go on a physical device if you want to test on phone hardware

## Quick Start

```bash
corepack enable
pnpm install
pnpm dev
```

Once Expo starts:

- scan the QR code with Expo Go on iOS or Android
- or press `i` to open the iOS simulator
- or press `a` to open Android if you have an emulator/device configured
- or press `w` to open the web target

If LAN discovery is unreliable on your network:

```bash
pnpm exec expo start --tunnel
```

## Available Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the Expo development server |
| `pnpm build` | Generates the static Expo preview into `static-build/` |
| `pnpm serve` | Serves the generated static preview from a local Node server |
| `pnpm typecheck` | Runs TypeScript without emitting files |

## Static Preview Flow

The repo includes a simple build-and-serve pipeline for static previews.

```bash
pnpm build
pnpm serve
```

What happens:

- `scripts/build.js` starts Metro in production mode
- it downloads the generated iOS and Android bundles plus manifests
- it writes the output into `static-build/`
- `server/serve.js` serves the built files and Expo manifests

Useful environment variables for this flow:

- `PORT`: port used by the preview server, defaults to `3000`
- `SERVE_PORT`: alternative port source used by the build script
- `PUBLIC_URL`: public origin embedded into the generated preview
- `BASE_PATH`: optional base path for serving under a subdirectory

## App Structure

```text
.
├── app/                Expo Router screens and navigation
├── assets/             icons and splash assets
├── components/         app shell and error boundary components
├── constants/          theme colors used by route-level screens
├── scripts/            local build helpers
├── server/             static preview server
├── src/
│   ├── components/     reusable finance UI building blocks
│   ├── constants/      storage keys, month labels, recurrence labels
│   ├── features/       form flows for budgets, categories, transactions
│   ├── hooks/          derived finance metrics and notification helpers
│   ├── lib/            formatting, seed data, storage, ids
│   ├── store/          Zustand stores
│   └── types/          shared domain types
├── app.json            Expo app config
├── package.json        scripts and dependencies
└── tsconfig.json       TypeScript config
```

## Routing

Expo Router handles navigation through the `app/` directory.

Main routes:

- `app/(tabs)/index.tsx`: dashboard
- `app/(tabs)/transactions.tsx`: transactions list and filters
- `app/(tabs)/budgets.tsx`: monthly budgets
- `app/(tabs)/reports.tsx`: analytics and charts
- `app/(tabs)/settings.tsx`: preferences and utilities
- `app/transaction-form.tsx`: add/edit transaction modal
- `app/categories.tsx`: category management
- `app/forecast.tsx`: financial forecast view

Framework-specific filenames such as `_layout.tsx` and `+not-found.tsx` are required by Expo Router and should not be renamed.

## Data Model

The main domain entities live in `src/types/index.ts`.

- `Transaction`: income or expense entry with amount, category, recurrence, and date
- `Category`: labeled bucket with icon, color, and transaction type
- `Budget`: monthly spending cap for a category
- `NotificationSettings`: local reminder and alert preferences
- `UserProfile`: basic local profile state

Derived values are computed in `src/hooks/use-finance-data.ts`, including:

- monthly totals
- category spending percentages
- budget progress
- multi-month trend summaries
- forecast projections

## Local Persistence

The app is local-first today.

- storage lives in AsyncStorage via `src/lib/storage.ts`
- Zustand stores load and persist data in `src/store/`
- default categories come from `src/lib/seed.ts`
- sample transactions and budgets are inserted automatically on first load

Storage keys currently include:

- `@fintrack_transactions`
- `@fintrack_categories`
- `@fintrack_budgets`
- `@fintrack_settings`
- `@fintrack_profile`

If you want a clean state during development, uninstall the app from the simulator/device or clear the relevant AsyncStorage keys.

## UI Notes

- The app uses a light theme centered on the palette in `constants/colors.ts`
- Text uses the Inter font family loaded in `app/_layout.tsx`
- Mobile-specific behaviors like safe areas, haptics, keyboard handling, and notifications are already wired in
- The UI copy is primarily in Portuguese

## Development Notes

- File naming follows kebab-case, except for Expo Router special files
- The project has been flattened into a conventional single-app repo
- There is no active API server in the current structure
- TanStack Query is already provided at the root if remote data is added later

## Validation

Before pushing changes, run:

```bash
pnpm typecheck
```

## Next Extensions

If you want to grow the app, the cleanest next steps are:

- replace AsyncStorage with a sync-capable persistence layer
- add authentication and cloud backup
- add recurring transaction automation
- add CSV import/export
- add stronger form validation and test coverage
