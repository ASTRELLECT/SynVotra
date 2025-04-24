document.addEventListener('DOMContentLoaded', function() {
    // Load profile data
    loadProfileData();
    
    // Setup event listeners
    document.getElementById('editProfileBtn').addEventListener('click', enableProfileEditing);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileChanges);
    document.getElementById('changePasswordBtn').addEventListener('click', showPasswordModal);
    document.getElementById('changeAvatarBtn').addEventListener('click', showAvatarModal);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
    
    // Confirm avatar selection
    document.getElementById('confirmAvatarBtn').addEventListener('click', updateAvatar);
    
    // Change password
    document.getElementById('submitPasswordBtn').addEventListener('click', changePassword);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

async function loadProfileData() {
    try {
        const response = await fetch('/astrellect/v1/employees/get-me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await response.json();
        
        // Update UI with profile data
        document.getElementById('profileName').textContent = 
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email;
        document.getElementById('profileEmail').textContent = profileData.email;
        document.getElementById('profileRole').textContent = profileData.role || 'Employee';
        
        // Personal Information
        document.getElementById('firstName').value = profileData.first_name || '';
        document.getElementById('lastName').value = profileData.last_name || '';
        document.getElementById('email').value = profileData.email || '';
        document.getElementById('contactNumber').value = profileData.contact_number || '';
        document.getElementById('dob').value = profileData.dob ? profileData.dob.split('T')[0] : '';
        document.getElementById('address').value = profileData.address || '';
        
        // Employment Information
        document.getElementById('employeeId').value = profileData.id || '';
        document.getElementById('role').value = profileData.role || 'Employee';
        document.getElementById('department').value = profileData.department || 'Not specified';
        document.getElementById('joiningDate').value = profileData.joining_date ? profileData.joining_date.split('T')[0] : '';
        
        // Set profile picture
        if (profileData.profile_picture_url) {
            document.getElementById('profileAvatar').src = profileData.profile_picture_url;
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        showToast('Failed to load profile data', 'error');
    }
}

function enableProfileEditing() {
    const editableFields = ['contactNumber', 'dob', 'address'];
    
    editableFields.forEach(field => {
        document.getElementById(field).disabled = false;
    });
    
    document.getElementById('editProfileBtn').disabled = true;
    document.getElementById('saveProfileBtn').disabled = false;
}

async function saveProfileChanges() {
    const updatedData = {
        contact_number: document.getElementById('contactNumber').value,
        dob: document.getElementById('dob').value,
        address: document.getElementById('address').value
    };
    
    try {
        const response = await fetch('/astrellect/v1/employees/update-me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updatedData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        // Disable editing after successful save
        ['contactNumber', 'dob', 'address'].forEach(field => {
            document.getElementById(field).disabled = true;
        });
        
        document.getElementById('editProfileBtn').disabled = false;
        document.getElementById('saveProfileBtn').disabled = true;
        
        showToast('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
}

function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
    // Clear fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function showAvatarModal() {
    document.getElementById('avatarModal').style.display = 'block';
    // Clear any previous selection
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

async function updateAvatar() {
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    
    if (!selectedAvatar) {
        showToast('Please select an avatar', 'error');
        return;
    }
    
    const avatarType = selectedAvatar.getAttribute('data-avatar');
    
    try {
        const response = await fetch('/astrellect/v1/employees/update_profile_picture', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avatar_type: avatarType })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update avatar');
        }
        
        // Close modal and update UI
        document.getElementById('avatarModal').style.display = 'none';
        
        // Reload profile data to show new avatar
        loadProfileData();
        
        showToast('Avatar updated successfully', 'success');
    } catch (error) {
        console.error('Error updating avatar:', error);
        showToast('Failed to update avatar', 'error');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch('/astrellect/v1/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                old_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to change password');
        }
        
        // Close modal and clear fields
        document.getElementById('passwordModal').style.display = 'none';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showToast('Password changed successfully', 'success');
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Failed to change password. Please check your current password.', 'error');
    }
}