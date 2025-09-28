let state = {
  page: 1,
  price_from: null,
  price_to: null,
  sort: null,
  lastSortOption: null,
};

console.log(state.sort);

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  state.page = parseInt(params.get("page")) || 1;
  state.price_from = parseFloat(params.get("price_from")) || null;
  state.price_to = parseFloat(params.get("price_to")) || null;
  state.sort = params.get("sort") || null;
  // Only update lastSortOption if a sort parameter is present
  if (params.get("sort")) {
    state.lastSortOption = state.sort;
  } else {
    // If no sort parameter, keep lastSortOption as is or set to null if undefined
    state.lastSortOption = state.lastSortOption || null;
  }
}

function updateURL() {
  const params = new URLSearchParams();
  if (state.page !== 1) params.set("page", state.page);
  if (state.price_from !== null) params.set("price_from", state.price_from);
  if (state.price_to !== null) params.set("price_to", state.price_to);
  if (state.sort !== null) params.set("sort", state.sort);
  const queryString = params.toString();
  const newURL = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;
  history.pushState(state, "", newURL);
}

async function getDataByPage() {
  try {
    const params = new URLSearchParams();
    params.set("page", state.page);
    if (state.price_from !== null)
      params.set("filter[price_from]", state.price_from);
    if (state.price_to !== null) params.set("filter[price_to]", state.price_to);
    if (state.sort !== null) params.set("sort", state.sort);

    console.log(
      "API Request:",
      `https://api.redseam.redberryinternship.ge/api/products?${params.toString()}`
    );
    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    state.page = data.meta.current_page;
    displayProducts(data.data);
    updatePagination(data.meta);
    displayTotalCount(data.meta);
    updateURL();
  } catch (error) {
    console.error("Error fetching data:", error, { sort: state.sort });
    displayProducts([]);
    const productCount = document.querySelector(".product-count");
    if (productCount) productCount.innerHTML = "Error loading products";
  }
}

function displayTotalCount(meta) {
  const productCount = document.querySelector(".product-count");
  if (!productCount) return;
  const start =
    meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const end = Math.min(meta.current_page * meta.per_page, meta.total);
  productCount.innerHTML = `Showing ${start}–${end} of ${meta.total} results`;
}

function displayProducts(products) {
  const productsGrid = document.querySelector(".products-grid");
  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  productsGrid.innerHTML =
    products.length === 0
      ? "<p>No products found</p>"
      : products
          .map(
            (product) => `
        <article class="div-2" data-product-id="${product.id || "no-id"}">
          <a href="product.html?id=${
            product.id || "no-id"
          }" class="product-link">
            <img class="rectangle" src="${product.cover_image || ""}" alt="${
              product.name || "Unnamed Product"
            }" />
            <div class="frame-7">
              <h3 class="product-name">${
                toCapitalCase(product.name) || "No Name"
              }</h3>
              <span class="text-wrapper-4" aria-label="Price">$ ${
                product.price || 0
              }</span>
            </div>
          </a>
        </article>
      `
          )
          .join("");

  productsGrid.querySelectorAll(".div-2").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      const productId = card.getAttribute("data-product-id");
      if (productId && productId !== "no-id") {
        window.location.href = `product.html?id=${productId}`;
      } else {
        console.error("No valid product ID:", card);
      }
    });
  });
}

