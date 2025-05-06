// Policies Management Script

// Global variables
let currentPolicyId = null;
let currentPage = 1;
let totalPages = 1;
let userRole = '';
let policies = [];
let inactivityTime = 0;
const inactivityLimit = 15 * 60; // 15 minutes in seconds
const BASE_URL = '/astrellect/v1'; // Base API URL

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Setup session management
    setupInactivityMonitoring();
    
    // Initialize the page
    initPage();
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
 * Initialize page and check user role
 */
async function initPage() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // Get user info
        const response = await fetch(`${BASE_URL}/employees/get-me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to get user data');
        }

        const userData = await response.json();
        userRole = userData.role || 'employee';
        
        // Update UI with user info
        document.getElementById('user-name').textContent = userData.first_name || 'User';
        if (userData.avatar_url) {
            document.getElementById('header-avatar-img').src = userData.avatar_url;
        }

        // Initialize page based on role
        initializePage(userRole);
        
    } catch (error) {
        console.error('Error initializing page:', error);
        window.location.href = '/';
    }
}

/**
 * Logout function aligned with dashboard_admin
 */
function logout() {
    // Clear all storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    // Clear cookies
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login
    window.location.href = '/';
}

/**
 * Initialize page based on user role
 */
function initializePage(role) {
    // Show/hide elements based on role
    const isAdminOrManager = role === 'admin' || role === 'manager';
    
    // Display admin/manager specific controls
    document.querySelectorAll('.admin-manager-only').forEach(element => {
        element.style.display = isAdminOrManager ? 'inline-block' : 'none';
    });
    
    // Initialize category filter
    initializeCategoryFilter();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial policies
    loadPolicies();
}

/**
 * Initialize category filter dropdown
 */
function initializeCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        const categories = {
            '': 'All Categories',
            'hr': 'HR',
            'it': 'IT',
            'finance': 'Finance',
            'operations': 'Operations',
            'security': 'Security'
        };
        
        categoryFilter.innerHTML = Object.entries(categories)
            .map(([value, label]) => `<option value="${value}">${label}</option>`)
            .join('');
    }
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-item:not(#logout-menu)').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('policy-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPolicies();
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterPolicies();
        });
    }
    
    // Create policy button (admin/manager only)
    const createPolicyBtn = document.getElementById('create-policy-btn');
    if (createPolicyBtn) {
        createPolicyBtn.addEventListener('click', function() {
            openModal('create-policy-modal');
        });
    }
    
    // Save new policy
    const savePolicyBtn = document.getElementById('save-policy');
    if (savePolicyBtn) {
        savePolicyBtn.addEventListener('click', createPolicy);
    }
    
    // Update policy
    const updatePolicyBtn = document.getElementById('update-policy');
    if (updatePolicyBtn) {
        updatePolicyBtn.addEventListener('click', updatePolicy);
    }
    
    // Edit policy button in view modal
    const editPolicyBtn = document.getElementById('edit-policy-btn');
    if (editPolicyBtn) {
        editPolicyBtn.addEventListener('click', function() {
            const policyId = currentPolicyId;
            closeModal('view-policy-modal');
            openEditPolicyModal(policyId);
        });
    }
    
    // Delete policy button in view modal
    const deletePolicyBtn = document.getElementById('delete-policy-btn');
    if (deletePolicyBtn) {
        deletePolicyBtn.addEventListener('click', function() {
            confirmDeletePolicy(currentPolicyId);
        });
    }
    
    // Confirm action button
    const confirmActionBtn = document.getElementById('confirm-action');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', executeConfirmedAction);
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                changePage(currentPage - 1);
            }
        });
    }
    
    const nextPageBtn = document.getElementById('next-page');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                changePage(currentPage + 1);
            }
        });
    }
    
    // Retry button for error state
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            loadPolicies();
        });
    }
    
    // Logout
    document.querySelectorAll('#logout-btn, #logout-menu').forEach(element => {
        element.addEventListener('click', logout);
    });
    
    // Form submissions - prevent default and handle with JS
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // The appropriate handler will be called from the button click
        });
    });
}

/**
 * Load policies from API
 */
async function loadPolicies() {
    try {
        // Show loading state
        const loadingElement = document.getElementById('loading');
        const tableElement = document.getElementById('policies-table');
        const errorElement = document.getElementById('error-message');
        const noDataElement = document.getElementById('no-policies-message');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (tableElement) tableElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (noDataElement) noDataElement.style.display = 'none';
        
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        const response = await fetch(`${BASE_URL}/policy/getall`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch policies: ${response.status}`);
        }

        const data = await response.json();
        policies = data.company_policies || [];
        
        // Hide loading
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Display policies or no-data message
        if (policies && policies.length > 0) {
            renderPoliciesTable(policies);
            if (tableElement) tableElement.style.display = 'table';
            updatePagination(1, Math.ceil(policies.length / 10));
        } else {
            if (noDataElement) noDataElement.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading policies:', error);
        if (document.getElementById('loading')) {
            document.getElementById('loading').style.display = 'none';
        }
        if (document.getElementById('error-message')) {
            document.getElementById('error-message').style.display = 'flex';
        }
    }
}

