/**
 * Debug script to monitor and prevent unwanted redirects
 */

// Track page navigation
(function() {
    console.log("🔍 Redirect debug initialized");
    console.log("Current page:", window.location.pathname);
    
    // Monitor history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        console.log("Navigation pushState to:", arguments[2]);
        return originalPushState.apply(this, arguments);
    };
    
    history.replaceState = function() {
        console.log("Navigation replaceState to:", arguments[2]);
        return originalReplaceState.apply(this, arguments);
    };
    
    // Monitor location changes
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    
    window.location.assign = function(url) {
        console.log("Location.assign to:", url);
        return originalAssign.call(this, url);
    };
    
    window.location.replace = function(url) {
        console.log("Location.replace to:", url);
        return originalReplace.call(this, url);
    };
    
    // Detect when someone tries to set location.href directly
    let href = window.location.href;
    Object.defineProperty(window.location, 'href', {
        get: function() { return href; },
        set: function(value) {
            console.log("Location.href changing to:", value);
            href = value;
            window.location.assign(value);
        }
    });
    
    // Monitor auth token
    setInterval(function() {
        const token = localStorage.getItem('token');
        console.log("Auth token present:", !!token);
    }, 5000);
})();
