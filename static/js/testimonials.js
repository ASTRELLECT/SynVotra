document.addEventListener('DOMContentLoaded', function() {
    // Debug function to help troubleshoot
    function debugLog(message, data) {
        console.log(`[TESTIMONIALS DEBUG] ${message}`, data);
    }

    // DOM elements
    const testimonialContainer = document.getElementById('testimonial-container');
    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    const testimonialModal = document.getElementById('testimonial-modal');
    const moderationModal = document.getElementById('moderation-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const testimonialForm = document.getElementById('testimonial-form');
    const saveTestimonial = document.getElementById('save-testimonial');
    const testimonialSearch = document.getElementById('testimonial-search');
    const modalTitle = document.getElementById('modal-title');
    const confirmAction = document.getElementById('confirm-action');
    const approveTestimonialBtn = document.getElementById('approve-testimonial');
    const rejectTestimonialBtn = document.getElementById('reject-testimonial');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // Global variables
    let currentUser = null;
    let currentTestimonials = [];
    let currentTestimonialId = null;
    let isEditing = false;
    let currentPage = 1;
    let totalPages = 1;
    let itemsPerPage = 8;
    let inactivityTimer;

    // Initialize the application
    init();

    function init() {
        // Check if we're on login page (don't check auth)
        if (window.location.pathname === '/login') return;

        showAuthLoading();
        setupEventListeners();
        resetInactivityTimer();
        checkAuth().then(() => {
            fetchTestimonials();
        }).catch(err => {
            debugLog("Error during initialization:", err);
            // Don't redirect immediately to allow debugging
            setTimeout(() => {
                removeAuthLoading(); // Make sure we remove the loading overlay
                
                // In development, don't redirect so we can debug
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.warn('Authentication failed but not redirecting (development mode)');
                    alert('Auth error but not redirecting in development mode.');
                    return;
                }
                
                window.location.href = '/';
            }, 2000);
        });
    }

    // Show loading state during auth check
    function showAuthLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'auth-loading';
        loadingEl.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Checking authentication...</p>
        `;
        document.body.appendChild(loadingEl);
    }

    // Remove auth loading
    function removeAuthLoading() {
        const loadingEl = document.querySelector('.auth-loading');
        if (loadingEl) loadingEl.remove();
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Search and filters
        if (testimonialSearch) {
            testimonialSearch.addEventListener('input', filterTestimonials);
        }

        // Pagination controls
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => changePage(-1));
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => changePage(1));
        }

        // Testimonial actions
        if (addTestimonialBtn) {
            addTestimonialBtn.addEventListener('click', () => openTestimonialModal());
        }
        
        if (saveTestimonial) {
            saveTestimonial.addEventListener('click', handleSaveTestimonial);
        }
        
        if (approveTestimonialBtn) {
            approveTestimonialBtn.addEventListener('click', () => updateTestimonialStatus('approved'));
        }
        
        if (rejectTestimonialBtn) {
            rejectTestimonialBtn.addEventListener('click', () => updateTestimonialStatus('rejected'));
        }

        // Star rating selection
        const stars = document.querySelectorAll('#rating-selector .fa-star');
        if (stars.length > 0) {
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    document.getElementById('testimonial-rating').value = rating;
                    updateStarDisplay(rating);
                });
                
                star.addEventListener('mouseover', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    hoverStarDisplay(rating);
                });
                
                star.addEventListener('mouseout', function() {
                    const currentRating = parseInt(document.getElementById('testimonial-rating').value);
                    updateStarDisplay(currentRating);
                });
            });
        }

        // Modal close handlers
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                if (testimonialModal) testimonialModal.style.display = 'none';
                if (moderationModal) moderationModal.style.display = 'none';
                if (confirmModal) confirmModal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', (event) => {
            if (testimonialModal && event.target === testimonialModal) testimonialModal.style.display = 'none';
            if (moderationModal && event.target === moderationModal) moderationModal.style.display = 'none';
            if (confirmModal && event.target === confirmModal) confirmModal.style.display = 'none';
        });

        // Inactivity tracking
        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);
        document.addEventListener('click', resetInactivityTimer);

        // Logout handlers
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        const logoutMenu = document.getElementById('logout-menu');
        if (logoutMenu) {
            logoutMenu.addEventListener('click', logout);
        }

        // Menu navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            if (!item.id.includes('logout')) {
                item.addEventListener('click', function() {
                    const page = this.getAttribute('data-page');
                    if (page) window.location.href = page;
                });
            }
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
                    window.location.href = '/dashboard';
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
    }

    // Check user authentication
    async function checkAuth() {
        try {
            debugLog("Checking authentication");
            
            // Get token from localStorage (check multiple possible token names)
            const token = localStorage.getItem('jwt_token') || 
                          localStorage.getItem('astrellect_token') || 
                          localStorage.getItem('access_token');
            
            if (!token) {
                debugLog("No token found");
                throw new Error("No authentication token found");
            }
            
            debugLog("Token found", token.substring(0, 15) + "...");
            
            // Skip API verification since /astrellect/v1/auth/verify returns 404
            // Just parse the JWT token directly
            const decodedToken = parseJwt(token);
            if (!decodedToken) {
                debugLog("Invalid token format");
                throw new Error("Invalid token format");
            }
            
            debugLog("Decoded token", decodedToken);
            setCurrentUser(decodedToken);
            
            debugLog("Current user set to", currentUser);
            removeAuthLoading();
            
        } catch (error) {
            debugLog("Authentication error:", error);
            console.error('Authentication error:', error);
            throw error; // Let the caller handle the redirect
        }
    }

    // Set current user from token or API response
    function setCurrentUser(userData) {
        currentUser = {
            id: userData.user_id || userData.sub,
            first_name: userData.first_name || userData.given_name || 'User',
            last_name: userData.last_name || userData.family_name || '',
            email: userData.email || '',
            role: userData.role || 'employee'
        };

        // Update UI based on user role
        updateUIForRole(currentUser.role);
        
        // Display user name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
        }
    }

    // Update UI elements based on user role
    function updateUIForRole(role) {
        const adminElements = document.querySelectorAll('.admin-only');
        
        if (role === 'admin' || role === 'manager') {
            adminElements.forEach(el => el.style.display = 'block');
        } else {
            adminElements.forEach(el => el.style.display = 'none');
        }
    }

    // JWT parsing function
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            debugLog("Error parsing JWT:", e);
            return null;
        }
    }

    // Redirect to login page
    function redirectToLogin() {
        logout();
        window.location.href = '/login';
    }

    // Logout functionality
    function logout() {
        // Clear all possible token storage
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('astrellect_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        
        // Clear inactivity timer
        clearTimeout(inactivityTimer);
        
        // Redirect to login
        window.location.href = '/';
    }

    // Inactivity timer
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            alert('Your session will expire soon due to inactivity.');
            setTimeout(() => redirectToLogin(), 60000); // 1 minute warning
        }, 1740000); // 29 minutes (JWT typically expires in 30)
    }

    // Fetch testimonials based on user role
    async function fetchTestimonials() {
        try {
            showLoading();
            
            const token = localStorage.getItem('jwt_token') || 
                          localStorage.getItem('astrellect_token') ||
                          localStorage.getItem('access_token');
            
            // Always use the get-all endpoint without query parameters first
            let url = '/astrellect/v1/testimonials/get-all';
            
            debugLog("Fetching testimonials from URL:", url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 422) {
                    const errorData = await response.json();
                    throw new Error(`Validation error: ${JSON.stringify(errorData)}`);
                }
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            debugLog("API Response:", data);
            
            // Extract testimonials from the response
            let testimonials = [];
            if (Array.isArray(data)) {
                testimonials = data;
            } else if (data.testimonials && Array.isArray(data.testimonials)) {
                testimonials = data.testimonials;
            } else if (data.data && Array.isArray(data.data)) {
                testimonials = data.data;
            } else {
                console.error("Unexpected API response format:", data);
            }
            
            // Store all testimonials
            currentTestimonials = testimonials;
            
            // Filter testimonials based on user role
            if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
                // For regular employees, only show approved testimonials
                currentTestimonials = currentTestimonials.filter(testimonial => 
                    testimonial.status === 'Approved'
                );
            }
            
            // Calculate total pages
            totalPages = Math.max(1, Math.ceil(currentTestimonials.length / itemsPerPage));
            updatePagination();
            
            renderTestimonials();
        } catch (error) {
            console.error('Failed to fetch testimonials:', error);
            showError("Failed to load testimonials. Please try again later.");
        }
    }
    
    // Show loading indicator
    function showLoading() {
        if (testimonialContainer) {
            testimonialContainer.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i> Loading testimonials...
                </div>
            `;
        }
    }
    
    // Show error message
    function showError(message) {
        if (testimonialContainer) {
            testimonialContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }

    // Apply filters to testimonials
    function applyFilters() {
        const searchQuery = testimonialSearch ? testimonialSearch.value.toLowerCase() : '';
        
        return currentTestimonials.filter(testimonial => {
            const matchesSearch = searchQuery === '' || 
                testimonial.title.toLowerCase().includes(searchQuery) || 
                testimonial.content.toLowerCase().includes(searchQuery) ||
                (testimonial.user_name && testimonial.user_name.toLowerCase().includes(searchQuery));
            
            return matchesSearch;
        });
    }
    
    // Filter testimonials
    function filterTestimonials() {
        // Only handle search filtering now
        currentPage = 1;
        renderTestimonials();
    }
    
    // Render testimonials with pagination
    function renderTestimonials() {
        if (!testimonialContainer) return;
        
        const filteredTestimonials = applyFilters();
        
        if (filteredTestimonials.length === 0) {
            testimonialContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments fa-2x"></i>
                    <p>No testimonials found</p>
                </div>
            `;
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredTestimonials.length);
        const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex);
        
        testimonialContainer.innerHTML = '';
        
        paginatedTestimonials.forEach(testimonial => {
            const testimonialCard = document.createElement('div');
            testimonialCard.className = 'testimonial-card';
            testimonialCard.dataset.id = testimonial.id;
            
            // Format date
            const formattedDate = new Date(testimonial.created_at || testimonial.date || new Date()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Generate stars for rating
            const starRating = generateStarRating(testimonial.rating);
            
            // Status badge (only visible to admin/manager)
            const statusBadge = testimonial.status ? 
                `<span class="status-badge ${testimonial.status}">${testimonial.status}</span>` : '';
            
            testimonialCard.innerHTML = `
                <div class="testimonial-header">
                    <div class="user-info">
                        <div class="user-avatar">
                            <img src="${testimonial.avatar || '/static/uploads/avatars/default.png'}" alt="User">
                        </div>
                        <div>
                            <div class="user-name">${testimonial.user_name || 'Anonymous'}</div>
                            <div class="testimonial-date">${formattedDate}</div>
                        </div>
                    </div>
                    ${(currentUser?.role === 'admin' || currentUser?.role === 'manager') ? statusBadge : ''}
                </div>
                <h3 class="testimonial-title">${testimonial.title}</h3>
                <div class="testimonial-rating">${starRating}</div>
                <div class="testimonial-content">${testimonial.content}</div>
                <div class="testimonial-actions">
                    ${(currentUser?.id === testimonial.user_id || currentUser?.role === 'admin') ? 
                        `<button class="edit-btn" title="Edit Testimonial">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" title="Delete Testimonial">
                            <i class="fas fa-trash"></i> Delete
                        </button>` : ''}
                    ${(testimonial.status === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'manager')) ? 
                        `<button class="moderate-btn" title="Review Testimonial">
                            <i class="fas fa-check-circle"></i> Review
                        </button>` : ''}
                </div>
            `;
            
            testimonialContainer.appendChild(testimonialCard);
            
            // Add event listeners
            if (currentUser?.id === testimonial.user_id || currentUser?.role === 'admin') {
                const editBtn = testimonialCard.querySelector('.edit-btn');
                const deleteBtn = testimonialCard.querySelector('.delete-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', () => openTestimonialModal(testimonial));
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => openDeleteConfirmation(testimonial.id));
                }
            }
            
            if (testimonial.status === 'pending' && (currentUser?.role === 'admin' || currentUser?.role === 'manager')) {
                const moderateBtn = testimonialCard.querySelector('.moderate-btn');
                if (moderateBtn) {
                    moderateBtn.addEventListener('click', () => openModerationModal(testimonial));
                }
            }
        });
        
        // Update pagination display
        updatePagination();
    }
    
    // Generate HTML for star rating display
    function generateStarRating(rating) {
        rating = parseInt(rating) || 0;
        let stars = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
    
    // Update star display in the form
    function updateStarDisplay(rating) {
        const stars = document.querySelectorAll('#rating-selector .fa-star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star active';
            } else {
                star.className = 'fas fa-star';
            }
        });
    }
    
    // Hover effect for star rating
    function hoverStarDisplay(rating) {
        const stars = document.querySelectorAll('#rating-selector .fa-star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star active';
            } else {
                star.className = 'fas fa-star';
            }
        });
    }
    
    // Update pagination UI
    function updatePagination() {
        if (!pageInfo || !prevPageBtn || !nextPageBtn) return;
        
        const filteredCount = applyFilters().length;
        totalPages = Math.max(1, Math.ceil(filteredCount / itemsPerPage));
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }
    
    // Change page
    function changePage(direction) {
        const newPage = currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderTestimonials();
        }
    }
    
    // Open testimonial modal for adding or editing
    function openTestimonialModal(testimonial = null) {
        isEditing = !!testimonial;
        currentTestimonialId = testimonial ? testimonial.id : null;
        
        // Update modal title
        modalTitle.innerHTML = isEditing ? 
            '<i class="fas fa-edit"></i> Edit Your Testimonial' : 
            '<i class="fas fa-comment-dots"></i> Add Your Testimonial';
        
        // Update button text
        saveTestimonial.textContent = isEditing ? 'Update Testimonial' : 'Submit Testimonial';
        
        // Reset form
        testimonialForm.reset();
        updateStarDisplay(5); // Default rating
        
        // Check if we need to show/hide the status dropdown for admin/manager
        const statusFieldContainer = document.getElementById('testimonial-status-container');
        if (statusFieldContainer) {
            if (isEditing && (currentUser?.role === 'admin' || currentUser?.role === 'manager')) {
                statusFieldContainer.style.display = 'block';
                
                // Make sure the status dropdown has properly capitalized values
                const statusDropdown = document.getElementById('testimonial-status');
                if (statusDropdown) {
                    // Ensure dropdown has correctly capitalized values
                    Array.from(statusDropdown.options).forEach(option => {
                        // Convert first letter to uppercase for each option
                        const value = option.value;
                        if (value) {
                            option.value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                        }
                    });
                }
            } else {
                statusFieldContainer.style.display = 'none';
            }
        }
        
        // If editing, populate form with testimonial data
        if (isEditing) {
            document.getElementById('testimonial-id').value = testimonial.id;
            document.getElementById('testimonial-title').value = testimonial.title || '';
            document.getElementById('testimonial-content').value = testimonial.content;
            
            // Set rating if available
            const rating = testimonial.rating || 5;
            document.getElementById('testimonial-rating').value = rating;
            updateStarDisplay(rating);
            
            // Set status in dropdown if applicable
            const statusDropdown = document.getElementById('testimonial-status');
            if (statusDropdown && testimonial.status) {
                for (let i = 0; i < statusDropdown.options.length; i++) {
                    if (statusDropdown.options[i].value.toLowerCase() === testimonial.status.toLowerCase()) {
                        statusDropdown.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        // Show modal
        testimonialModal.style.display = 'block';
    }
    
    // Open moderation modal for reviewing testimonials
    function openModerationModal(testimonial) {
        currentTestimonialId = testimonial.id;
        
        // Set up moderation modal content
        document.getElementById('review-testimonial-content').innerHTML = `
            <div class="review-testimonial-header">
                <h3>${testimonial.title}</h3>
                <div class="review-user-info">
                    <span class="review-user-name">By: ${testimonial.user_name || 'Anonymous'}</span>
                    <div class="review-rating">${generateStarRating(testimonial.rating)}</div>
                </div>
            </div>
            <div class="review-testimonial-body">
                ${testimonial.content}
            </div>
        `;
        
        // Reset notes field
        document.getElementById('moderation-notes').value = '';
        
        // Show modal
        moderationModal.style.display = 'block';
    }
    
    // Open delete confirmation modal
    function openDeleteConfirmation(testimonialId) {
        currentTestimonialId = testimonialId;
        document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this testimonial? This action cannot be undone.';
        confirmAction.onclick = deleteTestimonial;
        confirmModal.style.display = 'block';
    }
    
    // Handle testimonial save/update
    async function handleSaveTestimonial() {
        try {
            const testimonialId = document.getElementById('testimonial-id').value;
            
            // Only include fields that are present and have been modified
            const updateData = {};
            
            // Only add fields that have values
            const title = document.getElementById('testimonial-title').value.trim();
            if (title) {
                updateData.title = title;
            }
            
            const content = document.getElementById('testimonial-content').value.trim();
            if (content) {
                updateData.content = content;
            }
            
            const ratingElement = document.getElementById('testimonial-rating');
            if (ratingElement && ratingElement.value) {
                updateData.rating = parseInt(ratingElement.value);
            }
            
            // Add status if admin/manager is editing and status dropdown is available
            const statusDropdown = document.getElementById('testimonial-status');
            if (isEditing && 
                (currentUser?.role === 'admin' || currentUser?.role === 'manager') && 
                statusDropdown && 
                statusDropdown.value) {
                // Ensure proper capitalization of status value
                const statusValue = statusDropdown.value;
                updateData.status = statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase();
                debugLog("Setting status to:", updateData.status);
            }
            
            // Ensure we have at least some data to update
            if (Object.keys(updateData).length === 0) {
                alert('Please modify at least one field before saving.');
                return;
            }
            
            const token = localStorage.getItem('jwt_token') || 
                          localStorage.getItem('astrellect_token') ||
                          localStorage.getItem('access_token');
            
            let endpoint, method;
            
            if (isEditing) {
                endpoint = `/astrellect/v1/testimonials/${testimonialId}`;
                method = 'PUT';
                debugLog("Updating testimonial", { id: testimonialId, data: updateData });
            } else {
                // For new testimonials, content is required
                if (!content) {
                    alert('Please enter testimonial content.');
                    return;
                }
                endpoint = '/astrellect/v1/testimonials';
                method = 'POST';
                debugLog("Creating new testimonial", updateData);
            }
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                debugLog("Error response:", errorData);
                throw new Error(`API error: ${response.status} - ${errorData}`);
            }
            
            // Close modal and refresh testimonials
            testimonialModal.style.display = 'none';
            
            // Show success message
            if (isEditing) {
                alert('Testimonial updated successfully.');
            } else {
                alert('Testimonial submitted successfully.');
            }
            
            // Refresh the testimonials list
            fetchTestimonials();
            
        } catch (error) {
            console.error('Error saving testimonial:', error);
            alert('Failed to save testimonial: ' + (error.message || 'Unknown error'));
        }
    }
    
    // Update testimonial status (approve/reject)
    async function updateTestimonialStatus(status) {
        try {
            const notes = document.getElementById('moderation-notes').value.trim();
            
            const token = localStorage.getItem('jwt_token') || 
                          localStorage.getItem('astrellect_token') ||
                          localStorage.getItem('access_token');
            
            // Properly capitalize the status value for the API
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            
            debugLog("Updating testimonial status:", { 
                testimonialId: currentTestimonialId, 
                status: capitalizedStatus, 
                notes: notes 
            });
            
            // Format the request body according to the API's expected structure
            const requestBody = {
                status: capitalizedStatus,
                admin_comments: notes
            };
            
            // Use the correct endpoint from the API documentation with proper formatting
            const response = await fetch(`/astrellect/v1/testimonials/${currentTestimonialId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debugLog("Error response:", errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            // Close modal and refresh testimonials
            moderationModal.style.display = 'none';
            
            // Show success message
            alert(`Testimonial has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
            
            // Refresh the testimonials list - if we were filtering by a status, 
            // reset the filter since the status has changed
            fetchTestimonials();
            
        } catch (error) {
            console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} testimonial:`, error);
            alert(`Failed to ${status === 'approved' ? 'approve' : 'reject'} testimonial: ${error.message}`);
        }
    }
    
    // Delete testimonial
    async function deleteTestimonial() {
        try {
            const token = localStorage.getItem('jwt_token') || 
                          localStorage.getItem('astrellect_token') ||
                          localStorage.getItem('access_token');
            
            // Use the DELETE endpoint from the documentation
            const response = await fetch(`/astrellect/v1/testimonials/${currentTestimonialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            // Close modal and refresh testimonials
            confirmModal.style.display = 'none';
            fetchTestimonials();
            
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            alert('Failed to delete testimonial. Please try again later.');
        }
    }
});
