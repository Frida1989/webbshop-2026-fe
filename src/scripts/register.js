const form = document.querySelector("#registerForm");

if (form) {
  const nameInput = document.querySelector("#name");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");

  if (localStorage.getItem("token")) {
    window.location.assign("admin.html");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (name.length < 3) {
      alert("Name must be at least 3 characters long.");
      return;
    }

    try {
      const registerResponse = await axios.post(
        "https://webbshop-2026-be-one.vercel.app/auth/register",
        {
          name,
          email,
          password,
        }
      );

      if (registerResponse.status === 201) {
        console.log("Registration successful");

        const loginResponse = await axios.post(
          "https://webbshop-2026-be-one.vercel.app/auth/login",
          {
            email,
            password,
          }
        );

        if (loginResponse.status === 200) {
          const token = loginResponse.data.token;

          localStorage.setItem("token", token);

          localStorage.setItem("user", JSON.stringify({ name, email }));

          console.log("Registered & logged in:", { name, email });

          window.location.assign("admin.html");
        }
      }

    } catch (error) {
      console.error("Error:", error.response?.data || error);
      alert("Registration or login failed.");
    }
  });
}