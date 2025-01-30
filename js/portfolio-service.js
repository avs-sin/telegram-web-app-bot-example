// PortfolioService handles user portfolio and transactions
const PortfolioService = {
    // Portfolio data structure
    portfolio: {
        balance: 10000, // Starting balance in USD
        positions: {}, // Coin positions
        transactions: [], // Transaction history
    },
    
    // Initialize the service
    init() {
        // Load saved portfolio data
        const savedData = localStorage.getItem('portfolio');
        if (savedData) {
            this.portfolio = JSON.parse(savedData);
        }
        
        // Listen for price updates to update portfolio value
        window.addEventListener('crypto-price-update', (event) => {
            this.updatePortfolioValue(event.detail);
        });
    },
    
    // Save portfolio data
    save() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    },
    
    // Get current portfolio summary
    getPortfolioSummary() {
        return {
            balance: this.portfolio.balance,
            positions: this.portfolio.positions,
            totalValue: this.calculateTotalValue()
        };
    },
    
    // Calculate total portfolio value
    calculateTotalValue() {
        let total = this.portfolio.balance;
        
        for (const [coinId, position] of Object.entries(this.portfolio.positions)) {
            const priceData = window.CryptoService.getPrice(coinId);
            if (priceData) {
                total += position.amount * priceData.price;
            }
        }
        
        return total;
    },
    
    // Execute a trade
    async executeTrade(tradeParams) {
        const {
            coinId,
            type, // 'buy' or 'sell'
            amount,
            price
        } = tradeParams;
        
        const totalCost = amount * price;
        
        // Validate trade
        if (!this.validateTrade(type, totalCost, coinId, amount)) {
            throw new Error('Invalid trade parameters');
        }
        
        // Execute trade
        if (type === 'buy') {
            // Deduct balance
            this.portfolio.balance -= totalCost;
            
            // Add to position
            if (!this.portfolio.positions[coinId]) {
                this.portfolio.positions[coinId] = {
                    amount: 0,
                    averagePrice: 0
                };
            }
            
            const position = this.portfolio.positions[coinId];
            const totalValue = (position.amount * position.averagePrice) + totalCost;
            const totalAmount = position.amount + amount;
            position.averagePrice = totalValue / totalAmount;
            position.amount = totalAmount;
            
        } else { // sell
            // Add to balance
            this.portfolio.balance += totalCost;
            
            // Reduce position
            const position = this.portfolio.positions[coinId];
            position.amount -= amount;
            
            // Remove position if amount is 0
            if (position.amount === 0) {
                delete this.portfolio.positions[coinId];
            }
        }
        
        // Record transaction
        const transaction = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type,
            coinId,
            amount,
            price,
            totalCost,
            status: 'completed'
        };
        
        this.portfolio.transactions.push(transaction);
        
        // Save changes
        this.save();
        
        // Return transaction record
        return transaction;
    },
    
    // Validate trade parameters
    validateTrade(type, totalCost, coinId, amount) {
        if (type === 'buy') {
            // Check if user has enough balance
            return this.portfolio.balance >= totalCost;
        } else {
            // Check if user has enough coins to sell
            const position = this.portfolio.positions[coinId];
            return position && position.amount >= amount;
        }
    },
    
    // Get transaction history
    getTransactionHistory(filters = {}) {
        let transactions = [...this.portfolio.transactions];
        
        // Apply filters
        if (filters.coinId) {
            transactions = transactions.filter(t => t.coinId === filters.coinId);
        }
        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters.startDate) {
            transactions = transactions.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            transactions = transactions.filter(t => new Date(t.timestamp) <= new Date(filters.endDate));
        }
        
        // Sort by timestamp descending
        return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    
    // Get position for a specific coin
    getPosition(coinId) {
        return this.portfolio.positions[coinId] || null;
    },
    
    // Update portfolio value when prices change
    updatePortfolioValue(priceData) {
        // Calculate new total value
        const totalValue = this.calculateTotalValue();
        
        // Dispatch portfolio update event
        const event = new CustomEvent('portfolio-update', {
            detail: {
                totalValue,
                balance: this.portfolio.balance,
                positions: this.portfolio.positions
            }
        });
        window.dispatchEvent(event);
    },
    
    // Get portfolio performance metrics
    getPerformanceMetrics() {
        const transactions = this.portfolio.transactions;
        const positions = this.portfolio.positions;
        
        return {
            totalValue: this.calculateTotalValue(),
            balance: this.portfolio.balance,
            totalProfitLoss: this.calculateTotalProfitLoss(),
            positions: Object.entries(positions).map(([coinId, position]) => {
                const priceData = window.CryptoService.getPrice(coinId);
                const currentValue = priceData ? position.amount * priceData.price : 0;
                const costBasis = position.amount * position.averagePrice;
                
                return {
                    coinId,
                    amount: position.amount,
                    averagePrice: position.averagePrice,
                    currentValue,
                    profitLoss: currentValue - costBasis,
                    profitLossPercentage: ((currentValue - costBasis) / costBasis) * 100
                };
            })
        };
    },
    
    // Calculate total profit/loss
    calculateTotalProfitLoss() {
        let totalPL = 0;
        
        for (const [coinId, position] of Object.entries(this.portfolio.positions)) {
            const priceData = window.CryptoService.getPrice(coinId);
            if (priceData) {
                const currentValue = position.amount * priceData.price;
                const costBasis = position.amount * position.averagePrice;
                totalPL += currentValue - costBasis;
            }
        }
        
        return totalPL;
    }
};

// Export for use in other files
window.PortfolioService = PortfolioService; 