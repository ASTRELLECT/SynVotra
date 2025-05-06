/**
 * User Management System
 * Handles all user management operations
 */

// State management
const state = {
    users: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalUsers: 0,
    selectedUsers: new Set(),
    filters: {
        search: '',
        role: '',
        status: 'active'
    }
};

// DOM Elements
const dom = {
    // Table elements
    userTable: document.getElementById('users-table'),
    tableBody: document.querySelector('#users-table tbody'),
    selectAll: document.getElementById('select-all'),
    
    // Filter elements
    searchInput: document.getElementById('user-search'),
    roleFilter: document.getElementById('role-filter'),
    
    // Pagination
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    
    // Buttons
    createUserBtn: document.getElementById('create-user-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Modals
    createUserModal: document.getElementById('create-user-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    editUserModal: document.getElementById('edit-user-modal'),
    
    // Forms
    createUserForm: document.getElementById('create-user-form'),
    editUserForm: document.getElementById('edit-user-form'),
    
    // Toast container
    toastContainer: document.createElement('div')
};

// Initialize toast container
dom.toastContainer.className = 'toast-container';
document.body.appendChild(dom.toastContainer);

// API Service
const apiService = {
    // Update baseUrl to match your production environment
    baseUrl: '',
    
    async fetchWithAuth(endpoint, options = {}) {
        console.log('Making request to:', endpoint); // Debug log
        console.log('Request options:', options); // Debug log
        
        const token = localStorage.getItem('access_token');
        console.log('Using token:', token ? 'exists' : 'missing'); 
        if (!token) {
            window.location.href = '/login';
            return Promise.reject('No access token');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'})
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            // Handle unauthorized (401) responses
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject('Unauthorized');
            }

            // Handle empty responses
            if (response.status === 204) {
                return null;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getUsers(params = {}) {
        const query = new URLSearchParams({
            limit: state.itemsPerPage,
            offset: (state.currentPage - 1) * state.itemsPerPage,
            ...state.filters,
            ...params
        }).toString();
        
        return this.fetchWithAuth(`/astrellect/v1/employees/getall?${query}`);
    },

    async createUser(userData) {
        return this.fetchWithAuth('/astrellect/v1/employees/create', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async updateUser(userId, userData) {
        return this.fetchWithAuth(`/astrellect/v1/employees/update/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    async deleteUser(userId) {
        return this.fetchWithAuth(`/astrellect/v1/employees/delete/${userId}`, {
            method: 'DELETE'
        });
    }
};

// UI Controller
const uiController = {
    init() {
        this.setupEventListeners();
        this.loadUsers();
    },

    setupEventListeners() {
        // Search and filters
        dom.searchInput.addEventListener('input', debounce(() => {
            state.filters.search = dom.searchInput.value;
            this.loadUsers();
        }, 300));

        dom.roleFilter.addEventListener('change', () => {
            state.filters.role = dom.roleFilter.value;
            this.loadUsers();
        });

        // Create user
        dom.createUserBtn.addEventListener('click', () => this.showCreateUserModal());
        
        // Logout
        if (dom.logoutBtn) {
            dom.logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Pagination
        dom.prevPageBtn.addEventListener('click', () => this.prevPage());
        dom.nextPageBtn.addEventListener('click', () => this.nextPage());
        
        // Select all
        dom.selectAll.addEventListener('change', (e) => {
            const checkboxes = dom.tableBody.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                const userId = checkbox.dataset.userId;
                e.target.checked ? state.selectedUsers.add(userId) : state.selectedUsers.delete(userId);
            });
        });
    },

    async loadUsers() {
        try {
            this.showLoading();
            
            const data = await apiService.getUsers();
            state.users = data.result || [];
            state.totalUsers = data.total_count || state.users.length;
            
            this.renderUsers();
            this.updatePagination();
        } catch (error) {
            this.showToast('Failed to load users', 'error');
            console.error('Error loading users:', error);
        } finally {
            this.hideLoading();
        }
    },

    renderUsers() {
        dom.tableBody.innerHTML = '';
        
        if (state.users.length === 0) {
            dom.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">No users found</td>
                </tr>
            `;
            return;
        }

        state.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" data-user-id="${user.id}"></td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td><span class="badge role-${user.role}">${user.role}</span></td>
                <td><span class="badge status-${user.is_active ? 'active' : 'inactive'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span></td>
                <td>
                    <button class="btn btn-icon edit-btn" data-user-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon delete-btn" data-user-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners
            row.querySelector('.edit-btn').addEventListener('click', () => 
                this.editUser(user.id));
            row.querySelector('.delete-btn').addEventListener('click', () => 
                this.confirmDeleteUser(user.id));
            row.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                const userId = e.target.dataset.userId;
                e.target.checked ? state.selectedUsers.add(userId) : state.selectedUsers.delete(userId);
            });
            
            dom.tableBody.appendChild(row);
        });
    },

    updatePagination() {
        const totalPages = Math.ceil(state.totalUsers / state.itemsPerPage);
        
        dom.prevPageBtn.disabled = state.currentPage === 1;
        dom.nextPageBtn.disabled = state.currentPage >= totalPages;
        dom.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    },

    showCreateUserModal() {
        dom.createUserForm.reset();
        
        // Set up form submission handler
        dom.createUserForm.onsubmit = (e) => this.handleCreateFormSubmit(e);
        
        dom.createUserModal.style.display = 'block';
    },
    
    async handleCreateFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        
        try {
            this.showLoading();
            
            // Basic validation
            if (!form.elements['email'].value || !form.elements['password'].value) {
                throw new Error('Email and password are required');
            }
            
            const userData = {
                email: form.elements['email'].value,
                password: form.elements['password'].value,
                first_name: form.elements['first_name'].value,
                last_name: form.elements['last_name'].value,
                role: form.elements['role']?.value || 'employee',
                is_active: form.elements['is_active']?.checked !== false
            };
            
            // Add conditional fields only if they have values
            if (form.elements['contact_number']?.value) {
                userData.contact_number = form.elements['contact_number'].value;
            }
            // ... other conditional fields
            
            const response = await apiService.createUser(userData);
            
            if (response && response.id) {
                this.showToast('User created successfully');
                this.closeModals();
                await this.loadUsers();
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (error) {
            const errorMsg = error.message || 'Failed to create user';
            this.showToast(errorMsg, 'error');
            console.error('Error creating user:', error);
        } finally {
            this.hideLoading();
        }
    },

    editUser(userId) {
        const user = state.users.find(u => u.id === userId);
        if (!user) return;
        
        // Populate the edit form with user data
        const editForm = dom.editUserForm;
        
        // Set form values based on user object
        if (editForm) {
            editForm.elements['first_name'].value = user.first_name;
            editForm.elements['last_name'].value = user.last_name;
            editForm.elements['email'].value = user.email;
            if (editForm.elements['role']) editForm.elements['role'].value = user.role;
            if (editForm.elements['is_active']) editForm.elements['is_active'].checked = user.is_active;
            
            // Store user ID for the update operation
            editForm.dataset.userId = userId;
            
            // Set up the form submission handler
            editForm.onsubmit = (e) => this.handleEditFormSubmit(e);
            
            // Show the edit modal
            dom.editUserModal.style.display = 'block';
        } else {
            this.showToast('Edit form not found', 'error');
        }
    },
    
    async handleEditFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const userId = form.dataset.userId;
        
        try {
            this.showLoading();
            
            // Prepare user data from form
            const userData = {
                first_name: form.elements['first_name'].value,
                last_name: form.elements['last_name'].value,
                email: form.elements['email'].value
            };
            
            // Add optional fields if they exist in the form
            if (form.elements['role']) userData.role = form.elements['role'].value;
            if (form.elements['is_active']) userData.is_active = form.elements['is_active'].checked;
            
            await apiService.updateUser(userId, userData);
            this.showToast('User updated successfully');
            this.closeModals();
            await this.loadUsers();
        } catch (error) {
            this.showToast('Failed to update user', 'error');
            console.error('Error updating user:', error);
        } finally {
            this.hideLoading();
        }
    },

    confirmDeleteUser(userId) {
        const user = state.users.find(u => u.id === userId);
        if (!user) return;
        
        document.getElementById('confirm-title').textContent = 'Delete User';
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete ${user.first_name} ${user.last_name}?`;
        
        // Fix the delete action to use the correct userId
        document.getElementById('confirm-action').onclick = async () => {
            try {
                this.showLoading();
                await apiService.deleteUser(userId);
                this.showToast('User deleted successfully');
                this.closeModals();
                await this.loadUsers();
            } catch (error) {
                this.showToast('Failed to delete user', 'error');
                console.error('Error deleting user:', error);
            } finally {
                this.hideLoading();
            }
        };
        
        dom.confirmModal.style.display = 'block';
    },
    
    logout() {
        // Clear all authentication-related data
        localStorage.clear(); // Clear everything instead of selective removal
        sessionStorage.clear();
        
        // Redirect with cache-busting to ensure fresh page load
        window.location.href = '/login?logout=' + Date.now();
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        dom.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    showLoading() {
        document.body.classList.add('loading');
    },

    hideLoading() {
        document.body.classList.remove('loading');
    },

    prevPage() {
        if (state.currentPage > 1) {
            state.currentPage--;
            this.loadUsers();
        }
    },

    nextPage() {
        const totalPages = Math.ceil(state.totalUsers / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            this.loadUsers();
        }
    }
};

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!localStorage.getItem('access_token')) {
        window.location.href = '/login';
        return;
    }

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Add close buttons functionality for modals
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Initialize the UI
    uiController.init();
});