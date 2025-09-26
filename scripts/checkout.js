document.addEventListener("DOMContentLoaded", async () => {
  const logo = document.querySelector(".div");

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  // Prepopulate email field from localStorage
  const userDataString = localStorage.getItem("user");

  const avatarImg = document.querySelector(".ellipse");

  if (userDataString && userDataString.avatar && avatarImg) {
    avatarImg.src = userDataString.avatar; // set avatar dynamically
    avatarImg.alt = `${userDataString.name || "User"} avatar`; // accessibility
  } else {
    avatarImg.src = "images/user-icon.png";
    avatarImg.alt = `user avatar`;
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }
  if (userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      console.log("Loaded user data from localStorage:", userData);

      const emailInput = document.getElementById("email");
      if (emailInput && userData.email) {
        emailInput.value = userData.email;
        console.log("Email field prepopulated with:", userData.email);
      } else if (!userData.email) {
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

  // Fetch and display cart items
  await fetchCartItems(true);

  // Handle form submission for Pay button
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Pay button clicked, processing checkout...");

      // Validate form fields
      const name = document.getElementById("name").value.trim();
      const surname = document.getElementById("surname").value.trim();
      const email = document.getElementById("email").value.trim();
      const address = document.getElementById("address").value.trim();
      const zipcode = document.getElementById("zipcode").value.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!name || !surname || !email || !address || !zipcode) {
        displayFormError("All fields are required.");
        return;
      }
      if (!emailRegex.test(email)) {
        displayFormError("Please enter a valid email address.");
        return;
      }

      // Fetch cart items to check if cart is empty
      const cartItems = await fetchCartItems(false); // Don't render, just fetch
      console.log("Cart items:", cartItems);
      if (cartItems.length === 0) {
        displayFormError("Your cart is empty. Add items before checking out.");
        return;
      }

      // Check if cart is empty
      if (cartItems.length === 0) {
        displayFormError("Your cart is empty. Add items before checking out.");
        return;
      }

      // Prepare checkout request
      const authToken = getCookie("authToken");
      if (!authToken) {
        displayFormError("Please log in to complete checkout.");
        return;
      }

      // Prepare form data with API-expected field names
      const formData = {
        name, // Adjust to API's naming convention
        surname,
        email,
        zip_code: zipcode, // Changed from zipcode to zip_code
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
          throw new Error(
            `Checkout failed: ${errorData.message || response.status}`
          );
        }

        const responseData = await response.json();
        console.log("Checkout successful:", responseData);

        // Show congratulatory modal
        const modal = document.getElementById("congratulatory-modal");
        if (modal) {
          modal.classList.add("visible");
          console.log("Congratulatory modal displayed");
        } else {
          console.error(
            "Congratulatory modal (#congratulatory-modal) not found"
          );
          alert("Checkout successful! Your cart has been cleared."); // Fallback
        }

        await fetchCartItems(true); // Refresh to show empty cart
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
              console.error(
                "Retry checkout API error response:",
                retryErrorData
              );
              throw new Error(
                `Checkout failed: ${
                  retryErrorData.message || retryResponse.status
                }`
              );
            }

            const retryData = await retryResponse.json();
            console.log("Checkout successful (empty body):", retryData);

            // Show congratulatory modal
            const modal = document.getElementById("congratulatory-modal");
            if (modal) {
              modal.classList.add("visible");
              console.log("Congratulatory modal displayed (empty body)");
            } else {
              console.error(
                "Congratulatory modal (#congratulatory-modal) not found"
              );
              alert("Checkout successful! Your cart has been cleared."); // Fallback
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

    // Add event listeners for modal close and continue shopping
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
          window.location.href = "index.html"; // Adjust to your shopping page
        }
      });
    } else {
      console.warn("Continue shopping button (.success .primary) not found");
    }

    // Close modal by clicking outside
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

// Fetch cart items from API
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

