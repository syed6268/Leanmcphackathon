# Robinhood Portfolio MCP Server

A Model Context Protocol (MCP) server for managing a trading portfolio with MongoDB persistence. This server provides tools for buying/selling stocks, managing wallet funds, viewing transactions, and analyzing portfolio performance.

# Deployment

You can deploy this server on Leanmcp.com.
If you are generating the code, on the the platform just go ahead and click test and deploy button and this should deploy the MCP server on leanmcp.com.

The endpoint will look like this:
`https://3001-...deployment id...-6532622b.e2b.dev/`
or 
`https://3001-...deployment id...-6532622b.serverlessmcps.link/`


## Features

- **MongoDB Integration**: Persistent storage for portfolio data, transactions, and wallet balance
- **Trading Tools**: Buy and sell stocks with automatic position tracking
- **Wallet Management**: Deposit funds and track buying power
- **Transaction History**: View all transactions with filtering capabilities
- **Portfolio Analysis**: Comprehensive portfolio summary with performance metrics
- **Streamable HTTP Transport**: Modern MCP transport protocol
- **TypeScript**: Full type safety with ES modules

## Tools Available

### 1. `get_portfolio_summary`
Get comprehensive portfolio overview including holdings, performance, and key metrics.

**Parameters:**
- `include_positions` (boolean, optional): Include detailed position information
- `include_performance` (boolean, optional): Include performance metrics

### 2. `get_transactions`
Retrieve transaction history with optional filtering by type and date range.

**Parameters:**
- `type` (enum, optional): Filter by transaction type (BUY, SELL, DEPOSIT, WITHDRAWAL, ALL)
- `limit` (number, optional): Maximum number of transactions to return (default: 50)
- `start_date` (string, optional): Start date in ISO format (e.g., 2024-01-01)
- `end_date` (string, optional): End date in ISO format

### 3. `buy_stock`
Purchase shares of a stock. Updates positions and records transaction in database.

**Parameters:**
- `symbol` (string, required): Stock symbol to buy (e.g., AAPL, TSLA)
- `shares` (number, required): Number of shares to buy
- `price` (number, required): Price per share

### 4. `sell_stock`
Sell shares of a stock. Updates positions and records transaction in database.

**Parameters:**
- `symbol` (string, required): Stock symbol to sell (e.g., AAPL, TSLA)
- `shares` (number, required): Number of shares to sell
- `price` (number, required): Price per share

### 5. `add_money_to_wallet`
Deposit funds into your trading account to increase buying power.

**Parameters:**
- `amount` (number, required): Amount to deposit

## Prerequisites

- Node.js 18+
- MongoDB (local or remote instance)

## Quick Start

1. **Install MongoDB** (if running locally):
```bash
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or manually
mongod --config /opt/homebrew/etc/mongod.conf
```

2. **Configure Environment Variables**:
Create a `.env` file in the root directory:
```bash
MONGODB_URI=mongodb://localhost:27017
DB_NAME=robinhood
```

3. **Install Dependencies and Build**:
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

4. **Start the Server**:
```bash
# HTTP Server (recommended for web clients)
npm start

# Or Stdio Server (for Claude Desktop/Cursor)
npm run start:stdio

# Development mode with auto-reload
npm run dev
```

The server will:
- Connect to MongoDB automatically
- Initialize a default wallet with $10,000
- Be ready to accept trading commands

## Deployment

**To build and deploy this MCP server, click the "Test and Deploy" button in the UI.**

This button will:
1. Build your MCP server with all dependencies
2. Deploy it to a live endpoint

## API Endpoints

Once you've clicked "Test and Deploy" and your server is deployed, the following API endpoints will be available:

**An example server would look like this with the e2b.dev endpoint:**
`https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/`

**Available endpoints:**
- **MCP Endpoint**: `POST /mcp`
- **Health Check**: `GET /health`
- **Server Info**: `GET /`
- **AI Playground**: `GET /ai`
- **MCP Playground**: `GET /mcp`

**Example full URLs:**
- MCP Endpoint: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/mcp`
- Health Check: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/health`
- AI Playground: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/ai`


## MongoDB Collections

The server automatically creates and manages the following MongoDB collections:

- **positions**: Stock positions with average cost and share count
- **transactions**: Complete transaction history (BUY, SELL, DEPOSIT, WITHDRAWAL)
- **wallet**: Current balance and buying power
- **portfolio**: Portfolio metadata and performance metrics

## Environment Variables

Create a `.env` file with the following variables:

```bash
# MongoDB Configuration (required)
MONGODB_URI=mongodb://localhost:27017
DB_NAME=robinhood

# Optional
DASHBOARD_URL=https://s3-dashboard-build.s3.us-west-2.amazonaws.com/out/index.html
```


## Example Usage

### Buy a Stock
```javascript
{
  "tool": "buy_stock",
  "parameters": {
    "symbol": "AAPL",
    "shares": 10,
    "price": 175.50
  }
}
```

### Sell a Stock
```javascript
{
  "tool": "sell_stock",
  "parameters": {
    "symbol": "AAPL",
    "shares": 5,
    "price": 180.25
  }
}
```

### Add Money to Wallet
```javascript
{
  "tool": "add_money_to_wallet",
  "parameters": {
    "amount": 5000
  }
}
```

### View Transactions
```javascript
{
  "tool": "get_transactions",
  "parameters": {
    "type": "BUY",
    "limit": 10,
    "start_date": "2024-01-01"
  }
}
```

### Get Portfolio Summary
```javascript
{
  "tool": "get_portfolio_summary",
  "parameters": {
    "include_positions": true,
    "include_performance": true
  }
}
```

## Usage with MCP Clients

Connect your MCP client to your deployed MCP endpoint using the Streamable HTTP transport.

**Example MCP client connection:**
```
https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/mcp
```

Replace the example URL with your actual deployed server URL provided after clicking "Test and Deploy".

## Architecture

```
src/
├── server.ts          # Express server with Streamable HTTP transport
├── stdio-server.ts    # Stdio transport for Claude Desktop/Cursor
├── mcp-server.ts      # MCP server configuration
├── db.ts             # MongoDB connection and data models
└── minimal/
    ├── resource.ts    # Portfolio resources
    ├── tool.ts        # Trading and wallet tools
    └── prompt.ts      # Prompt templates
```

## Data Models

### Position
```typescript
{
  symbol: string;
  shares: number;
  avg_cost: number;
  created_at: Date;
  updated_at: Date;
}
```

### Transaction
```typescript
{
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';
  symbol?: string;
  shares?: number;
  price?: number;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}
```

### Wallet
```typescript
{
  balance: number;
  buying_power: number;
  updated_at: Date;
}
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run in stdio mode for testing with Claude Desktop
npm run dev:stdio

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Notes

- The server initializes with a default wallet balance of $10,000
- Stock prices must be provided manually (in production, integrate with a real-time market data API)
- All monetary values are stored as floating-point numbers
- Transactions are recorded with timestamps for historical analysis
- Position tracking automatically calculates average cost basis
- Selling all shares of a position removes it from the positions collection

## Troubleshooting

**MongoDB Connection Issues:**
- Ensure MongoDB is running: `brew services list` (macOS)
- Check connection string in `.env` file
- Verify network access if using remote MongoDB

**Build Errors:**
- Run `npm run clean` then `npm run build`
- Delete `node_modules` and run `npm install` again

**Server Won't Start:**
- Check if port 3001 is already in use
- Verify MongoDB is accessible
- Check logs for specific error messages