const WalletApp = {
    state: {
        balance: 10000, // Initial balance
        portfolio: {
            positions: {}
        }
    },

    // Initialize the application
    async init() {
        try {
            // Check if Telegram WebApp is available
            if (typeof Telegram === 'undefined' || !Telegram.WebApp) {
                console.error('Telegram WebApp is not available');
                return;
            }

            // Initialize Telegram Web App
            Telegram.WebApp.ready();
            document.body.style.visibility = '';
            Telegram.WebApp.setHeaderColor('secondary_bg_color');

            // Load saved state
            this.loadState();

            // Initialize services
            if (typeof CryptoService !== 'undefined') {
                await CryptoService.init();
            }
            if (typeof PortfolioService !== 'undefined') {
                PortfolioService.init();
            }

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
        } catch (error) {
            console.error('Error initializing WalletApp:', error);
            this.showError('Failed to initialize application');
        }
    },

    // Load saved state from localStorage
    loadState() {
        try {
            const savedState = localStorage.getItem('walletAppState');
            if (savedState) {
                this.state = JSON.parse(savedState);
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    },

    // Save current state to localStorage
    saveState() {
        try {
            localStorage.setItem('walletAppState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    },

    // Get current balance
    getBalance() {
        return this.state.balance;
    },

    // Get portfolio
    getPortfolio() {
        return this.state.portfolio;
    },

    // Update balance
    updateBalance(amount) {
        try {
            this.state.balance += amount;
            if (this.state.balance < 0) {
                this.state.balance = 0;
            }
            this.saveState();
            this.updateUI();
        } catch (error) {
            console.error('Error updating balance:', error);
            this.showError('Failed to update balance');
        }
    },

    // Handle buy overlay close
    handleCloseBuy() {
        try {
            const overlay = document.getElementById('buyOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        } catch (error) {
            console.error('Error closing buy overlay:', error);
        }
    },

    // Handle asset selection
    selectAsset(asset) {
        try {
            document.querySelectorAll('.asset-option').forEach(option => {
                option.classList.remove('active');
            });
            const selectedOption = document.querySelector(`.asset-option[data-asset="${asset}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
            this.updateBuyPreview();
        } catch (error) {
            console.error('Error selecting asset:', error);
        }
    },

    // Update buy preview
    updateBuyPreview() {
        try {
            const amount = parseFloat(document.getElementById('buyAmount')?.value) || 0;
            const totalCostElement = document.getElementById('totalCost');
            if (totalCostElement) {
                totalCostElement.textContent = `$${amount.toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error updating buy preview:', error);
        }
    },

    // Set maximum amount
    setMaxAmount() {
        try {
            const balance = this.getBalance();
            const amountInput = document.getElementById('buyAmount');
            if (amountInput) {
                amountInput.value = balance.toFixed(2);
                this.updateBuyPreview();
            }
        } catch (error) {
            console.error('Error setting max amount:', error);
        }
    },

    // Execute buy
    executeBuy() {
        try {
            const amount = parseFloat(document.getElementById('buyAmount')?.value) || 0;
            if (amount <= 0) {
                this.showError('Please enter a valid amount');
                return;
            }
            if (amount > this.getBalance()) {
                this.showError('Insufficient balance');
                return;
            }

            // Process the buy
            this.updateBalance(-amount);
            this.handleCloseBuy();
            this.showSuccess('Purchase successful!');
        } catch (error) {
            console.error('Error executing buy:', error);
            this.showError('Failed to complete purchase');
        }
    },

    // Show error message
    showError(message) {
        if (Telegram.WebApp) {
            Telegram.WebApp.showAlert(message);
        } else {
            alert(message);
        }
    },

    // Show success message
    showSuccess(message) {
        if (Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Success',
                message: message,
                buttons: [{type: 'ok'}]
            });
        } else {
            alert(message);
        }
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

    init: function() {
        console.log('WalletApp initialized');
        this.portfolio = {
            positions: {}
        };
    },

    getBalance: function() {
        return 10000.00;
    },

    getPortfolio: function() {
        return this.portfolio.positions;
    },

    updateBalance: function(amount) {
        console.log(`Balance updated: ${amount}`);
    },

    updatePortfolio: function(asset, amount) {
        if (!this.portfolio.positions[asset]) {
            this.portfolio.positions[asset] = { amount: 0 };
        }
        this.portfolio.positions[asset].amount += amount;
        console.log(`Updated ${asset} portfolio: ${this.portfolio.positions[asset].amount}`);
    }
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    WalletApp.init();
});