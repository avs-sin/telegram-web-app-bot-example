const Navigation = {
    navigateToTradingPage: function(coin) {
        // ... navigation logic ...
    },
    
    returnToMainPage: function() {
        // ... return logic ...
    }
};

const StateManager = {
    saveState: function(key, state) {
        localStorage.setItem(key, JSON.stringify(state));
    },
    
    loadState: function(key) {
        return JSON.parse(localStorage.getItem(key) || '{}');
    }
}; 