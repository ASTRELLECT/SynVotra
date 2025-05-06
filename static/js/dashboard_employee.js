/**
 * Employee Dashboard JavaScript
 * Handles employee-specific dashboard functionality
 */

// Session management variables
let inactivityTime = 0;
const inactivityLimit = 15 * 60; // 15 minutes in seconds

/**
 * Initialize dashboard functionality when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Session management setup
    setupSessionManagement();
    
    // Load user data and content
    loadUserData();
    loadAnnouncements();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Set up session management with inactivity timeout
 */
function setupSessionManagement() {
    // Reset timer on user activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
    
    // Check inactivity every second
    setInterval(checkInactivity, 1000);
}

/**
 * Reset inactivity timer on user activity
 */
function resetInactivityTimer() {
    inactivityTime = 0;
}

/**
 * Check for user inactivity and logout if limit exceeded
 */
function checkInactivity() {
    inactivityTime++;
    if (inactivityTime >= inactivityLimit) {
        logout();
    }
}

/**
 * Set up all necessary event listeners
 */
function setupEventListeners() {
    // Logout button event
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Setup navigation menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const currentActive = document.querySelector('.menu-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            
            this.classList.add('active');
            
            // Get text content to determine which page to navigate to
            const menuText = this.textContent.trim().toLowerCase();
            
            if (menuText.includes('dashboard')) {
                window.location.href = '/employee/dashboard';
            } else if (menuText.includes('profile')) {
                window.location.href = '/profile';
            } else if (menuText.includes('testimonials')) {
                window.location.href = '/testimonials';
            } else if (menuText.includes('policies')) {
                window.location.href = '/policies';
            } else if (menuText.includes('announcements')) {
                window.location.href = '/announcement';
            } else if (menuText.includes('logout')) {
                logout();
            }
        });
    });
    
    // View all announcements button
    const viewAllBtn = document.getElementById('view-all-announcements-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            window.location.href = '/announcement';
        });
    }
}

/**
 * Log out user by clearing tokens and redirecting to login page
 */
function logout() {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    
    // Clear cookies
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login page
    window.location.href = '/';
}

/**
 * Helper function to get auth token
 */
function getAuthToken() {
    return localStorage.getItem('access_token') || '';
}

/**
 * Load user data from API
 */
async function loadUserData() {
    try {
        const token = getAuthToken();
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        const response = await fetch('/astrellect/v1/employees/get-me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('header-user-name').textContent = userData.name || userData.first_name || 'Employee';
            
            // Set avatar if exists
            if (userData.avatar_url || userData.avatar) {
                const avatarUrl = userData.avatar_url || userData.avatar;
                document.getElementById('header-avatar-img').src = avatarUrl;
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        displayErrorNotification('Failed to load user data. Please try refreshing the page.');
    }
}

/**
 * Load announcements from API
 */
async function loadAnnouncements() {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch('/astrellect/v1/announcement/get-all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const announcements = data.announcements || [];
            displayAnnouncements(announcements);
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        displayErrorNotification('Failed to load announcements. Please try refreshing the page.');
    }
}

/**
 * Display announcements in the dashboard
 */
function displayAnnouncements(announcements) {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<div class="no-announcements">No announcements available.</div>';
        return;
    }
    
    // Display only the latest 3 announcements
    const recentAnnouncements = announcements
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
    
    recentAnnouncements.forEach(announcement => {
        const announcementEl = document.createElement('div');
        announcementEl.className = 'announcement-item';
        
        // Get user ID from local storage
        const currentUserId = localStorage.getItem('user_id');
        
        // Check if announcement has read_by property
        // If not, treat as unread for UI purposes
        const isUnread = !announcement.read_by || 
            (Array.isArray(announcement.read_by) && 
             !announcement.read_by.includes(currentUserId));
        
        announcementEl.innerHTML = `
            <div class="announcement-header">
                <div class="announcement-title">
                    ${announcement.title}
                    ${isUnread ? '<span class="unread-badge">New</span>' : ''}
                </div>
                <div class="announcement-date">${new Date(announcement.created_at).toLocaleDateString()}</div>
            </div>
            <div class="announcement-content">
                ${announcement.content.length > 100 ? 
                    announcement.content.substring(0, 100) + '...' : 
                    announcement.content}
            </div>
            <button class="view-announcement-btn" data-id="${announcement.id}">Read More</button>
        `;
        
        container.appendChild(announcementEl);
    });
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-announcement-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const announcementId = btn.getAttribute('data-id');
            viewAnnouncement(announcementId);
        });
    });
}

/**
 * View announcement details
 */
function viewAnnouncement(announcementId) {
    // Redirect to announcements page with ID
    window.location.href = `/announcement?id=${announcementId}`;
}

/**
 * Handle API errors based on response status
 */
function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid
        displayErrorNotification('Your session has expired. Please login again.');
        setTimeout(logout, 2000);
    } else if (response.status === 403) {
        // Forbidden - not enough permissions
        displayErrorNotification('You do not have permission to access this resource.');
    } else {
        // Other errors
        displayErrorNotification('An error occurred. Please try again later.');
    }
}

/**
 * Display error notification to the user
 */
function displayErrorNotification(message) {
    // Implementation depends on your notification system
    console.error(message);
    
    // Create a notification element if it doesn't exist
    let notification = document.getElementById('error-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
