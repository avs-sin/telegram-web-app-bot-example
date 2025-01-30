// Demo Data Service for Investor Presentation
const DemoDataService = {
    // Sample market data with realistic price movements
    marketData: {
        'the-open-network': {
            basePrice: 2.45,
            volatility: 0.02,
            trend: 0.001,
            volume24h: 15000000,
            marketCap: 8500000000
        },
        'bitcoin': {
            basePrice: 43500,
            volatility: 0.015,
            trend: 0.0005,
            volume24h: 28000000000,
            marketCap: 850000000000
        }
    },

    // Get current price with realistic movements
    getCurrentPrice(coinId) {
        const data = this.marketData[coinId];
        if (!data) return null;

        const time = Date.now() / 1000;
        const noise = Math.sin(time) * data.volatility;
        const trend = Math.sin(time / 3600) * data.trend;
        
        return {
            price: data.basePrice * (1 + noise + trend),
            change24h: (noise + trend) * 100,
            volume24h: data.volume24h,
            marketCap: data.marketCap
        };
    },

    // Generate realistic trading volume
    generateTradeVolume() {
        return Math.floor(Math.random() * 1000000) + 500000;
    },

    // Generate sample transaction history
    getTransactionHistory() {
        const types = ['buy', 'sell'];
        const coins = ['TON', 'BTC'];
        const history = [];

        for (let i = 0; i < 10; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const coin = coins[Math.floor(Math.random() * coins.length)];
            const amount = (Math.random() * 100).toFixed(2);
            const price = coin === 'TON' ? 2.45 : 43500;

            history.push({
                type,
                coin,
                amount: parseFloat(amount),
                price,
                timestamp: Date.now() - (i * 3600000)
            });
        }

        return history;
    },

    // Initialize demo portfolio
    initDemoPortfolio() {
        return {
            balance: 10000,
            positions: {
                'the-open-network': {
                    amount: 1000,
                    averagePrice: 2.35
                },
                'bitcoin': {
                    amount: 0.05,
                    averagePrice: 42000
                }
            }
        };
    }
};