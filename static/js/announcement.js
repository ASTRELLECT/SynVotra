// Global variables
let currentUser = null;
let userRole = null;
let currentAnnouncements = [];
let currentAnnouncementId = null;

// DOM Elements
const announcementsContainer = document.getElementById('announcements-container');
const createAnnouncementBtn = document.getElementById('create-announcement-btn');
const announcementForm = document.getElementById('announcement-form');
const announcementModal = document.getElementById('announcementModal');
const viewAnnouncementModal = document.getElementById('viewAnnouncementModal');
const confirmationModal = document.getElementById('confirmationModal');
const filterOptions = document.querySelectorAll('.filter-option');

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('access_token') || '';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Get current user info
    await fetchUserInfo();
    
    // Load announcements
    await loadAnnouncements();
    
    // Add event listeners
    setupEventListeners();
});

// Fetch current user information
async function fetchUserInfo() {
    try {
        const response = await fetch('/astrellect/v1/employees/get-me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }    
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        
        const userData = await response.json();
        currentUser = userData;
        userRole = userData.role;
        
        // Update UI based on user role
        updateUIForRole();
        
        // Update header user info
        document.getElementById('header-user-name').textContent = userData.name;
        if (userData.avatar) {
            document.getElementById('header-avatar-img').src = userData.avatar;
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// Update UI elements based on user role
function updateUIForRole() {
    // Only show "Create Announcement" button for managers and admins
    if (userRole === 'employee') {
        createAnnouncementBtn.style.display = 'none';
    }
    
    // Show/hide user management menu for admins only
    const userManagementMenu = document.getElementById('user-management-menu');
    if (userRole !== 'admin') {
        userManagementMenu.style.display = 'none';
    }
}

// Load announcements from API
async function loadAnnouncements(filterType = 'all') {
    try {
        let endpoint = '/astrellect/v1/announcement/get-all';
        // Apply filter if specified
        if (filterType !== 'all') {
            endpoint = `/astrellect/v1/announcement/filter?status=${filterType}`;
        }
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch announcements');
        
        const data = await response.json();
        currentAnnouncements = data.announcements;
        
        renderAnnouncements(currentAnnouncements);
    } catch (error) {
        console.error('Error loading announcements:', error);
        showNoAnnouncements('Failed to load announcements. Please try again later.');
    }
}

// Render announcements in the container
function renderAnnouncements(announcements) {
    announcementsContainer.innerHTML = '';
    
    if (!announcements || announcements.length === 0) {
        showNoAnnouncements();
        return;
    }
    
    announcements.forEach(announcement => {
        // Since the API response doesn't include approval_status, we show all announcements to employees
        const card = createAnnouncementCard(announcement);
        announcementsContainer.appendChild(card);
    });
}

// Create HTML for an announcement card
function createAnnouncementCard(announcement) {
    const card = document.createElement('div');
    card.className = 'announcement-card';
    card.dataset.id = announcement.id;
    
    // Check if the announcement has been read
    // First try to get from our API's read_by field (if present)
    // Then check if there's a recipient record with is_read=true
    let isRead = false;
    if (announcement.read_by && Array.isArray(announcement.read_by) && announcement.read_by.includes(currentUser.id)) {
        isRead = true;
    } else if (announcement.recipients) {
        // Check if there's a recipient entry for this user that is marked as read
        const userRecipient = announcement.recipients.find(r => 
            r.user_id === currentUser.id && r.is_read === true
        );
        isRead = !!userRecipient;
    }
    
    // Add unread indicator if NOT read
    if (!isRead) {
        const unreadIndicator = document.createElement('div');
        unreadIndicator.className = 'unread-indicator';
        card.appendChild(unreadIndicator);
    }
    
    // Create card header with title
    const header = document.createElement('div');
    header.className = 'announcement-header';
    
    const title = document.createElement('h3');
    title.className = 'announcement-title';
    title.textContent = announcement.title;
    
    header.appendChild(title);
    
    // Only show approval status badge if the API provides this field
    if (userRole !== 'employee' && announcement.approval_status) {
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-indicator status-${announcement.approval_status}`;
        statusBadge.textContent = announcement.approval_status.charAt(0).toUpperCase() + announcement.approval_status.slice(1);
        title.appendChild(statusBadge);
    }
    
    card.appendChild(header);
    
    // Create meta information section (author and date)
    const meta = document.createElement('div');
    meta.className = 'announcement-meta';
    
    const author = document.createElement('div');
    author.className = 'announcement-author';
    author.innerHTML = `<i class="fas fa-user"></i> ${announcement.author_name || 'Unknown'}`;
    
    const date = document.createElement('div');
    date.className = 'announcement-date';
    const created = new Date(announcement.created_at);
    date.innerHTML = `<i class="fas fa-calendar-alt"></i> ${created.toLocaleDateString()}`;
    
    meta.appendChild(author);
    meta.appendChild(date);
    card.appendChild(meta);
    
    // Create content preview
    const content = document.createElement('div');
    content.className = 'announcement-content';
    content.textContent = announcement.content.length > 150 ? 
        announcement.content.substring(0, 150) + '...' : 
        announcement.content;
    card.appendChild(content);
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'announcement-actions';
    
    // View button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-button';
    viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
    viewBtn.addEventListener('click', () => viewAnnouncement(announcement.id));
    actions.appendChild(viewBtn);
    
    // For managers/admins: delete button only
    if ((userRole === 'admin') || 
        (userRole === 'manager' && announcement.author_id === currentUser.id)) {
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-button';
        deleteBtn.style.backgroundColor = '#e74c3c';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.addEventListener('click', () => confirmDeleteAnnouncement(announcement.id));
        actions.appendChild(deleteBtn);
    }
    
    // Only show approval buttons if the API provides approval_status field
    if ((userRole === 'admin' || userRole === 'manager') && 
        announcement.approval_status === 'pending') {
        
        // Create approval actions container
        const approvalActions = document.createElement('div');
        approvalActions.className = 'approval-actions';
        
        // Approve button
        const approveBtn = document.createElement('button');
        approveBtn.className = 'approve-btn';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateApprovalStatus(announcement.id, 'approved');
        });
        
        // Reject button
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'reject-btn';
        rejectBtn.textContent = 'Reject';
        rejectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateApprovalStatus(announcement.id, 'rejected');
        });
        
        approvalActions.appendChild(approveBtn);
        approvalActions.appendChild(rejectBtn);
        card.appendChild(approvalActions);
    }
    
    card.appendChild(actions);
    
    return card;
}

// Show message when no announcements are available
function showNoAnnouncements(message = 'No announcements available') {
    const noAnnouncementsDiv = document.createElement('div');
    noAnnouncementsDiv.className = 'no-announcements';
    noAnnouncementsDiv.innerHTML = `
        <i class="fas fa-bullhorn"></i>
        <p>${message}</p>
    `;
    announcementsContainer.appendChild(noAnnouncementsDiv);
}

// View a single announcement
async function viewAnnouncement(announcementId) {
    try {
        // Get the announcement from current list or from API if needed
        let announcement = currentAnnouncements.find(a => a.id === announcementId);
        
        if (!announcement) {
            const response = await fetch(`/astrellect/v1/announcement/${announcementId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch announcement');
            announcement = await response.json();
        }
        
        // Populate the modal with announcement data
        document.getElementById('view-announcement-title').textContent = announcement.title;
        document.getElementById('view-announcement-author').textContent = announcement.author_name || 'Unknown';
        document.getElementById('view-announcement-date').textContent = new Date(announcement.created_at).toLocaleDateString();
        document.getElementById('view-announcement-content').textContent = announcement.content;
        
        // Show/hide mark as read button based on read status
        const markReadBtn = document.getElementById('mark-read-btn');
        if (announcement.read_by && announcement.read_by.includes(currentUser.id)) {
            markReadBtn.style.display = 'none';
        } else {
            markReadBtn.style.display = 'block';
            markReadBtn.onclick = () => markAsRead(announcementId);
        }
        
        // Store current announcement ID for actions
        currentAnnouncementId = announcementId;
        
        // Show the modal
        viewAnnouncementModal.style.display = 'block';
    } catch (error) {
        console.error('Error viewing announcement:', error);
        alert('Failed to load announcement details.');
    }
}

// Create a new announcement
function createNewAnnouncement() {
    // Reset the form
    document.getElementById('modal-title').textContent = 'Create Announcement';
    document.getElementById('announcement-id').value = '';
    document.getElementById('announcement-form').reset();
    
    // Show the modal
    announcementModal.style.display = 'block';
}

// Mark announcement as read
async function markAsRead(announcementId) {
    try {
        console.log("Marking announcement as read, ID:", announcementId);
        
        const response = await fetch('/astrellect/v1/announcement/mark-as-read', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                announcement_id: announcementId
            })
        });
        
        if (!response.ok) {
            // Parse error response
            const errorData = await response.json();
            console.log("Error response:", errorData);
            
            // Check for validation errors
            if (response.status === 422) {
                console.error('Validation error:', errorData);
                
                // Extract detail message from validation error
                let errorMessage = 'Validation error';
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => err.msg).join(', ');
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
                
                throw new Error(errorMessage);
            } else {
                throw new Error(errorData.detail || 'Failed to mark announcement as read');
            }
        }
        
        // Update UI - remove unread indicator
        const unreadIndicator = document.querySelector(`.announcement-card[data-id="${announcementId}"] .unread-indicator`);
        if (unreadIndicator) {
            unreadIndicator.remove();
        }
        
        // Hide the mark as read button
        document.getElementById('mark-read-btn').style.display = 'none';
        
        // Update the announcement in the current list
        const announcement = currentAnnouncements.find(a => a.id === announcementId);
        if (announcement) {
            // Update read_by array if it exists
            if (!announcement.read_by) {
                announcement.read_by = [];
            }
            if (!announcement.read_by.includes(currentUser.id)) {
                announcement.read_by.push(currentUser.id);
            }
            
            // Also update recipients if they exist
            if (announcement.recipients) {
                const userRecipient = announcement.recipients.find(r => r.user_id === currentUser.id);
                if (userRecipient) {
                    userRecipient.is_read = true;
                    userRecipient.read_at = new Date().toISOString();
                }
            }
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        alert('Failed to mark announcement as read: ' + error.message);
    }
}

// Confirm announcement deletion
function confirmDeleteAnnouncement(announcementId) {
    currentAnnouncementId = announcementId;
    confirmationModal.style.display = 'block';
}

// Delete an announcement
async function deleteAnnouncement() {
    if (!currentAnnouncementId) return;
    
    try {
        const response = await fetch(`/astrellect/v1/announcement/delete/${currentAnnouncementId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete announcement');
        
        // Remove from UI and close modal
        const card = document.querySelector(`.announcement-card[data-id="${currentAnnouncementId}"]`);
        if (card) {
            card.remove();
        }
        
        confirmationModal.style.display = 'none';
        
        // Remove from current list
        currentAnnouncements = currentAnnouncements.filter(a => a.id !== currentAnnouncementId);
        currentAnnouncementId = null;
        
        // Show "no announcements" if list is empty
        if (currentAnnouncements.length === 0) {
            showNoAnnouncements();
        }
    } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Failed to delete announcement.');
    }
}

// Update approval status of an announcement
async function updateApprovalStatus(announcementId, status) {
    try {
        const response = await fetch(`/astrellect/v1/announcement/update-approval`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                announcement_id: announcementId,
                status: status
            })
        });
        
        if (!response.ok) throw new Error(`Failed to ${status} announcement`);
        
        // Refresh announcements list
        await loadAnnouncements();
    } catch (error) {
        console.error(`Error updating approval status:`, error);
        alert(`Failed to update approval status.`);
    }
}

// Submit announcement form
async function submitAnnouncementForm(event) {
    event.preventDefault();
    
    const formError = document.getElementById('form-error');
    formError.style.display = 'none';
    
    const announcementId = document.getElementById('announcement-id').value;
    const title = document.getElementById('announcement-title').value;
    const content = document.getElementById('announcement-content').value;
    const recipients = Array.from(
        document.getElementById('announcement-recipients').selectedOptions
    ).map(option => option.value);
    
    // Validate form
    if (!title || !content || recipients.length === 0) {
        formError.textContent = 'Please fill all required fields.';
        formError.style.display = 'block';
        return;
    }
    
    try {
        // Prepare request data
        const requestData = {
            title,
            content,
            recipients
        };
        
        // Add date fields if available
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        
        if (startDate) requestData.start_date = startDate;
        if (endDate) requestData.end_date = endDate;
        
        // Create only, no more update
        const url = '/astrellect/v1/announcement/create';
        const method = 'POST';
        
        // Send request
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) throw new Error('Failed to save announcement');
        
        // Close modal and refresh list
        announcementModal.style.display = 'none';
        await loadAnnouncements();
    } catch (error) {
        console.error('Error saving announcement:', error);
        formError.textContent = 'Failed to save announcement. Please try again.';
        formError.style.display = 'block';
    }
}

// Log out user by clearing tokens and redirecting to login page
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

// Setup all event listeners
function setupEventListeners() {
    // Create announcement button
    createAnnouncementBtn.addEventListener('click', createNewAnnouncement);
    
    // Form submission
    announcementForm.addEventListener('submit', submitAnnouncementForm);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            announcementModal.style.display = 'none';
            viewAnnouncementModal.style.display = 'none';
            confirmationModal.style.display = 'none';
        });
    });
    
    // Cancel buttons
    document.getElementById('cancel-announcement-btn').addEventListener('click', () => {
        announcementModal.style.display = 'none';
    });
    
    document.getElementById('close-view-btn').addEventListener('click', () => {
        viewAnnouncementModal.style.display = 'none';
    });
    
    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });
    
    // Confirm delete button
    document.getElementById('confirm-delete-btn').addEventListener('click', deleteAnnouncement);
    
    // Filter options
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Update active class
            filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Load filtered announcements
            loadAnnouncements(option.dataset.filter);
        });
    
    });
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
                window.location.href = '/admin/dashboard';
            } else if (menuText.includes('profile')) {
                window.location.href = '/profile';
            } else if (menuText.includes('user management')) {
                window.location.href = '/user_management';
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
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    document.getElementById('logout-menu').addEventListener('click', logout);
    
    // Navigation menu items
    document.querySelectorAll('.menu-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            window.location.href = `/${item.dataset.page}`;
        });
    });
}
