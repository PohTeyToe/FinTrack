# FinTrack - Personal Finance Dashboard

Full-stack portfolio tracker and spending manager for individual investors. Tracks holdings with live market data, calculates returns over configurable windows, and visualizes spending patterns -- all in one dashboard instead of scattered spreadsheets.

**Live Demo:** [Frontend](https://fintrack-dashboard-dusky.vercel.app) | [Backend API](https://fintrack-api-4lux.onrender.com/api/)

## Screenshots

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Portfolio overview with interactive performance chart and holdings list*

### Spending Tracker
![Spending](./screenshots/spending.png)
*Expense tracking with category breakdown pie chart*

### Mobile View
![Mobile](./screenshots/mobile.png)
*Fully responsive design for mobile devices*

## Features

### Portfolio Dashboard
- **Real-time portfolio tracking** with total value and daily change
- **Interactive line charts** showing portfolio performance (1W, 1M, 3M, 1Y views)
- **Holdings management** with current price, daily change, and total value
- **Visual indicators** - green for gains, red for losses

### Spending Tracker
- **Expense entry** with amount, category, date, and description
- **Pie chart breakdown** by category (Food, Transport, Entertainment, Bills, Other)
- **Monthly comparison** showing spending trends
- **Category insights** with percentage breakdown
- **Budget tracking** with per-category limits and over-budget alerts

### Watchlist
- **Track stocks** without owning them
- **Quick view** of price and daily change
- **Easy add to portfolio** from watchlist
- **Top movers** highlighting best/worst performers

### Data Export
- **CSV export** for portfolio holdings and transactions
- **CSV export** for spending entries

### Design
- **Dark mode by default** - easy on the eyes
- **Clean, minimal UI** inspired by modern finance apps
- **Smooth animations** on data updates and page transitions
- **Fully responsive** - works on mobile

## Tech Stack

| Technology | Purpose |
|-|-|
| **Django + DRF** | Backend API with ORM and browsable API |
| **PostgreSQL** | Relational database with JSON column support |
| **pandas + yfinance** | Portfolio analytics and live market data |
| **React 18** | UI library with hooks |
| **TypeScript** | Type safety and better DX |
| **Redux Toolkit** | Global state management |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Data visualization |
| **Docker Compose** | Local development environment |

## Architecture Decisions

- **Django over FastAPI** — Django's built-in admin interface provides immediate data management UI without building custom CRUD views. The ORM with migrations handles schema evolution as the portfolio model grew. DRF (Django REST Framework) provides serializers, viewsets, and browsable API for faster API development.

- **pandas for portfolio analytics** — Single-user scale data (hundreds of holdings, not millions) makes pandas the right tool. Rich financial functions (rolling windows, percentage changes, resampling) integrate naturally with yfinance data. NumPy operations handle returns calculations efficiently.

- **yfinance for market data** — Free, no API key required, covers all major exchanges. Good enough for a personal portfolio tracker where real-time data isn't critical. The `download()` API handles batch requests for multiple tickers efficiently.

- **Redux Toolkit for frontend state** — Centralized portfolio state prevents prop-drilling across dashboard components. RTK Query handles API caching and invalidation automatically. Redux DevTools simplify debugging state changes during development.

- **PostgreSQL over SQLite** — Needed concurrent read/write access for background data refresh jobs. JSON column support stores flexible metadata per holding. Better date/time functions for financial time series queries.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PohTeyToe/fintrack.git
   cd fintrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── charts/           # Chart components (Portfolio, Spending, Mini)
│   ├── common/           # Reusable UI components
│   ├── portfolio/        # Portfolio-specific components
│   ├── spending/         # Spending tracker components
│   └── watchlist/        # Watchlist components
├── hooks/                # Custom React hooks
├── pages/                # Page components
├── store/                # Redux slices and store
├── types/                # TypeScript interfaces
├── utils/                # Utility functions
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

## Key Features Explained

### State Management
- **Redux Toolkit** for predictable state updates
- **localStorage persistence** - your data survives refresh
- **Optimistic updates** for snappy UX

### Custom Hooks
- `usePortfolioSummary` - Calculates portfolio statistics
- `usePortfolioHistory` - Filters chart data by time range
- `useStockData` - Fetches and caches stock quotes
- `useLocalStorage` - Syncs state with localStorage

### Data Visualization
- **Area charts** for portfolio performance
- **Pie charts** for spending breakdown
- **Mini sparklines** for quick stock trends

## Responsive Design

The app is fully responsive with:
- Mobile-first approach
- Collapsible navigation on small screens
- Touch-friendly interactions
- Optimized chart sizes for different viewports

## Backend Setup

The Django backend requires a few environment variables. Copy `.env.example` and customise:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|-|-|-|
| `DJANGO_SECRET_KEY` | `dev-secret-key-change-me` | Django secret key (change in prod) |
| `DJANGO_DEBUG` | `True` | Debug mode toggle |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `fintrack` | Database name |
| `DB_USER` | `fintrack` | Database user |
| `DB_PASSWORD` | `fintrack` | Database password |

Start everything with Docker:

```bash
docker-compose up -d
```

Or run the backend manually (requires a local PostgreSQL instance):

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Authentication

The API uses **token-based authentication** via Django REST Framework's `TokenAuthentication`. After registering or logging in, include the token in subsequent requests.

### Auth Endpoints

**Register a new user**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "securepass", "email": "demo@example.com"}'
# Returns: {"token": "<token>", "user_id": 1, "username": "demo"}
```

**Log in (obtain token)**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "securepass"}'
# Returns: {"token": "<token>"}
```

