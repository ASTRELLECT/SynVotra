/**
 * Admin Dashboard JavaScript
 * Handles admin-specific dashboard functionality
 */

// Session management variables
let inactivityTime = 0;
const inactivityLimit = 15 * 60; // 15 minutes in seconds

document.addEventListener('DOMContentLoaded', function() {
    // Session management for automatic logout
    setupInactivityMonitoring();
    
    // Load user data
    loadUserData();
    
    // Load user statistics
    loadUserStatistics();
    
    // Load recent users
    loadRecentUsers();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Set up inactivity monitoring for automatic logout
 */
function setupInactivityMonitoring() {
    function resetInactivityTimer() {
        inactivityTime = 0;
    }
    
    function checkInactivity() {
        inactivityTime++;
        if (inactivityTime >= inactivityLimit) {
            logout();
        }
    }
    
    // Reset timer on user activity
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
    
    // Check inactivity every second
    setInterval(checkInactivity, 1000);
}

/**
 * Set up all necessary event listeners
 */
function setupEventListeners() {
    // Logout button event
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Action buttons
    document.getElementById('create-user-btn').addEventListener('click', () => {
        window.location.href = '/user_management?action=create';
    });
    
    document.getElementById('create-announcement-btn').addEventListener('click', () => {
        window.location.href = '/announcement?action=create';
    });
    
    // Menu item click events
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const text = this.textContent.trim();
            if (text.includes('Profile')) {
                window.location.href = '/profile';
            } else if (text.includes('User Management')) {
                window.location.href = '/user_management';
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
            document.getElementById('user-name').textContent = userData.first_name || 'Admin';
            
            // Set avatar if exists
            if (userData.avatar_url) {
                document.getElementById('user-avatar-img').src = userData.avatar_url;
            }
        } else {
            console.error('Failed to load user data');
            if (response.status === 401) {
                logout();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Load user statistics from API
 */
async function loadUserStatistics() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        // Use a different endpoint or handle the error gracefully
        const response = await fetch('/astrellect/v1/employees/getall', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Extract users from the "result" field in the response
            const users = data.result || [];
            
            // Calculate statistics manually
            let totalCount = 0;
            let employeeCount = 0;
            let managerCount = 0;
            let adminCount = 0;
            
            // Make sure users is an array
            if (Array.isArray(users)) {
                totalCount = users.length;
                users.forEach(user => {
                    if (user.role === 'employee') employeeCount++;
                    else if (user.role === 'manager') managerCount++;
                    else if (user.role === 'admin') adminCount++;
                });
            }
            
            // Update UI with calculated statistics
            document.getElementById('total-users').textContent = totalCount || 0;
            document.getElementById('employee-count').textContent = employeeCount || 0;
            document.getElementById('manager-count').textContent = managerCount || 0;
            document.getElementById('admin-count').textContent = adminCount || 0;
        } else {
            console.error('Failed to load user statistics');
        }
    } catch (error) {
        console.error('Error loading user statistics:', error);
    }
}

/**
 * Load recent users from API
 */
async function loadRecentUsers() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch('/astrellect/v1/employees/getall?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Extract users from the "result" field in the response
            const users = data.result || [];
            
            const tableBody = document.getElementById('user-table-body');
            tableBody.innerHTML = '';
            
            if (users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No users found</td></tr>';
                return;
            }
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.first_name || ''} ${user.last_name || ''}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td class="user-actions">
                        <button class="edit-btn" data-id="${user.id}">Edit</button>
                        <button class="delete-btn" data-id="${user.id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Add event listeners for edit/delete buttons
            addUserActionEventListeners();
        } else {
            console.error('Failed to load recent users');
            document.getElementById('user-table-body').innerHTML = 
                '<tr><td colspan="4" class="text-center">Failed to load users</td></tr>';
        }
    } catch (error) {
        console.error('Error loading recent users:', error);
        document.getElementById('user-table-body').innerHTML = 
            '<tr><td colspan="4" class="text-center">Error loading users</td></tr>';
    }
}

/**
 * Add event listeners to user action buttons
 */
function addUserActionEventListeners() {
    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            window.location.href = `/user_management?action=edit&id=${userId}`;
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this user?')) {
                deleteUser(userId);
            }
        });
    });
}

/**
 * Delete a user
 */
async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch(`/astrellect/v1/employees/delete/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('User deleted successfully');
            // Refresh the user list
            loadRecentUsers();
            loadUserStatistics();
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail || 'Failed to delete user'}`);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user');
    }
}
