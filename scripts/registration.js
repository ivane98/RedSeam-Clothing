// Configurable API URL
const API_URL = "https://api.redseam.redberryinternship.ge/api/register";

// Utility to set a cookie
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;Secure`;
}

// Clear all error messages
function clearErrors() {
  document.querySelectorAll(".error-message").forEach((div) => {
    div.textContent = "";
  });
}

// Basic frontend validation for UX (only checks required fields)
function validateField(field, errorDiv) {
  const value = field.value.trim();
  let error = "";

  if (
    ["username", "email", "password", "password_confirmation"].includes(
      field.name
    ) &&
    !value
  ) {
    error = "This field is required";
  }

  errorDiv.textContent = error;
  return !error;
}

// Show success message
function showSuccessMessage() {
  const message = document.createElement("div");
  message.textContent = "Registration successful!";
  message.style.position = "fixed";
  message.style.top = "20px";
  message.style.left = "50%";
  message.style.transform = "translateX(-50%)";
  message.style.backgroundColor = "#4caf50";
  message.style.color = "white";
  message.style.padding = "10px 20px";
  message.style.borderRadius = "5px";
  message.style.zIndex = "1000";
  document.body.appendChild(message);
  setTimeout(() => {
    message.remove();
  }, 2000);
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const form = event.target;
  const fields = form.querySelectorAll("input");
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true; // Disable button during submission

  // Optional: Basic frontend validation for UX
  let isValid = true;
  fields.forEach((field) => {
    const errorDiv = document.getElementById(`${field.id}-error`);
    if (!validateField(field, errorDiv)) {
      isValid = false;
    }
  });

  if (!isValid) {
    submitBtn.disabled = false;
    return;
  }

  const formData = new FormData(form);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setCookie("authToken", data.token, 7);
      localStorage.setItem("user", JSON.stringify(data.user));
      showSuccessMessage();
      setTimeout(() => {
        window.location.href = "products.html";
      }, 2000);
    } else if (response.status === 422) {
      const data = await response.json();
      const errors = data.errors || {};
      console.log("Backend errors:", errors);

      // Map backend errors to form fields
      [
        "username",
        "email",
        "password",
        "password_confirmation",
        "avatar",
      ].forEach((field) => {
        const errorDiv = document.getElementById(`${field}-error`);
        if (errors[field] && errors[field].length > 0) {
          errorDiv.textContent = errors[field][0];
        }
      });
    } else {
      alert("An error occurred. Please try again later.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Network error. Please check your connection.");
  } finally {
    submitBtn.disabled = false; // Re-enable button
  }
}

// DOM event listeners
document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  const form = document.querySelector(".frame-3");
  const uploadBtn = document.getElementById("upload-btn");
  const removeBtn = document.getElementById("remove-btn");
  const avatarInput = document.getElementById("avatar");
  const avatarImg = document.querySelector(".ellipse");
  const passwordToggles = document.querySelectorAll(".password-toggle");

  // Logo click handler
  logo.addEventListener("click", () => {
    window.location.href = "products.html";
  });

  // Password toggle
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  // Avatar upload
  uploadBtn.addEventListener("click", () => {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    const errorDiv = document.getElementById("avatar-error");
    if (file) {
      avatarImg.src = URL.createObjectURL(file);
    }
  });

  // Avatar remove
  removeBtn.addEventListener("click", () => {
    avatarInput.value = "";
    avatarImg.src = "images/photo.png";
    document.getElementById("avatar-error").textContent = "";
  });

  // Validate on blur (optional, for UX)
  form.querySelectorAll("input").forEach((field) => {
    field.addEventListener("blur", () => {
      const errorDiv = document.getElementById(`${field.id}-error`);
      validateField(field, errorDiv);
    });
  });

  // Form submission
  form.addEventListener("submit", handleSubmit);
});
