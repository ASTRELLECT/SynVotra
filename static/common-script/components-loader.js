document.addEventListener("DOMContentLoaded", function () {
  // Load sidebar component
  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    fetch("/static/components/sidebar.html")
      .then((response) => response.text())
      .then((data) => {
        sidebarContainer.innerHTML = data;

        // Highlight the active menu item based on current page
        const currentPage = window.location.pathname.split("/").pop();
        const menuItem = document.getElementById(
          currentPage.split(".")[0] + "-link"
        );
        if (menuItem) {
          menuItem.classList.add("active");
        }

        // Check user role and show/hide admin elements
        (async () => {
          const userRole = await getUserRole();
          console.info(userRole);
          if (userRole === "admin") {
            const adminElements = document.querySelectorAll(".admin-only");
            adminElements.forEach((element) => {
              element.style.display = "block";
            });
          }
        })();
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
        fetchData();
      })
      .catch((error) => console.error("Error loading header:", error));
  }
});

// Function to get user role (placeholder - would be replaced with actual logic)
async function getUserRole() {
  const token = localStorage.getItem("astrellect_token");

  if (!token) {
    alert("Login session expired");
    return null;
  }

  try {
    const res = await fetch("/astrellect/v1/employees/get-me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch");

    const user = await res.json();
    return user.role?.toLowerCase();
  } catch (err) {
    alert("An error encountered while fetching data");
    return null;
  }
}

async function fetchData() {
  const token = localStorage.getItem("astrellect_token");

  if (!token) {
    console.error("No authentication token found");
    showErrorMessage("Please log in to view your profile");
    return;
  }
  const response = await fetch("/astrellect/v1/employees/get-me", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  const userData = await response.json();
  updateUserInfo(userData);
}

// Function to update user information in the header (placeholder)
function updateUserInfo(userData) {
  // In a real application, this would update the user information from a session or API
  const userNameElement = document.querySelector(".user-name");
  const userRoleElement = document.querySelector(".user-role");
  const userAvatarElement = document.querySelector(".user-avatar");

  if (userNameElement && userRoleElement) {
    // Example of setting user data from a theoretical API or session
    // const userData = {
    //   name: "John Smith",
    //   role: "Software Engineer",
    //   initials: "JS",
    // };

    userNameElement.textContent = userData.first_name;
    userRoleElement.textContent = userData.role;
  }
}

const logout = () => {
  localStorage.removeItem("astrellect_token");
  window.location = "/";
};
