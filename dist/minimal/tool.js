import { z } from "zod";
import { getPositionsCollection, getTransactionsCollection, getWallet, updateWallet } from "../db.js";
/**
 * Sets up Robinhood portfolio analysis tools
 */
export function setupMinimalTool(server) {
    // Portfolio Analysis Tool
    server.registerTool("get_portfolio_summary", {
        title: "Portfolio Summary",
        description: "Get comprehensive portfolio overview including holdings, performance, and key metrics",
        inputSchema: {
            include_positions: z.boolean().optional().describe("Include detailed position information"),
            include_performance: z.boolean().optional().describe("Include performance metrics")
        }
    }, async ({ include_positions = true, include_performance = true }) => {
        try {
            const portfolioData = await getPortfolioData(include_positions, include_performance);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(portfolioData, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error fetching portfolio: ${error instanceof Error ? error.message : String(error)}`
                    }]
            };
        }
    });
    // Get Transactions Tool
    server.registerTool("get_transactions", {
        title: "Get Transactions",
        description: "Retrieve transaction history with optional filtering by type and date range",
        inputSchema: {
            type: z.enum(["BUY", "SELL", "DEPOSIT", "WITHDRAWAL", "ALL"]).optional().describe("Filter by transaction type"),
            limit: z.number().optional().describe("Maximum number of transactions to return (default: 50)"),
            start_date: z.string().optional().describe("Start date in ISO format (e.g., 2024-01-01)"),
            end_date: z.string().optional().describe("End date in ISO format")
        }
    }, async ({ type = "ALL", limit = 50, start_date, end_date }) => {
        try {
            const transactionsCol = getTransactionsCollection();
            // Build query
            const query = {};
            if (type !== "ALL") {
                query.type = type;
            }
            if (start_date || end_date) {
                query.timestamp = {};
                if (start_date) {
                    query.timestamp.$gte = new Date(start_date);
                }
                if (end_date) {
                    query.timestamp.$lte = new Date(end_date);
                }
            }
            const transactions = await transactionsCol
                .find(query)
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            count: transactions.length,
                            transactions: transactions
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error fetching transactions: ${error instanceof Error ? error.message : String(error)}`
                    }]
            };
        }
    });
    // Buy Stock Tool
    server.registerTool("buy_stock", {
        title: "Buy Stock",
        description: "Purchase shares of a stock. Updates positions and records transaction in database.",
        inputSchema: {
            symbol: z.string().describe("Stock symbol to buy (e.g., AAPL, TSLA)"),
            shares: z.number().positive().describe("Number of shares to buy"),
            price: z.number().positive().describe("Price per share")
        }
    }, async ({ symbol, shares, price }) => {
        try {
            const totalCost = shares * price;
            // Check wallet balance
            const wallet = await getWallet();
            if (wallet.buying_power < totalCost) {
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: "Insufficient buying power",
                                required: totalCost,
                                available: wallet.buying_power
                            }, null, 2)
                        }]
                };
            }
            // Update or create position
            const positionsCol = getPositionsCollection();
            const existingPosition = await positionsCol.findOne({ symbol: symbol.toUpperCase() });
            if (existingPosition) {
                // Update existing position
                const newShares = existingPosition.shares + shares;
                const newAvgCost = ((existingPosition.avg_cost * existingPosition.shares) + (price * shares)) / newShares;
                await positionsCol.updateOne({ symbol: symbol.toUpperCase() }, {
                    $set: {
                        shares: newShares,
                        avg_cost: newAvgCost,
                        updated_at: new Date()
                    }
                });
            }
            else {
                // Create new position
                await positionsCol.insertOne({
                    symbol: symbol.toUpperCase(),
                    shares,
                    avg_cost: price,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
            // Record transaction
            const transactionsCol = getTransactionsCollection();
            const transaction = {
                type: 'BUY',
                symbol: symbol.toUpperCase(),
                shares,
                price,
                amount: totalCost,
                timestamp: new Date(),
                status: 'completed'
            };
            await transactionsCol.insertOne(transaction);
            // Update wallet
            await updateWallet(wallet.balance - totalCost, wallet.buying_power - totalCost);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Successfully bought ${shares} shares of ${symbol.toUpperCase()} at $${price} per share`,
                            transaction: {
                                symbol: symbol.toUpperCase(),
                                shares,
                                price,
                                total_cost: totalCost,
                                timestamp: transaction.timestamp
                            },
                            new_balance: wallet.balance - totalCost,
                            new_buying_power: wallet.buying_power - totalCost
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error buying stock: ${error instanceof Error ? error.message : String(error)}`
                    }]
            };
        }
    });
    // Sell Stock Tool
    server.registerTool("sell_stock", {
        title: "Sell Stock",
        description: "Sell shares of a stock. Updates positions and records transaction in database.",
        inputSchema: {
            symbol: z.string().describe("Stock symbol to sell (e.g., AAPL, TSLA)"),
            shares: z.number().positive().describe("Number of shares to sell"),
            price: z.number().positive().describe("Price per share")
        }
    }, async ({ symbol, shares, price }) => {
        try {
            const positionsCol = getPositionsCollection();
            const position = await positionsCol.findOne({ symbol: symbol.toUpperCase() });
            if (!position) {
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: `No position found for ${symbol.toUpperCase()}`
                            }, null, 2)
                        }]
                };
            }
            if (position.shares < shares) {
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                success: false,
                                error: "Insufficient shares",
                                requested: shares,
                                available: position.shares
                            }, null, 2)
                        }]
                };
            }
            const totalProceeds = shares * price;
            const costBasis = shares * position.avg_cost;
            const profitLoss = totalProceeds - costBasis;
            // Update position
            if (position.shares === shares) {
                // Selling all shares, remove position
                await positionsCol.deleteOne({ symbol: symbol.toUpperCase() });
            }
            else {
                // Partial sell
                await positionsCol.updateOne({ symbol: symbol.toUpperCase() }, {
                    $set: {
                        shares: position.shares - shares,
                        updated_at: new Date()
                    }
                });
            }
            // Record transaction
            const transactionsCol = getTransactionsCollection();
            const transaction = {
                type: 'SELL',
                symbol: symbol.toUpperCase(),
                shares,
                price,
                amount: totalProceeds,
                timestamp: new Date(),
                status: 'completed'
            };
            await transactionsCol.insertOne(transaction);
            // Update wallet
            const wallet = await getWallet();
            await updateWallet(wallet.balance + totalProceeds, wallet.buying_power + totalProceeds);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Successfully sold ${shares} shares of ${symbol.toUpperCase()} at $${price} per share`,
                            transaction: {
                                symbol: symbol.toUpperCase(),
                                shares,
                                price,
                                total_proceeds: totalProceeds,
                                cost_basis: costBasis,
                                profit_loss: profitLoss,
                                profit_loss_percent: ((profitLoss / costBasis) * 100).toFixed(2),
                                timestamp: transaction.timestamp
                            },
                            new_balance: wallet.balance + totalProceeds,
                            new_buying_power: wallet.buying_power + totalProceeds,
                            remaining_shares: position.shares === shares ? 0 : position.shares - shares
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error selling stock: ${error instanceof Error ? error.message : String(error)}`
                    }]
            };
        }
    });
    // Add Money to Wallet Tool
    server.registerTool("add_money_to_wallet", {
        title: "Add Money to Wallet",
        description: "Deposit funds into your trading account to increase buying power",
        inputSchema: {
            amount: z.number().positive().describe("Amount to deposit")
        }
    }, async ({ amount }) => {
        try {
            const wallet = await getWallet();
            // Update wallet
            await updateWallet(wallet.balance + amount, wallet.buying_power + amount);
            // Record transaction
            const transactionsCol = getTransactionsCollection();
            const transaction = {
                type: 'DEPOSIT',
                amount,
                timestamp: new Date(),
                status: 'completed'
            };
            await transactionsCol.insertOne(transaction);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `Successfully deposited $${amount.toFixed(2)}`,
                            transaction: {
                                amount,
                                timestamp: transaction.timestamp
                            },
                            previous_balance: wallet.balance,
                            new_balance: wallet.balance + amount,
                            new_buying_power: wallet.buying_power + amount
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: `Error adding money to wallet: ${error instanceof Error ? error.message : String(error)}`
                    }]
            };
        }
    });
    // Profit & Loss Analysis Tool
    // server.registerTool(
    //   "analyze_pnl",
    //   {
    //     title: "P&L Analysis",
    //     description: "Analyze portfolio profit and loss over specified time periods",
    //     inputSchema: {
    //       period: z.enum(["1D", "1W", "1M", "3M", "6M", "1Y", "YTD", "ALL"]).describe("Time period for P&L analysis"),
    //       symbol: z.string().optional().describe("Analyze P&L for specific stock symbol")
    //     }
    //   },
    //   async ({ period, symbol }) => {
    //     try {
    //       const pnlData = await analyzeProfitLoss(period, symbol);
    //       return {
    //         content: [{
    //           type: "text",
    //           text: JSON.stringify(pnlData, null, 2)
    //         }]
    //       };
    //     } catch (error) {
    //       return {
    //         content: [{
    //           type: "text",
    //           text: `Error analyzing P&L: ${error instanceof Error ? error.message : String(error)}`
    //         }]
    //       };
    //     }
    //   }
    // );
    // // Risk Analysis Tool
    // server.registerTool(
    //   "calculate_risk_metrics",
    //   {
    //     title: "Risk Analysis",
    //     description: "Calculate portfolio risk metrics including beta, volatility, and risk-adjusted returns",
    //     inputSchema: {
    //       benchmark: z.string().optional().describe("Benchmark symbol for comparison (default: SPY)"),
    //       risk_free_rate: z.number().optional().describe("Risk-free rate for calculations (default: 0.05)")
    //     }
    //   },
    //   async ({ benchmark = "SPY", risk_free_rate = 0.05 }) => {
    //     try {
    //       const riskMetrics = await calculateRiskMetrics(benchmark, risk_free_rate);
    //       return {
    //         content: [{
    //           type: "text",
    //           text: JSON.stringify(riskMetrics, null, 2)
    //         }]
    //       };
    //     } catch (error) {
    //       return {
    //         content: [{
    //           type: "text",
    //           text: `Error calculating risk metrics: ${error instanceof Error ? error.message : String(error)}`
    //         }]
    //       };
    //     }
    //   }
    // );
    // // Stock Analysis & Recommendation Tool
    // server.registerTool(
    //   "analyze_stock",
    //   {
    //     title: "Stock Analysis",
    //     description: "Analyze individual stocks and provide buy/sell recommendations",
    //     inputSchema: {
    //       symbol: z.string().describe("Stock symbol to analyze"),
    //       analysis_type: z.enum(["technical", "fundamental", "both"]).describe("Type of analysis to perform")
    //     }
    //   },
    //   async ({ symbol, analysis_type }) => {
    //     try {
    //       const stockAnalysis = await analyzeStock(symbol, analysis_type);
    //       return {
    //         content: [{
    //           type: "text",
    //           text: JSON.stringify(stockAnalysis, null, 2)
    //         }]
    //       };
    //     } catch (error) {
    //       return {
    //         content: [{
    //           type: "text",
    //           text: `Error analyzing stock: ${error instanceof Error ? error.message : String(error)}`
    //         }]
    //       };
    //     }
    //   }
    // );
    // // Portfolio Optimization Tool
    // server.registerTool(
    //   "suggest_trades",
    //   {
    //     title: "Trade Suggestions",
    //     description: "Generate buy/sell recommendations based on portfolio analysis and market conditions",
    //     inputSchema: {
    //       risk_tolerance: z.enum(["conservative", "moderate", "aggressive"]).describe("Risk tolerance level"),
    //       investment_goal: z.enum(["growth", "income", "balanced"]).describe("Investment objective"),
    //       max_suggestions: z.number().optional().describe("Maximum number of trade suggestions")
    //     }
    //   },
    //   async ({ risk_tolerance, investment_goal, max_suggestions = 5 }) => {
    //     try {
    //       const tradeSuggestions = await generateTradeSuggestions(risk_tolerance, investment_goal, max_suggestions);
    //       return {
    //         content: [{
    //           type: "text",
    //           text: JSON.stringify(tradeSuggestions, null, 2)
    //         }]
    //       };
    //     } catch (error) {
    //       return {
    //         content: [{
    //           type: "text",
    //           text: `Error generating trade suggestions: ${error instanceof Error ? error.message : String(error)}`
    //         }]
    //       };
    //     }
    //   }
    // );
    // // Market Data Tool
    // server.registerTool(
    //   "get_market_data",
    //   {
    //     title: "Market Data",
    //     description: "Get real-time market data and quotes for stocks",
    //     inputSchema: {
    //       symbols: z.array(z.string()).describe("Array of stock symbols to get quotes for"),
    //       include_fundamentals: z.boolean().optional().describe("Include fundamental data")
    //     }
    //   },
    //   async ({ symbols, include_fundamentals = false }) => {
    //     try {
    //       const marketData = await getMarketData(symbols, include_fundamentals);
    //       return {
    //         content: [{
    //           type: "text",
    //           text: JSON.stringify(marketData, null, 2)
    //         }]
    //       };
    //     } catch (error) {
    //       return {
    //         content: [{
    //           type: "text",
    //           text: `Error fetching market data: ${error instanceof Error ? error.message : String(error)}`
    //         }]
    //       };
    //     }
    //   }
    // );
}
// Helper functions for portfolio data from MongoDB
async function getPortfolioData(includePositions, includePerformance) {
    const wallet = await getWallet();
    const positionsCol = getPositionsCollection();
    const transactionsCol = getTransactionsCollection();
    let totalValue = wallet.balance;
    let positionsData = null;
    if (includePositions) {
        const positions = await positionsCol.find({}).toArray();
        // Calculate current market value and P&L for each position
        // In production, you would fetch current prices from a real-time API
        positionsData = await Promise.all(positions.map(async (pos) => {
            // Mock current price (in production, fetch from market data API)
            const currentPrice = pos.avg_cost * (1 + (Math.random() - 0.4) * 0.3);
            const marketValue = pos.shares * currentPrice;
            const unrealizedPnl = (currentPrice - pos.avg_cost) * pos.shares;
            const unrealizedPnlPercent = ((currentPrice - pos.avg_cost) / pos.avg_cost) * 100;
            totalValue += marketValue;
            return {
                symbol: pos.symbol,
                shares: pos.shares,
                avg_cost: pos.avg_cost,
                current_price: currentPrice,
                market_value: marketValue,
                unrealized_pnl: unrealizedPnl,
                unrealized_pnl_percent: unrealizedPnlPercent
            };
        }));
    }
    else {
        // Still need to calculate total value for portfolio summary
        const positions = await positionsCol.find({}).toArray();
        for (const pos of positions) {
            const currentPrice = pos.avg_cost * (1 + (Math.random() - 0.4) * 0.3);
            totalValue += pos.shares * currentPrice;
        }
    }
    // Calculate performance metrics
    let performanceData = null;
    if (includePerformance) {
        const allTransactions = await transactionsCol.find({}).sort({ timestamp: 1 }).toArray();
        // Calculate total deposits
        const totalDeposits = allTransactions
            .filter(t => t.type === 'DEPOSIT')
            .reduce((sum, t) => sum + t.amount, 0);
        // Calculate realized P&L from sell transactions
        const sellTransactions = allTransactions.filter(t => t.type === 'SELL');
        let realizedPnl = 0;
        for (const sell of sellTransactions) {
            // Find corresponding buy transactions to calculate actual P&L
            const buyTransactions = allTransactions.filter(t => t.type === 'BUY' && t.symbol === sell.symbol && t.timestamp < sell.timestamp);
            if (buyTransactions.length > 0) {
                const avgBuyPrice = buyTransactions.reduce((sum, t) => sum + (t.price || 0), 0) / buyTransactions.length;
                realizedPnl += ((sell.price || 0) - avgBuyPrice) * (sell.shares || 0);
            }
        }
        const totalReturn = totalValue - totalDeposits;
        const totalReturnPercent = totalDeposits > 0 ? (totalReturn / totalDeposits) * 100 : 0;
        // Calculate win rate
        const buyCount = allTransactions.filter(t => t.type === 'BUY').length;
        const sellCount = sellTransactions.length;
        performanceData = {
            inception_date: allTransactions[0]?.timestamp?.toISOString() || new Date().toISOString(),
            total_return: totalReturn,
            total_return_percent: totalReturnPercent,
            realized_pnl: realizedPnl,
            total_deposits: totalDeposits,
            total_trades: buyCount + sellCount,
            buy_trades: buyCount,
            sell_trades: sellCount
        };
    }
    return {
        account_value: totalValue,
        balance: wallet.balance,
        buying_power: wallet.buying_power,
        positions: positionsData,
        performance: performanceData,
        last_updated: new Date().toISOString()
    };
}
async function analyzeProfitLoss(period, symbol) {
    // Mock P&L analysis - replace with actual calculations
    return {
        period,
        symbol: symbol || "PORTFOLIO",
        realized_pnl: 1250.75,
        unrealized_pnl: 1499.57,
        total_pnl: 2750.32,
        trades_count: 45,
        winning_trades: 31,
        losing_trades: 14,
        win_rate: 0.689,
        avg_win: 125.30,
        avg_loss: -85.45,
        largest_win: 450.25,
        largest_loss: -225.80,
        profit_factor: 1.85,
        sharpe_ratio: 1.34
    };
}
async function calculateRiskMetrics(benchmark, riskFreeRate) {
    // Mock risk calculations - replace with actual risk analysis
    return {
        portfolio_beta: 1.15,
        portfolio_volatility: 0.18,
        sharpe_ratio: 1.34,
        sortino_ratio: 1.67,
        max_drawdown: -0.12,
        var_95: -0.03,
        correlation_with_benchmark: 0.82,
        tracking_error: 0.06,
        information_ratio: 0.45,
        benchmark,
        risk_free_rate: riskFreeRate,
        analysis_date: new Date().toISOString()
    };
}
async function analyzeStock(symbol, analysisType) {
    // Mock stock analysis - replace with real financial analysis
    return {
        symbol,
        analysis_type: analysisType,
        current_price: 175.50,
        recommendation: "BUY",
        confidence: 0.78,
        target_price: 195.00,
        technical_indicators: {
            rsi: 45.2,
            moving_avg_50: 170.25,
            moving_avg_200: 165.80,
            macd_signal: "BULLISH"
        },
        fundamental_metrics: {
            pe_ratio: 28.5,
            pb_ratio: 5.2,
            debt_to_equity: 0.45,
            roe: 0.185
        },
        analyst_ratings: {
            strong_buy: 8,
            buy: 12,
            hold: 5,
            sell: 2,
            strong_sell: 0
        }
    };
}
async function generateTradeSuggestions(riskTolerance, investmentGoal, maxSuggestions) {
    // Mock trade suggestions - replace with actual analysis
    const suggestions = [
        {
            action: "BUY",
            symbol: "MSFT",
            quantity: 5,
            reason: "Strong fundamentals and technical breakout",
            confidence: 0.85,
            risk_level: "MODERATE"
        },
        {
            action: "SELL",
            symbol: "META",
            quantity: 3,
            reason: "Overvalued based on current metrics",
            confidence: 0.72,
            risk_level: "LOW"
        },
        {
            action: "BUY",
            symbol: "NVDA",
            quantity: 2,
            reason: "AI growth potential and strong earnings",
            confidence: 0.90,
            risk_level: "HIGH"
        }
    ];
    return {
        risk_tolerance: riskTolerance,
        investment_goal: investmentGoal,
        suggestions: suggestions.slice(0, maxSuggestions),
        generated_at: new Date().toISOString()
    };
}
async function getMarketData(symbols, includeFundamentals) {
    // Mock market data - replace with real API calls
    const mockData = symbols.map(symbol => ({
        symbol,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        change_percent: (Math.random() - 0.5) * 0.1,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        market_cap: Math.floor(Math.random() * 1000000000000) + 10000000000,
        fundamentals: includeFundamentals ? {
            pe_ratio: Math.random() * 50 + 10,
            pb_ratio: Math.random() * 10 + 1,
            dividend_yield: Math.random() * 0.05
        } : null
    }));
    return {
        quotes: mockData,
        market_status: "OPEN",
        last_updated: new Date().toISOString()
    };
}
