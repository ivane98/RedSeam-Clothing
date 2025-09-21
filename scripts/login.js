document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const passwordToggle = document.querySelector(".password-toggle");

  // ✅ Success message element
  const successMessage = document.createElement("p");
  successMessage.style.color = "green";
  successMessage.style.marginTop = "10px";
  successMessage.style.textAlign = "center";
  form.appendChild(successMessage);

  // ✅ Toggle password visibility
  passwordToggle.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    successMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let valid = true;

    if (!email) {
      emailError.textContent = "Email is required.";
      valid = false;
    } else if (!isValidEmail(email)) {
      emailError.textContent = "Enter a valid email address.";
      valid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required.";
      valid = false;
    } else if (password.length < 3) {
      passwordError.textContent = "Password must be at least 3 characters.";
      valid = false;
    }

    if (!valid) return;

    try {
      const response = await fetch(
        "https://api.redseam.redberryinternship.ge/api/login",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          passwordError.textContent = "Invalid email or password.";
        } else if (response.status === 422) {
          emailError.textContent = "Please check your input.";
        } else {
          passwordError.textContent = "Something went wrong. Try again.";
        }
        return;
      }

      const data = await response.json();
      const token = data.token;

      // ✅ Store token in cookie
      document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;

      // ✅ Show success message and redirect
      successMessage.textContent = "Login successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "products.html";
      }, 1500);
    } catch (error) {
      passwordError.textContent = "Network error. Please try again.";
      console.error("Login error:", error);
    }
  });
});
