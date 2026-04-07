const form = document.querySelector("#registerForm");

if (form) {
  const nameInput = document.querySelector("#name");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");

  if (localStorage.getItem("user")) {
    window.location.assign("index.html");
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
      const response = await axios.post("http://localhost:3000/users", {
        name,
        email,
        password
      });

      // SAVE USER (AUTO LOGIN)
      localStorage.setItem("user", JSON.stringify(response.data));

      console.log("Registered & logged in:", response.data);

      window.location.assign("index.html");

    } catch (error) {
      console.error("Error:", error);
      alert("Registration failed.");
    }
  });
}