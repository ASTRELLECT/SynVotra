// API Constants
const API_BASE = '/astrellect/v1/employees';
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let users = []; // Add this line to define the users array

// Fetch users with filters and pagination
async function fetchUsers(page = 1, filters = {}) {
    try {
        const searchParams = new URLSearchParams();
        // Add filters to query params
        Object.entries(filters).forEach(([key, value]) => {
            if (value) searchParams.append(key, value);
        });

        const response = await fetch(`${API_BASE}/filter?${searchParams}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        users = data.result; // Store users in the global variable
        renderUsers(data.result);
        updatePagination(data.total_pages, page);
    } catch (error) {
        showNotification('Error fetching users: ' + error.message, 'error');
    }
}

// Render users to table
function renderUsers(users) {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = `
            <tr data-id="${user.id}">
                <td><input type="checkbox" class="user-select"></td>
                <td>${user.first_name} ${user.last_name || ''}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'active' : 'inactive'}</span></td>
                <td>
                    <button class="btn-icon" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="confirmDelete('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Update pagination controls
function updatePagination(total = 1, current = 1) {
    totalPages = total || 1;
    currentPage = current;
    
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

// Handle page navigation
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        fetchUsers(currentPage, currentFilters);
    }
}

// Create new user
async function createUser() {
    const userData = {
        first_name: document.getElementById('new-first-name').value,
        last_name: document.getElementById('new-last-name').value,
        email: document.getElementById('new-email').value,
        role: document.getElementById('new-role').value,
        password: document.getElementById('new-password').value,
        is_active: document.getElementById('new-status').value === 'active'
    };

    try {
        const response = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('access_token')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create user');
        }

        showNotification('User created successfully', 'success');
        closeModal('create-user-modal');
        fetchUsers(currentPage, currentFilters);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Edit user
async function editUser(userId) {
    try {
        // Fetch the specific user data first
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getCookie('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        
        // Populate edit form
        document.getElementById('edit-id').value = user.id;
        document.getElementById('edit-first-name').value = user.first_name || '';
        document.getElementById('edit-last-name').value = user.last_name || '';
        document.getElementById('edit-email').value = user.email || '';
        document.getElementById('edit-role').value = user.role || 'employee';
        document.getElementById('edit-status').value = user.is_active ? 'active' : 'inactive';

        openModal('edit-user-modal');
    } catch (error) {
        showNotification(`Error fetching user: ${error.message}`, 'error');
    }
}

// Update existing user
async function saveEdit() {
    const userId = document.getElementById('edit-id').value;
    const userData = {
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        email: document.getElementById('edit-email').value,
        role: document.getElementById('edit-role').value,
        is_active: document.getElementById('edit-status').value === 'active'
    };

    try {
        const response = await fetch(`${API_BASE}/update/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('access_token')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update user');
        }

        showNotification('User updated successfully', 'success');
        closeModal('edit-user-modal');
        fetchUsers(currentPage, currentFilters);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Delete user
async function deleteConfirmedUser() {
    const userId = document.getElementById('confirm-modal').dataset.userId;
    
    try {
        const response = await fetch(`${API_BASE}/delete/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getCookie('access_token')}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete user');
        }

        showNotification('User deleted successfully', 'success');
        closeModal('confirm-modal');
        fetchUsers(currentPage, currentFilters);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Modal handling functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Add event listener for clicking outside modal
        window.onclick = function(event) {
            if (event.target === modal) {
                closeModal(modalId);
            }
        };
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Clear form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

function confirmDelete(userId) {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.dataset.userId = userId;
        openModal('confirm-modal');
    }
}

// Utility functions
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
    
    // Setup pagination handlers
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    
    if (prevPage) {
        prevPage.addEventListener('click', () => changePage(-1));
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => changePage(1));
    }
    
    // Search and filter handlers
    const searchInput = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    
    searchInput.addEventListener('input', debounce(() => {
        currentFilters = {
            ...currentFilters,
            search: searchInput.value,
            role: roleFilter.value
        };
        fetchUsers(1, currentFilters);
    }, 300));
    
    roleFilter.addEventListener('change', () => {
        currentFilters = {
            ...currentFilters,
            role: roleFilter.value
        };
        fetchUsers(1, currentFilters);
    });

    // Add close button handlers
    document.querySelectorAll('.close-modal').forEach(button => {
        button.onclick = function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        };
    });
});

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}