const loginMessageEl = document.getElementById("loginMessage");
// Logout function
function logout() {
    localStorage.removeItem("astrellect_token");
    loginFormEl.style.display = "block";
    loggedInSectionEl.style.display = "none";
    showMessage("Logged out successfully", "success", loginMessageEl);
}
