function clearErrors() {
  document.querySelectorAll(".error-message").forEach((div) => {
    div.textContent = "";
    const frame14 = div
      .closest(".frame-13, .frame-16, .frame-17, .frame-18, .frame-19")
      ?.querySelector(".frame-14");
    if (frame14) frame14.classList.remove("has-error");
  });
}

function validateField(field, errorDiv) {
  const value = field.value.trim();
  let error = "";
  const frame14 = errorDiv
    .closest(".frame-13, .frame-16, .frame-17, .frame-18, .frame-19")
    ?.querySelector(".frame-14");

  if (!value) {
    error = "This field is required";
  } else {
    switch (field.name) {
      case "name":
      case "surname":
        if (value.length < 2 || value.length > 50) {
          error = `${
            field.name.charAt(0).toUpperCase() + field.name.slice(1)
          } must be 2-50 characters long`;
        } else if (!/^[A-Za-z\s]+$/.test(value)) {
          error = `${
            field.name.charAt(0).toUpperCase() + field.name.slice(1)
          } can only contain letters and spaces`;
        }
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "address":
        if (value.length < 5 || value.length > 100) {
          error = "Address must be 5-100 characters long";
        }
        break;
      case "zipcode":
        if (!/^\d{5}$/.test(value)) {
          error = "Zip code must be exactly 5 digits";
        }
        break;
    }
  }

  errorDiv.textContent = error;
  if (frame14) {
    if (error) {
      frame14.classList.add("has-error");
    } else {
      frame14.classList.remove("has-error");
    }
  }
  return !error;
}
document.addEventListener("DOMContentLoaded", async () => {
  const authToken = getCookie("authToken");

  const logo = document.querySelector(".div");

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  const userDataString = JSON.parse(localStorage.getItem("user"));

  const avatarImg = document.querySelector(".ellipse");

  if (userDataString && userDataString.avatar && avatarImg && authToken) {
    avatarImg.src = userDataString.avatar;
    avatarImg.alt = `${userDataString.name || "User"} avatar`;
  } else {
    avatarImg.src = "assets/user-icon.png";
    avatarImg.alt = `user avatar`;
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }
  if (userDataString) {
    try {
      console.log("Loaded user data from localStorage:", userDataString);

      const emailInput = document.getElementById("email");
      if (emailInput && userDataString.email) {
        emailInput.value = userDataString.email;
        console.log("Email field prepopulated with:", userDataString.email);
      } else if (!userDataString.email) {
        console.log("No email found in userData; email field remains empty.");
      } else if (!emailInput) {
        console.error("Email input (#email) not found in DOM.");
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
  } else {
    console.log(
      "No user data found in localStorage; email field will remain empty."
    );
  }

  await fetchCartItems(true);

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    const fields = [
      {
        input: document.getElementById("name"),
        error: document.getElementById("name-error"),
      },
      {
        input: document.getElementById("surname"),
        error: document.getElementById("surname-error"),
      },
      {
        input: document.getElementById("email"),
        error: document.getElementById("email-error"),
      },
      {
        input: document.getElementById("address"),
        error: document.getElementById("address-error"),
      },
      {
        input: document.getElementById("zipcode"),
        error: document.getElementById("zipcode-error"),
      },
    ];

    fields.forEach(({ input, error }) => {
      if (input && error) {
        input.addEventListener("input", () => {
          validateField(input, error);
        });
      }
    });
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Pay button clicked, processing checkout...");

      // Clear previous errors
      clearErrors();

      // Validate all fields on frontend
      const fields = [
        {
          input: document.getElementById("name"),
          error: document.getElementById("name-error"),
        },
        {
          input: document.getElementById("surname"),
          error: document.getElementById("surname-error"),
        },
        {
          input: document.getElementById("email"),
          error: document.getElementById("email-error"),
        },
        {
          input: document.getElementById("address"),
          error: document.getElementById("address-error"),
        },
        {
          input: document.getElementById("zipcode"),
          error: document.getElementById("zipcode-error"),
        },
      ];

      let isValid = true;
      fields.forEach(({ input, error }) => {
        if (!validateField(input, error)) {
          isValid = false;
        }
      });

      if (!isValid) {
        // displayFormError("Please correct the errors in the form.");
        return;
      }

      const name = document.getElementById("name").value.trim();
      const surname = document.getElementById("surname").value.trim();
      const email = document.getElementById("email").value.trim();
      const address = document.getElementById("address").value.trim();
      const zipcode = document.getElementById("zipcode").value.trim();

      const cartItems = await fetchCartItems(false); // Don't render, just fetch
      console.log("Cart items:", cartItems);
      if (cartItems.length === 0) {
        displayFormError("Your cart is empty. Add items before checking out.");
        return;
      }

      const authToken = getCookie("authToken");
      if (!authToken) {
        displayFormError("Please log in to complete checkout.");
        return;
      }

      const formData = {
        name,
        surname,
        email,
        zip_code: zipcode,
        address,
      };
      console.log("Checkout form data:", formData);

      try {
        const response = await fetch(
          "https://api.redseam.redberryinternship.ge/api/cart/checkout",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 422 || response.status === 400) {
            // Handle field-specific validation errors from backend
            if (errorData.errors) {
              Object.keys(errorData.errors).forEach((field) => {
                const errorDiv = document.getElementById(`${field}-error`);
                if (errorDiv) {
                  errorDiv.textContent =
                    errorData.errors[field][0] || "Invalid input";
                }
              });
              displayFormError("Please correct the errors in the form.");
            } else {
              throw new Error(
                `Checkout failed: ${errorData.message || response.status}`
              );
            }
            return;
          }
          throw new Error(
            `Checkout failed: ${errorData.message || response.status}`
          );
        }

        const responseData = await response.json();
        console.log("Checkout successful:", responseData);

        const modal = document.getElementById("congratulatory-modal");
        if (modal) {
          modal.classList.add("visible");
          console.log("Congratulatory modal displayed");
        } else {
          console.error(
            "Congratulatory modal (#congratulatory-modal) not found"
          );
          alert("Checkout successful! Your cart has been cleared.");
        }

        await fetchCartItems(true);
        checkoutForm.reset();
      } catch (error) {
        console.error("Error during checkout:", error);
        if (error.message.includes("422") || error.message.includes("400")) {
          console.log("Retrying checkout with empty body...");
          try {
            const retryResponse = await fetch(
              "https://api.redseam.redberryinternship.ge/api/cart/checkout",
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: null,
              }
            );
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json();
              if (
                retryResponse.status === 422 ||
                retryResponse.status === 400
              ) {
                // Handle field-specific validation errors from backend retry
                if (retryErrorData.errors) {
                  Object.keys(retryErrorData.errors).forEach((field) => {
                    const errorDiv = document.getElementById(`${field}-error`);
                    if (errorDiv) {
                      errorDiv.textContent =
                        retryErrorData.errors[field][0] || "Invalid input";
                    }
                  });
                  displayFormError("Please correct the errors in the form.");
                } else {
                  throw new Error(
                    `Checkout failed: ${
                      retryErrorData.message || retryResponse.status
                    }`
                  );
                }
                return;
              }
              throw new Error(
                `Checkout failed: ${
                  retryErrorData.message || retryResponse.status
                }`
              );
            }

            const retryData = await retryResponse.json();
            console.log("Checkout successful (empty body):", retryData);

            const modal = document.getElementById("congratulatory-modal");
            if (modal) {
              modal.classList.add("visible");
              console.log("Congratulatory modal displayed (empty body)");
            } else {
              console.error(
                "Congratulatory modal (#congratulatory-modal) not found"
              );
              alert("Checkout successful! Your cart has been cleared.");
            }

            await fetchCartItems(true);
            checkoutForm.reset();
          } catch (retryError) {
            console.error("Error during retry checkout:", retryError);
            displayFormError(`Checkout failed: ${retryError.message}`);
          }
        } else {
          displayFormError(`Checkout failed: ${error.message}`);
        }
      }
    });

    const closeModalButton = document.querySelector(".heroicons-mini-x");
    if (closeModalButton) {
      closeModalButton.addEventListener("click", () => {
        const modal = document.getElementById("congratulatory-modal");
        if (modal) {
          modal.classList.remove("visible");
          window.location.href = "index.html";
          console.log("Congratulatory modal closed via close button");
        }
      });
    } else {
      console.warn("Close modal button (.heroicons-mini-x) not found");
    }
    const continueButton = document.querySelector(".success .primary");
    if (continueButton) {
      continueButton.addEventListener("click", () => {
        const modal = document.getElementById("congratulatory-modal");
        if (modal) {
          modal.classList.remove("visible");
          console.log("Congratulatory modal closed via Continue shopping");
          window.location.href = "index.html";
        }
      });
    } else {
      console.warn("Continue shopping button (.success .primary) not found");
    }

    const modal = document.getElementById("congratulatory-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("visible");
          console.log("Congratulatory modal closed by clicking outside");
        }
      });
    } else {
      console.warn("Congratulatory modal (#congratulatory-modal) not found");
    }
  } else {
    console.error("Checkout form (#checkout-form) not found.");
  }
});

