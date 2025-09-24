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

// Validate form fields
function validateField(field, errorDiv) {
  const value = field.value.trim();
  let error = "";

  if (field.name === "username") {
    if (!value) error = "Username is required";
    else if (value.length < 3) error = "Username must be at least 3 characters";
  } else if (field.name === "email") {
    if (!value) error = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(value))
      error = "Invalid email format";
  } else if (field.name === "password") {
    if (!value) error = "Password is required";
    else if (value.length < 3) error = "Password must be at least 3 characters";
  } else if (field.name === "password_confirmation") {
    const password = document.getElementById("password").value;
    if (!value) error = "Confirm password is required";
    else if (value !== password) error = "Passwords do not match";
  } else if (field.name === "avatar") {
    if (value) {
      const file = field.files[0];
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        error = "Only JPEG or PNG files are allowed";
      } else if (file.size > 1024 * 1024) {
        error = "Avatar must be less than 1MB";
      }
    }
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
  let isValid = true;

  // Validate all fields
  fields.forEach((field) => {
    const errorDiv = document.getElementById(`${field.id}-error`);
    if (!validateField(field, errorDiv)) {
      isValid = false;
    }
  });

  if (!isValid) return;

  const formData = new FormData(form);

  try {
    const response = await fetch(
      "https://api.redseam.redberryinternship.ge/api/register",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      setCookie("authToken", data.token, 7); // Save token to cookie
      localStorage.setItem("user", JSON.stringify(data.user));
      showSuccessMessage();
      setTimeout(() => {
        window.location.href = "products.html"; // Redirect
      }, 2000);
    } else if (response.status === 422) {
      const data = await response.json();
      console.log("Backend errors:", data.errors); // Debug
      const errors = data.errors || {};
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
    alert("Network error. Please check your connection.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".frame-3");
  const uploadBtn = document.getElementById("upload-btn");
  const removeBtn = document.getElementById("remove-btn");
  const avatarInput = document.getElementById("avatar");
  const avatarImg = document.querySelector(".ellipse");
  const passwordToggles = document.querySelectorAll(".password-toggle");

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
    avatarImg.click()
  });
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    const errorDiv = document.getElementById("username-error"); // Use username-error for avatar
    if (file) {
      if (validateField(avatarInput, errorDiv)) {
        avatarImg.src = URL.createObjectURL(file);
        console.log(file);
      } else {
        avatarInput.value = ""; // Clear invalid file
        avatarImg.src = "images/profile-picture-big.png";
      }
    }
  });



  // Avatar remove
  removeBtn.addEventListener("click", () => {
    avatarInput.value = "";
    avatarImg.src = "images/photo.png";
    document.getElementById("username-error").textContent = ""; // Clear avatar error
  });

  // Validate on blur
  form.querySelectorAll("input").forEach((field) => {
    field.addEventListener("blur", () => {
      const errorDiv = document.getElementById(`${field.id}-error`);
      validateField(field, errorDiv);
    });
  });

  // Form submission
  form.addEventListener("submit", handleSubmit);
});
