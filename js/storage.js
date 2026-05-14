// KEVRA Storage System
window.KevraStorage = {
    get: function(key, defaultVal) {
        try {
            var val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultVal;
        } catch(e) { return defaultVal; }
    },
    set: function(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }
};