function updatePagination(meta) {
  const paginationWrapper = document.querySelector(".pagination");
  if (!paginationWrapper) return;

  const pages = meta.links
    .filter(
      (link) =>
        !isNaN(link.label) &&
        !link.label.includes("&laquo;") &&
        !link.label.includes("&raquo;")
    )
    .map((link) => ({
      label: parseInt(link.label),
      url: link.url,
      active: link.active,
    }));

  const maxVisiblePages = 2;
  const halfVisible = Math.floor(maxVisiblePages / 2);
  const lastPage = meta.last_page;
  let startPage = Math.max(1, state.page - halfVisible);
  let endPage = Math.min(lastPage, state.page + halfVisible);

  if (endPage - startPage < maxVisiblePages - 1) {
    if (startPage === 1)
      endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
    else if (endPage === lastPage)
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  let paginationHtml = `
    <button class="pagination-nav" type="button" aria-label="Previous page" ${
      meta.links.find((l) => l.label.includes("Previous"))?.url
        ? ""
        : "disabled"
    } data-url="${
    meta.links.find((l) => l.label.includes("Previous"))?.url || ""
  }">
      <img class="heroicons-mini" src="assets/chevron-left.png" alt="" />
    </button>
  `;

  if (startPage > 1) {
    const firstPage = pages.find((p) => p.label === 1);
    paginationHtml += `
      <div class="page ${firstPage?.active ? "" : "num-wrapper"}">
        <button class="page-button ${
          firstPage?.active ? "page-active" : ""
        }" type="button" aria-label="Go to page 1" data-url="${
      firstPage?.url || ""
    }" ${firstPage?.active ? 'aria-current="page"' : ""}>
          <span class="num-2 ${firstPage?.active ? "num" : ""}">1</span>
        </button>
      </div>
    `;
    if (startPage > 2) {
      paginationHtml += `
        <div class="num-wrapper">
          <span class="num-2" aria-hidden="true">...</span>
        </div>
      `;
    }
  }

  pages.forEach((page) => {
    if (page.label >= startPage && page.label <= endPage) {
      paginationHtml += `
        <div class="${page.active ? "page" : "num-wrapper"}">
          <button class="${
            page.active ? "page-active" : "page-button"
          }" type="button" aria-label="Go to page ${page.label}" data-url="${
        page.url
      }" ${page.active ? 'aria-current="page"' : ""}>
            <span class="${page.active ? "num" : "num-2"}">${page.label}</span>
          </button>
        </div>
      `;
    }
  });

  if (endPage < lastPage) {
    if (endPage < lastPage - 1) {
      paginationHtml += `
        <div class="num-wrapper">
          <span class="num-2" aria-hidden="true">...</span>
        </div>
      `;
    }
    const lastPageLink = pages.find((p) => p.label === lastPage);
    paginationHtml += `
      <div class="${lastPageLink?.active ? "page" : "num-wrapper"}">
        <button class="${
          lastPageLink?.active ? "page-active" : "page-button"
        }" type="button" aria-label="Go to page ${lastPage}" data-url="${
      lastPageLink?.url || ""
    }" ${lastPageLink?.active ? 'aria-current="page"' : ""}>
          <span class="${
            lastPageLink?.active ? "num" : "num-2"
          }">${lastPage}</span>
        </button>
      </div>
    `;
  }

  paginationHtml += `
    <button class="pagination-nav" type="button" aria-label="Next page" ${
      meta.links.find((l) => l.label.includes("Next"))?.url ? "" : "disabled"
    } data-url="${meta.links.find((l) => l.label.includes("Next"))?.url || ""}">
      <img class="heroicons-mini" src="assets/chevron-right.png" alt="" />
    </button>
  `;

  paginationWrapper.innerHTML = paginationHtml;
  paginationWrapper.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) {
        state.page = Number(new URL(url).searchParams.get("page"));
        getDataByPage();
      }
    });
  });

  const pageWrapper = document.querySelector(".pagination-wrapper");
  if (pageWrapper) pageWrapper.classList.add("loaded");
}

