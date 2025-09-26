const API_URL = "https://api.redseam.redberryinternship.ge/api/login";

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;Secure;SameSite=Strict`;
}

function clearErrors() {
  document.getElementById("email-error").textContent = "";
  document.getElementById("password-error").textContent = "";
}

function validateField(field, errorElement) {
  const value = field.value.trim();
  let error = "";

  if (["email", "password"].includes(field.name) && !value) {
    error = "This field is required";
  }

  errorElement.textContent = error;
  return !error;
}

function showSuccessMessage() {
  const successMessage = document.createElement("p");
  successMessage.style.color = "green";
  successMessage.style.marginTop = "10px";
  successMessage.style.textAlign = "center";
  successMessage.textContent = "Login successful! Redirecting...";
  document.getElementById("login-form").appendChild(successMessage);
  setTimeout(() => {
    successMessage.remove();
  }, 1500);
}

async function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  const form = e.target;
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true; 

  let isValid = true;
  if (!validateField(emailInput, emailError)) isValid = false;
  if (!validateField(passwordInput, passwordError)) isValid = false;

  if (!isValid) {
    submitBtn.disabled = false;
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      setCookie("authToken", data.token, 7);
      localStorage.setItem("user", JSON.stringify(data.user));
      showSuccessMessage();
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else if (response.status === 422) {
      const data = await response.json();
      const errors = data.errors || {};
      console.log("Backend errors:", errors);

      ["email", "password"].forEach((field) => {
        const errorElement = document.getElementById(`${field}-error`);
        if (errors[field] && errors[field].length > 0) {
          errorElement.textContent = errors[field][0];
        }
      });
    } else if (response.status === 401) {
      passwordError.textContent = "Invalid email or password.";
    } else {
      passwordError.textContent = "Something went wrong. Try again.";
    }
  } catch (error) {
    console.error("Network error:", error);
    passwordError.textContent = "Network error. Please try again.";
  } finally {
    submitBtn.disabled = false; 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  const form = document.getElementById("login-form");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.querySelector(".password-toggle");

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  passwordToggle.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
  });

  form.addEventListener("submit", handleSubmit);

  [
    document.getElementById("email"),
    document.getElementById("password"),
  ].forEach((field) => {
    field.addEventListener("blur", () => {
      const errorElement = document.getElementById(`${field.id}-error`);
      validateField(field, errorElement);
    });
  });
});
