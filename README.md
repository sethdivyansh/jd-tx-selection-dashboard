# DMND Transaction Selection Dashboard

**Stratum V2 Job Declaration UI for Bitcoin Miners**

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Usage](#usage)
6. [Architecture](#architecture)

---

## Overview

The DMND Transaction Selection Dashboard is a web-based interface that connects to the DMND proxy via Stratum V2. It enables miners to:

- **Monitor** real-time mempool transactions
- **Select** transactions manually or with smart criteria
- **Submit** custom job declarations to their mining pool
- **Optimize** profitability by choosing high-fee transactions

By shifting transaction control from the pool to individual miners, this dashboard promotes decentralization and maximizes miner rewards.

---

## Features

- **Real-time Mempool Feed**: Live updates via WebSocket for pending transactions
- **Transaction Selection**: Manual multi-select and automated filters (fee rate, size, profitability)
- **Job Declaration**: Direct Stratum V2 submission and status tracking
- **Floating Action Bar**: Contextual bulk actions (submit, copy IDs, export CSV)
- **Analytics**: Charts and stats for selection efficiency and estimated rewards
- **Dark/Light Themes**: System and manual theme switching

---

## Tech Stack

| Category           | Technology                           |
| ------------------ | ------------------------------------ |
| Framework          | Next.js 15 (App Router)              |
| Language           | TypeScript                           |
| Styling            | Tailwind CSS v4                      |
| Components         | Shadcn UI                            |
| Table Library      | TanStack Table                       |
| State Management   | Zustand                              |
| WebSocket Client   | Reconnecting WebSocket               |
| URL State Routing  | Nuqs                                 |
| Animations         | Motion                               |
| Forms & Validation | Zod                                  |
| Icons              | Lucide React, Tabler Icons           |
| Lint & Format      | ESLint, Prettier |

---

## Getting Started

### Prerequisites

- Node.js ≥18
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/dmnd-transaction-dashboard.git
cd dmnd-transaction-dashboard/dashboard

# Install dependencies
npm install
```

### Development

```bash
# Start dev server with Turbopack
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Monitor** the live mempool feed
2. **Select** transactions manually or via filter criteria
3. **Review** selected transaction details in the floating action bar
4. **Submit** your custom job declaration to the pool
5. **Track** job status and analytics in the dashboard

---

## Architecture

```plaintext
src/
├── api/                      # API routes & proxy endpoints
├── app/
│   ├── dashboard/
│   │   └── overview/         # Transaction monitoring & mempool data
├── components/
│   ├── ui/                   # Shadcn UI components (tables, buttons, etc.)
│   ├── layout/               # Layout components
│   └── modal/                # Modal components
├── features/
│   ├── overview/             # Transaction tables & mempool monitoring
├── hooks/
│   ├── use-mempool-transactions.ts  # Real-time mempool WebSocket
│   ├── use-data-table.ts            # Table state management
│   └── use-proxy-stats.ts           # Proxy connection stats
├── lib/
│   ├── utils.ts              # General utilities
│   └── composition.ts        # Component composition utilities
├── types/
transaction types
│   ├── index.ts              
│   └── data-table.ts         # Table configuration types
└── constants/
    └── data.ts               # Static data & configurations
```
