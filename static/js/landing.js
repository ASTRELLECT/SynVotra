/**
 * Landing Page JavaScript
 * Handles landing page functionality and login modal
 */

document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const modal = document.getElementById("loginModal");
    const loginBtn = document.getElementById("loginBtn");
    const closeBtn = document.querySelector(".close");
    const loginForm = document.getElementById("loginForm");
    
    // Open modal when login button is clicked
    loginBtn.addEventListener("click", function() {
        modal.style.display = "block";
    });
    
    // Close modal when X is clicked
    closeBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });
    
    // Close modal when clicking outside of it
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    
    // Handle login form submission
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorMsg = document.getElementById("login-error") || createErrorElement();
        
        try {
            const response = await fetch('/astrellect/v1/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Store the token and user info in localStorage
                localStorage.setItem('access_token', data.access_token);
                if (data.user_id) localStorage.setItem('user_id', data.user_id);
                if (data.role) localStorage.setItem('user_role', data.role);
                
                // Also set as cookie for server-side access
                document.cookie = `access_token=${data.access_token}; path=/; max-age=86400`;
                
                // Redirect to dashboard (the server will handle role-based redirection)
                window.location.href = '/dashboard';
                
            } else {
                // Handle login errors
                const error = await response.json();
                errorMsg.textContent = error.detail || 'Invalid username or password';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMsg.textContent = 'An error occurred during login. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
    
    /**
     * Create error message element if it doesn't exist
     */
    function createErrorElement() {
        const errorElement = document.createElement('div');
        errorElement.id = 'login-error';
        errorElement.style.color = '#e74c3c';
        errorElement.style.marginTop = '10px';
        errorElement.style.fontSize = '14px';
        
        // Insert after the login button
        const loginButton = document.querySelector('.login-submit-btn');
        loginButton.parentNode.insertBefore(errorElement, loginButton.nextSibling);
        
        return errorElement;
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem('access_token') || getTokenFromCookie();
    // Add this parameter to avoid redirect loops if there's a problem with the token
    const redirectAttempt = new URLSearchParams(window.location.search).get('redirect');
    
    if (token && redirectAttempt !== 'failed') {
        // Redirect to dashboard
        window.location.href = '/dashboard?source=landing';
    }
    
    /**
     * Get token from cookie
     */
    function getTokenFromCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'access_token') {
                return value;
            }
        }
        return null;
    }
});