document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    const testimonialContainer = document.getElementById('testimonials-container');
    const testimonialModal = document.getElementById('testimonial-form-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const testimonialForm = document.getElementById('testimonial-form');
    const searchInput = document.getElementById('testimonial-search');
    const statusFilter = document.getElementById('status-filter');
    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 9;
    
    // Filter state
    let currentSearchTerm = '';
    let currentStatusFilter = 'all';
    
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
        loadTestimonials();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Testimonial form modal
        addTestimonialBtn.addEventListener('click', openTestimonialForm);
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                testimonialModal.style.display = 'none';
                confirmModal.style.display = 'none';
            });
        });
        
        // Form submission
        testimonialForm.addEventListener('submit', submitTestimonial);
        
        // Search and filters
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        if (statusFilter) {
            statusFilter.addEventListener('change', handleStatusFilter);
        }
        
        // Pagination
        prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
        nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === testimonialModal) testimonialModal.style.display = 'none';
            if (e.target === confirmModal) confirmModal.style.display = 'none';
        });
    }
    
    // Load testimonials with filtering and pagination
    async function loadTestimonials() {
        showLoading();
        
        try {
            // Build query parameters
            let url = `/astrellect/v1/testimonials/get-all?page=${currentPage}&size=${pageSize}`;
            
            if (currentSearchTerm) {
                url += `&search=${encodeURIComponent(currentSearchTerm)}`;
            }
            
            if (isAdmin && currentStatusFilter !== 'all') {
                url += `&status=${currentStatusFilter}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch testimonials');
            }
            
            const data = await response.json();
            
            // Update pagination info
            totalPages = data.totalPages || 1;
            updatePaginationControls();
            
            // Display testimonials
            displayTestimonials(data.items || []);
            
        } catch (error) {
            console.error('Error loading testimonials:', error);
            showToast('Failed to load testimonials. Please try again later.', 'error');
            displayEmptyState();
        } finally {
            hideLoading();
        }
    }
    
    // Display testimonials in the container
    function displayTestimonials(testimonials) {
        testimonialContainer.innerHTML = '';
        
        if (!testimonials.length) {
            displayEmptyState();
            return;
        }
        
        const template = document.getElementById('testimonial-template');
        
        testimonials.forEach(testimonial => {
            const clone = document.importNode(template.content, true);
            const card = clone.querySelector('.testimonial-card');
            
            // Set testimonial data
            card.dataset.id = testimonial.id;
            card.querySelector('.testimonial-text').textContent = testimonial.text;
            card.querySelector('.employee-name').textContent = testimonial.employeeName || 'Anonymous';
            
            // Format date
            const date = new Date(testimonial.createdAt);
            card.querySelector('.testimonial-date').textContent = date.toLocaleDateString();
            
            // Set status badge if admin
            const statusBadge = card.querySelector('.testimonial-status');
            if (statusBadge) {
                statusBadge.textContent = testimonial.status || 'Pending';
                statusBadge.classList.add(testimonial.status?.toLowerCase() || 'pending');
            }
            
            // Setup admin actions if user is admin
            if (isAdmin) {
                const approveBtn = card.querySelector('.approve-btn');
                const rejectBtn = card.querySelector('.reject-btn');
                const deleteBtn = card.querySelector('.delete-btn');
                
                if (testimonial.status !== 'approved') {
                    approveBtn.addEventListener('click', () => approveTestimonial(testimonial.id));
                } else {
                    approveBtn.disabled = true;
                    approveBtn.style.opacity = '0.5';
                }
                
                if (testimonial.status !== 'rejected') {
                    rejectBtn.addEventListener('click', () => rejectTestimonial(testimonial.id));
                } else {
                    rejectBtn.disabled = true;
                    rejectBtn.style.opacity = '0.5';
                }
                
                deleteBtn.addEventListener('click', () => confirmDeleteTestimonial(testimonial.id));
            }
            
            testimonialContainer.appendChild(clone);
        });
    }
    
    // Display empty state
    function displayEmptyState() {
        const emptyTemplate = document.getElementById('empty-state-template');
        const clone = document.importNode(emptyTemplate.content, true);
        testimonialContainer.innerHTML = '';
        testimonialContainer.appendChild(clone);
    }
    
    // Open testimonial form modal
    function openTestimonialForm() {
        // Reset form
        testimonialForm.reset();
        document.getElementById('form-title').textContent = 'Add Your Testimonial';
        testimonialModal.style.display = 'block';
    }
    
    // Submit testimonial
    async function submitTestimonial(e) {
        e.preventDefault();
        const text = document.getElementById('testimonial-text').value.trim();
        
        if (!text) {
            showToast('Please enter your testimonial.', 'error');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch('/astrellect/v1/testimonials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit testimonial');
            }
            
            testimonialModal.style.display = 'none';
            showToast('Your testimonial has been submitted successfully. It will be visible after approval.', 'success');
            loadTestimonials(); // Reload testimonials
            
        } catch (error) {
            console.error('Error submitting testimonial:', error);
            showToast('Failed to submit testimonial. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Approve testimonial
    async function approveTestimonial(id) {
        showLoading();
        
        try {
            const response = await fetch(`/astrellect/v1/testimonials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'approved' })
            });
            
            if (!response.ok) {
                throw new Error('Failed to approve testimonial');
            }
            
            showToast('Testimonial approved successfully.', 'success');
            loadTestimonials(); // Reload testimonials
            
        } catch (error) {
            console.error('Error approving testimonial:', error);
            showToast('Failed to approve testimonial. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Reject testimonial
    async function rejectTestimonial(id) {
        showLoading();
        
        try {
            const response = await fetch(`/astrellect/v1/testimonials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'rejected' })
            });
            
            if (!response.ok) {
                throw new Error('Failed to reject testimonial');
            }
            
            showToast('Testimonial rejected.', 'info');
            loadTestimonials(); // Reload testimonials
            
        } catch (error) {
            console.error('Error rejecting testimonial:', error);
            showToast('Failed to reject testimonial. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Confirm delete testimonial
    function confirmDeleteTestimonial(id) {
        document.getElementById('confirm-title').textContent = 'Delete Testimonial';
        document.getElementById('confirm-message').textContent = 
            'Are you sure you want to delete this testimonial? This action cannot be undone.';
        
        const confirmBtn = document.getElementById('confirm-action');
        confirmBtn.onclick = () => deleteTestimonial(id);
        
        confirmModal.style.display = 'block';
    }
    
    // Delete testimonial
    async function deleteTestimonial(id) {
        showLoading();
        confirmModal.style.display = 'none';
        
        try {
            const response = await fetch(`/astrellect/v1/testimonials/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete testimonial');
            }
            
            showToast('Testimonial deleted successfully.', 'success');
            loadTestimonials(); // Reload testimonials
            
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            showToast('Failed to delete testimonial. Please try again later.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Search handler
    function handleSearch() {
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1; // Reset to first page when searching
        loadTestimonials();
    }
    
    // Status filter handler
    function handleStatusFilter() {
        currentStatusFilter = statusFilter.value;
        currentPage = 1; // Reset to first page when filtering
        loadTestimonials();
    }
    
    // Change page
    function changePage(newPage) {
        if (newPage < 1 || newPage > totalPages) return;
        
        currentPage = newPage;
        loadTestimonials();
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
