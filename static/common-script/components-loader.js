document.addEventListener("DOMContentLoaded", function () {
  // Load sidebar component
  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    fetch("/static/components/sidebar.html")
      .then((response) => response.text())
      .then((data) => {
        sidebarContainer.innerHTML = data;
        const token = localStorage.getItem("astrellect_token");
        if (token) {
          fetch("/astrellect/v1/employees/get-me", {
            headers: { "Authorization": `Bearer ${token}` }
          })
            .then(res => {
              if (!res.ok) throw new Error();
              return res.json();
            })
            .then(user => {
              if (user.role && user.role.toLowerCase() === "admin") {
                document.querySelectorAll(".admin-only").forEach(el => {
                  el.style.display = "block";
                });
              }
            })
            .catch(() => {
              // leave admin-only hidden on error or if not admin
            });
        }
        // Highlight the active menu item based on current page
        const currentPage = window.location.pathname.split("/").pop();
        const menuItem = document.getElementById(
          currentPage.split(".")[0] + "-link"
        );
        if (menuItem) {
          menuItem.classList.add("active");
        }
      })
      .catch((error) => console.error("Error loading sidebar:", error));
  }

  // Load header component
  const headerContainer = document.getElementById("header-container");
  if (headerContainer) {
    fetch("/static/components/header.html")
      .then((response) => response.text())
      .then((data) => {
        headerContainer.innerHTML = data;

        // Update user information in the header
        updateUserInfo();
      })
      .catch((error) => console.error("Error loading header:", error));
  }
});

// Function to get user role (placeholder - would be replaced with actual logic)
function getUserRole() {
  // In a real application, this would get the user's role from a session, cookie, or API
  // For demonstration, we're returning 'admin' to show admin features
  return "admin";
}

// Function to update user information in the header (placeholder)
function updateUserInfo() {
  // In a real application, this would update the user information from a session or API
  const userNameElement = document.querySelector(".user-name");
  const userRoleElement = document.querySelector(".user-role");
  const userAvatarElement = document.querySelector(".user-avatar");

  if (userNameElement && userRoleElement) {
    // Example of setting user data from a theoretical API or session
    const userData = {
      name: "John Smith",
      role: "Software Engineer",
      initials: "JS",
    };

    userNameElement.textContent = userData.name;
    userRoleElement.textContent = userData.role;
  }
}

const logout = () => {
  localStorage.removeItem("astrellect_token");
  window.location = "/";
};
