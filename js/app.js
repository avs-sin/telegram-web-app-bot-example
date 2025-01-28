const WalletApp = {
    state: {
        currentBalance: 250,
        tonBalance: 100,
        transactions: [],
    },

    init() {
        // Initialize Telegram Web App
        Telegram.WebApp.ready();
        document.body.style.visibility = '';
        Telegram.WebApp.setHeaderColor('secondary_bg_color');

        // Setup back button if not on main page
        if (!this.isMainPage()) {
            Telegram.WebApp.BackButton.show();
            Telegram.WebApp.BackButton.onClick(() => {
                this.navigateBack();
            });
        } else {
            Telegram.WebApp.BackButton.hide();
        }

        // Load saved state
        this.loadState();
    },

    isMainPage() {
        return window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    },

    navigateBack() {
        // Check if there's a saved previous page
        const previousPage = sessionStorage.getItem('previousPage');
        if (previousPage) {
            window.location.href = previousPage;
        } else {
            window.location.href = 'index.html';
        }
    },

    navigateTo(page) {
        // Save current page as previous page
        sessionStorage.setItem('previousPage', window.location.pathname);
        window.location.href = page;
    },

    saveState() {
        localStorage.setItem('walletAppState', JSON.stringify(this.state));
    },

    loadState() {
        const savedState = localStorage.getItem('walletAppState');
        if (savedState) {
            this.state = JSON.parse(savedState);
        }
    },

    // Action handlers
    handleSend() {
        Telegram.WebApp.showPopup({
            title: 'Send Funds',
            message: 'Choose recipient and amount',
            buttons: [
                {id: 'contact', type: 'default', text: 'Choose Contact'},
                {type: 'cancel'}
            ]
        });
    },

    handleReceive() {
        Telegram.WebApp.showPopup({
            title: 'Receive Funds',
            message: 'Share your wallet address',
            buttons: [
                {id: 'share', type: 'default', text: 'Share Address'},
                {type: 'cancel'}
            ]
        });
    },

    handleExchange() {
        Telegram.WebApp.showPopup({
            title: 'Exchange',
            message: 'Convert between currencies',
            buttons: [
                {id: 'exchange', type: 'default', text: 'Exchange Now'},
                {type: 'cancel'}
            ]
        });
    },

    handleSell() {
        Telegram.WebApp.showPopup({
            title: 'Sell',
            message: 'Sell your crypto for cash',
            buttons: [
                {id: 'sell', type: 'default', text: 'Sell Now'},
                {type: 'cancel'}
            ]
        });
    },

    // Market specific handlers
    handleBuy() {
        this.navigateTo('market.html');
    },

    handleCreateAd() {
        Telegram.WebApp.showPopup({
            title: 'Create Advertisement',
            message: 'What type of ad would you like to create?',
            buttons: [
                {id: 'buy', type: 'default', text: 'Buy Ad'},
                {id: 'sell', type: 'default', text: 'Sell Ad'},
                {type: 'cancel'}
            ]
        });
    },

    // Transaction specific methods
    getTransaction(id) {
        return this.state.transactions.find(t => t.id === id);
    },

    formatBalance(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    handleAssetClick(symbol) {
        // Get the coin data
        const coinData = this.getCoinData(symbol);
        if (coinData) {
            // Store the selected coin data in localStorage (more reliable than sessionStorage)
            localStorage.setItem('selectedCoin', JSON.stringify(coinData));
            // Navigate to coin detail page
            window.location.href = 'coin-detail.html';
        }
    },

    getCoinData(symbol) {
        // Static data for demo
        const coins = {
            'BTC': {
                name: 'Bitcoin',
                symbol: 'BTC',
                price: 101099.33,
                change: -1.68,
                changeAmount: -1724.63,
                stats: {
                    weekHigh: 109100.29,
                    weekLow: 41806.04,
                    volume: '29.43B',
                    marketCap: '1.99T'
                }
            }
        };
        return coins[symbol];
    }
}; 