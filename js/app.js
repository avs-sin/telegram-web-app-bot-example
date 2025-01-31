const WalletApp = {
    // Initialize the application
    async init() {
        // Initialize Telegram Web App
        Telegram.WebApp.ready();
        document.body.style.visibility = '';
        Telegram.WebApp.setHeaderColor('secondary_bg_color');

        // Initialize services
        await CryptoService.init();
        PortfolioService.init();

        // Setup back button if not on main page
        if (!this.isMainPage()) {
            Telegram.WebApp.BackButton.show();
            Telegram.WebApp.BackButton.onClick(() => {
                this.navigateBack();
            });
        } else {
            Telegram.WebApp.BackButton.hide();
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Initial UI update
        this.updateUI();

        // Initialize app
        this.portfolio = JSON.parse(localStorage.getItem('portfolio')) || {
            positions: {}
        };
        this.balance = parseFloat(localStorage.getItem('balance')) || 10000;
    },

    // Set up event listeners
    setupEventListeners() {
        // Listen for price updates
        window.addEventListener('crypto-price-update', (event) => {
            this.updatePriceDisplays(event.detail);
        });

        // Listen for portfolio updates
        window.addEventListener('portfolio-update', (event) => {
            this.updatePortfolioDisplays(event.detail);
        });

        // Add click handlers to all asset cards
        document.querySelectorAll('.asset-card').forEach(card => {
            card.addEventListener('click', () => {
                const symbol = card.dataset.symbol;
                this.handleAssetClick(symbol);
            });
        });

        // Add handlers for trade buttons
        document.querySelectorAll('.trade-type').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                this.setTradeType(type);
            });
        });

        // Add handler for trade amount input
        const tradeAmountInput = document.getElementById('tradeAmount');
        if (tradeAmountInput) {
            tradeAmountInput.addEventListener('input', () => {
                this.updateTradePreview();
            });
        }

        // Add handlers for quick amount buttons
        document.querySelectorAll('.quick-amount-selector button').forEach(button => {
            button.addEventListener('click', () => {
                const percent = parseInt(button.dataset.percent);
                this.setAmountPercentage(percent);
            });
        });
    },

    // Update all price displays
    updatePriceDisplays(priceData) {
        // Update TON price display
        const tonPriceElement = document.querySelector('.ton-price');
        if (tonPriceElement) {
            const tonData = priceData['the-open-network'];
            if (tonData) {
                const isPositive = tonData.change24h > 0;
                tonPriceElement.innerHTML = `
                    <div class="price-main">TON/USD $${Number(tonData.price).toFixed(2)}</div>
                    <div class="price-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '▲' : '▼'}${Math.abs(tonData.change24h).toFixed(2)}%
                    </div>
                `;
                tonPriceElement.classList.add('price-update');
                setTimeout(() => tonPriceElement.classList.remove('price-update'), 500);
            }
        }

        // Update BTC price display
        const btcPriceElement = document.querySelector('.btc-price');
        if (btcPriceElement) {
            const btcData = priceData['bitcoin'];
            if (btcData) {
                const isPositive = btcData.change24h > 0;
                btcPriceElement.innerHTML = `
                    <div class="price-main">BTC/USD $${(Number(btcData.price) / 1000).toFixed(1)}k</div>
                    <div class="price-change ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '▲' : '▼'}${Math.abs(btcData.change24h).toFixed(1)}%
                    </div>
                `;
                btcPriceElement.classList.add('price-update');
                setTimeout(() => btcPriceElement.classList.remove('price-update'), 500);
            }
        }

        // Update market stats
        const statsContainer = document.querySelector('.balance-stats');
        if (statsContainer) {
            const tonData = priceData['the-open-network'];
            if (tonData) {
                statsContainer.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-label">24H Volume</div>
                        <div class="stat-value">$${(tonData.volume24h / 1000000).toFixed(2)}M</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">24H High</div>
                        <div class="stat-value">$${(tonData.price * (1 + Math.abs(tonData.change24h) / 100)).toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">24H Low</div>
                        <div class="stat-value">$${(tonData.price * (1 - Math.abs(tonData.change24h) / 100)).toFixed(2)}</div>
                    </div>
                `;
            }
        }
    },

    // Update portfolio displays
    updatePortfolioDisplays(portfolioData) {
        // Update balance display
        const balanceElement = document.querySelector('.header-subtitle');
        if (balanceElement) {
            balanceElement.textContent = `Available Balance: $${portfolioData.balance.toFixed(2)}`;
        }

        // Update portfolio value
        const valueElement = document.querySelector('.portfolio-value');
        if (valueElement) {
            valueElement.textContent = `$${portfolioData.totalValue.toFixed(2)}`;
        }

        // Update positions list
        const positionsList = document.querySelector('.positions-list');
        if (positionsList) {
            positionsList.innerHTML = Object.entries(portfolioData.positions)
                .map(([coinId, position]) => {
                    const priceData = CryptoService.getPrice(coinId);
                    const currentValue = priceData ? position.amount * priceData.price : 0;
                    const profitLoss = currentValue - (position.amount * position.averagePrice);
                    const profitLossPercent = ((profitLoss / (position.amount * position.averagePrice)) * 100);

                    return `
                        <div class="position-item">
                            <div class="position-info">
                                <div class="position-coin">${coinId === 'the-open-network' ? 'TON' : coinId.toUpperCase()}</div>
                                <div class="position-amount">${position.amount.toFixed(4)}</div>
                            </div>
                            <div class="position-value">
                                <div class="current-value">$${currentValue.toFixed(2)}</div>
                                <div class="profit-loss ${profitLoss >= 0 ? 'positive' : 'negative'}">
                                    ${profitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join('');
        }
    },

    // Handle asset click
    handleAssetClick(symbol) {
        // Convert symbol to coinId
        const coinId = symbol.toLowerCase() === 'ton' ? 'the-open-network' : symbol.toLowerCase();
        
        // Get current price and market data
        const priceData = CryptoService.getPrice(coinId);
        if (priceData) {
            // Store selected coin data
            localStorage.setItem('selectedCoin', JSON.stringify({
                symbol,
                coinId,
                price: priceData.price,
                change24h: priceData.change24h
            }));
            
            // Navigate to trading page
            this.navigateTo(`trading.html?coin=${symbol}`);
        }
    },

    // Set trade type (buy/sell)
    setTradeType(type) {
        document.querySelectorAll('.trade-type').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.trade-type[data-type="${type}"]`).classList.add('active');
        
        // Update button text
        const selectedCoin = JSON.parse(localStorage.getItem('selectedCoin'));
        document.querySelector('.execute-trade-button').textContent = 
            `${type.charAt(0).toUpperCase() + type.slice(1)} ${selectedCoin.symbol}`;
        
        this.updateTradePreview();
    },

    // Update trade preview
    updateTradePreview() {
        const selectedCoin = JSON.parse(localStorage.getItem('selectedCoin'));
        const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
        const priceData = CryptoService.getPrice(selectedCoin.coinId);
        
        if (priceData) {
            const totalCost = amount * priceData.price;
            
            document.getElementById('tradePrice').textContent = `$${priceData.price.toFixed(2)}`;
            document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
            
            const portfolioSummary = PortfolioService.getPortfolioSummary();
            document.getElementById('availableBalance').textContent = 
                `$${portfolioSummary.balance.toFixed(2)}`;
        }
    },

    // Set amount as percentage of available balance
    setAmountPercentage(percent) {
        const selectedCoin = JSON.parse(localStorage.getItem('selectedCoin'));
        const priceData = CryptoService.getPrice(selectedCoin.coinId);
        const portfolioSummary = PortfolioService.getPortfolioSummary();
        
        if (priceData) {
            const type = document.querySelector('.trade-type.active').dataset.type;
            
            if (type === 'buy') {
                const maxAmount = (portfolioSummary.balance / priceData.price) * (percent / 100);
                document.getElementById('tradeAmount').value = maxAmount.toFixed(4);
            } else {
                const position = PortfolioService.getPosition(selectedCoin.coinId);
                if (position) {
                    const maxAmount = position.amount * (percent / 100);
                    document.getElementById('tradeAmount').value = maxAmount.toFixed(4);
                }
            }
            
            this.updateTradePreview();
        }
    },

    // Execute trade
    async executeTrade() {
        const selectedCoin = JSON.parse(localStorage.getItem('selectedCoin'));
        const amount = parseFloat(document.getElementById('tradeAmount').value);
        const type = document.querySelector('.trade-type.active').dataset.type;
        const priceData = CryptoService.getPrice(selectedCoin.coinId);
        
        if (!amount || !priceData) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Please enter a valid amount',
                buttons: [{type: 'ok'}]
            });
            return;
        }
        
        try {
            const transaction = await PortfolioService.executeTrade({
                coinId: selectedCoin.coinId,
                type,
                amount,
                price: priceData.price
            });
            
            // Show success message
            Telegram.WebApp.showPopup({
                title: 'Success',
                message: `Successfully ${type} ${amount} ${selectedCoin.symbol}`,
                buttons: [{type: 'ok'}]
            });
            
            // Clear input and update UI
            document.getElementById('tradeAmount').value = '';
            this.updateTradePreview();
            
            // Show trade feedback
            this.showTradeFeedback(transaction);
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: error.message,
                buttons: [{type: 'ok'}]
            });
        }
    },

    // Show trade feedback
    showTradeFeedback(transaction) {
        const feedback = document.getElementById('tradeFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }
    },

    // Navigation methods
    isMainPage() {
        return window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    },

    navigateBack() {
        const previousPage = sessionStorage.getItem('previousPage');
        if (previousPage) {
            window.location.href = previousPage;
        } else {
            window.location.href = 'index.html';
        }
    },

    navigateTo(page) {
        sessionStorage.setItem('previousPage', window.location.pathname);
        window.location.href = page;
    },

    // Initial UI update
    updateUI() {
        const portfolioSummary = PortfolioService.getPortfolioSummary();
        this.updatePortfolioDisplays(portfolioSummary);
        
        const priceData = {};
        for (const coinId of CryptoService.SUPPORTED_COINS) {
            const price = CryptoService.getPrice(coinId);
            if (price) {
                priceData[coinId] = price;
            }
        }
        this.updatePriceDisplays(priceData);
    },

    getBalance() {
        return this.balance;
    },

    getPortfolio() {
        return this.portfolio.positions;
    },

    updateBalance(amount) {
        this.balance += amount;
        localStorage.setItem('balance', this.balance);
    },

    updatePortfolio(asset, amount) {
        if (!this.portfolio.positions[asset]) {
            this.portfolio.positions[asset] = { amount: 0 };
        }
        this.portfolio.positions[asset].amount += amount;
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    }
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    WalletApp.init();
});