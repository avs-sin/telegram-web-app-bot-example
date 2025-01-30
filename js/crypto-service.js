const CryptoService = {
    SUPPORTED_COINS: ['the-open-network', 'bitcoin'],
    prices: {},
    lastUpdate: 0,
    updateInterval: 5000,

    async init() {
        // Initialize with demo data
        this.updatePrices();
        
        // Set up periodic updates
        setInterval(() => this.updatePrices(), this.updateInterval);
    },

    updatePrices() {
        this.SUPPORTED_COINS.forEach(coinId => {
            this.prices[coinId] = DemoDataService.getCurrentPrice(coinId);
        });

        this.lastUpdate = Date.now();
        
        // Dispatch price update event
        window.dispatchEvent(new CustomEvent('crypto-price-update', {
            detail: this.prices
        }));
    },

    getPrice(coinId) {
        return this.prices[coinId] || null;
    }
};

// Export for use in other files
window.CryptoService = CryptoService;