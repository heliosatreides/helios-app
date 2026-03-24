# Helios ☀️

A personal life dashboard with 27+ features — finance, trips, investments, daily planner, news, dev tools, and more. Everything runs locally in your browser. No cloud. No accounts. No tracking.

**Live:** [helios-app-opal.vercel.app](https://helios-app-opal.vercel.app)

## Features

### Personal
- ✈️ **Trip Planning** — itineraries, budgets, expense tracking, AI trip plans
- 💰 **Finance** — accounts, transactions, monthly budgets, net worth
- 📈 **Investments** — portfolio tracking, asset allocation, watchlist, AI risk assessment
- 🏆 **Sports Hub** — live NBA, NFL, MLB, NHL, MLS scores & standings
- 🎯 **Goals & OKRs** — objectives with key results & progress tracking
- 🏥 **Health** — water tracker, mood journal, sleep log, AI health digest
- 🤝 **Networking / CRM** — contacts, interactions, follow-up reminders
- 💸 **Expense Splitter** — fair bill splitting with friends
- 🍽️ **Meal Planner** — weekly meal grid, grocery list, calorie tracking
- 📋 **Subscriptions** — track recurring payments, renewal alerts
- 🎵 **Music Picks** — mood-based AI music recommendations
- 🧳 **Packing Lists** — travel templates with AI custom lists

### Productivity
- 🗓️ **Daily Planner** — time blocks, task priorities, recurring tasks, calendar
- 🔥 **Focus Mode** — Pomodoro timer, habit streaks, quick notes
- 📚 **Knowledge Base** — reading list, TIL log, AI connections
- 📄 **Resume Builder** — full editor, print-ready, AI bullet rewrites

### Developer Tools
- 💻 **Dev Tools** — GitHub feed, snippet manager, daily log, standup gen
- 📰 **News Aggregator** — 7 topic feeds with AI briefings
- 🔄 **Converter** — currency, length, weight, temp, data, time
- 🕐 **World Clock** — multi-city, business hours, meeting planner
- 🃏 **Flashcards** — spaced repetition with AI card generation
- 💬 **P2P Chat** — WebRTC encrypted, no servers, ephemeral
- 🔌 **API Playground** — REST tester with history & AI explanation
- 🎨 **Color Palette** — generate palettes with CSS vars output
- 📝 **Personal Wiki** — markdown with [[links]], folders, search
- 🔤 **Regex Tester** — live testing with AI regex explainer
- 🧮 **Calculator** — loan, compound interest, retirement, tax

### Platform Features
- ⌘K **Command Palette** — instant page search & navigation
- 🔐 **AES-256-GCM encryption** — API keys encrypted with your password
- 📦 **Export/Import** — full JSON backup + per-module CSV exports
- ✨ **AI Integration** — bring your own Gemini key, works across all features
- 🔔 **Toast Notifications** — animated feedback system

## Privacy

- **100% local** — all data in IndexedDB, nothing leaves your device
- **No accounts** — no email, no server, no analytics
- **Encrypted secrets** — API keys use AES-256-GCM derived from your password
- **No tracking** — zero telemetry, zero data collection

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| State | IndexedDB (via `useIDB` hook) + localStorage |
| Auth | Local bcrypt hashing, session-only |
| P2P Chat | PeerJS + WebRTC with TURN relay |
| AI | Gemini API (BYOK) |
| Testing | Vitest + React Testing Library |
| Build | Create React App |
| Hosting | Vercel |

## Development

```bash
npm install
npm start        # http://localhost:3000
npx vitest run   # tests
```

## Architecture

```
src/
├── auth/           # Local auth (bcrypt + AES-256-GCM encryption)
├── components/     # Sidebar, CommandPalette, Toast, AiSuggestion, ui primitives
├── hooks/          # useIDB, useGemini, useTasks, useSportsScores, etc.
├── pages/          # 27+ feature pages
│   ├── dashboard/  # Overview + FocusTab, GoalsTab, HealthTab, etc.
│   ├── chat/       # P2P chat with lobby, usePeer, useAIControl
│   ├── finance/    # Accounts, transactions, budgets
│   ├── investments/# Portfolio, watchlist, strategy
│   ├── landing/    # Public landing page
│   └── ...         # trips, planner, news, devtools, etc.
├── utils/          # Export/import helpers
├── App.jsx         # Root layout, routing, providers
└── index.css       # Global styles, animations, scrollbar
```

## Data Storage

All data lives in IndexedDB under `helios-*` keys. Auth is local (bcrypt). API keys are AES-256-GCM encrypted. Clearing browser storage resets everything.
