# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Budget Drop** is a Next.js 14 React application that implements a retro-CRT themed budget management interface. Users drag and drop "money chips" into fund/debt buckets in a terminal-style interface. The app features a unique visual design with neon colors, scan-lines, and CRT-inspired animations.

## Development Commands

```bash
# Setup
npm install

# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Quality Assurance
npm run lint         # Run ESLint
npm test            # Run Jest tests
```

**Note**: The developer typically runs `npm run dev` automatically, so no need to suggest this command unless specifically asked.

## Architecture & Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with CSS variables and design tokens
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animation**: Framer Motion for smooth transitions
- **Drag & Drop**: @dnd-kit library with keyboard accessibility
- **Charts**: Recharts for progress visualizations
- **State Management**: React Context with useReducer pattern
- **Testing**: Jest with ts-jest

## Key Project Structure

```
/app/                    # Next.js App Router pages and layouts
/components/             # React components organized by feature
  /budget/              # Budget-related components (Bucket, BudgetDrop)
  /inputs/              # Form inputs (Chip, CurrencySelector, SumInput)
  /layout/              # Layout components (Header, Footer)
  /transaction/         # Transaction management components
  /trays/               # Chip and staging trays
  /ui/                  # Shared UI components (shadcn/ui)
/hooks/                 # Custom React hooks by category
/lib/                   # Core business logic and utilities
  /context/             # React Context providers
  /reducers/            # State management reducers
  /services/            # External service integrations
  /types.ts             # TypeScript type definitions
/__tests__/             # Jest test files
```

## Core Domain Model

- **Chip**: Draggable money unit with amount, currency, exchange rate, and optional note
- **Bucket**: Fund (fill up) or Debt (drain down) with targets/limits
- **Transaction**: Historical record of chip drops with undo capability and preserved notes
- **Exchange Rates**: Multi-currency support with USD base and 24h refresh cycle

### Note System
- **Optional notes** can be added to chips during creation (e.g., "Salary", "Groceries", "Coffee")
- **Notes are preserved** through the entire lifecycle: chip → transaction → export/import
- **Visual indicators** show notes on chips and in transaction history
- **Remainder chips** inherit notes from original chips when splits occur

## State Management

The application uses a centralized BudgetContext with reducer pattern:

- **BudgetContext** (`/lib/context/budget-context.tsx`): Main state provider
- **BudgetReducer** (`/lib/reducers/budget-reducer.ts`): Core business logic
- **Types** (`/lib/types.ts`): TypeScript definitions for all entities

Key actions: `mint`, `drop`, `undo`, `import`, `export`, `updateRates`

## Design System

- **Colors**: Black (#000) background, neon green (#00FF90), magenta accent (#FF00C8)
- **Typography**: IBM Plex Mono equivalent (Geist Mono), 16px base, 24px headings
- **Effects**: 3px scan-lines overlay, subtle CRT flicker animations
- **Accessibility**: High contrast mode, keyboard navigation, ARIA labels

## Currency & Exchange Rates

- Multi-currency support with display in native currency
- Internal storage uses raw numbers + USD conversion rates
- Exchange rate service with 24h refresh cycle and offline fallback
- Visual indicators when rates are stale (>24h old)

## Testing Strategy

- Unit tests for core business logic in `/__tests__/`
- Focus on reducer functions and currency conversion
- Accessibility testing for keyboard navigation
- Example: `stabilisation-fund.test.ts`

## Important Configuration

- **Path Aliases**: `@/*` maps to project root
- **shadcn/ui**: Configured in `components.json`
- **TypeScript**: Strict mode with bundler module resolution
- **Tailwind**: Custom design tokens and CSS variables

## Development Workflow

1. Component-driven development with TypeScript strict mode
2. Feature-based folder organization
3. shadcn/ui for consistent UI primitives
4. Drag & drop with keyboard accessibility fallback
5. Test-driven development for business logic
6. Sound effects with mute toggle (default muted)

## Key Implementation Details

- **Drag & Drop**: Uses @dnd-kit with keyboard alternatives
- **Animations**: Framer Motion with spring physics (250ms ease-out)
- **Persistence**: localStorage with JSON serialization
- **Export/Import**: JSON file download/upload functionality
- **Undo System**: Right-click bucket for transaction history (last 20 moves)

## Accessibility Features

- Full keyboard navigation support
- High contrast mode toggle
- ARIA labels and semantic HTML
- Screen reader compatibility
- Focus management for drag & drop interactions