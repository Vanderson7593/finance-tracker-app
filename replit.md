# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an Express API server and an Expo mobile app (FinTrack — personal finance app).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (for future use)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo ~54 + React Native 0.81.5

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo mobile app (FinTrack)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Mobile App (FinTrack)

Located in `artifacts/mobile/`. Personal finance app built with Expo + React Native.

### Features
- Dashboard with monthly summary (income, expenses, balance)
- Full CRUD for transactions with categories and recurrence
- Budget tracking per category with visual progress
- Reports with charts (line, pie)
- Financial forecast based on spending patterns
- Local notifications (Expo Notifications)
- AsyncStorage persistence with seed data

### Mobile Structure
```
artifacts/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation (home, transactions, reports, budgets, settings)
│   ├── transaction-form.tsx
│   ├── categories.tsx
│   └── forecast.tsx
├── src/
│   ├── types/              # TypeScript types
│   ├── constants/          # App constants
│   ├── lib/                # Utilities (storage, formatters, seed, uuid)
│   ├── store/              # Zustand stores
│   ├── hooks/              # Custom hooks (useFinanceData, useNotifications)
│   ├── components/         # Reusable UI components
│   └── features/           # Feature-specific forms
└── constants/colors.ts     # Global theme
```

### Mobile Key Packages
- `zustand` - Global state management
- `date-fns` - Date formatting
- `react-native-chart-kit` - Charts
- `react-hook-form` + `zod` - Forms with validation
- `expo-notifications` - Local reminders
- `@react-native-async-storage/async-storage` - Local persistence

## TypeScript & Composite Projects

Every lib package extends `tsconfig.base.json` which sets `composite: true`. Mobile app has its own tsconfig.

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`. Uses `@workspace/api-zod` for validation.

### `artifacts/mobile` (`@workspace/mobile`)
Expo mobile app for personal finance management. Uses AsyncStorage for local persistence. Ready to connect to API server.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