function initializeEventListeners() {
  const filterControl = document.querySelector(".filter-control");
  const priceFilter = document.querySelector(".price-filter");
  const sortControl = document.querySelector(".sort-dropdown");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (filterControl && priceFilter) {
    priceFilter.style.display = "none";
    filterControl.setAttribute("aria-expanded", "false");
    filterControl.addEventListener("click", () => {
      const isExpanded = priceFilter.style.display === "flex";
      priceFilter.style.display = isExpanded ? "none" : "flex";
      filterControl.setAttribute("aria-expanded", !isExpanded);
    });
  }

  if (sortControl && dropdownMenu) {
    dropdownMenu.style.display = "none";
    sortControl.setAttribute("aria-expanded", "false");
    sortControl.addEventListener("click", () => {
      const isExpanded = dropdownMenu.style.display === "block";
      dropdownMenu.style.display = isExpanded ? "none" : "block";
      sortControl.setAttribute("aria-expanded", !isExpanded);
    });
  }

  document.addEventListener("click", (event) => {
    if (
      dropdownMenu &&
      sortControl &&
      !dropdownMenu.contains(event.target) &&
      !sortControl.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
      sortControl.setAttribute("aria-expanded", "false");
    }
    if (
      priceFilter &&
      filterControl &&
      !priceFilter.contains(event.target) &&
      !filterControl.contains(event.target)
    ) {
      priceFilter.style.display = "none";
      filterControl.setAttribute("aria-expanded", "false");
    }
  });
}

function initializePriceFilter() {
  const applyButton = document.querySelector(".apply-button");
  const minPriceInput = document.querySelector("#price-from");
  const maxPriceInput = document.querySelector("#price-to");
  const priceValues = document.querySelector(".price-values");
  const priceRange = document.querySelector(".price-range");
  const clearButton = document.querySelector(".price-values-img");

  if (!minPriceInput || !maxPriceInput) {
    console.warn(
      "Price filter inputs not found: #price-from or #price-to missing"
    );
  }

  if (minPriceInput && maxPriceInput) {
    minPriceInput.value = state.price_from || "";
    maxPriceInput.value = state.price_to || "";
  }
  if (priceValues && priceRange) {
    priceRange.textContent = `${state.price_from || 0} - ${
      state.price_to || "∞"
    }`;
    priceValues.style.display =
      state.price_from || state.price_to ? "flex" : "none";
  }

  if (applyButton) {
    applyButton.addEventListener(
      "click",
      debounce(() => {
        if (!minPriceInput || !maxPriceInput) {
          console.error("Cannot apply filters: Price inputs not found");
          alert(
            "Error: Price filter inputs are missing. Please try refreshing the page."
          );
          return;
        }

        const minPrice = parseFloat(minPriceInput.value) || null;
        const maxPrice = parseFloat(maxPriceInput.value) || null;

        if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
          alert("Minimum price cannot be greater than maximum price.");
          return;
        }

        state.price_from = minPrice;
        state.price_to = maxPrice;
        state.page = 1;
        getDataByPage();

        if (priceValues && priceRange) {
          priceRange.textContent = `${minPrice || 0}-${maxPrice || "-"}`;
          priceValues.style.display = minPrice || maxPrice ? "flex" : "none";
          document.querySelector(".price-filter").style.display = "none";
          document
            .querySelector(".filter-control")
            .setAttribute("aria-expanded", "false");
        }
      }, 300)
    );
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      state.price_from = null;
      state.price_to = null;
      state.page = 1;
      if (minPriceInput && maxPriceInput) {
        minPriceInput.value = "";
        maxPriceInput.value = "";
      }
      if (priceValues) priceValues.style.display = "none";
      getDataByPage();
    });
  }
}

function initializeSortDropdown() {
  const sortText = document.querySelector(".text-wrapper-3 .sort-wrapper");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  const sortOptions = [
    { value: "created_at", text: "New products first" },
    { value: "price", text: "Price, low to high" },
    { value: "-price", text: "Price, high to low" },
    // { value: "default", text: "Sort by" },
    { value: "clear", text: "Clear Sort" },
  ];

  if (sortText) {
    const selectedOption = sortOptions.find(
      (opt) => opt.value === state.lastSortOption && opt.value !== "clear"
    );
    sortText.textContent = selectedOption ? selectedOption.text : "Sort by";
  }

  document.querySelectorAll(".dropdown-option").forEach((option) => {
    const value = option.dataset.value;
    const text = option.textContent.trim();
    option.setAttribute("role", "option");
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      console.log("Sort option selected:", { value, text });
      if (sortText) sortText.textContent = value === "clear" ? "Sort By" : text;
      state.sort = value === "clear" ? null : value;
      state.lastSortOption = value;
      state.page = 1;
      getDataByPage();
      if (dropdownMenu) {
        dropdownMenu.style.display = "none";
        document
          .querySelector(".sort-dropdown")
          .setAttribute("aria-expanded", "false");
      }
    });
  });
}

