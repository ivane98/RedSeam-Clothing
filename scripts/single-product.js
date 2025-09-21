document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

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
      const product = await response.json();

      console.log(product);

      // Cache DOM elements for performance
      const mainImage = document.querySelector(".rectangle");
      const thumbnailContainer = document.querySelector(".frame-2");
      const productName = document.querySelector(".product-name");
      const productPrice = document.querySelector(".product-price");

      // Update main image with first available image
      if (mainImage) {
        mainImage.src = product.images?.[0] || product.main_image || "";
        mainImage.alt = `${toCapitalCase(product.name)} - Main product image`;
      } else {
        console.warn("Main image (.rectangle) not found");
      }

      // Update thumbnail images
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
                src="${img}"
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

      // Update product name and price
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

      // Dynamic color picker
      const colorPickerContainer = document.createElement("fieldset");
      colorPickerContainer.className = "frame-6";
      const legend = document.createElement("legend");
      legend.className = "text-wrapper-4";
      legend.textContent = `Color: ${
        product.available_colors
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

          // Make color wrapper clickable
          wrapper.addEventListener("click", () => {
            input.checked = true;
            input.dispatchEvent(new Event("change"));
          });

          input.addEventListener("change", () => {
            if (input.checked) {
              const selectedImage = product.images[index] || product.main_image;
              if (mainImage) {
                mainImage.src = selectedImage;
                mainImage.alt = `${toCapitalCase(
                  product.name
                )} - ${toCapitalCase(color)}`;
              }

              legend.textContent = `Color: ${toCapitalCase(color)}`;

              // Remove styling from previously selected
              if (lastSelectedWrapper) {
                lastSelectedWrapper.style.border = "none";
              }

              // Apply selected color's hex as border
              wrapper.style.border = `2px solid ${getColorValue(color)}`;
              lastSelectedWrapper = wrapper;

              // Highlight corresponding thumbnail and reset others
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

        // Highlight first color and trigger change event
        lastSelectedWrapper = radioGroup.querySelector(".color-wrapper");
        if (lastSelectedWrapper) {
          lastSelectedWrapper.style.borderColor = "#FF4000";
        }
        const firstColorInput = radioGroup.querySelector("input.color-input");
        if (firstColorInput) {
          firstColorInput.checked = true;
          firstColorInput.dispatchEvent(new Event("change")); // Trigger initial update
        }

        // Highlight first thumbnail
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

      // Replace static color picker
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

      // Dynamic size picker
      const sizePickerContainer = document.createElement("fieldset");
      sizePickerContainer.className = "frame-8";
      const sizeLegend = document.createElement("legend");
      sizeLegend.className = "text-wrapper-4";
      sizeLegend.textContent = `Size: ${
        product.available_sizes ? product.available_sizes[0] : "N/A"
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
          input.style.outline = "none"; // Remove default blue focus outline

          const label = document.createElement("label");
          label.htmlFor = inputId;
          label.className = index === 0 ? "div-wrapper" : "size";
          label.innerHTML = `<span class="${
            index === 0 ? "text-wrapper-5" : "l"
          }">${size}</span>`;
          label.style.cursor = "pointer"; // Explicit cursor pointer
          label.style.outline = "none"; // Remove default blue focus outline

          input.addEventListener("change", () => {
            if (input.checked) {
              sizeLegend.textContent = `Size: ${size}`;
              // Reset previous label styling
              if (lastSelectedSizeLabel) {
                lastSelectedSizeLabel.className = "size";
                lastSelectedSizeLabel.querySelector("span").className = "l";
              }
              // Apply selected styling
              label.className = "div-wrapper";
              label.querySelector("span").className = "text-wrapper-5";
              lastSelectedSizeLabel = label;
            }
          });

          sizeRadioGroup.appendChild(input);
          sizeRadioGroup.appendChild(label);
        });

        // Trigger initial change for first size
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

      // Replace static size picker
      const formContainer = productOptions.querySelector(".frame-5");
      if (formContainer) {
        const staticSizePicker = formContainer.querySelector(".frame-8");
        if (staticSizePicker) {
          formContainer.replaceChild(sizePickerContainer, staticSizePicker);
        } else {
          // Insert after color picker
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

      // Link thumbnails to colors
      const thumbnailButtons = document.querySelectorAll(".thumbnail-button");
      thumbnailButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const index = parseInt(btn.getAttribute("data-index"), 10);
          const selectedColor = product.available_colors[index];

          if (mainImage) {
            mainImage.src = product.images[index];
            mainImage.alt = `${toCapitalCase(product.name)} - ${toCapitalCase(
              selectedColor
            )}`;
          }

          // Auto-select matching radio
          const colorInput = document.querySelector(
            `#color-${selectedColor.toLowerCase().replace(/\s/g, "-")}`
          );
          if (colorInput) {
            colorInput.checked = true;
            colorInput.dispatchEvent(new Event("change"));
          }

          // Highlight selected thumbnail
          if (lastSelectedThumbnail) {
            lastSelectedThumbnail.style.border = "2px solid #CCCCCC";
          }
          btn.style.border = "2px solid #FF4000";
          lastSelectedThumbnail = btn;
        });
      });

      // Form submission (example)
      const form = document.querySelector(".frame-5");
      if (form) {
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const selectedColor = formData.get("color");
          const selectedSize = formData.get("size");
          const quantity = formData.get("quantity") || "1";
          console.log("Add to cart:", {
            productId,
            name: product.name,
            color: selectedColor,
            size: selectedSize,
            quantity,
          });
          // TODO: Add cart integration (API or localStorage)
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
});

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
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
