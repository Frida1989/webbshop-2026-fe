function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateUserHeader();
  window.location.assign("index.html");
}

function updateUserHeader() {
  const userArea = document.getElementById('userArea');
  const navLinks = document.querySelector('.nav-links');

  if (!userArea || !navLinks) return;

  const userNameEl = document.getElementById('userName');
  const userInitialEl = document.getElementById('userInitial');

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (token) {
    userArea.style.display = 'flex';

    let displayName = "User";

    if (user) {
      displayName = user.name || user.email || "User";
    }

    const firstName = displayName.split(' ')[0];

    if (userNameEl) userNameEl.textContent = firstName;
    if (userInitialEl) userInitialEl.textContent = displayName[0].toUpperCase();

    navLinks.querySelectorAll("a").forEach(link => {
      if (["login.html","register.html"].includes(link.getAttribute("href"))) {
        link.style.display = "none";
      }
    });

  } else {
    userArea.style.display = 'none';

    navLinks.querySelectorAll("a").forEach(link => {
      link.style.display = "inline-block";
    });
  }
}
function protectAuthPages() {
  const path = window.location.pathname;

  if (isLoggedIn() && (path.includes("login.html") || path.includes("register.html"))) {
    window.location.assign("admin.html");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  protectAuthPages();
  updateUserHeader();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

window.addEventListener("storage", updateUserHeader);