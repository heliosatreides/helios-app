# Helios ☀️

A personal life-dashboard app for tracking trips, finances, and investments — all in one clean dark-mode interface.

## Features

### ✈️ Trips
- Create and manage travel plans with destination, dates, and budget
- Track itinerary items and trip-specific expenses
- Trip statuses: Planning, Upcoming, Ongoing, Completed

### 💰 Finance
- **Accounts** — track checking, savings, credit cards, and investment accounts
- **Transactions** — log income and expenses, filter by account or category
- **Budget** — set monthly category budgets with visual progress bars and over-budget alerts

### 📈 Investments
- **Portfolio** — track holdings with cost basis, current price, market value, and gain/loss
- **Asset Allocation** — visual pie chart of your portfolio by asset class (Stocks, ETF, Crypto, Bonds, etc.)
- **Watchlist** — monitor tickers you're interested in with target prices and notes
- **Strategy Notes** — freeform markdown-style notes for your investment thesis

### ⚡ Dashboard
- Unified overview of upcoming trips, finance summary, and portfolio performance
- Live net worth, monthly spend, budget health percentage, and total portfolio gain/loss

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| State / Persistence | `localStorage` (via custom `useLocalStorage` hook) |
| Testing | Vitest + React Testing Library |
| Build | Create React App (react-scripts) |

No backend required — all data is stored locally in the browser.

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm start
```

## Running Tests

```bash
# Run all tests once (62 tests across trips, finance, investments, dashboard)
npx vitest run

# Watch mode during development
npx vitest
```

## Project Structure

```
src/
├── components/
│   └── Sidebar.jsx          # Navigation sidebar with icons
├── hooks/
│   └── useLocalStorage.js   # Persistent state hook
├── pages/
│   ├── dashboard/           # Dashboard overview
│   ├── trips/               # Trip management (list, create, detail)
│   ├── finance/             # Accounts, transactions, budgets
│   └── investments/         # Portfolio, watchlist, strategy notes
├── App.jsx                  # Root app + layout shell
└── index.css                # Global styles (Tailwind base)
```

## Data Persistence

All data is stored in `localStorage` under these keys:

- `helios-trips` — trip records
- `finance-accounts` — account balances
- `finance-transactions` — transaction history
- `finance-budgets` — budget category limits
- `investments-portfolio` — holdings
- `investments-watchlist` — watchlist items
- `investments-strategy` — strategy notes

Clearing browser storage resets all data.