async function fetchCartItems(render = true) {
  const authToken = getCookie("authToken");
  if (!authToken) {
    console.error("No auth token found");
    if (render) displayCartError("Please log in to view your cart.");
    return [];
  }

  try {
    const response = await fetch(
      "https://api.redseam.redberryinternship.ge/api/cart",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const cartItems = await response.json();
    console.log("Fetched cart items:", cartItems);
    if (render) displayCartItems(cartItems);
    return cartItems;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    if (render)
      displayCartError("Failed to load cart items. Please try again.");
    return [];
  }
}

function displayCartItems(cartItems) {
  const cartContainer = document.querySelector(".cart-items-container");
  const orderSummary = document.querySelector(".frame-12");

  if (!cartContainer || !orderSummary) {
    console.error(
      "Cart container (.frame-3) or order summary (.frame-12) not found:",
      { cartContainer, orderSummary }
    );
    return;
  }

  cartContainer.innerHTML = "";

  if (cartItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart";
    cartContainer.appendChild(emptyMessage);
    updateOrderSummary(0);
    return;
  }

  cartItems.forEach((item, index) => {
    const colorIndex = item.available_colors?.indexOf(item.color) || 0;
    const itemImage =
      colorIndex !== -1 && item.images?.[colorIndex]
        ? item.images[colorIndex]
        : item.main_image || item.images?.[0] || "/assets/fallback.png";

    const uniqueId = `${item.id || index}-${item.color || "N/A"}-${
      item.size || "N/A"
    }`;
    console.log(
      `Rendering cart item: uniqueId=${uniqueId}, id=${
        item.id || index
      }, color=${item.color || "N/A"}, size=${item.size || "N/A"}`
    );

    const itemElement = document.createElement("article");
    itemElement.className = `frame-4`;
    itemElement.setAttribute("aria-label", `Cart item ${index + 1}`);
    itemElement.setAttribute("data-unique-id", uniqueId);
    itemElement.innerHTML = `
      <img
        class="rectangle"
        src="${itemImage}"
        alt="${toCapitalCase(item.name) || "Product"}"
      />
      <div class="frame-5">
        <div class="frame-6">
          <div class="frame-7">
            <div class="kids-curved-hilfiger-wrapper">
              <h3 class="kids-curved-hilfiger">${
                toCapitalCase(item.name) || "Unknown Product"
              }</h3>
            </div>
            <div class="text-wrapper-2">${
              toCapitalCase(item.color) || "N/A"
            }</div>
            <div class="text-wrapper-2">${(
              item.size || "N/A"
            ).toUpperCase()}</div>
          </div>
          <div class="div-wrapper">
            <div class="text-wrapper-3">$${item.price ? item.price : "0"}</div>
          </div>
        </div>
        <div class="frame-8">
          <div class="frame-9" role="group" aria-label="Quantity controls">
            <button
              type="button"
              class="quantity-button"
              aria-label="Decrease quantity"
              data-unique-id="${uniqueId}"
              data-action="decrease"
            >
              <img class="img-3" src="/assets/minus.png" alt="" />
            </button>
            <div class="frame-10">
              <span class="text-wrapper-4" aria-label="Quantity">${
                item.quantity || 1
              }</span>
            </div>
            <button
              type="button"
              class="quantity-button"
              aria-label="Increase quantity"
              data-unique-id="${uniqueId}"
              data-action="increase"
            >
              <img class="img-3" src="/assets/plus.png" alt="" />
            </button>
          </div>
          <div class="frame-11">
            <button type="button" class="remove-button" data-unique-id="${uniqueId}">
              <span class="text-wrapper-5">Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;
    cartContainer.appendChild(itemElement);
    addCartItemEventListeners(
      uniqueId,
      item.id || index,
      item.color || "N/A",
      item.size || "N/A"
    );
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.total_price || item.price * item.quantity || 0),
    0
  );
  updateOrderSummary(subtotal);
}

function updateOrderSummary(subtotal) {
  const orderSummary = document.querySelector(".frame-12");
  if (!orderSummary) {
    console.error("Order summary (.frame-12) not found");
    return;
  }

  const delivery = 5;
  const total = subtotal + delivery;

  orderSummary.innerHTML = `
    <div class="frame-8">
      <div class="text-wrapper-6">Items subtotal</div>
      <div class="text-wrapper-7">$${subtotal.toFixed(2)}</div>
    </div>
    <div class="frame-8">
      <div class="text-wrapper-6">Delivery</div>
      <div class="text-wrapper-7">$${delivery.toFixed(2)}</div>
    </div>
    <div class="frame-8">
      <div class="text-wrapper-8">Total</div>
      <div class="text-wrapper-8">$${total.toFixed(2)}</div>
    </div>
  `;
}

function displayCartError(message) {
  const cartContainer = document.querySelector(".cart-items-container");
  const orderSummary = document.querySelector(".frame-12");
  if (!cartContainer || !orderSummary) {
    console.error(
      "Cart container (.cart-items-container) or order summary (.frame-12) not found"
    );
    return;
  }

  cartContainer.innerHTML = "";
  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message";
  errorMessage.textContent = message;
  cartContainer.appendChild(errorMessage);
  updateOrderSummary(0);
}

function addCartItemEventListeners(uniqueId, itemId, color, size) {
  const cartItem = document.querySelector(
    `.frame-4[data-unique-id="${uniqueId}"]`
  );

  if (!cartItem) {
    console.warn(`Cart item not found for uniqueId: ${uniqueId}`);
    return;
  }
  const decreaseButton = cartItem.querySelector(
    `.quantity-button[data-action="decrease"][data-unique-id="${uniqueId}"]`
  );
  const increaseButton = cartItem.querySelector(
    `.quantity-button[data-action="increase"][data-unique-id="${uniqueId}"]`
  );
  const removeButton = cartItem.querySelector(
    `.remove-button[data-unique-id="${uniqueId}"]`
  );
  const quantityElement = cartItem.querySelector(
    ".frame-9 .frame-10 .text-wrapper-4"
  );

  if (!decreaseButton || !increaseButton || !quantityElement) {
    console.warn(`Required elements not found for uniqueId: ${uniqueId}`, {
      decreaseButton,
      increaseButton,
      quantityElement,
    });
    return;
  }

  [decreaseButton, increaseButton].forEach((button) => {
    button.addEventListener("click", async () => {
      let currentQuantity = parseInt(quantityElement.textContent, 10);
      const action = button.getAttribute("data-action");

      if (action === "increase") {
        currentQuantity += 1;
      } else if (action === "decrease" && currentQuantity > 1) {
        currentQuantity -= 1;
      } else {
        return;
      }

      console.log(
        `Initiating quantity update for uniqueId: ${uniqueId}, itemId: ${itemId}, color: ${color}, size: ${size}, new quantity: ${currentQuantity}`
      );
      try {
        const authToken = getCookie("authToken");
        if (!authToken) throw new Error("Please log in to update cart.");

        const requestBody = {
          quantity: currentQuantity,
          color: color !== "N/A" ? color : undefined,
          size: size !== "N/A" ? size : undefined,
        };
        console.log("PATCH request body:", requestBody);

        const response = await fetch(
          `https://api.redseam.redberryinternship.ge/api/cart/products/${itemId}`,
          {
            method: "PATCH",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to update quantity: ${response.status} ${
              errorData.message || ""
            }`
          );
        }

        console.log(
          `Successfully updated item ${itemId} (color: ${color}, size: ${size}) to quantity ${currentQuantity}`
        );
        quantityElement.textContent = currentQuantity;
        await fetchCartItems();
      } catch (error) {
        console.error("Error updating quantity:", error);
        displayCartError("Failed to update quantity. Please try again.");
      }
    });
  });

  if (removeButton) {
    removeButton.addEventListener("click", async () => {
      console.log(`Removing item ${itemId} (color: ${color}, size: ${size})`);
      try {
        const authToken = getCookie("authToken");
        if (!authToken) throw new Error("Please log in to remove items.");

        const response = await fetch(
          `https://api.redseam.redberryinternship.ge/api/cart/products/${itemId}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              color: color !== "N/A" ? color : undefined,
              size: size !== "N/A" ? size : undefined,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to remove item: ${response.status} ${
              errorData.message || ""
            }`
          );
        }

        console.log(
          `Successfully removed item ${itemId} (color: ${color}, size: ${size})`
        );
        await fetchCartItems();
      } catch (error) {
        console.error("Error removing item:", error);
        displayCartError("Failed to remove item. Please try again.");
      }
    });
  } else {
    console.warn(`Remove button not found for uniqueId: ${uniqueId}`);
  }
}

function displayFormError(message) {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const existingError = form.querySelector(".error-message");
  if (existingError) existingError.remove();

  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message";
  errorMessage.textContent = message;
  errorMessage.style.color = "var(--red)";
  errorMessage.style.marginTop = "10px";
  errorMessage.style.fontFamily = '"Poppins", Helvetica';
  errorMessage.style.fontSize = "14px";
  form.appendChild(errorMessage);
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function toCapitalCase(str) {
  return str
    ? str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";
}
