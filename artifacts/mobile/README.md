# FinTrack — App de Finanças Pessoais

MVP de finanças pessoais construído com Expo + React Native + TypeScript.

## Como correr

```bash
# Na raiz do monorepo
pnpm install

# Inicia o servidor de desenvolvimento
pnpm --filter @workspace/mobile run dev
```

Depois abre a app no Expo Go (iOS/Android) usando o QR code, ou acede ao preview no browser.

## Stack

| Pacote | Versão | Uso |
|--------|--------|-----|
| expo | ~54.0 | Runtime mobile |
| expo-router | ~6.0 | Routing file-based |
| react-native | 0.81.5 | UI framework |
| typescript | ~5.9 | Tipagem |
| zustand | ^5.0 | Estado global |
| @tanstack/react-query | latest | Server state |
| react-hook-form | ^7.0 | Formulários |
| @hookform/resolvers | ^3.0 | Integração Zod |
| zod | latest | Validação de schemas |
| @react-native-async-storage/async-storage | 2.2.0 | Persistência local |
| date-fns | ^3.0 | Formatação de datas |
| react-native-chart-kit | ^6.12 | Gráficos |
| expo-notifications | ~0.28 | Notificações locais |
| expo-haptics | ~15.0 | Feedback tátil |
| expo-linear-gradient | ~15.0 | Gradientes |
| react-native-svg | 15.12 | SVG (requerido pelo chart-kit) |

## Estrutura do Projeto

```
artifacts/mobile/
├── app/                        # Rotas (Expo Router)
│   ├── _layout.tsx             # Root layout + providers
│   ├── (tabs)/                 # Tab navigation
│   │   ├── _layout.tsx         # Tab bar config
│   │   ├── index.tsx           # Dashboard / Home
│   │   ├── transactions.tsx    # Lista de transações
│   │   ├── reports.tsx         # Relatórios e gráficos
│   │   ├── budgets.tsx         # Orçamentos
│   │   └── settings.tsx        # Definições
│   ├── transaction-form.tsx    # Criar/editar transação
│   ├── categories.tsx          # Gestão de categorias
│   └── forecast.tsx            # Previsão financeira
│
├── src/
│   ├── types/                  # TypeScript types globais
│   ├── constants/              # Constantes da app
│   ├── lib/                    # Utilitários
│   │   ├── storage.ts          # AsyncStorage wrapper
│   │   ├── uuid.ts             # Gerador de IDs
│   │   ├── formatters.ts       # date-fns, currency
│   │   └── seed.ts             # Dados iniciais
│   ├── store/                  # Zustand stores
│   │   ├── useTransactionStore.ts
│   │   ├── useCategoryStore.ts
│   │   ├── useBudgetStore.ts
│   │   └── useSettingsStore.ts
│   ├── hooks/                  # Custom hooks
│   │   ├── useFinanceData.ts   # Cálculos financeiros
│   │   └── useNotifications.ts # Expo Notifications
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ThemedText.tsx
│   │   ├── Card.tsx
│   │   ├── CategoryIcon.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── BudgetProgressBar.tsx
│   │   ├── InsightCard.tsx
│   │   ├── MonthSelector.tsx
│   │   ├── PillFilter.tsx
│   │   ├── SegmentedControl.tsx
│   │   ├── FormInput.tsx
│   │   └── EmptyState.tsx
│   └── features/               # Componentes por feature
│       ├── transactions/TransactionForm.tsx
│       ├── categories/CategoryForm.tsx
│       └── budgets/BudgetForm.tsx
│
└── constants/
    └── colors.ts               # Tema de cores global
```

## Funcionalidades

### Implementadas
- ✅ Dashboard com resumo financeiro mensal (receitas, despesas, saldo)
- ✅ Seletor de mês para navegar no histórico
- ✅ Registo de receitas e despesas (CRUD completo)
- ✅ Categorias personalizadas (nome, ícone, cor, tipo)
- ✅ Recorrência simples (diária, semanal, mensal, anual)
- ✅ Filtros por período, tipo e categoria
- ✅ Relatórios com gráficos (linhas, pizza, barras)
- ✅ Insights mensais (maior gasto, variação, média)
- ✅ Orçamentos mensais por categoria com barra de progresso
- ✅ Alertas visuais quando orçamento perto do limite/excedido
- ✅ Previsão financeira baseada no ritmo de gastos
- ✅ Lembretes locais com Expo Notifications
- ✅ Persistência local com AsyncStorage
- ✅ Dados de demonstração realistas
- ✅ Design moderno, minimalista e premium

### Para evoluir
- 🔮 Sincronização com API REST (estrutura pronta com TanStack Query)
- 🔮 Autenticação (Replit Auth ou outro)
- 🔮 Export para PDF/CSV
- 🔮 Suporte a múltiplas contas/carteiras
- 🔮 Integração bancária (Open Banking)
- 🔮 Modo escuro completo
- 🔮 Widgets iOS/Android
- 🔮 Backup na nuvem

## Decisões Arquiteturais

**Zustand sobre Redux**: Mais simples e com menos boilerplate para um MVP. Fácil de substituir por Redux Toolkit se necessário.

**AsyncStorage sobre SQLite**: Suficiente para o MVP. A estrutura dos stores facilita migração futura para SQLite ou API.

**react-native-chart-kit**: Mais leve e fácil de configurar que Victory Native. Funciona bem para os gráficos necessários.

**Feature-first organização**: Os formulários ficam em `src/features/` e os componentes genéricos em `src/components/`, seguindo uma separação clara.

**Hooks de cálculo**: `useFinanceData.ts` centraliza todos os cálculos financeiros com `useMemo` para performance.
