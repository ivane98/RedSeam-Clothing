document.addEventListener("DOMContentLoaded", async () => {
  const logo = document.querySelector(".div");

  logo.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  const user = JSON.parse(localStorage.getItem("user"));
  const avatarImg = document.querySelector(".ellipse");

  if (user && user.avatar && avatarImg) {
    avatarImg.src = user.avatar;
    avatarImg.alt = `${user.name || "User"} avatar`;
  } else {
    avatarImg.src = "images/user-icon.png";
    avatarImg.alt = `user avatar`;
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  let product = null;

  if (productId) {
    try {
      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/products/${productId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Product not found");
      product = await response.json();

      console.log("Fetched product:", product);

      const mainImage = document.querySelector(".rectangle");
      const thumbnailContainer = document.querySelector(".frame-2");
      const productName = document.querySelector(".product-name");
      const productPrice = document.querySelector(".product-price");
      const brandLogo = document.querySelector(".image-2");
      const brandName = document.querySelector(".text-wrapper-8");
      const brandDescription = document.querySelector(".description");

      if (product) {
        brandLogo.src = product.brand.image;
        brandName.innerText = `Brand: ${product.brand.name}`;
        brandDescription.innerText = product.description;
      }

      if (mainImage) {
        mainImage.src =
          product.images?.[0] || product.main_image || "/images/fallback.png";
        mainImage.alt = `${toCapitalCase(product.name)} - Main product image`;
      } else {
        console.warn("Main image (.rectangle) not found");
      }

      let productImages = "";
      if (product.images) {
        productImages = product.images
          .map(
            (img, index) => `
            <button
              class="thumbnail-button"
              type="button"
              data-index="${index}"
              aria-label="View product image"
            >
              <img
                class="image"
                src="${img || "/images/fallback.png"}"
                alt="Product thumbnail ${index + 1}"
              />
            </button>
          `
          )
          .join("");
        if (thumbnailContainer) {
          thumbnailContainer.innerHTML = productImages;
        } else {
          console.warn("Thumbnail container (.frame-2) not found");
        }
      }

      if (productName) {
        productName.innerText = toCapitalCase(product.name);
      } else {
        console.warn("Product name (.product-name) not found");
      }

      if (productPrice) {
        productPrice.innerText = `$${product.price}`;
      } else {
        console.warn("Product price (.product-price) not found");
      }

      const colorPickerContainer = document.createElement("fieldset");
      colorPickerContainer.className = "frame-6";
      const legend = document.createElement("legend");
      legend.className = "text-wrapper-4";
      legend.textContent = `Color: ${product.available_colors
        ? toCapitalCase(product.available_colors[0])
        : "N/A"
        }`;
      const radioGroup = document.createElement("div");
      radioGroup.className = "frame-7";
      radioGroup.setAttribute("role", "radiogroup");
      radioGroup.setAttribute("aria-label", "Color options");

      let lastSelectedWrapper = null;
      let lastSelectedThumbnail = null;

      if (product.available_colors && product.available_colors.length > 0) {
        product.available_colors.forEach((color, index) => {
          const inputId = `color-${color.toLowerCase().replace(/\s/g, "-")}`;
          const input = document.createElement("input");
          input.type = "radio";
          input.id = inputId;
          input.name = "color";
          input.className = "color-input";
          input.value = color.toLowerCase();
          if (index === 0) input.checked = true;

          const wrapper = document.createElement("div");
          wrapper.className = "color-wrapper";
          wrapper.setAttribute(
            "aria-label",
            `${toCapitalCase(color)} color option`
          );

          const label = document.createElement("div");
          label.className = "component";
          label.style.backgroundColor = getColorValue(color);
          label.style.borderRadius = "50%";
          label.style.borderColor = getColorValue(color);
          label.style.width = "38px";
          label.style.height = "38px";
          wrapper.appendChild(label);
          wrapper.style.border =
            index === 0 ? `2px solid ${getColorValue(color)}` : "none";
          wrapper.style.borderRadius = "50%";
          wrapper.style.display = "inline-flex";
          wrapper.style.alignItems = "center";
          wrapper.style.justifyContent = "center";
          wrapper.style.width = "48px";
          wrapper.style.height = "48px";
          wrapper.style.backgroundColor = "#fff";
          wrapper.style.margin = "2px";
          wrapper.style.cursor = "pointer";

          wrapper.addEventListener("click", () => {
            input.checked = true;
            input.dispatchEvent(new Event("change"));
          });

          input.addEventListener("change", () => {
            if (input.checked) {
              const selectedImage =
                product.images[index] ||
                product.main_image ||
                "/images/fallback.png";
              if (mainImage) {
                mainImage.src = selectedImage;
                mainImage.alt = `${toCapitalCase(
                  product.name
                )} - ${toCapitalCase(color)}`;
              }

              legend.textContent = `Color: ${toCapitalCase(color)}`;

              if (lastSelectedWrapper) {
                lastSelectedWrapper.style.border = "none";
              }

              wrapper.style.border = `2px solid ${getColorValue(color)}`;
              lastSelectedWrapper = wrapper;

              const thumbnailButtons =
                document.querySelectorAll(".thumbnail-button");
              thumbnailButtons.forEach((btn) => (btn.style.border = "none"));
              if (thumbnailButtons[index]) {
                thumbnailButtons[index].style.border = "2px solid #FF4000";
                lastSelectedThumbnail = thumbnailButtons[index];
              }
            }
          });

          radioGroup.appendChild(input);
          radioGroup.appendChild(wrapper);
        });

        lastSelectedWrapper = radioGroup.querySelector(".color-wrapper");
        if (lastSelectedWrapper) {
          lastSelectedWrapper.style.borderColor = "#FF4000";
        }
        const firstColorInput = radioGroup.querySelector("input.color-input");
        if (firstColorInput) {
          firstColorInput.checked = true;
          firstColorInput.dispatchEvent(new Event("change"));
        }

        const thumbnailButtons = document.querySelectorAll(".thumbnail-button");
        if (thumbnailButtons[0]) {
          thumbnailButtons[0].style.border = "2px solid #FF4000";
          lastSelectedThumbnail = thumbnailButtons[0];
        }
      } else {
        const noColor = document.createElement("p");
        noColor.textContent = "No colors available";
        radioGroup.appendChild(noColor);
      }

      colorPickerContainer.appendChild(legend);
      colorPickerContainer.appendChild(radioGroup);

      const productOptions = document.querySelector(".frame-3");
      if (productOptions) {
        const formContainer = productOptions.querySelector(".frame-5");
        if (formContainer) {
          const staticColorPicker = formContainer.querySelector(".frame-6");
          if (staticColorPicker) {
            formContainer.replaceChild(colorPickerContainer, staticColorPicker);
          } else {
            formContainer.insertBefore(
              colorPickerContainer,
              formContainer.firstChild
            );
          }
        } else {
          console.error("Form container (.frame-5) not found");
          productOptions.appendChild(colorPickerContainer);
        }
      } else {
        console.error("Product options container (.frame-3) not found");
        document.body.appendChild(colorPickerContainer);
      }

      const sizePickerContainer = document.createElement("fieldset");
      sizePickerContainer.className = "frame-8";
      const sizeLegend = document.createElement("legend");
      sizeLegend.className = "text-wrapper-4";
      sizeLegend.textContent = `Size: ${product.available_sizes ? product.available_sizes[0] : "N/A"
        }`;
      const sizeRadioGroup = document.createElement("div");
      sizeRadioGroup.className = "frame-9";
      sizeRadioGroup.setAttribute("role", "radiogroup");
      sizeRadioGroup.setAttribute("aria-label", "Size options");

      let lastSelectedSizeLabel = null;

      if (product.available_sizes && product.available_sizes.length > 0) {
        product.available_sizes.forEach((size, index) => {
          const inputId = `size-${size.toLowerCase()}`;
          const input = document.createElement("input");
          input.type = "radio";
          input.id = inputId;
          input.name = "size";
          input.className = "size-input";
          input.value = size.toLowerCase();
          if (index === 0) input.checked = true;
          input.style.outline = "none";

          const label = document.createElement("label");
          label.htmlFor = inputId;
          label.className = index === 0 ? "div-wrapper" : "size";
          label.innerHTML = `<span class="${index === 0 ? "text-wrapper-5" : "l"
            }">${size}</span>`;
          label.style.cursor = "pointer";
          label.style.outline = "none";

          input.addEventListener("change", () => {
            if (input.checked) {
              sizeLegend.textContent = `Size: ${size}`;
              if (lastSelectedSizeLabel) {
                lastSelectedSizeLabel.className = "size";
                lastSelectedSizeLabel.querySelector("span").className = "l";
              }
              label.className = "div-wrapper";
              label.querySelector("span").className = "text-wrapper-5";
              lastSelectedSizeLabel = label;
            }
          });

          sizeRadioGroup.appendChild(input);
          sizeRadioGroup.appendChild(label);
        });

        const firstSizeInput = sizeRadioGroup.querySelector("input.size-input");
        if (firstSizeInput) {
          firstSizeInput.dispatchEvent(new Event("change"));
        }
      } else {
        const noSize = document.createElement("p");
        noSize.textContent = "No sizes available";
        sizeRadioGroup.appendChild(noSize);
      }

      sizePickerContainer.appendChild(sizeLegend);
      sizePickerContainer.appendChild(sizeRadioGroup);

      const formContainer = productOptions.querySelector(".frame-5");
      if (formContainer) {
        const staticSizePicker = formContainer.querySelector(".frame-8");
        if (staticSizePicker) {
          formContainer.replaceChild(sizePickerContainer, staticSizePicker);
        } else {
          const colorPicker = formContainer.querySelector(".frame-6");
          if (colorPicker) {
            formContainer.insertBefore(
              sizePickerContainer,
              colorPicker.nextSibling
            );
          } else {
            formContainer.appendChild(sizePickerContainer);
          }
        }
      } else {
        console.error("Form container (.frame-5) not found");
        productOptions.appendChild(sizePickerContainer);
      }

      const thumbnailButtons = document.querySelectorAll(".thumbnail-button");
      thumbnailButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const index = parseInt(btn.getAttribute("data-index"), 10);
          const selectedColor = product.available_colors[index];

          if (mainImage) {
            mainImage.src = product.images[index] || "/images/fallback.png";
            mainImage.alt = `${toCapitalCase(product.name)} - ${toCapitalCase(
              selectedColor
            )}`;
          }

          const colorInput = document.querySelector(
            `#color-${selectedColor.toLowerCase().replace(/\s/g, "-")}`
          );
          if (colorInput) {
            colorInput.checked = true;
            colorInput.dispatchEvent(new Event("change"));
          }

          if (lastSelectedThumbnail) {
            lastSelectedThumbnail.style.border = "2px solid #CCCCCC";
          }
          btn.style.border = "2px solid #FF4000";
          lastSelectedThumbnail = btn;
        });
      });

      const form = document.querySelector(".frame-5");

      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const selectedColor = formData.get("color");
          const selectedSize = formData.get("size");
          const quantity = formData.get("quantity") || "1";
          console.log("Form submission:", {
            productId,
            name: product.name,
            color: selectedColor,
            size: selectedSize,
            quantity,
          });
        });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      const errorContainer =
        document.querySelector(".frame-3") ||
        document.querySelector(".listing-page");
      if (errorContainer) {
        errorContainer.innerHTML =
          "<p>Product not found or error occurred.</p>";
      } else {
        document.body.innerHTML = "<p>Product not found or error occurred.</p>";
      }
    }
  } else {
    const noIdContainer =
      document.querySelector(".frame-3") ||
      document.querySelector(".listing-page");
    if (noIdContainer) {
      noIdContainer.innerHTML = "<p>No product ID provided.</p>";
    } else {
      document.body.innerHTML = "<p>No product ID provided.</p>";
    }
  }

  const addToCartButton = document.querySelector("button.primary");
  if (addToCartButton) {
    addToCartButton.addEventListener("click", async () => {
      try {
        if (!product) throw new Error("Product data not loaded");
        const colorInput = document.querySelector(
          "input[name='color']:checked"
        );
        const selectedColorIndex = Array.from(
          document.querySelectorAll("input[name='color']")
        ).indexOf(colorInput);
        const selectedColor = product.available_colors[selectedColorIndex];

        const sizeInput = document.querySelector("input[name='size']:checked");
        const selectedSizeIndex = Array.from(
          document.querySelectorAll("input[name='size']")
        ).indexOf(sizeInput);
        const selectedSize = product.available_sizes[selectedSizeIndex];

        const quantitySelect = document.querySelector("#quantity");

        const quantity = parseInt(quantitySelect.value, 10) || 1;

        const authToken = getCookie("authToken");
        console.log("Auth token for add to cart:", authToken);

        if (!authToken) {
          alert("You must be logged in to add items to cart.");
          window.location.href = "login.html";
          return;
        }

        console.log("Attempting POST to add item:", {
          productId: product.id,
          color: selectedColor,
          size: selectedSize,
          quantity,
        });
        let response = await fetch(
          `https://api.redseam.redberryinternship.ge/api/cart/products/${product.id}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              color: selectedColor,
              size: selectedSize,
              quantity: quantity,
            }),
          }
        );

        if (response.status === 422) {
          console.log("POST returned 422, checking for existing item");
          const cartItems = await fetchCartItems(false);
          const existingItem = cartItems.find(
            (item) =>
              item.product_id === product.id &&
              item.color.toLowerCase() === selectedColor.toLowerCase() &&
              item.size.toLowerCase() === selectedSize.toLowerCase()
          );

          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            console.log(
              `Found existing item ${existingItem.id}, updating quantity to ${newQuantity}`
            );
            response = await fetch(
              `https://api.redseam.redberryinternship.ge/api/cart/${existingItem.id}`,
              {
                method: "PATCH",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ quantity: newQuantity }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message || "Failed to update cart item quantity."
              );
            }

            console.log(
              `Updated quantity of item ${existingItem.id} to ${newQuantity}`
            );
            alert("Updated quantity in cart successfully!");

          } else {
            throw new Error(
              "Validation error: Item not found in cart for update."
            );
          }
        } else if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to add product to cart."
          );
        } else {
          const responseData = await response.json();
          console.log("Added new item to cart:", responseData);
          alert("Product added to cart successfully!");
          window.location.href = 'index.html'
        }

      } catch (error) {
        console.error("Error adding product to cart:", error);
        alert(`Error adding product to cart: ${error.message}`);
      }
    });
  }

  async function fetchCartItems(render = true) {
    const authToken = getCookie("authToken");
    if (!authToken) {
      console.error("No auth token found");
      alert("You must be logged in to view your cart");
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
      if (render) {
        if (cartItems.length === 0) {
          console.log("Cart is empty, displaying empty cart sidebar");
          displayEmptyCart();
        } else {
          console.log("Cart has items, displaying shopping cart sidebar");
          displayCartItems(cartItems);
        }
      }
      return cartItems;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      if (render)
        displayCartError("Failed to load cart items. Please try again.");
      return [];
    }
  }

  // function displayCartItems(cartItems) {
  //   console.log("Entering displayCartItems with items:", cartItems);
  //   const cartPanel = document.querySelector(".shopping-cart");
  //   const emptyCartPanel = document.querySelector(".cart-is-empty");
  //   const overlay = document.querySelector(".rectangle-2");

  //   if (!cartPanel || !emptyCartPanel || !overlay) {
  //     console.error("Required cart elements not found");
  //     return;
  //   }

  //   const cartTitle = cartPanel.querySelector(".text-wrapper-9");
  //   const orderSummary = cartPanel.querySelector(".frame-23");

  //   const cartItemsContainer = cartPanel.querySelector(".cart-items-container");

  //   if (!cartTitle) {
  //     console.warn("Cart title (.text-wrapper-9) not found in .shopping-cart");
  //   }
  //   if (!orderSummary) {
  //     console.warn("Order summary (.frame-23) not found in .shopping-cart");
  //   }

  //   console.log(
  //     "Adding .active to .shopping-cart and .rectangle-2, removing from .cart-is-empty"
  //   );
  //   cartPanel.classList.add("active");
  //   emptyCartPanel.classList.remove("active");
  //   overlay.classList.add("active");

  //   if (cartTitle) {
  //     const totalQuantity = cartItems.reduce(
  //       (sum, item) => sum + (item.quantity || 1),
  //       0
  //     );
  //     cartTitle.textContent = `Shopping cart (${totalQuantity})`;
  //   }

  //   //
  //   cartItemsContainer.innerHTML = "";

  //   cartItems.forEach((item, index) => {
  //     console.log(`Rendering cart item ${index + 1}:`, item);


  //     const colorIndex = item.available_colors.indexOf(item.color);
  //     const itemImage =
  //       colorIndex !== -1 && item.images[colorIndex]
  //         ? item.images[colorIndex]
  //         : item.cover_image || item.images?.[0] || "/images/fallback.png";

  //     const itemElement = document.createElement("article");
  //     itemElement.className = `frame-${14 + index * 8}`;

  //     itemElement.setAttribute("aria-label", `Cart item ${index + 1}`);
  //     itemElement.innerHTML = `
  //       <img class="rectangle-3" src="${itemImage}" alt="${toCapitalCase(item.name) || "Product"
  //       }" />
  //       <div class="frame-15">
  //         <div class="frame-16">
  //           <div class="frame-17">
  //             <div class="kids-curved-hilfiger-wrapper">
  //               <h3 class="kids-curved-hilfiger-2">${toCapitalCase(item.name) || "Unknown Product"
  //       }</h3>
  //             </div>
  //             <div class="text-wrapper-10">${toCapitalCase(item.color) || "N/A"
  //       }</div>
  //             <div class="text-wrapper-10">${(
  //         item.size || "N/A"
  //       ).toUpperCase()}</div>
  //           </div>
  //           <div class="frame-18">
  //             <div class="text-wrapper-11">$${item.price ? item.price : "0"
  //       }</div>
  //           </div>
  //         </div>
  //         <div class="frame-12">
  //           <div class="frame-19" role="group" aria-label="Quantity controls">
  //             <button type="button" class="quantity-button" aria-label="Decrease quantity" data-item-id="${item.id || ""
  //       }" data-action="decrease">
  //               <img class="img-2" src="/images/minus.png" alt="Decrease" />
  //             </button>
  //             <div class="frame-20"><div class="text-wrapper-12">${item.quantity || 1
  //       }</div></div>
  //             <button type="button" class="quantity-button" aria-label="Increase quantity" data-item-id="${item.id || ""
  //       }" data-action="increase">
  //               <img class="img-2" src="/images/plus.png" alt="Increase" />
  //             </button>
  //           </div>
  //           <div class="frame-21">
  //             <button type="button" class="remove-button" data-item-id="${item.id || ""
  //       }">
  //               <span class="text-wrapper-13">Remove</span>
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     `;
  //     //
  //     cartItemsContainer.appendChild(itemElement);

  //     // if (orderSummary) {
  //     //   cartPanel.insertBefore(itemElement, orderSummary);
  //     // } else {
  //     //   cartPanel.appendChild(itemElement);
  //     // }
  //   });

  //   if (orderSummary) {
  //     const subtotal = cartItems.reduce(
  //       (sum, item) =>
  //         sum + (item.total_price || item.price * item.quantity || 0),
  //       0
  //     );
  //     updateOrderSummary(subtotal);
  //   } else {
  //     console.warn("Skipping order summary update due to missing .frame-23");
  //   }

  //   addCartItemEventListeners();
  //   console.log("Completed displayCartItems");
  // }

  function displayCartItems(cartItems) {
    console.log("Entering displayCartItems with items:", cartItems);
    const cartPanel = document.querySelector(".shopping-cart");
    const emptyCartPanel = document.querySelector(".cart-is-empty");
    const overlay = document.querySelector(".rectangle-2");
    const cartItemsContainer = cartPanel.querySelector(".cart-items-container");

    if (!cartPanel || !emptyCartPanel || !overlay || !cartItemsContainer) {
      console.error("Required cart elements not found");
      return;
    }

    const cartTitle = cartPanel.querySelector(".text-wrapper-9");
    const orderSummary = cartPanel.querySelector(".frame-23");

    if (!cartTitle) {
      console.warn("Cart title (.text-wrapper-9) not found in .shopping-cart");
    }
    if (!orderSummary) {
      console.warn("Order summary (.frame-23) not found in .shopping-cart");
    }

    console.log(
      "Adding .active to .shopping-cart and .rectangle-2, removing from .cart-is-empty"
    );
    cartPanel.classList.add("active");
    emptyCartPanel.classList.remove("active");
    overlay.classList.add("active");

    if (cartTitle) {
      const totalQuantity = cartItems.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      cartTitle.textContent = `Shopping cart (${totalQuantity})`;
    }

    // Clear the container
    cartItemsContainer.innerHTML = "";

    cartItems.forEach((item, index) => {
      console.log(`Rendering cart item ${index + 1}:`, item);

      const colorIndex = item.available_colors?.indexOf(item.color) || 0;
      const itemImage =
        colorIndex !== -1 && item.images?.[colorIndex]
          ? item.images[colorIndex]
          : item.main_image || item.images?.[0] || "/images/fallback.png";

      const itemElement = document.createElement("article");
      itemElement.className = "cart-item"; // Use a single class for all items
      itemElement.setAttribute("aria-label", `Cart item ${index + 1}`);
      itemElement.innerHTML = `
      <img class="rectangle-3" src="${itemImage}" alt="${toCapitalCase(item.name) || "Product"
        }" />
      <div class="frame-15">
        <div class="frame-16">
          <div class="frame-17">
            <div class="kids-curved-hilfiger-wrapper">
              <h3 class="kids-curved-hilfiger-2">${toCapitalCase(item.name) || "Unknown Product"
        }</h3>
            </div>
            <div class="text-wrapper-10">${toCapitalCase(item.color) || "N/A"
        }</div>
            <div class="text-wrapper-10">${(item.size || "N/A").toUpperCase()}</div>
          </div>
          <div class="frame-18">
            <div class="text-wrapper-11">$${item.price ? item.price : "0"
        }</div>
          </div>
        </div>
        <div class="frame-12">
          <div class="frame-19" role="group" aria-label="Quantity controls">
            <button type="button" class="quantity-button" aria-label="Decrease quantity" data-item-id="${item.id || index
        }" data-action="decrease">
              <img class="img-2" src="/images/minus.png" alt="Decrease" />
            </button>
            <div class="frame-20"><div class="text-wrapper-12">${item.quantity || 1
        }</div></div>
            <button type="button" class="quantity-button" aria-label="Increase quantity" data-item-id="${item.id || index
        }" data-action="increase">
              <img class="img-2" src="/images/plus.png" alt="Increase" />
            </button>
          </div>
          <div class="frame-21">
            <button type="button" class="remove-button" data-item-id="${item.id || index
        }">
              <span class="text-wrapper-13">Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;

      // Append to cartItemsContainer
      cartItemsContainer.appendChild(itemElement);
    });

    if (orderSummary) {
      const subtotal = cartItems.reduce(
        (sum, item) =>
          sum + (item.total_price || item.price * item.quantity || 0),
        0
      );
      updateOrderSummary(subtotal);
    } else {
      console.warn("Skipping order summary update due to missing .frame-23");
    }

    addCartItemEventListeners();
    console.log("Completed displayCartItems");
  }

  function displayEmptyCart() {
    console.log("Entering displayEmptyCart");
    const cartPanel = document.querySelector(".shopping-cart");
    const emptyCartPanel = document.querySelector(".cart-is-empty");
    const emptyCartTitle = emptyCartPanel.querySelector(".empty-cart-heading");
    const overlay = document.querySelector(".rectangle-2");

    if (!cartPanel) {
      console.error("Shopping cart panel (.shopping-cart) not found");
      return;
    }
    if (!emptyCartPanel) {
      console.error("Empty cart panel (.cart-is-empty) not found");
      return;
    }
    if (!emptyCartTitle) {
      console.error("Empty cart title (.empty-cart-heading) not found");
      return;
    }
    if (!overlay) {
      console.error("Overlay (.rectangle-2) not found");
      return;
    }

    console.log(
      "Adding .active to .cart-is-empty and .rectangle-2, removing from .shopping-cart"
    );
    emptyCartPanel.classList.add("active");
    cartPanel.classList.remove("active");
    overlay.classList.add("active");
    console.log("Empty cart classList:", emptyCartPanel.classList.toString());
    console.log("Shopping cart classList:", cartPanel.classList.toString());
    console.log("Overlay classList:", overlay.classList.toString());

    emptyCartTitle.textContent = "Shopping cart (0)";
    console.log("Completed displayEmptyCart");
  }

  function updateOrderSummary(subtotal) {
    console.log("Updating order summary with subtotal:", subtotal);
    const orderSummary = document.querySelector(".frame-23");
    if (!orderSummary) {
      console.warn("Order summary (.frame-23) not found");
      return;
    }

    const delivery = 5;
    const total = subtotal + delivery;

    orderSummary.innerHTML = `
      <div class="frame-12">
        <div class="text-wrapper-14">Items subtotal</div>
        <div class="text-wrapper-15">$${subtotal}</div>
      </div>
      <div class="frame-12">
        <div class="text-wrapper-14">Delivery</div>
        <div class="text-wrapper-15">$${delivery}</div>
      </div>
      <div class="frame-12">
        <div class="text-wrapper-16">Total</div>
        <div class="text-wrapper-16">$${total}</div>
      </div>
    `;
    console.log("Completed order summary update");
  }

  function displayCartError(message) {
    console.log("Displaying cart error:", message);
    const cartPanel = document.querySelector(".shopping-cart");
    const emptyCartPanel = document.querySelector(".cart-is-empty");
    const orderSummary = cartPanel.querySelector(".frame-23");
    const overlay = document.querySelector(".rectangle-2");

    if (!cartPanel) {
      console.error("Shopping cart panel (.shopping-cart) not found");
      return;
    }
    if (!emptyCartPanel) {
      console.error("Empty cart panel (.cart-is-empty) not found");
      return;
    }
    if (!overlay) {
      console.error("Overlay (.rectangle-2) not found");
      return;
    }

    console.log(
      "Adding .active to .shopping-cart and .rectangle-2, removing from .cart-is-empty"
    );
    cartPanel.classList.add("active");
    emptyCartPanel.classList.remove("active");
    overlay.classList.add("active");
    console.log("Shopping cart classList:", cartPanel.classList.toString());
    console.log("Overlay classList:", overlay.classList.toString());

    const existingItems = cartPanel.querySelectorAll(
      "article[class^='frame-'], .empty-cart, .error-message"
    );
    existingItems.forEach((item) => item.remove());

    const errorMessage = document.createElement("p");
    errorMessage.className = "error-message";
    errorMessage.textContent = message;
    if (orderSummary) {
      cartPanel.insertBefore(errorMessage, orderSummary);
    } else {
      cartPanel.appendChild(errorMessage);
    }
    console.log("Completed displayCartError");
  }

  function addCartItemEventListeners() {
    console.log("Adding cart item event listeners");
    document.querySelectorAll(".quantity-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const itemId = button.getAttribute("data-item-id");
        const action = button.getAttribute("data-action");
        const quantityElement =
          button.parentElement.querySelector(".text-wrapper-12");
        let currentQuantity = parseInt(quantityElement.textContent, 10);

        if (action === "increase") {
          currentQuantity += 1;
        } else if (action === "decrease" && currentQuantity > 1) {
          currentQuantity -= 1;
        } else {
          return;
        }

        try {
          const authToken = getCookie("authToken");
          if (!authToken) throw new Error("Please log in to update cart.");

          const response = await fetch(
            `https://api.redseam.redberryinternship.ge/api/cart/products/${itemId}`,
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

          if (!response.ok) throw new Error("Failed to update quantity.");

          quantityElement.textContent = currentQuantity;
          await fetchCartItems(true);
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
            `https://api.redseam.redberryinternship.ge/api/cart/products/${itemId}`,
            {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) throw new Error("Failed to remove item.");

          await fetchCartItems(true);
        } catch (error) {
          console.error("Error removing item:", error);
          displayCartError("Failed to remove item. Please try again.");
        }
      });
    });
    console.log("Completed adding cart item event listeners");
  }

  const cartButton = document.querySelector(".cart-button");
  if (cartButton) {
    cartButton.addEventListener("click", () => {
      console.log("Cart button clicked");
      fetchCartItems(true);
    });
  } else {
    console.error("Cart button (.cart-button) not found");
  }

  const closeButton = document.querySelector(
    ".shopping-cart .heroicons-solid-x"
  );
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      console.log("Shopping cart close button clicked");
      const cartPanel = document.querySelector(".shopping-cart");
      const emptyCartPanel = document.querySelector(".cart-is-empty");
      const overlay = document.querySelector(".rectangle-2");
      if (cartPanel && emptyCartPanel && overlay) {
        cartPanel.classList.remove("active");
        emptyCartPanel.classList.remove("active");
        overlay.classList.remove("active");
        console.log(
          "Closed shopping cart, classList:",
          cartPanel.classList.toString()
        );
      } else {
        console.error("Cart elements not found:", {
          cartPanel,
          emptyCartPanel,
          overlay,
        });
      }
    });
  } else {
    console.error(
      "Shopping cart close button (.shopping-cart .heroicons-solid-x) not found"
    );
  }

  const emptyCartCloseButton = document.querySelector(
    ".cart-is-empty .close-cart-button"
  );
  if (emptyCartCloseButton) {
    emptyCartCloseButton.addEventListener("click", () => {
      console.log("Empty cart close button clicked");
      const cartPanel = document.querySelector(".shopping-cart");
      const emptyCartPanel = document.querySelector(".cart-is-empty");
      const overlay = document.querySelector(".rectangle-2");
      if (cartPanel && emptyCartPanel && overlay) {
        cartPanel.classList.remove("active");
        emptyCartPanel.classList.remove("active");
        overlay.classList.remove("active");
        console.log(
          "Closed empty cart, classList:",
          emptyCartPanel.classList.toString()
        );
      } else {
        console.error("Cart elements not found:", {
          cartPanel,
          emptyCartPanel,
          overlay,
        });
      }
    });
  } else {
    console.error(
      "Empty cart close button (.cart-is-empty .close-cart-button) not found"
    );
  }

  const overlay = document.querySelector(".rectangle-2");
  if (overlay) {
    overlay.addEventListener("click", () => {
      console.log("Overlay clicked");
      const cartPanel = document.querySelector(".shopping-cart");
      const emptyCartPanel = document.querySelector(".cart-is-empty");
      if (cartPanel && emptyCartPanel) {
        cartPanel.classList.remove("active");
        emptyCartPanel.classList.remove("active");
        overlay.classList.remove("active");
        console.log(
          "Closed via overlay, shopping cart classList:",
          cartPanel.classList.toString()
        );
        console.log(
          "Closed via overlay, empty cart classList:",
          emptyCartPanel.classList.toString()
        );
      } else {
        console.error("Cart elements not found:", {
          cartPanel,
          emptyCartPanel,
          overlay,
        });
      }
    });
  } else {
    console.error("Overlay (.rectangle-2) not found");
  }

  const checkoutButton = document.querySelector(".shopping-cart .primary-2");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      console.log("Go to Checkout button clicked");
      window.location.href = "checkout.html";
    });
  } else {
    console.error("Checkout button (.shopping-cart .primary-2) not found");
  }

  const startShoppingButton = document.querySelector(
    ".cart-is-empty .shopping-button-wrapper"
  );
  if (startShoppingButton) {
    startShoppingButton.addEventListener("click", () => {
      console.log("Start shopping button clicked");
      window.location.href = "index.html";
    });
  } else {
    console.error(
      "Start shopping button (.cart-is-empty .shopping-button-wrapper) not found"
    );
  }

  const chevron = document.querySelector(".heroicons-mini-3");
  const select = document.querySelector(".quantity-select");
  const quantityDisplay = document.querySelector(".l-2");
  const sizeContainer = document.querySelector(".size-2");
  const dropdown = document.querySelector(".quantity-dropdown");
  const options = document.querySelectorAll(".dropdown-option");

  if (chevron && select && quantityDisplay && sizeContainer && dropdown) {
    console.log("Found chevron:", chevron);
    chevron.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = dropdown.classList.contains("active");
      dropdown.classList.toggle("active");
      sizeContainer.setAttribute("aria-expanded", !isExpanded);
      if (!isExpanded) {
        const selectedValue = select.value;
        options.forEach((option) => {
          option.classList.toggle(
            "selected",
            option.dataset.value === selectedValue
          );
        });
      }
      console.log(
        "Chevron clicked, dropdown toggled, aria-expanded:",
        !isExpanded
      );
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value;
        select.value = value;
        quantityDisplay.textContent = value;
        options.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
        dropdown.classList.remove("active");
        select.dispatchEvent(new Event("change"));
        console.log("Quantity selected:", value);
      });
    });

    quantityDisplay.textContent = select.value;
  } else {
    console.error("Missing elements:", {
      chevron,
      select,
      quantityDisplay,
      sizeContainer,
      dropdown,
    });
  }

  document.addEventListener("click", (e) => {
    const isClickInside = sizeContainer.contains(e.target);
    if (!isClickInside && dropdown) {
      dropdown.classList.remove("active");
      sizeContainer.setAttribute("aria-expanded", "false");
    }
  });
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getColorValue(color) {
  const colorMap = {
    yellow: "#FFFF00",
    green: "#00FF00",
    purple: "#800080",
    pink: "#FFC1CC",
    white: "#FFFFFF",
    red: "#FF0000",
    blue: "#0000FF",
    "navy blue": "#000080",
    black: "#000000",
    beige: "#F5F5DC",
    grey: "#808080",
    orange: "#FFA500",
    multi: "#808080",
  };
  return colorMap[color.toLowerCase()] || "#808080";
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
