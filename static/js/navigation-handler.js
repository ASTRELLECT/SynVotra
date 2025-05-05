/**
 * Navigation handler to manage route transitions and fix navigation issues
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fix navigation links that aren't yet implemented
    fixNavigationLinks();
    
    // Prevent accidental redirects to the landing page
    preventLandingRedirects();
});

/**
 * Fix navigation links in the sidebar that aren't yet implemented
 */
function fixNavigationLinks() {
    // Get all navigation links in the sidebar
    const navLinks = document.querySelectorAll('.sidebar a, .nav-link');
    
    navLinks.forEach(link => {
        // Check if the link leads to a page that doesn't exist yet
        const href = link.getAttribute('href');
        
        if (href && (
            href.endsWith('.html') || 
            href === '/' || 
            href === '#'
        )) {
            // Prevent default navigation for unimplemented pages
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Show a toast notification that the page is under development
                showToast('This feature is currently under development.', 'info');
                
                console.log('Navigation prevented for:', href);
            });
        }
    });
}

/**
 * Prevent accidental redirects to the landing page
 */
function preventLandingRedirects() {
    // Monitor and block any attempts to navigate to the landing page
    // when a user is already authenticated
    const token = localStorage.getItem('token');
    
    if (token) {
        // Use a MutationObserver to watch for link additions to the page
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const links = node.querySelectorAll('a[href="/"]');
                            links.forEach(link => {
                                link.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    console.log('Prevented navigation to landing page');
                                });
                            });
                        }
                    });
                }
            });
        });
        
        // Start observing the document body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    // Check if a toast container exists, if not create one
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.minWidth = '250px';
    toast.style.margin = '10px';
    toast.style.padding = '15px';
    toast.style.backgroundColor = type === 'info' ? '#17a2b8' : '#dc3545';
    toast.style.color = 'white';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 500);
    }, 3000);
}
