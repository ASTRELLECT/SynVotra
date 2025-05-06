/**
 * Authentication Utilities
 * Handles JWT tokens and authentication logic
 */

/**
 * Get the stored authentication token
 * @returns {string|null} The authentication token or null
 */
export function getAuthToken() {
    return localStorage.getItem('access_token') || getTokenFromCookie();
}

/**
 * Get token from cookie
 * @returns {string|null} The token from cookie or null
 */
export function getTokenFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
            return value;
        }
    }
    return null;
}

/**
 * Get the user's role from localStorage
 * @returns {string} The user role or 'employee' as default
 */
export function getUserRole() {
    return localStorage.getItem('user_role') || 'employee';
}

/**
 * Get the user's ID from localStorage
 * @returns {string|null} The user ID or null
 */
export function getUserId() {
    return localStorage.getItem('user_id');
}

/**
 * Check if the user is authenticated
 * @returns {boolean} True if the user has a valid token
 */
export function isAuthenticated() {
    const token = getAuthToken();
    return !!token; // Convert to boolean
}

/**
 * Perform logout by clearing tokens and redirecting
 */
export function logout() {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    
    // Clear cookie
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to landing page
    window.location.href = '/';
}

/**
 * Add authorization header to fetch requests
 * @param {Object} options The fetch options object
 * @returns {Object} The options with authorization header added
 */
export function withAuth(options = {}) {
    const token = getAuthToken();
    if (!token) return options;
    
    if (!options.headers) {
        options.headers = {};
    }
    
    options.headers['Authorization'] = `Bearer ${token}`;
    return options;
}

/**
 * Perform an authenticated fetch request
 * @param {string} url The URL to fetch
 * @param {Object} options The fetch options
 * @returns {Promise} The fetch promise
 */
export async function authFetch(url, options = {}) {
    const authOptions = withAuth(options);
    const response = await fetch(url, authOptions);
    
    // If unauthorized, logout and redirect
    if (response.status === 401) {
        logout();
        throw new Error('Your session has expired. Please login again.');
    }
    
    return response;
}