// ADDED FOR CART: Cart fetching and display functions
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
    if (render) {
      if (cartItems.length === 0) {
        displayEmptyCart();
      } else {
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

function displayCartItems(cartItems) {
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

  cartItemsContainer.innerHTML = "";

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
    itemElement.className = "cart-item";
    itemElement.setAttribute("aria-label", `Cart item ${index + 1}`);
    itemElement.setAttribute("data-unique-id", uniqueId);
    itemElement.innerHTML = `
      <img class="rectangle-3" src="${itemImage}" alt="${
      toCapitalCase(item.name) || "Product"
    }" />
      <div class="frame-15">
        <div class="frame-16">
          <div class="frame-17">
            <div class="kids-curved-hilfiger-wrapper">
              <h3 class="kids-curved-hilfiger-2">${
                toCapitalCase(item.name) || "Unknown Product"
              }</h3>
            </div>
            <div class="text-wrapper-10">${
              toCapitalCase(item.color) || "N/A"
            }</div>
            <div class="text-wrapper-10">${(
              item.size || "N/A"
            ).toUpperCase()}</div>
          </div>
          <div class="frame-18">
            <div class="text-wrapper-11">$${item.price ? item.price : "0"}</div>
          </div>
        </div>
        <div class="frame-12">
          <div class="frame-19" role="group" aria-label="Quantity controls">
            <button type="button" class="quantity-button" aria-label="Decrease quantity" data-unique-id="${uniqueId}" data-action="decrease">
              <img class="img-2" src="/assets/minus.png" alt="Decrease" />
            </button>
            <div class="frame-20"><div class="text-wrapper-12">${
              item.quantity || 1
            }</div></div>
            <button type="button" class="quantity-button" aria-label="Increase quantity" data-unique-id="${uniqueId}" data-action="increase">
              <img class="img-2" src="/assets/plus.png" alt="Increase" />
            </button>
          </div>
          <div class="frame-21">
            <button type="button" class="remove-button" data-unique-id="${uniqueId}">
              <span class="text-wrapper-13">Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemElement);
    addCartItemEventListeners(
      uniqueId,
      item.id || index,
      item.color || "N/A",
      item.size || "N/A"
    );
  });

  if (orderSummary) {
    const subtotal = cartItems.reduce(
      (sum, item) =>
        sum + (item.total_price || item.price * item.quantity || 0),
      0
    );
    updateOrderSummary(subtotal);
  }
}

function displayEmptyCart() {
  const cartPanel = document.querySelector(".shopping-cart");
  const emptyCartPanel = document.querySelector(".cart-is-empty");
  const emptyCartTitle = emptyCartPanel.querySelector(".empty-cart-heading");
  const overlay = document.querySelector(".rectangle-2");

  if (!cartPanel || !emptyCartPanel || !emptyCartTitle || !overlay) {
    console.error("Required cart elements not found");
    return;
  }

  emptyCartPanel.classList.add("active");
  cartPanel.classList.remove("active");
  overlay.classList.add("active");
  emptyCartTitle.textContent = "Shopping cart (0)";
}

function updateOrderSummary(subtotal) {
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
}

function displayCartError(message) {
  const cartPanel = document.querySelector(".shopping-cart");
  const emptyCartPanel = document.querySelector(".cart-is-empty");
  const orderSummary = cartPanel.querySelector(".frame-23");
  const overlay = document.querySelector(".rectangle-2");

  if (!cartPanel || !emptyCartPanel || !overlay) {
    console.error("Required cart elements not found");
    return;
  }

  cartPanel.classList.add("active");
  emptyCartPanel.classList.remove("active");
  overlay.classList.add("active");

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
}

function addCartItemEventListeners(uniqueId, itemId, color, size) {
  const cartItem = document.querySelector(
    `.cart-item[data-unique-id="${uniqueId}"]`
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
    ".frame-19 .frame-20 .text-wrapper-12"
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

// ADDED FOR CART: Utility function for authentication
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

window.addEventListener("popstate", () => {
  parseQueryParams();
  const minPriceInput = document.querySelector("#price-from");
  const maxPriceInput = document.querySelector("#price-to");
  const priceValues = document.querySelector(".price-values");
  const priceRange = document.querySelector(".price-range");
  const sortText = document.querySelector(".text-wrapper-3 .sort-wrapper");
  const priceFilter = document.querySelector(".price-filter");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  const filterControl = document.querySelector(".filter-control");
  const sortControl = document.querySelector(".sort-dropdown");

  const sortOptions = [
    { value: "created_at", text: "New products first" },
    { value: "price", text: "Price, low to high" },
    { value: "-price", text: "Price, high to low" },
    // { value: "default", text: "Sort by" },
    { value: "clear", text: "Clear Sort" },
  ];

  if (minPriceInput && maxPriceInput) {
    minPriceInput.value = state.price_from || "";
    maxPriceInput.value = state.price_to || "";
  }
  if (priceValues && priceRange) {
    priceRange.textContent = `${state.price_from || 0}-${
      state.price_to || "-"
    }`;
    priceValues.style.display =
      state.price_from || state.price_to ? "flex" : "none";
  }

  if (sortText) {
    const selectedOption = sortOptions.find((opt) => opt.value === state.sort);
    sortText.textContent = selectedOption ? selectedOption.text : "Sort By";
  }

  if (priceFilter && filterControl) {
    priceFilter.style.display = "none";
    filterControl.setAttribute("aria-expanded", "false");
  }
  if (dropdownMenu && sortControl) {
    dropdownMenu.style.display = "none";
    sortControl.setAttribute("aria-expanded", "false");
  }
  getDataByPage();
});

document.addEventListener("DOMContentLoaded", () => {
  const authToken = getCookie("authToken");
  const logo = document.querySelector(".div");
  const loginBtn = document.querySelector(".login-btn");
  const cartBtn = document.querySelector(".cart-img");

  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (!authToken) {
    loginBtn.style.display = "flex";
    cartBtn.style.display = "none";
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      console.log("login");
      window.location.href = "login.html";
    });
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const avatarImg = document.querySelector(".user-menu .ellipse");
  if (user && user.avatar && avatarImg) {
    avatarImg.src = user.avatar;
    avatarImg.alt = `${user.name || "User"} avatar`;
  } else if (avatarImg) {
    avatarImg.src = "assets/user-icon.png";
    avatarImg.alt = "User avatar";
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }

  parseQueryParams();
  initializeEventListeners();
  initializePriceFilter();
  initializeSortDropdown();
  getDataByPage();

  // ADDED FOR CART: Cart button and interaction event listeners
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
      }
    });
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
      }
    });
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
      }
    });
  }

  const checkoutButton = document.querySelector(".shopping-cart .primary-2");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      console.log("Go to Checkout button clicked");
      window.location.href = "checkout.html";
    });
  }

  const startShoppingButton = document.querySelector(
    ".cart-is-empty .shopping-button-wrapper"
  );
  if (startShoppingButton) {
    startShoppingButton.addEventListener("click", () => {
      console.log("Start shopping button clicked");
      window.location.href = "index.html";
    });
  }
});

function toCapitalCase(str) {
  return str.replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
}
