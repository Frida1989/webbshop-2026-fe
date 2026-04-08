function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getUser();
}

function logout() {
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

  const user = getUser();

  if (user) {
    userArea.style.display = 'flex';

    const firstName = user.name ? user.name.split(' ')[0] : 'User';
    userNameEl.textContent = firstName;
    userInitialEl.textContent = user.name
      ? user.name[0].toUpperCase()
      : 'U';

    navLinks.querySelectorAll("a").forEach(link => {
      if (
        link.getAttribute("href") === "login.html" ||
        link.getAttribute("href") === "register.html"
      ) {
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
    window.location.assign("index.html");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  protectAuthPages();
  updateUserHeader();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});

// sync between tabs
window.addEventListener("storage", updateUserHeader);