/**
 * Create a new policy
 */
async function createPolicy() {
    try {
        const form = document.getElementById('create-policy-form');
        const formData = {
            title: form.querySelector('#policy-title').value.trim(),
            description: form.querySelector('#policy-description').value.trim(),
            category: form.querySelector('#policy-category').value,
            document_url: form.querySelector('#policy-document').value.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            version: form.querySelector('#policy-version').value.trim() || '1.0',
            is_active: true
        };
        
        // Validate required fields
        if (!formData.title || !formData.description || !formData.category) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/policy/create_new_policy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.detail || 'Failed to create policy');
        }

        // Success
        form.reset();
        closeModal('create-policy-modal');
        await loadPolicies();
        showNotification('Policy created successfully', 'success');

    } catch (error) {
        console.error('Error creating policy:', error);
        showNotification(error.message || 'Failed to create policy', 'error');
    }
}

/**
 * Update an existing policy
 */
async function updatePolicy() {
    try {
        const policyId = document.getElementById('edit-policy-id').value;
        const formData = {
            title: document.getElementById('edit-policy-title').value.trim(),
            description: document.getElementById('edit-policy-description').value.trim(),
            category: document.getElementById('edit-policy-category').value,
            document_url: document.getElementById('edit-policy-document').value.trim(),
            version: document.getElementById('edit-policy-version').value.trim(),
            is_active: true
        };

        // Validate required fields
        if (!formData.title || !formData.description || !formData.category) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/policy/edit_policy/${policyId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.detail || 'Failed to update policy');
        }

        closeModal('edit-policy-modal');
        await loadPolicies();
        showNotification('Policy updated successfully', 'success');

    } catch (error) {
        console.error('Error updating policy:', error);
        showNotification(error.message || 'Failed to update policy', 'error');
    }
}

/**
 * Delete a policy
 */
async function deletePolicy(policyId) {
    try {
        if (!policyId) {
            throw new Error('Policy ID is required');
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${BASE_URL}/policy/delete_policy/${policyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Policy not found');
            }
            throw new Error('Failed to delete policy');
        }

        await loadPolicies();
        showNotification('Policy deleted successfully', 'success');

    } catch (error) {
        console.error('Error deleting policy:', error);
        showNotification(error.message || 'Failed to delete policy', 'error');
    }
}

/**
 * Render policies in the table
 */
