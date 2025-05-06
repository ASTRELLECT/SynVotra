/**
 * Profile Page JavaScript
 * Handles user profile functionality including viewing and editing profile information
 * API Endpoints:
 * - GET /astrellect/v1/employees/get-me → View profile dashboard
 * - PUT /astrellect/v1/employees/update/{user_id} → Edit profile info
 * - PUT /astrellect/v1/employees/update_profile_picture → Upload profile picture
 * - POST /astrellect/v1/auth/change-password → Change password
 */

document.addEventListener('DOMContentLoaded', function() {
    // Session management variables
    let inactivityTime = 0;
    const inactivityLimit = 15 * 60; // 15 minutes in seconds
    
    // User data storage
    let userData = {};
    let isOwnProfile = true;
    let queryParams = new URLSearchParams(window.location.search);
    let viewUserId = queryParams.get('id');
    
    // API endpoints
    const API = {
        GET_ME: '/astrellect/v1/employees/get-me',
        GET_USER: '/astrellect/v1/employees/get/',
        UPDATE_USER: '/astrellect/v1/employees/update/',
        UPDATE_AVATAR: '/astrellect/v1/employees/update_profile_picture',
        CHANGE_PASSWORD: '/astrellect/v1/auth/change-password'
    };
    
    // Initialize profile functionality
    initialize();
    
    /**
     * Initialize all profile functionality
     */
    function initialize() {
        // Set up session management
        setupSessionManagement();
        
        // Load user profile data
        loadUserProfile().then(() => {
            // Set up event listeners after profile is loaded
            setupEventListeners();
        });
        
        // Setup auth-related event listeners immediately
        setupAuthEventListeners();
    }
    
    /**
     * Set up session management with inactivity timeout
     */
    function setupSessionManagement() {
        function resetInactivityTimer() {
            inactivityTime = 0;
        }
        
        function checkInactivity() {
            inactivityTime++;
            if (inactivityTime >= inactivityLimit) {
                logout();
            }
        }
        
        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);
        document.addEventListener('click', resetInactivityTimer);
        
        setInterval(checkInactivity, 1000);
    }
    
    /**
     * Set up authentication-related event listeners
     */
    function setupAuthEventListeners() {
        // Logout button events
        document.getElementById('logout-btn').addEventListener('click', logout);
        document.getElementById('logout-menu').addEventListener('click', logout);
        
        // Navigation menu events
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                if (this.classList.contains('active')) return;
                
                const page = this.dataset.page;
                if (page === 'dashboard') {
                    window.location.href = '/dashboard';
                } else if (page === 'announcements') {
                    window.location.href = '/announcement';
                }
            });
        });
    }
    
    /**
     * Set up all event listeners related to profile functionality
     */
    function setupEventListeners() {
        // Check user role for navigation options
        const userRole = localStorage.getItem('user_role');
        if (userRole === 'admin' || userRole === 'manager') {
            document.getElementById('user-management-menu').classList.remove('hidden');
            document.getElementById('user-management-menu').addEventListener('click', function() {
                window.location.href = '/user_management';
            });
        }
        
        // Show/hide edit buttons based on ownership
        if (!isOwnProfile) {
            document.getElementById('edit-personal-info-btn').style.display = 'none';
            document.getElementById('edit-address-info-btn').style.display = 'none';
            document.getElementById('change-password-btn').style.display = 'none';
            document.getElementById('change-avatar-btn').style.display = 'none';
        }
        
        // Personal info edit buttons
        document.getElementById('edit-personal-info-btn').addEventListener('click', function() {
            document.getElementById('personal-info-display').classList.add('hidden');
            document.getElementById('personal-info-form').classList.remove('hidden');
            
            // Populate form with current data
            document.getElementById('first-name').value = userData.first_name || '';
            document.getElementById('last-name').value = userData.last_name || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.contact_number || '';
        });
        
        document.getElementById('cancel-personal-info-btn').addEventListener('click', function() {
            document.getElementById('personal-info-display').classList.remove('hidden');
            document.getElementById('personal-info-form').classList.add('hidden');
        });
        
        document.getElementById('personal-info-edit-form').addEventListener('submit', function(e) {
            e.preventDefault();
            updatePersonalInfo();
        });
        
        // Address info edit buttons
        document.getElementById('edit-address-info-btn').addEventListener('click', function() {
            document.getElementById('address-info-display').classList.add('hidden');
            document.getElementById('address-info-form').classList.remove('hidden');
            
            // Populate form with current data
            document.getElementById('address').value = userData.address || '';
            
            // Format dates for date inputs (YYYY-MM-DD)
            if (userData.dob) {
                document.getElementById('dob').value = formatDateForInput(userData.dob);
            }
            if (userData.joining_date) {
                document.getElementById('joining-date').value = formatDateForInput(userData.joining_date);
            }
        });
        
        document.getElementById('cancel-address-info-btn').addEventListener('click', function() {
            document.getElementById('address-info-display').classList.remove('hidden');
            document.getElementById('address-info-form').classList.add('hidden');
        });
        
        document.getElementById('address-info-edit-form').addEventListener('submit', function(e) {
            e.preventDefault();
            updateAddressInfo();
        });
        
        // Profile picture change button
        document.getElementById('change-avatar-btn').addEventListener('click', function() {
            openAvatarModal();
        });
        
        // Close avatar modal
        document.getElementById('close-avatar-modal').addEventListener('click', function() {
            document.getElementById('avatarModal').style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === document.getElementById('passwordModal')) {
                document.getElementById('passwordModal').style.display = 'none';
            }
            if (e.target === document.getElementById('avatarModal')) {
                document.getElementById('avatarModal').style.display = 'none';
            }
        });
        
        // Setup avatar selection options
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', function() {
                const avatarName = this.getAttribute('data-avatar');
                updateAvatar(avatarName);
            });
        });
        
        // Password change modal
        document.getElementById('change-password-btn').addEventListener('click', function() {
            document.getElementById('passwordModal').style.display = 'block';
        });
        
        document.querySelector('#passwordModal .close').addEventListener('click', function() {
            document.getElementById('passwordModal').style.display = 'none';
        });
        
        document.getElementById('cancel-password-btn').addEventListener('click', function() {
            document.getElementById('passwordModal').style.display = 'none';
        });
        
        document.getElementById('change-password-form').addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === document.getElementById('passwordModal')) {
                document.getElementById('passwordModal').style.display = 'none';
            }
        });
    }
    
    /**
     * Log out the current user
     */
    function logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/';
    }
    
    /**
     * Get authentication token from storage
     * @returns {string} The authentication token or null if not found
     */
    function getAuthToken() {
        return localStorage.getItem('access_token');
    }
    
    /**
     * Load user profile data
     * @returns {Promise} Promise that resolves when profile is loaded
     */
    async function loadUserProfile() {
        try {
            const token = getAuthToken();
            if (!token) {
                window.location.href = '/';
                return Promise.reject("No auth token found");
            }
            
            let endpoint = API.GET_ME;
            
            // If viewing another user's profile (for admins/managers)
            if (viewUserId) {
                endpoint = `${API.GET_USER}${viewUserId}`;
                isOwnProfile = false;
            }
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                userData = await response.json();
                
                // Remove loading spinner
                document.getElementById('loading').remove();
                
                // Show the profile template
                const template = document.getElementById('profile-template');
                const content = document.getElementById('profile-content');
                content.innerHTML = template.innerHTML;
                
                // Display user data in the profile
                loadProfileData(userData);
                
                // Update header info
                document.getElementById('header-user-name').textContent = userData.first_name || 'User';
                
                if (userData.avatar_url) {
                    document.getElementById('header-avatar-img').src = userData.avatar_url;
                }
                
                return Promise.resolve();
            } else {
                if (response.status === 401) {
                    logout();
                } else {
                    showNotification('Failed to load user profile', 'error');
                }
                return Promise.reject("Failed to load profile");
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            showNotification('An error occurred while loading the profile', 'error');
            return Promise.reject(error);
        }
    }
    
    /**
     * Add this function to handle the profile data once loaded
     * @param {Object} userData User data object
     */
    function loadProfileData(userData) {
        // Existing code to populate profile fields
        displayUserData();
        
        // Update user name in header
        document.getElementById('header-user-name').textContent = userData.first_name + ' ' + userData.last_name;
        
        // Update profile name
        document.getElementById('profile-full-name').textContent = userData.first_name + ' ' + userData.last_name;
        
        // Update profile role
        document.getElementById('profile-role').textContent = userData.role;
        
        // Store role in localStorage for use across pages
        localStorage.setItem('userRole', userData.role);
        
        // Update menu visibility based on role
        if (window.updateMenuBasedOnRole) {
            window.updateMenuBasedOnRole(userData.role);
        }
    }
    
    /**
     * Display user data in the profile
     */
    function displayUserData() {
        // Profile sidebar
        document.getElementById('profile-full-name').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';
        document.getElementById('profile-role').textContent = capitalizeFirstLetter(userData.role) || 'Employee';
        
        // Set profile picture if available
        if (userData.profile_picture_url) {
            const avatarUrl = `/static/uploads/avatars/${userData.profile_picture_url}.png`;
            document.getElementById('profile-avatar').src = avatarUrl;
            document.getElementById('header-avatar-img').src = avatarUrl;
        }
        
        // Personal info display
        document.getElementById('display-first-name').textContent = userData.first_name || '-';
        document.getElementById('display-last-name').textContent = userData.last_name || '-';
        document.getElementById('display-email').textContent = userData.email || '-';
        document.getElementById('display-phone').textContent = userData.contact_number || '-';
        
        // Address info display
        document.getElementById('display-address').textContent = userData.address || '-';
        document.getElementById('display-contact-number').textContent = userData.contact_number || '-';
        document.getElementById('display-dob').textContent = formatDate(userData.dob) || '-';
        document.getElementById('display-joining-date').textContent = formatDate(userData.joining_date) || '-';
        
        // Update form fields as well if they exist
        if (document.getElementById('first-name')) {
            document.getElementById('first-name').value = userData.first_name || '';
        }
        if (document.getElementById('last-name')) {
            document.getElementById('last-name').value = userData.last_name || '';
        }
        if (document.getElementById('email')) {
            document.getElementById('email').value = userData.email || '';
        }
        if (document.getElementById('phone')) {
            document.getElementById('phone').value = userData.contact_number || '';
        }
        if (document.getElementById('address')) {
            document.getElementById('address').value = userData.address || '';
        }
    }
    
    /**
     * Update personal information
     */
    async function updatePersonalInfo() {
        try {
            const token = getAuthToken();
            if (!token) {
                logout();
                return;
            }
            
            const userId = viewUserId || userData.id;
            const form = document.getElementById('personal-info-edit-form');
            
            // Add loading class to form
            form.classList.add('loading');
            
            const updateData = {
                first_name: document.getElementById('first-name').value,
                last_name: document.getElementById('last-name').value,
                contact_number: document.getElementById('phone').value
            };
            
            const response = await fetch(`${API.UPDATE_USER}${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            // Remove loading class
            form.classList.remove('loading');
            
            if (response.ok) {
                // Update was successful
                const result = await response.json();
                Object.assign(userData, result);
                displayUserData();
                
                // Update header name
                document.getElementById('header-user-name').textContent = userData.first_name || 'User';
                
                // Switch back to display view
                document.getElementById('personal-info-display').classList.remove('hidden');
                document.getElementById('personal-info-form').classList.add('hidden');
                
                showNotification('Personal information updated successfully', 'success');
            } else {
                const error = await response.json();
                showNotification(error.detail || 'Failed to update personal information', 'error');
            }
        } catch (error) {
            console.error('Error updating personal info:', error);
            showNotification('An error occurred while updating personal information', 'error');
        }
    }
    
    /**
     * Update address information
     */
    async function updateAddressInfo() {
        try {
            const token = getAuthToken();
            if (!token) {
                logout();
                return;
            }
            
            const userId = viewUserId || userData.id;
            const form = document.getElementById('address-info-edit-form');
            
            // Add loading class to form
            form.classList.add('loading');
            
            const updateData = {
                address: document.getElementById('address').value,
                dob: document.getElementById('dob').value || null,
                joining_date: document.getElementById('joining-date').value || null
            };
            
            const response = await fetch(`${API.UPDATE_USER}${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            // Remove loading class
            form.classList.remove('loading');
            
            if (response.ok) {
                // Update was successful
                const result = await response.json();
                Object.assign(userData, result);
                displayUserData();
                
                // Switch back to display view
                document.getElementById('address-info-display').classList.remove('hidden');
                document.getElementById('address-info-form').classList.add('hidden');
                
                showNotification('Address information updated successfully', 'success');
            } else {
                const error = await response.json();
                showNotification(error.detail || 'Failed to update address information', 'error');
            }
        } catch (error) {
            console.error('Error updating address info:', error);
            showNotification('An error occurred while updating address information', 'error');
        }
    }
    
    /**
     * Open avatar selection modal
     */
    function openAvatarModal() {
        const modal = document.getElementById('avatarModal');
        modal.style.display = 'block';
        
        // Mark current avatar as selected
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
            const avatarName = option.getAttribute('data-avatar');
            if (userData.profile_picture_url === avatarName) {
                option.classList.add('selected');
            }
        });
    }
    
    /**
     * Update avatar with selected option
     * @param {string} avatarName Name of the selected avatar
     */
    async function updateAvatar(avatarName) {
        try {
            const token = getAuthToken();
            if (!token) {
                logout();
                return;
            }
            
            // Show loading state
            const modal = document.getElementById('avatarModal');
            modal.classList.add('loading');
            
            // Make API request to update avatar
            const response = await fetch(API.UPDATE_USER + (viewUserId || userData.id), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile_picture_url: avatarName
                })
            });
            
            // Remove loading state
            modal.classList.remove('loading');
            
            if (response.ok) {
                const result = await response.json();
                
                // Update avatar URLs in the UI
                const avatarUrl = `/static/uploads/avatars/${avatarName}.png?t=${new Date().getTime()}`;
                document.getElementById('profile-avatar').src = avatarUrl;
                document.getElementById('header-avatar-img').src = avatarUrl;
                
                // Update user data
                userData.profile_picture_url = avatarName;
                
                // Close modal
                modal.style.display = 'none';
                
                showNotification('Avatar updated successfully', 'success');
            } else {
                const error = await response.json();
                showNotification(error.detail || 'Failed to update avatar', 'error');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            showNotification('An error occurred while updating the avatar', 'error');
        }
    }
    
    /**
     * Change password
     */
    async function changePassword() {
        try {
            const token = getAuthToken();
            if (!token) {
                logout();
                return;
            }
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorMsg = document.getElementById('password-error');
            const form = document.getElementById('change-password-form');
            
            // Clear any previous error messages
            errorMsg.style.display = 'none';
            errorMsg.textContent = '';
            
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                errorMsg.textContent = 'New passwords do not match.';
                errorMsg.style.display = 'block';
                return;
            }
            
            // Validate password complexity
            if (newPassword.length < 8) {
                errorMsg.textContent = 'Password must be at least 8 characters long.';
                errorMsg.style.display = 'block';
                return;
            }
            
            // Password complexity regex - at least one uppercase, one lowercase, one number
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                errorMsg.textContent = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
                errorMsg.style.display = 'block';
                return;
            }
            
            // Show loading state
            form.classList.add('loading');
            
            const response = await fetch(API.CHANGE_PASSWORD, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            // Remove loading state
            form.classList.remove('loading');
            
            if (response.ok) {
                // Password changed successfully
                document.getElementById('passwordModal').style.display = 'none';
                document.getElementById('change-password-form').reset();
                showNotification('Password changed successfully', 'success');
            } else {
                const error = await response.json();
                errorMsg.textContent = error.detail || 'Failed to change password. Please check your current password.';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('Error changing password:', error);
            document.getElementById('password-error').textContent = 'An error occurred. Please try again.';
            document.getElementById('password-error').style.display = 'block';
        }
    }
    
    /**
     * Format date from ISO string to readable format
     * @param {string} dateString ISO date string
     * @returns {string} Formatted date string or empty string if null
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    /**
     * Format date for HTML date input (YYYY-MM-DD)
     * @param {string} dateString ISO date string
     * @returns {string} Formatted date string for input
     */
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Capitalize first letter of a string
     * @param {string} string String to capitalize
     * @returns {string} Capitalized string
     */
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    /**
     * Show notification to the user
     * @param {string} message The notification message
     * @param {string} type The notification type ('success' or 'error')
     */
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
