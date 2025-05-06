/**
 * Manager Dashboard JavaScript
 * Handles manager-specific dashboard functionality
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
    loadTeamMembers();
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
    
    // Action buttons
    document.getElementById('create-announcement-btn').addEventListener('click', () => {
        window.location.href = '/announcement?action=create';
    });
    
    document.getElementById('view-team-btn').addEventListener('click', () => {
        window.location.href = '/team_management';
    });
    
    // Menu item click events
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const text = this.textContent.trim();
            if (text.includes('Profile')) {
                window.location.href = '/profile';
            } else if (text.includes('Team Management')) {
                window.location.href = '/team_management';
            } else if (text.includes('Announcements')) {
                window.location.href = '/announcement';
            } else if (text.includes('Logout')) {
                logout();
            }
        });
    });
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
 * Load user data from API
 */
async function loadUserData() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        const response = await fetch('/astrellect/v1/employees/get-me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('user-name').textContent = userData.first_name || 'Manager';
            
            // Set avatar if exists
            if (userData.avatar_url) {
                document.getElementById('user-avatar-img').src = userData.avatar_url;
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
 * Load team members from API
 */
async function loadTeamMembers() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        // Get employees (for managers, this would be filtered to their team)
        const response = await fetch('/astrellect/v1/employees/getall?role=employee', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Extract employees from the "result" field in the response
            const employees = data.result || [];
            
            displayTeamMembers(employees);
        } else {
            handleApiError(response);
            
            // Display a fallback message if API fails
            document.getElementById('team-count').textContent = '0';
            const tableBody = document.getElementById('employees-table-body');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Failed to load team members</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading team members:', error);
        displayErrorNotification('Failed to load team members. Please try refreshing the page.');
        
        // Display a fallback message
        document.getElementById('team-count').textContent = '0';
        const tableBody = document.getElementById('employees-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error loading team members</td></tr>';
        }
    }
}

/**
 * Display team members in the table
 */
function displayTeamMembers(employees) {
    const tableBody = document.getElementById('employees-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Update team count
    document.getElementById('team-count').textContent = employees.length;
    
    if (employees.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No team members found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.first_name || ''} ${employee.last_name || ''}</td>
            <td>${employee.email || 'N/A'}</td>
            <td>Employee</td>
            <td>
                <button class="action-button view-profile-btn" data-id="${employee.id}">View Profile</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners for profile buttons
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            window.location.href = `/profile?id=${userId}`;
        });
    });
}

/**
 * Load announcements from API
 */
async function loadAnnouncements() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch('/astrellect/v1/announcement/get-all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Make sure we have an announcements array
            const announcements = data.announcements || [];
            
            displayAnnouncements(announcements);
        } else {
            handleApiError(response);
            
            // Show a fallback message
            const container = document.getElementById('announcements-container');
            if (container) {
                container.innerHTML = '<div class="no-announcements">Failed to load announcements.</div>';
            }
            document.getElementById('unread-count').textContent = 0;
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        displayErrorNotification('Failed to load announcements. Please try refreshing the page.');
        
        // Show a fallback message
        const container = document.getElementById('announcements-container');
        if (container) {
            container.innerHTML = '<div class="no-announcements">Error loading announcements.</div>';
        }
        document.getElementById('unread-count').textContent = 0;
    }
}

/**
 * Display announcements in the dashboard
 */
function displayAnnouncements(announcements) {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let unreadCount = 0;
    
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<div class="no-announcements">No announcements available.</div>';
        document.getElementById('unread-count').textContent = 0;
        return;
    }
    
    // Take only the most recent 5 announcements
    const recentAnnouncements = announcements
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    
    recentAnnouncements.forEach(announcement => {
        // Check if announcement is read
        let isRead = false;
        if (announcement.read_by && Array.isArray(announcement.read_by)) {
            isRead = announcement.read_by.includes(localStorage.getItem('user_id'));
        } else if (announcement.recipients) {
            const userRecipient = announcement.recipients.find(r => 
                r.user_id === localStorage.getItem('user_id') && r.is_read === true
            );
            isRead = !!userRecipient;
        }
        
        if (!isRead) unreadCount++;
        
        const announcementEl = document.createElement('div');
        announcementEl.className = 'announcement-item';
        announcementEl.innerHTML = `
            <div class="announcement-header">
                <div class="announcement-title">
                    ${announcement.title}
                    ${!isRead ? '<span class="unread-badge">New</span>' : ''}
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
            window.location.href = `/announcement?id=${announcementId}`;
        });
    });
    
    document.getElementById('unread-count').textContent = unreadCount;
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