function renderPoliciesTable(policiesList) {
    const tableBody = document.getElementById('policies-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!policiesList || policiesList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No policies found</td>
            </tr>`;
        return;
    }

    policiesList.forEach(policy => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(policy.title)}</td>
            <td>
                <span class="category-badge ${policy.category}">
                    ${getCategoryDisplayName(policy.category)}
                </span>
            </td>
            <td>${new Date(policy.created_at).toLocaleDateString()}</td>
            <td>${policy.version || '1.0'}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewPolicy('${policy.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${userRole === 'admin' || userRole === 'manager' ? `
                    <button class="action-btn edit-btn" onclick="openEditPolicyModal('${policy.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="confirmDeletePolicy('${policy.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Filter policies based on search and category
 */
function filterPolicies() {
    const searchTerm = document.getElementById('policy-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;

    const filteredPolicies = policies.filter(policy => {
        const matchesSearch = policy.title.toLowerCase().includes(searchTerm) ||
            policy.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || policy.category === category;
        
        return matchesSearch && matchesCategory;
    });

    if (filteredPolicies.length > 0) {
        renderPoliciesTable(filteredPolicies);
        document.getElementById('policies-table').style.display = 'table';
        document.getElementById('no-policies-message').style.display = 'none';
    } else {
        document.getElementById('policies-table').style.display = 'none';
        document.getElementById('no-policies-message').style.display = 'flex';
    }
    
    updatePagination(1, Math.ceil(filteredPolicies.length / 10) || 1);
}

/**
 * View a policy's details
 */
function viewPolicy(policyId) {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) {
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Set current policy ID for later use
    currentPolicyId = policyId;
    
    // Populate modal
    document.getElementById('view-policy-title').textContent = policy.title;
    
    const categoryBadge = document.getElementById('view-policy-category');
    categoryBadge.textContent = getCategoryDisplayName(policy.category);
    categoryBadge.className = `category-badge ${policy.category}`;
    
    document.getElementById('view-policy-content').textContent = policy.description || 'No content available';
    
    // Show the modal
    openModal('view-policy-modal');
}

/**
 * Open edit policy modal with policy data
 */
function openEditPolicyModal(policyId) {
    // Check if user has permission
    if (userRole !== 'admin' && userRole !== 'manager') {
        showNotification('You do not have permission to edit policies', 'error');
        return;
    }
    
    const policy = policies.find(p => p.id === policyId);
    if (!policy) {
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Set form values
    document.getElementById('edit-policy-id').value = policy.id;
    document.getElementById('edit-policy-title').value = policy.title || '';
    document.getElementById('edit-policy-description').value = policy.description || '';
    document.getElementById('edit-policy-category').value = policy.category || '';
    document.getElementById('edit-policy-document').value = policy.document_url || '';
    document.getElementById('edit-policy-version').value = policy.version || '';
    document.getElementById('edit-policy-active').checked = policy.is_active || false;
    
    // Show modal
    openModal('edit-policy-modal');
}

/**
 * Confirm policy deletion
 */
function confirmDeletePolicy(policyId) {
    // Check if user has permission
    if (userRole !== 'admin' && userRole !== 'manager') {
        showNotification('You do not have permission to delete policies', 'error');
        return;
    }
    
    const policy = policies.find(p => p.id === policyId);
    if (!policy) {
        showNotification('Policy not found', 'error');
        return;
    }
    
    // Set up confirmation modal
    document.getElementById('confirm-title').textContent = 'Delete Policy';
    document.getElementById('confirm-message').textContent = 
        `Are you sure you want to delete the policy "${policy.title}"?`;
    
    // Store action data
    const confirmModal = document.getElementById('confirm-modal');
    confirmModal.dataset.action = 'delete';
    confirmModal.dataset.id = policyId;
    
    // Close other modals
    closeModal('view-policy-modal');
    
    // Show confirmation modal
    openModal('confirm-modal');
}

/**
 * Execute confirmed action (delete)
 */
async function executeConfirmedAction() {
    const modal = document.getElementById('confirm-modal');
    const action = modal.dataset.action;
    const id = modal.dataset.id;
    
    closeModal('confirm-modal');
    
    if (action === 'delete') {
        await deletePolicy(id);
    }
}

/**
 * Delete a policy
 */
async function deletePolicy(policyId) {
    try {
        // Check if user has permission
        if (userRole !== 'admin' && userRole !== 'manager') {
            showNotification('You do not have permission to delete policies', 'error');
            return;
        }
        
        // Show loading state
        showNotification('Deleting policy...', 'warning');
        
        // Get token
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        // Send API request
        const response = await fetch(`${BASE_URL}/policy/delete_policy/${policyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            
            throw new Error('Failed to delete policy');
        }
        
        // Reload policies
        await loadPolicies();
        
        // Show success message
        showNotification('Policy deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting policy:', error);
        showNotification(error.message || 'Failed to delete policy', 'error');
    }
}

/**
 * Get category display name
 */
function getCategoryDisplayName(categoryCode) {
    const categories = {
        'hr': 'HR',
        'it': 'IT',
        'finance': 'Finance',
        'operations': 'Operations',
        'security': 'Security'
    };
    
    return categories[categoryCode] || categoryCode.toUpperCase();
}

/**
 * Update pagination controls
 */
function updatePagination(current, total) {
    currentPage = current;
    totalPages = total;
    
    document.getElementById('page-info').textContent = `Page ${current} of ${total}`;
    document.getElementById('prev-page').disabled = current <= 1;
    document.getElementById('next-page').disabled = current >= total;
}

/**
 * Change page in pagination
 */
function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        // In a real implementation, this would fetch the specific page of policies
        // For now, we'll just update the pagination display
        updatePagination(page, totalPages);
        
        // Here you would typically call an API endpoint with the page parameter
        // and then update the table with the new data
    }
}

/**
 * Open a modal by ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Close a modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}