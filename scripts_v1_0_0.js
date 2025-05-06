const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

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
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ contact_number: newNumber })
  })
    .then(res => {
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    })
    .then(() => {
      document.getElementById('contact-number').value = newNumber;
      document.getElementById('verified-msg').style.display = "inline-block";
      document.getElementById('update-msg').innerText = "Number updated!";
    })
    .catch(err => {
      console.error("Contact update error:", err);
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

let selectedAvatarId = null;

function loadAvatars() {
  fetch(`/astrellect/v1/employees/${userId}/avatars`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("avatar-list");
      container.innerHTML = "";

      data.avatars.forEach(avatar => {
        const img = document.createElement("img");
        img.src = avatar.url;
        img.alt = avatar.name;
        img.className = "avatar-option";
        img.onclick = () => {
          selectedAvatarId = avatar.id;
          highlightSelected(img);
        };
        container.appendChild(img);
      });
    })
    .catch(err => {
      console.error("Failed to load avatars:", err);
    });
}

function highlightSelected(selectedImg) {
  const allAvatars = document.querySelectorAll(".avatar-option");
  allAvatars.forEach(img => img.style.border = "2px solid transparent");
  selectedImg.style.border = "2px solid blue";
}

function uploadProfilePicture() {
  if (!selectedAvatarId) {
    alert("Please select an avatar first.");
    return;
  }

  fetch("/astrellect/v1/employees/profile-picture", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ avatar_id: selectedAvatarId })
  })
    .then(res => res.json())
    .then(data => {
      alert("Profile picture updated!");
      document.getElementById("toast").style.display = "block";
      setTimeout(() => {
        document.getElementById("toast").style.display = "none";
      }, 3000);
    })
    .catch(err => {
      console.error("Upload error:", err);
      alert("Upload failed.");
    });
}

window.onload = () => {
  loadAvatars();
};
