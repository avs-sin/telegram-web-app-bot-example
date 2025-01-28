const CoinDetail = {
    init() {
        // Make sure WalletApp is initialized first
        if (WalletApp) {
            this.loadCoinData();
            this.setupEventListeners();
            this.updatePriceData();
            // Show the page after everything is loaded
            document.body.style.visibility = '';
        }
    },

    loadCoinData() {
        const coinData = localStorage.getItem('selectedCoin');
        if (coinData) {
            try {
                const coin = JSON.parse(coinData);
                this.updateUI(coin);
            } catch (e) {
                console.error('Error loading coin data:', e);
                // Redirect back to main page if there's an error
                window.location.href = 'index.html';
            }
        } else {
            // No coin data found, go back to main page
            window.location.href = 'index.html';
        }
    },

    updateUI(coin) {
        // Update page title
        document.querySelector('h1').textContent = coin.name;
        
        // Update price and change
        const priceElement = document.querySelector('.coin-price');
        const changeElement = document.querySelector('.price-change');
        
        priceElement.textContent = `$${coin.price.toLocaleString()}`;
        priceElement.dataset.price = coin.price;
        
        const changePrefix = coin.change >= 0 ? '▲' : '▼';
        changeElement.textContent = `${changePrefix} $${Math.abs(coin.changeAmount).toLocaleString()} (${Math.abs(coin.change)}%) Today`;
        changeElement.className = `price-change ${coin.change >= 0 ? 'positive' : 'negative'}`;

        // Update stats
        document.querySelector('.stat-value:nth-child(1)').textContent = `$${coin.stats.weekHigh.toLocaleString()}`;
        document.querySelector('.stat-value:nth-child(2)').textContent = `$${coin.stats.weekLow.toLocaleString()}`;
        document.querySelector('.stat-value:nth-child(3)').textContent = `$${coin.stats.volume}`;
        document.querySelector('.stat-value:nth-child(4)').textContent = `$${coin.stats.marketCap}`;
    },

    setupEventListeners() {
        document.querySelector('.back-button')?.addEventListener('click', () => {
            window.history.back();
        });

        const buyButton = document.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                WalletApp.handleBuy();
            });
        }
    },

    updatePriceData() {
        // In a real app, this would fetch live price data
        const priceElement = document.querySelector('.coin-price');
        const changeElement = document.querySelector('.price-change');
        
        if (priceElement && changeElement) {
            // Simulate live price updates
            setInterval(() => {
                const currentPrice = parseFloat(priceElement.dataset.price);
                const newPrice = currentPrice + (Math.random() - 0.5) * 10;
                const change = ((newPrice - currentPrice) / currentPrice) * 100;
                
                priceElement.textContent = `$${newPrice.toFixed(2)}`;
                priceElement.dataset.price = newPrice;
                
                changeElement.textContent = `${change > 0 ? '▲' : '▼'} $${Math.abs(change).toFixed(2)} (${Math.abs(change).toFixed(2)}%) Today`;
                changeElement.className = `price-change ${change > 0 ? 'positive' : 'negative'}`;
            }, 5000);
        }
    }
}; 