**Log out (invalidate token)**
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Token <token>"
```

## API Usage Examples

All endpoints live under `/api/`. Include the auth header with every request:

```
Authorization: Token <token>
```

**List portfolios**
```bash
curl http://localhost:8000/api/portfolios/ \
  -H "Authorization: Token <token>"
```

**Get portfolio returns (1-month window)**
```bash
curl http://localhost:8000/api/portfolios/1/returns/?period=1M \
  -H "Authorization: Token <token>"
```

**Create a holding**
```bash
curl -X POST http://localhost:8000/api/holdings/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <token>" \
  -d '{"portfolio": 1, "symbol": "AAPL", "shares": "10", "avg_cost": "150.00", "sector": "technology"}'
```

**Spending analytics (3-month pattern analysis)**
```bash
curl http://localhost:8000/api/analytics/spending/patterns/?period=3M \
  -H "Authorization: Token <token>"
```

**Generate spending report for a date range**
```bash
curl "http://localhost:8000/api/analytics/spending/report/?start=2025-10-01&end=2025-12-31" \
  -H "Authorization: Token <token>"
```

**Budget summary (current month)**
```bash
curl http://localhost:8000/api/analytics/spending/budget-summary/ \
  -H "Authorization: Token <token>"
```

**Export portfolio as CSV**
```bash
curl http://localhost:8000/api/portfolio/export/ \
  -H "Authorization: Token <token>" -o portfolio.csv
```

**Export spending as CSV**
```bash
curl http://localhost:8000/api/analytics/spending/export/ \
  -H "Authorization: Token <token>" -o spending.csv
```

**Health check (no auth required)**
```bash
curl http://localhost:8000/api/health/
# Returns: {"status": "ok", "database": "connected"}
```

**Watchlist**
```bash
# List watched stocks
curl http://localhost:8000/api/watchlist/ \
  -H "Authorization: Token <token>"

# Add a stock to watchlist
curl -X POST http://localhost:8000/api/watchlist/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <token>" \
  -d '{"symbol": "NVDA"}'
```

## Deployment

### Frontend (Vercel)
1. Connect the repository on [Vercel](https://vercel.com)
2. Set `VITE_API_BASE_URL` to your Render backend URL
3. Deploy — `vercel.json` configures the build automatically

### Backend (Render)
1. Connect the repository on [Render](https://render.com)
2. Create a new Blueprint from `render.yaml`
3. Render will provision the PostgreSQL database and Django service automatically
4. Demo data is loaded automatically on first deploy

See live links at the top of this README.

## Known Issues

- Market data refresh is synchronous — large portfolios (50+ tickers) can timeout on the API call
- Returns calculation assumes all transactions are in USD; no multi-currency support
- yfinance occasionally returns stale data for less-traded securities
- Portfolio allocation chart doesn't account for pending sell orders

## Roadmap

- [ ] Background task queue (Celery) for async market data refresh
- [ ] Multi-currency portfolio support with exchange rate conversion
- [ ] Tax-loss harvesting analysis and suggestions
- [ ] Portfolio rebalancing recommendations based on target allocation
- [ ] Email alerts for significant portfolio value changes (>5% daily)

## License

MIT License - feel free to use this project for learning or as a starting point for your own finance app!
