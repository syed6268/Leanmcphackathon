import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Sets up Robinhood portfolio resources
 */
export function setupMinimalResource(server: McpServer): void {
  // Portfolio Overview Resource
  server.registerResource(
    "portfolio-overview",
    "robinhood://portfolio/overview",
    {
      title: "Portfolio Overview",
      description: "Current portfolio overview with key metrics and performance data",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const portfolioOverview = {
        account_summary: {
          total_value: 15750.32,
          buying_power: 1250.50,
          total_return: 2750.32,
          total_return_percent: 21.17,
          day_change: 125.45,
          day_change_percent: 0.80
        },
        asset_allocation: {
          stocks: 0.75,
          etfs: 0.15,
          crypto: 0.08,
          cash: 0.02
        },
        top_holdings: [
          { symbol: "AAPL", weight: 0.18, value: 2835.50 },
          { symbol: "MSFT", weight: 0.15, value: 2362.55 },
          { symbol: "TSLA", weight: 0.12, value: 1890.04 },
          { symbol: "GOOGL", weight: 0.10, value: 1575.03 },
          { symbol: "NVDA", weight: 0.08, value: 1260.03 }
        ],
        performance_metrics: {
          sharpe_ratio: 1.34,
          max_drawdown: -0.12,
          volatility: 0.18,
          beta: 1.15
        },
        last_updated: new Date().toISOString()
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(portfolioOverview, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );

  // Market Overview Resource
  server.registerResource(
    "market-overview",
    "robinhood://market/overview",
    {
      title: "Market Overview",
      description: "Current market conditions and key indices performance",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const marketOverview = {
        indices: {
          sp500: { value: 4185.47, change: 15.23, change_percent: 0.37 },
          nasdaq: { value: 12845.78, change: -5.45, change_percent: -0.04 },
          dow: { value: 33425.85, change: 125.85, change_percent: 0.38 }
        },
        market_sentiment: {
          fear_greed_index: 65,
          vix: 18.45,
          put_call_ratio: 0.85
        },
        sector_performance: {
          technology: 1.2,
          healthcare: 0.8,
          financials: -0.3,
          energy: 2.1,
          consumer_discretionary: 0.5
        },
        economic_indicators: {
          fed_funds_rate: 5.25,
          inflation_rate: 3.2,
          unemployment_rate: 3.8,
          gdp_growth: 2.4
        },
        market_status: "OPEN",
        trading_hours: "9:30 AM - 4:00 PM EST",
        last_updated: new Date().toISOString()
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(marketOverview, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );

  // Risk Analysis Resource
  server.registerResource(
    "risk-analysis",
    "robinhood://portfolio/risk",
    {
      title: "Portfolio Risk Analysis",
      description: "Comprehensive risk metrics and analysis for the current portfolio",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const riskAnalysis = {
        risk_profile: "MODERATE",
        key_metrics: {
          portfolio_beta: 1.15,
          volatility: 0.18,
          sharpe_ratio: 1.34,
          sortino_ratio: 1.67,
          max_drawdown: -0.12,
          var_95: -0.03,
          expected_shortfall: -0.05
        },
        diversification: {
          concentration_risk: "LOW",
          sector_concentration: 0.35,
          geographic_concentration: 0.82,
          correlation_score: 0.65
        },
        stress_tests: {
          market_crash_scenario: -0.25,
          interest_rate_shock: -0.08,
          recession_scenario: -0.18
        },
        recommendations: [
          "Consider reducing technology sector exposure",
          "Add international diversification",
          "Increase defensive positions during market volatility"
        ],
        risk_adjusted_performance: {
          information_ratio: 0.45,
          tracking_error: 0.06,
          treynor_ratio: 0.12
        },
        analysis_date: new Date().toISOString()
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(riskAnalysis, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );

  // Keep server info resource with updated information
  server.registerResource(
    "server-info",
    "info://server",
    {
      title: "Server Information",
      description: "Information about this Robinhood Portfolio Analysis MCP server",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const serverInfo = {
        name: "robinhood-portfolio-mcp",
        version: "1.0.0",
        description: "Robinhood Portfolio Analysis MCP Server with comprehensive trading and risk analysis capabilities",
        timestamp: new Date().toISOString(),
        features: ["portfolio-analysis", "pnl-tracking", "risk-metrics", "trade-recommendations", "market-data"],
        uri: uri.href,
        capabilities: {
          resources: 4,
          tools: 6,
          prompts: 3
        },
        transport: "Streamable HTTP",
        status: "active",
        integrations: ["Robinhood API", "Market Data APIs"],
        environment: {
          node_version: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
      };

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(serverInfo, null, 2),
          mimeType: "application/json"
        }]
      };
    }
  );
}