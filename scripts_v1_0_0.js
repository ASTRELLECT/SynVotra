const userId = localStorage.getItem("user_id");

function enableEdit() {
  document.getElementById('verify-section').classList.remove('hidden');
}

function sendCode() {
  const newNumber = document.getElementById('new-number').value.trim();
  if (!newNumber) return alert("Enter a new number");
  alert(`Verification code sent to ${newNumber}`);
}

function submitContactUpdate() {
  const code = document.getElementById('code-input').value.trim();
  const newNumber = document.getElementById('new-number').value.trim();

  if (code !== "123456") {
    alert("Invalid code. Use 123456 for test.");
    return;
  }

  fetch(`/astrellect/v1/employees/update/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      
    },
    body: JSON.stringify({ phone: newNumber })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById('contact-number').value = newNumber;
    document.getElementById('verified-msg').style.display = "inline-block";
    document.getElementById('update-msg').innerText = "Number updated!";
  })
  .catch(err => {
    console.error(err);
    alert("Failed to update number.");
  });
}

function resendCode() {
  alert("Verification code resent.");
}

function previewImage() {
  const file = document.getElementById('profile-upload').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('preview-pic').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function uploadProfilePicture() {
  const file = document.getElementById("profile-upload").files[0];
  if (!file) return alert("Select an image first");

  const formData = new FormData();
  formData.append("avatar_type", "upload");
  formData.append("profileImage", file);

  fetch("/astrellect/v1/employees/update_profile_picture", {
    method: "PUT",
    body: formData,
    
  })
  .then(res => res.json())
  .then(data => {
    alert("Profile picture uploaded!");
    if (data.newImageUrl) {
      document.getElementById("preview-pic").src = data.newImageUrl;
    }
    document.getElementById("toast").style.display = "block";
    setTimeout(() => {
      document.getElementById("toast").style.display = "none";
    }, 3000);
  })
  .catch(err => {
    console.error(err);
    alert("Upload failed.");
  });
}
