document.addEventListener('DOMContentLoaded', function() {
    // Load user data and dashboard stats
    loadUserData();
    loadDashboardStats();
    loadRecentAnnouncements();
    loadRecentTestimonials();

    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    
    // Navigation handling
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
});

async function loadUserData() {
    try {
        const response = await fetch('/astrellect/v1/employees/get-me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        
        // Update UI with user data
        document.getElementById('userName').textContent = 
            `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
            
        if (userData.profile_picture_url) {
            document.getElementById('userAvatar').src = userData.profile_picture_url;
            document.getElementById('profileAvatar').src = userData.profile_picture_url;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
    }
}

async function loadDashboardStats() {
    try {
        // Fetch all necessary data in parallel
        const [employeesRes, announcementsRes, testimonialsRes, policiesRes] = await Promise.all([
            fetch('/astrellect/v1/employees/getall', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/astrellect/v1/announcement/get-all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/astrellect/v1/testimonials/get-all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/astrellect/v1/policy/getall', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);

        if (!employeesRes.ok || !announcementsRes.ok || !testimonialsRes.ok || !policiesRes.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        const employeesData = await employeesRes.json();
        const announcementsData = await announcementsRes.json();
        const testimonialsData = await testimonialsRes.json();
        const policiesData = await policiesRes.json();

        // Update UI with counts
        document.getElementById('employeeCount').textContent = employeesData.result.length;
        document.getElementById('announcementCount').textContent = announcementsData.announcements.length;
        document.getElementById('testimonialCount').textContent = testimonialsData.testimonials.length;
        document.getElementById('policyCount').textContent = policiesData.company_policies.length;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Failed to load dashboard statistics', 'error');
    }
}

async function loadRecentAnnouncements() {
    try {
        const response = await fetch('/astrellect/v1/announcement/get-all?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recent announcements');
        }
        
        const data = await response.json();
        const announcementsContainer = document.getElementById('recentAnnouncements');
        
        if (data.announcements.length === 0) {
            announcementsContainer.innerHTML = '<p>No announcements found</p>';
            return;
        }
        
        announcementsContainer.innerHTML = data.announcements.map(announcement => `
            <div class="announcement-item">
                <h3 class="announcement-title">${announcement.title}</h3>
                <div class="announcement-date">${new Date(announcement.created_at).toLocaleDateString()}</div>
                <p class="announcement-content">${announcement.content || 'No content provided'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent announcements:', error);
        document.getElementById('recentAnnouncements').innerHTML = 
            '<p class="error-message">Failed to load announcements</p>';
    }
}

async function loadRecentTestimonials() {
    try {
        const response = await fetch('/astrellect/v1/testimonials/get-all?limit=5', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recent testimonials');
        }
        
        const data = await response.json();
        const testimonialsContainer = document.getElementById('recentTestimonials');
        
        if (data.testimonials.length === 0) {
            testimonialsContainer.innerHTML = '<p>No testimonials found</p>';
            return;
        }
        
        testimonialsContainer.innerHTML = data.testimonials.map(testimonial => `
            <div class="testimonial-item">
                <p class="testimonial-content">"${testimonial.content}"</p>
                <div class="testimonial-author">- ${testimonial.user_id}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent testimonials:', error);
        document.getElementById('recentTestimonials').innerHTML = 
            '<p class="error-message">Failed to load testimonials</p>';
    }
}

function navigateToPage(page) {
    // Hide all content pages
    document.querySelectorAll('.content-page').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show the selected page
    const pageElement = document.getElementById(`${page}-page`);
    
    if (pageElement) {
        pageElement.classList.add('active');
        
        // If the page is empty, load it dynamically
        if (pageElement.innerHTML.trim() === '') {
            loadPageContent(page);
        }
    }
    
    // Update active nav item
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`).parentElement.classList.add('active');
}

async function loadPageContent(page) {
    try {
        const response = await fetch(`pages/${page}.html`);
        
        if (!response.ok) {
            throw new Error('Page not found');
        }
        
        const html = await response.text();
        document.getElementById(`${page}-page`).innerHTML = html;
        
        // Load the corresponding JS file
        const script = document.createElement('script');
        script.src = `scripts/${page}.js`;
        document.body.appendChild(script);
    } catch (error) {
        console.error(`Error loading ${page} page:`, error);
        document.getElementById(`${page}-page`).innerHTML = `
            <div class="error-container">
                <h2>Error loading page</h2>
                <p>Failed to load ${page} content. Please try again later.</p>
            </div>
        `;
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}