let state = {
  page: 1,
  price_from: null,
  price_to: null,
  sort: null,
};

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


    console.log('API Request:', `https://api.redseam.redberryinternship.ge/api/products?${params.toString()}`);
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
          <a href="single-product.html?id=${
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
        window.location.href = `single-product.html?id=${productId}`;
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
      <img class="heroicons-mini" src="images/chevron-left.png" alt="" />
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
      <img class="heroicons-mini" src="images/chevron-right.png" alt="" />
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
    priceFilter.style.display = 'none';
    filterControl.setAttribute('aria-expanded', 'false');
    filterControl.addEventListener('click', () => {
      const isExpanded = priceFilter.style.display === 'flex';
      priceFilter.style.display = isExpanded ? 'none' : 'flex';
      filterControl.setAttribute('aria-expanded', !isExpanded);
    });
  }


  if (sortControl && dropdownMenu) {
    dropdownMenu.style.display = 'none'; 
    sortControl.setAttribute('aria-expanded', 'false');
    sortControl.addEventListener('click', () => {
      const isExpanded = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isExpanded ? 'none' : 'block';
      sortControl.setAttribute('aria-expanded', !isExpanded);
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
    priceRange.textContent = `${state.price_from || 0}-${
      state.price_to || "-"
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
  const sortText = document.querySelector('.text-wrapper-3 .sort-wrapper');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const sortOptions = [
    { value: 'created_at', text: 'New products first' },
    { value: 'price', text: 'Price, low to high' },
    { value: '-price', text: 'Price, high to low' },
    {value: 'default', text: 'Sort by'}
  ];

  if (sortText) {
    const selectedOption = sortOptions.find(opt => opt.value === state.sort) || sortOptions[3];
    sortText.textContent = selectedOption.text;
  }

  document.querySelectorAll('.dropdown-option').forEach((option, index) => {
    if (index < sortOptions.length) {
      option.setAttribute('data-value', sortOptions[index].value);
      option.setAttribute('role', 'option');
      option.textContent = sortOptions[index].text;
      option.addEventListener('click', event => {
        event.stopPropagation();
        const value = option.dataset.value;
        const text = option.textContent;
        console.log('Sort option selected:', { value, text });
        if (sortText) sortText.textContent = text;
        state.sort = value;
        state.page = 1;
        getDataByPage();
        if (dropdownMenu) {
          dropdownMenu.style.display = 'none';
          document.querySelector('.sort-dropdown').setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
}

window.addEventListener("popstate", () => {
  parseQueryParams();
  const minPriceInput = document.querySelector("#price-from");
  const maxPriceInput = document.querySelector("#price-to");
  const priceValues = document.querySelector(".price-values");
  const priceRange = document.querySelector(".price-range");
  const sortText = document.querySelector(".text-wrapper-3 .sort-wrapper");
  const priceFilter = document.querySelector('.price-filter');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const filterControl = document.querySelector('.filter-control');
  const sortControl = document.querySelector('.sort-dropdown');

  const sortOptions = [
    { value: 'created_at', text: 'New products first' },
    { value: 'price', text: 'Price, low to high' },
    { value: '-price', text: 'Price, high to low' },
    { value: 'default', text: 'Sort by' }

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
    const selectedOption = sortOptions.find(opt => opt.value === state.sort) || sortOptions[3];
    sortText.textContent = selectedOption.text;
  }

  if (priceFilter && filterControl) {
    priceFilter.style.display = 'none';
    filterControl.setAttribute('aria-expanded', 'false');
  }
  if (dropdownMenu && sortControl) {
    dropdownMenu.style.display = 'none';
    sortControl.setAttribute('aria-expanded', 'false');
  }
  getDataByPage();
});

document.addEventListener("DOMContentLoaded", () => {
  const logo = document.querySelector(".div");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const avatarImg = document.querySelector(".user-menu .ellipse");
  if (user && user.avatar && avatarImg) {
    avatarImg.src = user.avatar;
    avatarImg.alt = `${user.name || "User"} avatar`;
  } else if (avatarImg) {
    avatarImg.src = "images/user-icon.png";
    avatarImg.alt = "User avatar";
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }

  parseQueryParams();
  initializeEventListeners();
  initializePriceFilter();
  initializeSortDropdown();
  getDataByPage();
});

function toCapitalCase(str) {
  return str.replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
}
