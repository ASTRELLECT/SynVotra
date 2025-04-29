// logout.js

// DOM Elements (make sure they exist in the page)
const loginFormEl = document.getElementById("loginForm");
const loggedInSectionEl = document.getElementById("loggedInSection");
const loginMessageEl = document.getElementById("loginMessage");

// Logout function
function logout() {
  localStorage.removeItem("astrellect_token");
  if (loginFormEl && loggedInSectionEl) {
    loginFormEl.style.display = "block";
    loggedInSectionEl.style.display = "none";
  }
  if (loginMessageEl) {
    showMessage("Logged out successfully", "success", loginMessageEl);
  }
}

// Helper function to show message (needs to match your app's style)
function showMessage(message, type, element) {
  const messageEl = document.createElement("div");
  messageEl.className = message ${type};
  messageEl.textContent = message;

  // Clear any existing messages
  element.innerHTML = "";
  element.appendChild(messageEl);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (element.contains(messageEl)) {
      element.removeChild(messageEl);
    }
  }, 5000);
}

// (Optional) You can export logout if using modules
// export { logout };