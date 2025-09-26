const API_URL = "https://api.redseam.redberryinternship.ge/api/register";

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;Secure`;
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((div) => {
    div.textContent = "";
  });
}

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

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const form = event.target;
  const fields = form.querySelectorAll("input");
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true; 

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

  const avatarInput = form.querySelector("#avatar");
  if (avatarInput && avatarInput.files[0]) {
    const file = avatarInput.files[0];
    const maxSize = 1 * 1024 * 1024; // 1 MB
    if (file.size > maxSize) {
      const errorDiv = document.getElementById(`avatar-error`);

      errorDiv.textContent = "Image size must be less than 1MB";
      errorDiv.style.display = "flex";

      submitBtn.disabled = false;
      return;
    }
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
        window.location.href = "index.html";
      }, 2000);
    } else if (response.status === 413 || response.status === 422) {
      const data = await response.json();
      const errors = data.errors || {};
      console.log("Backend errors:", errors);

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
    submitBtn.disabled = false; 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".logo");
  const form = document.querySelector(".frame-3");
  const uploadBtn = document.getElementById("upload-btn");
  const removeBtn = document.getElementById("remove-btn");
  const avatarInput = document.getElementById("avatar");
  const avatarImg = document.querySelector(".ellipse");
  const passwordToggles = document.querySelectorAll(".password-toggle");
  const photo = document.querySelector(".ellipse");

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  uploadBtn.addEventListener("click", () => {
    avatarInput.click();
  });

  photo.addEventListener("click", () => {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    console.log(file.type);
    console.log("image/png");
    if (
      file.type !== "image/png" &&
      file.type !== "image/jpeg" &&
      file.type !== "image/svg+xml" &&
      file.type !== "image/gif"
    ) {
      alert("File should be of valid Image Type ");
      return;
    }
    const errorDiv = document.getElementById("avatar-error");
    if (file) {
      avatarImg.src = URL.createObjectURL(file);
    }
  });

  removeBtn.addEventListener("click", () => {
    avatarInput.value = "";
    avatarImg.src = "images/photo.png";
    document.getElementById("avatar-error").textContent = "";
    document.getElementById("avatar-error").style.display = "none";
  });

  form.querySelectorAll("input").forEach((field) => {
    field.addEventListener("blur", () => {
      const errorDiv = document.getElementById(`${field.id}-error`);
      validateField(field, errorDiv);
    });
  });

  form.addEventListener("submit", handleSubmit);
});
