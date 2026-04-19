const form = document.getElementById('loginForm');

if (form) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const response = await axios.post(
        "https://webbshop-2026-be-one.vercel.app/auth/login",
        {
          email,
          password
        }
      );

      if (response.status === 200) {
        const token = response.data.token;

        localStorage.setItem("token", token);

        const existingUser = JSON.parse(localStorage.getItem("user"));

        let userData;

        if (existingUser && existingUser.name) {
          userData = {
            name: existingUser.name,
            email
          };
        } else {
          userData = {
            name: email.split("@")[0],
            email
          };
        }

localStorage.setItem("user", JSON.stringify(userData));

        console.log("Logged in");

        window.location.assign("admin.html");
      } else {
        alert("Invalid email or password.");
      }

    } catch (error) {
      console.error(error.response?.data || error);
      alert("Login failed.");
    }
  });
}