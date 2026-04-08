function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return { name: payload.name, email: payload.email };
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

  const user = getUserFromToken();

  if (user) {
    userArea.style.display = 'flex';
    const firstName = user.name ? user.name.split(' ')[0] : 'User';
    userNameEl.textContent = firstName;
    userInitialEl.textContent = user.name ? user.name[0].toUpperCase() : 'U';

    navLinks.querySelectorAll("a").forEach(link => {
      if (["login.html","register.html"].includes(link.getAttribute("href"))) {
        link.style.display = "none";
      }
    });
  } else {
    userArea.style.display = 'none';
    navLinks.querySelectorAll("a").forEach(link => link.style.display = "inline-block");
  }
}

function protectAuthPages() {
  const path = window.location.pathname;
  if (isLoggedIn() && (path.includes("login.html") || path.includes("register.html"))) {
    window.location.assign("index.html");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  protectAuthPages();
  updateUserHeader();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

window.addEventListener("storage", updateUserHeader);