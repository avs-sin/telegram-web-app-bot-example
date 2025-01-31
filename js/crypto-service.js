class CryptoService {
    static async init() {
        this.prices = {};
        await this.updatePrices();
        // Update prices every minute
        setInterval(() => this.updatePrices(), 60000);
    }

    static async updatePrices() {
        try {
            // Simulated price data for demo purposes
            this.prices = {
                'BTC': 45000 + Math.random() * 1000,
                'ETH': 2800 + Math.random() * 100,
                'TON': 2.5 + Math.random() * 0.2,
                'USDT': 1.0
            };
        } catch (error) {
            console.error('Error updating prices:', error);
        }
    }

    static getPrice(symbol) {
        return this.prices[symbol] || 0;
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }
}