// Display cart items in .frame-3 and update order summary in .frame-12
function displayCartItems(cartItems) {
  const cartContainer = document.querySelector(".frame-3");
  const orderSummary = document.querySelector(".frame-12");

  if (!cartContainer || !orderSummary) {
    console.error(
      "Cart container (.frame-3) or order summary (.frame-12) not found:",
      { cartContainer, orderSummary }
    );
    return;
  }

  // Clear existing cart items
  cartContainer.innerHTML = "";

  if (cartItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-cart";
    // emptyMessage.textContent = "Your cart is empty.";
    cartContainer.appendChild(emptyMessage);
    updateOrderSummary(0);
    return;
  }

  // Render cart items
  cartItems.forEach((item, index) => {
    const itemElement = document.createElement("article");
    itemElement.className = `frame-4`; // Unique class for styling if needed
    itemElement.setAttribute("aria-label", `Cart item ${index + 1}`);
    itemElement.innerHTML = `
      <img
        class="rectangle"
        src="${item.cover_image || item.images?.[0] || "/images/fallback.png"}"
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
            <div class="text-wrapper-3">$${
              item.price ? item.price.toFixed(2) : "0.00"
            }</div>
          </div>
        </div>
        <div class="frame-8">
          <div class="frame-9" role="group" aria-label="Quantity controls">
            <button
              type="button"
              class="quantity-button"
              aria-label="Decrease quantity"
              data-item-id="${item.id || ""}"
              data-action="decrease"
            >
              <img class="img-3" src="/images/minus.png" alt="" />
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
              data-item-id="${item.id || ""}"
              data-action="increase"
            >
              <img class="img-3" src="/images/plus.png" alt="" />
            </button>
          </div>
          <div class="frame-11">
            <button type="button" class="remove-button" data-item-id="${
              item.id || ""
            }">
              <span class="text-wrapper-5">Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;
    cartContainer.appendChild(itemElement);
  });

  // Log rendered HTML for debugging
  //   console.log("Rendered cart items HTML:", cartContainer.innerHTML);

  // Calculate and update order summary
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.total_price || item.price * item.quantity || 0),
    0
  );
  updateOrderSummary(subtotal);

  // Add event listeners for quantity and remove buttons
  addCartItemEventListeners();
}

// Update order summary (subtotal, delivery, total)
function updateOrderSummary(subtotal) {
  const orderSummary = document.querySelector(".frame-12");
  if (!orderSummary) {
    console.error("Order summary (.frame-12) not found");
    return;
  }

  const delivery = 5; // Fixed delivery cost
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

// Display error message in cart container
function displayCartError(message) {
  const cartContainer = document.querySelector(".frame-3");
  const orderSummary = document.querySelector(".frame-12");
  if (!cartContainer || !orderSummary) {
    console.error(
      "Cart container (.frame-3) or order summary (.frame-12) not found"
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

// Add event listeners for quantity and remove buttons
function addCartItemEventListeners() {
  document.querySelectorAll(".quantity-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = button.getAttribute("data-item-id");
      const action = button.getAttribute("data-action");
      const quantityElement =
        button.parentElement.querySelector(".text-wrapper-4");
      let currentQuantity = parseInt(quantityElement.textContent, 10);

      if (action === "increase") {
        currentQuantity += 1;
      } else if (action === "decrease" && currentQuantity > 1) {
        currentQuantity -= 1;
      } else {
        return; // Don't allow quantity < 1
      }

      try {
        const authToken = getCookie("authToken");
        if (!authToken) throw new Error("Please log in to update cart.");

        const response = await fetch(
          `https://api.redseam.redberryinternship.ge/api/cart/${itemId}`,
          {
            method: "PATCH",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ quantity: currentQuantity }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update quantity: ${errorData.message || response.status}`
          );
        }

        quantityElement.textContent = currentQuantity;
        await fetchCartItems(true); // Refresh cart display
      } catch (error) {
        console.error("Error updating quantity:", error);
        displayCartError("Failed to update quantity. Please try again.");
      }
    });
  });

  document.querySelectorAll(".remove-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = button.getAttribute("data-item-id");

      try {
        const authToken = getCookie("authToken");
        if (!authToken) throw new Error("Please log in to remove items.");

        const response = await fetch(
          `https://api.redseam.redberryinternship.ge/api/cart/${itemId}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to remove item: ${errorData.message || response.status}`
          );
        }

        await fetchCartItems(true); // Refresh cart display
      } catch (error) {
        console.error("Error removing item:", error);
        displayCartError("Failed to remove item. Please try again.");
      }
    });
  });
}

// Display error message below form
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

// Helper functions from single-product.js
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
