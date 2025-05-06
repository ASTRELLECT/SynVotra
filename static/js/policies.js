document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    const policiesContainer = document.getElementById('policies-container');
    const policyFormModal = document.getElementById('policy-form-modal');
    const policyViewModal = document.getElementById('policy-view-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const policyForm = document.getElementById('policy-form');
    const searchInput = document.getElementById('policy-search');
    const categoryFilter = document.getElementById('category-filter');
    const addPolicyBtn = document.getElementById('add-policy-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // File upload elements
    const policyFileInput = document.getElementById('policy-file');
    const fileNameDisplay = document.querySelector('.file-name');
    const fileUploadButton = document.querySelector('.file-upload-button');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 9;
    
    // Filter state
    let currentSearchTerm = '';
    let currentCategoryFilter = 'all';
    
    // Current policy for editing
    let currentPolicyId = null;
    
    // User role and authentication
    let isAdmin = false;
    let currentUser = null;
    
    // Check user authentication and role
    async function checkUserAuth() {
        try {
            const userResponse = await fetch('/astrellect/v1/users/me');
            if (userResponse.ok) {
                currentUser = await userResponse.json();
                
                // Check if user is admin
                if (currentUser && currentUser.role === 'admin') {
                    isAdmin = true;
                    document.body.classList.add('is-admin');
                }
            } else {
                // Handle unauthenticated user
                window.location.href = '/login';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking authentication:', error);
            showToast('Authentication error. Please try again later.', 'error');
            return false;
        }
    }
    
    // Initialize the page
    async function init() {
        if (!await checkUserAuth()) return;
        
        setupEventListeners();
        loadPolicies();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Policy form modal
        if (addPolicyBtn) {
            addPolicyBtn.addEventListener('click', openPolicyForm);
        }
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                policyFormModal.style.display = 'none';
                policyViewModal.style.display = 'none';
                confirmModal.style.display = 'none';
            });
        });
        
        // Form submission
        policyForm.addEventListener('submit', submitPolicy);
        
        // File upload
        if (fileUploadButton) {
            fileUploadButton.addEventListener('click', () => {
                policyFileInput.click();
            });
        }
        
        if (policyFileInput) {
            policyFileInput.addEventListener('change', handleFileSelection);
        }
        
        // Search and filters
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        categoryFilter.addEventListener('change', handleCategoryFilter);
        
        // Pagination
        prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
        nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === policyFormModal) policyFormModal.style.display = 'none';
            if (e.target === policyViewModal) policyViewModal.style.display = 'none';
            if (e.target === confirmModal) confirmModal.style.display = 'none';
        });
    }
    
    // Handle file selection
    function handleFileSelection() {
        const fileName = policyFileInput.files[0]?.name || 'No file chosen';
        fileNameDisplay.textContent = fileName;
    }
    
    // Load policies with filtering and pagination
    async function loadPolicies() {
        showLoading();
        
        try {
            // Build query parameters
            let url = `/astrellect/v1/policy/getall?page=${currentPage}&size=${pageSize}`;
            
            if (currentSearchTerm) {
                url += `&search=${encodeURIComponent(currentSearchTerm)}`;
            }
            
            if (currentCategoryFilter !== 'all') {
                url += `&category=${currentCategoryFilter}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch policies');
            }
            
            const data = await response.json();
            
            // Update pagination info
            totalPages = data.totalPages || 1;
            updatePaginationControls();
            
            // Display policies
            displayPolicies(data.items || []);
            
        } catch (error) {
            console.error('Error loading policies:', error);
            showToast('Failed to load policies. Please try again later.', 'error');
            displayEmptyState();
        } finally {
            hideLoading();
        }
    }
    
    // Display policies in the container
    function displayPolicies(policies) {
        policiesContainer.innerHTML = '';
        
        if (!policies.length) {
            displayEmptyState();
            return;
        }
        
        const template = document.getElementById('policy-template');
        
        policies.forEach(policy => {
            const clone = document.importNode(template.content, true);
            const card = clone.querySelector('.policy-card');
            
            // Set policy data
            card.dataset.id = policy.id;
            card.querySelector('.policy-title').textContent = policy.title;
            
            // Set category
            const categoryBadge = card.querySelector('.policy-category');
            categoryBadge.textContent = getCategoryLabel(policy.category);
            categoryBadge.classList.add(policy.category);
            
            card.querySelector('.policy-description').textContent = policy.description;
            
            // Format date
            const date = new Date(policy.createdAt || policy.updatedAt);
            card.querySelector('.date-text').textContent = date.toLocaleDateString();
            
            card.querySelector('.version-text').textContent = policy.version || '1.0';
            
            // Setup buttons
            const viewBtn = card.querySelector('.view-policy-btn');
            viewBtn.addEventListener('click', () => viewPolicy(policy.id));
            
            if (isAdmin) {
                const editBtn = card.querySelector('.edit-policy-btn');
                const deleteBtn = card.querySelector('.delete-policy-btn');
                
                editBtn.addEventListener('click', () => editPolicy(policy.id));
                deleteBtn.addEventListener('click', () => confirmDeletePolicy(policy.id));
            }
            
            policiesContainer.appendChild(clone);
        });
    }
    
    // Get human-readable category name
    function getCategoryLabel(categoryCode) {
        const categories = {
            'hr': 'HR',
            'it': 'IT',
            'safety': 'Safety',
            'finance': 'Finance',
            'general': 'General'
        };
        
        return categories[categoryCode] || 'Other';
    }
    
    // Display empty state
    function displayEmptyState() {
        const emptyTemplate = document.getElementById('empty-state-template');
        const clone = document.importNode(emptyTemplate.content, true);
        policiesContainer.innerHTML = '';
        policiesContainer.appendChild(clone);
    }
    
    // View policy details
    async function viewPolicy(id) {
        showLoading();
        
        try {
            const response = await fetch(`/astrellect/v1/policy/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch policy details');
            }
            
            const policy = await response.json();
            
            // Populate view modal
            document.getElementById('view-policy-title').textContent = policy.title;
            document.querySelector('.policy-view-category').textContent = getCategoryLabel(policy.category);
            document.querySelector('.policy-view-version').textContent = `Version ${policy.version || '1.0'}`;
            
            const date = new Date(policy.createdAt || policy.updatedAt);
            document.querySelector('.policy-view-date').textContent = date.toLocaleDateString();
            
            document.querySelector('.policy-view-content').innerHTML = policy.content;
            
            // Update download link
            const downloadBtn = document.getElementById('download-policy-btn');
            if (policy.fileUrl) {
                downloadBtn.href = policy.fileUrl;
                downloadBtn.style.display = 'inline-flex';
            } else {
                downloadBtn.style.display = 'none';
            }
            
            policyViewModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error fetching policy details:', error);
            showToast('Failed to load policy details. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Open policy form for creation or editing
    async function openPolicyForm() {
        // Reset form and current policy
        policyForm.reset();
        currentPolicyId = null;
        fileNameDisplay.textContent = 'No file chosen';
        
        document.getElementById('form-title').textContent = 'Add New Policy';
        policyFormModal.style.display = 'block';
    }
    
    // Load policy for editing
    async function editPolicy(id) {
        showLoading();
        
        try {
            const response = await fetch(`/astrellect/v1/policy/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch policy for editing');
            }
            
            const policy = await response.json();
            currentPolicyId = id;
            
            // Populate form fields
            document.getElementById('policy-title').value = policy.title;
            document.getElementById('policy-category').value = policy.category;
            document.getElementById('policy-description').value = policy.description;
            document.getElementById('policy-content').value = policy.content;
            document.getElementById('policy-version').value = policy.version || '1.0';
            
            // Update file display if there's a file
            if (policy.fileName) {
                fileNameDisplay.textContent = policy.fileName;
            } else {
                fileNameDisplay.textContent = 'No file chosen';
            }
            
            document.getElementById('form-title').textContent = 'Edit Policy';
            policyFormModal.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading policy for editing:', error);
            showToast('Failed to load policy for editing. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Submit policy (create or update)
    async function submitPolicy(e) {
        e.preventDefault();
        
        // Validate form
        const title = document.getElementById('policy-title').value.trim();
        const category = document.getElementById('policy-category').value;
        const description = document.getElementById('policy-description').value.trim();
        const content = document.getElementById('policy-content').value.trim();
        const version = document.getElementById('policy-version').value.trim();
        const file = policyFileInput.files[0];
        
        if (!title || !category || !description || !content || !version) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        
        showLoading();
        
        try {
            // Create FormData object for file upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('content', content);
            formData.append('version', version);
            
            if (file) {
                formData.append('file', file);
            }
            
            let url = '/astrellect/v1/policy/create_new_policy';
            let method = 'POST';
            
            // If editing an existing policy
            if (currentPolicyId) {
                url = `/astrellect/v1/policy/edit_policy/${currentPolicyId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${currentPolicyId ? 'update' : 'create'} policy`);
            }
            
            policyFormModal.style.display = 'none';
            showToast(`Policy ${currentPolicyId ? 'updated' : 'created'} successfully.`, 'success');
            loadPolicies(); // Reload policies
            
        } catch (error) {
            console.error('Error submitting policy:', error);
            showToast(`Failed to ${currentPolicyId ? 'update' : 'create'} policy. Please try again later.`, 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Confirm delete policy
    function confirmDeletePolicy(id) {
        document.getElementById('confirm-title').textContent = 'Delete Policy';
        document.getElementById('confirm-message').textContent = 
            'Are you sure you want to delete this policy? This action cannot be undone.';
        
        const confirmBtn = document.getElementById('confirm-action');
        confirmBtn.onclick = () => deletePolicy(id);
        
        confirmModal.style.display = 'block';
    }
    
    // Delete policy
    async function deletePolicy(id) {
        showLoading();
        confirmModal.style.display = 'none';
        
        try {
            const response = await fetch(`/astrellect/v1/policy/delete_policy/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete policy');
            }
            
            showToast('Policy deleted successfully.', 'success');
            loadPolicies(); // Reload policies
            
        } catch (error) {
            console.error('Error deleting policy:', error);
            showToast('Failed to delete policy. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Search handler
    function handleSearch() {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1; // Reset to first page when searching
        loadPolicies();
    }
    
    // Category filter handler
    function handleCategoryFilter() {
        currentCategoryFilter = categoryFilter.value;
        currentPage = 1; // Reset to first page when filtering
        loadPolicies();
    }
    
    // Change page
    function changePage(newPage) {
        if (newPage < 1 || newPage > totalPages) return;
        
        currentPage = newPage;
        loadPolicies();
    }
    
    // Update pagination controls
    function updatePaginationControls() {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }
    
    // Show loading state
    function showLoading() {
        document.querySelector('.loading-overlay').classList.add('active');
    }
    
    // Hide loading state
    function hideLoading() {
        document.querySelector('.loading-overlay').classList.remove('active');
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                                type === 'error' ? 'fa-exclamation-circle' : 
                                'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.querySelector('.toast-container').appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    // Debounce function for search input
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
    
    // Initialize the page
    init();
});
