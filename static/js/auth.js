// Authentication related functions
document.addEventListener('DOMContentLoaded', function() {
    // Get the login form
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is already logged in
    checkAuthStatus();

    // Setup idle timeout
    setupIdleTimeout();
});

// Function to handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    try {
        // Clear any previous error messages
        errorElement.textContent = '';
        
        // Call the login API endpoint
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Incorrect username or password');
        }
        
        // Handle login success
        handleLoginSuccess(data.token, data.user.role, getDashboardUrl(data.user.role));
        
        // Show success notification
        showToast(`Welcome ${data.user.name}! Login successful.`, 'success');
        
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

// Function to check if user is authenticated
function checkAuthStatus() {
    if (isTokenValid()) {
        const currentPage = window.location.pathname;
        if (currentPage === '/' || currentPage === '/landing') {
            const userRole = localStorage.getItem('userRole');
            const userName = localStorage.getItem('userName');
            // Show welcome back message if user is already logged in
            showToast(`Welcome back ${userName || ''}!`, 'info');
            redirectBasedOnRole(userRole);
        }
    } else {
        // If we're not on the login page, redirect to login
        const currentPage = window.location.pathname;
        if (currentPage !== '/' && currentPage !== '/landing') {
            window.location.href = '/';
        }
    }
}

// Function to handle logout
function logout() {
    // Clear localStorage
    clearAuth();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Redirect to login page
    window.location.href = '/';
    
    // Show toast notification
    showToast('Logged out successfully', 'success');
}

// Function to redirect based on user role
function redirectBasedOnRole(role) {
    const dashboardUrl = getDashboardUrl(role);
    console.log(`Redirecting to ${dashboardUrl}...`);
    window.location.href = dashboardUrl;
}

// Function to get dashboard URL based on user role
function getDashboardUrl(role) {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'manager':
            return '/manager/dashboard';
        case 'employee':
            return '/employee/dashboard';
        default:
            return '/employee/dashboard';
    }
}

// Function to set up auto-logout for inactivity
function setupIdleTimeout() {
    let idleTime = 0;
    const idleInterval = 60000; // 1 minute
    const maxIdleTime = 15; // 15 minutes max idle time
    
    // Reset the idle timer on user activity
    const resetIdleTime = () => {
        idleTime = 0;
    };
    
    // Events that reset the idle timer
    const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, resetIdleTime);
    });
    
    // Check idle time every minute
    setInterval(() => {
        idleTime++;
        
        // If user is authenticated and idle time exceeded
        if (isTokenValid() && idleTime >= maxIdleTime) {
            showToast('You have been logged out due to inactivity.', 'warning');
            logout();
        }
    }, idleInterval);
}

// Toast notification function
function showToast(message, type = 'success') {
    // Create toast if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set toast type and message
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Show toast
    setTimeout(() => toast.classList.add('active'), 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Improve token storage with more robust handling
function storeToken(token) {
    localStorage.setItem('token', token);
    // Set token expiry time (24 hours from now)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    console.log("Token stored successfully");
}

// Enhance token validation
function isTokenValid() {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token) {
        console.log("No token found");
        return false;
    }
    
    if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
        console.log("Token expired");
        clearAuth();
        return false;
    }
    
    return true;
}

// Function to clear auth data
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userRole');
}

// Prevent unauthorized access to protected pages
function protectRoute() {
    if (!isTokenValid()) {
        console.log("Unauthorized access attempt - redirecting to login");
        window.location.href = "/login";
        return false;
    }
    return true;
}

// Handle login success
function handleLoginSuccess(token, userRole, redirectPath) {
    storeToken(token);
    localStorage.setItem('userRole', userRole);
    console.log("Login successful, redirecting to:", redirectPath);
    
    // Use replaceState instead of location.href to avoid creating history entries
    window.location.replace(redirectPath);
}
