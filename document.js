document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!localStorage.getItem('authToken')) {
        window.location.href = '/index.html';
        return;
    }
    
    // Display user name in header
    document.getElementById('userName').textContent = localStorage.getItem('userName') || 'User';
    
    // Load profile data
    loadProfileData();
    
    // Setup event handlers
    setupEventHandlers();
});

// Function to load profile data from the API
async function loadProfileData() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`/api/employees/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile data');
        }
        
        const data = await response.json();
        displayProfileData(data);
    } catch (error) {
        showToast('Failed to load profile data', 'error');
        console.error('Error loading profile:', error);
    }
}

// Function to display profile data
function displayProfileData(data) {
    // For this example, we'll use mock data
    const profile = {
        id: 'EMP001',
        name: 'John Doe',
        designation: 'Software Engineer',
        email: 'john.doe@synvotra.com',
        contact: '+1 123-456-7890',
        dob: '15 Jan 1990',
        address: '123 Main St, Anytown, AT 12345',
        department: 'Engineering',
        joiningDate: '01 Mar 2020',
        manager: 'Jane Smith',
        profilePicture: '../../assets/images/profile-placeholder.png'
    };
    
    // Update profile info
    document.getElementById('employeeName').textContent = profile.name;
    document.getElementById('employeeDesignation').textContent = profile.designation;
    document.getElementById('employeeId').textContent = profile.id;
    document.getElementById('fullName').textContent = profile.name;
    document.getElementById('dob').textContent = profile.dob;
    document.getElementById('contactNumber').textContent = profile.contact;
    document.getElementById('address').textContent = profile.address;
    document.getElementById('email').textContent = profile.email;
    document.getElementById('designation').textContent = profile.designation;
    document.getElementById('department').textContent = profile.department;
    document.getElementById('joiningDate').textContent = profile.joiningDate;
    document.getElementById('manager').textContent = profile.manager;
    
    // Update profile picture
    document.getElementById('profileImage').src = profile.profilePicture;
}

// Function to setup event handlers
function setupEventHandlers() {
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', openChangePasswordModal);
    }
    
    // Edit contact button
    const editContactBtn = document.getElementById('editContactBtn');
    if (editContactBtn) {
        editContactBtn.addEventListener('click', openVerifyContactModal);
    }
    
    // Profile picture upload
    const uploadProfilePicture = document.getElementById('uploadProfilePicture');
    if (uploadProfilePicture) {
        uploadProfilePicture.addEventListener('change', handleProfilePictureUpload);
    }
    
    // Setup modal event handlers
    setupModalHandlers();
}

// Function to setup modal event handlers
function setupModalHandlers() {
    // Close modals
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Change password form submission
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // Contact update form
    const updateContactForm = document.getElementById('updateContactForm');
    if (updateContactForm) {
        updateContactForm.addEventListener('submit', handleContactUpdate);
    }
    
    // Send verification code button
    const sendVerificationCodeBtn = document.getElementById('sendVerificationCodeBtn');
    if (sendVerificationCodeBtn) {
        sendVerificationCodeBtn.addEventListener('click', sendVerificationCode);
    }
    
    // Resend code button
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener('click', sendVerificationCode);
    }
}

// Function to open change password modal
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Function to open verify contact modal
function openVerifyContactModal() {
    const modal = document.getElementById('verifyContactModal');
    if (modal) {
        modal.classList.add('show');
        
        // Reset form state
        document.getElementById('verificationCodeGroup').style.display = 'none';
        document.getElementById('submitContactUpdateBtn').disabled = true;
    }
}

// Function to close all modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
}

// Function to handle profile picture upload
async function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    try {
        // Create form data for the API
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        // For demo purposes, we'll just update the image locally
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result;
            showToast('Profile picture updated successfully', 'success');
        };
        reader.readAsDataURL(file);
        
        // In a real application, you would upload to the server:
        /*
        const response = await fetch('/api/employees/profile-picture', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload profile picture');
        }
        
        showToast('Profile picture updated successfully', 'success');
        */
    } catch (error) {
        showToast('Failed to update profile picture', 'error');
        console.error('Error uploading profile picture:', error);
    }
}

// Function to handle change password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('changePasswordError');
    
    // Clear previous error messages
    errorElement.textContent = '';
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'New password and confirmation do not match';
        return;
    }
    
    try {
        // For demo purposes, we'll just show a success message
        showToast('Password changed successfully', 'success');
        closeModals();
        
        // In a real application, you would call the API:
        /*
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to change password');
        }
        
        showToast('Password changed successfully', 'success');
        closeModals();
        */
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

// Function to send verification code for contact number update
async function sendVerificationCode() {
    const contactNumber = document.getElementById('newContactNumber').value;
    
    if (!contactNumber) {
        showToast('Please enter a contact number', 'error');
        return;
    }
    
    try {
        // For demo purposes, we'll just show the verification code field
        document.getElementById('verificationCodeGroup').style.display = 'block';
        document.getElementById('submitContactUpdateBtn').disabled = false;
        showToast('Verification code sent', 'success');
        
        // In a real application, you would call the API:
        /*
        const response = await fetch('/api/employees/send-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                contactNumber
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send verification code');
        }
        
        document.getElementById('verificationCodeGroup').style.display = 'block';
        document.getElementById('submitContactUpdateBtn').disabled = false;
        showToast('Verification code sent', 'success');
        */
    } catch (error) {
        showToast('Failed to send verification code', 'error');
    }
}

// Function to handle contact number update
async function handleContactUpdate(event) {
    event.preventDefault();
    
    const contactNumber = document.getElementById('newContactNumber').value;
    const verificationCode = document.getElementById('verificationCode').value;
    const errorElement = document.getElementById('contactUpdateError');
    
    // Clear previous error messages
    errorElement.textContent = '';
    
    if (!verificationCode) {
        errorElement.textContent = 'Please enter the verification code';
        return;
    }
    
    try {
        // For demo purposes, we'll just update the contact number
        document.getElementById('contactNumber').textContent = contactNumber;
        showToast('Contact number updated successfully', 'success');
        closeModals();
        
        // In a real application, you would call the API:
        /*
        const response = await fetch('/api/employees/verify-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                contactNumber,
                verificationCode
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to verify contact number');
        }
        
        // Update the displayed contact number
        document.getElementById('contactNumber').textContent = contactNumber;
        showToast('Contact number updated successfully', 'success');
        closeModals();
        */
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

// Toast notification function (if not already defined in auth.js)
function showToast(message, type = 'success') {
    // Create toast if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set toast type and message
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Show toast
    setTimeout(() => toast.classList.add('active'), 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}
