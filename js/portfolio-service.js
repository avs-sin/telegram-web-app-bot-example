class PortfolioService {
    static init() {
        this.portfolio = JSON.parse(localStorage.getItem('portfolio')) || {
            positions: {},
            balance: 10000
        };
    }

    static getPortfolio() {
        return this.portfolio;
    }

    static updatePosition(asset, amount) {
        if (!this.portfolio.positions[asset]) {
            this.portfolio.positions[asset] = 0;
        }
        this.portfolio.positions[asset] += amount;
        if (this.portfolio.positions[asset] <= 0) {
            delete this.portfolio.positions[asset];
        }
        this.savePortfolio();
    }

    static getPreviewTrade(asset, amount, type) {
        const price = CryptoService.getPrice(asset);
        const totalValue = price * amount;
        const fee = totalValue * 0.001; // 0.1% trading fee

        return {
            asset,
            amount,
            type,
            price,
            totalValue,
            fee,
            finalValue: type === 'buy' ? totalValue + fee : totalValue - fee
        };
    }

    static savePortfolio() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    }

    static getPortfolioValue() {
        return Object.entries(this.portfolio.positions).reduce((total, [asset, amount]) => {
            return total + (amount * CryptoService.getPrice(asset));
        }, this.portfolio.balance);
    }
}