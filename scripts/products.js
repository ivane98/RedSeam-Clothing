let products = [];
let current_page = 1;
let lastPage = 1;
let currentSort = "default";

async function getDataByPage(page = 1) {
  try {
    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products?page=${page}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = await response.json();
    products = data.data; // Ensure products is updated
    current_page = data.meta.current_page;
    lastPage = data.meta.last_page;
    applyFiltersAndSort(); // Apply current filter and sort on load
    updatePagination(data.meta.links);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function displayTotalCount() {
  try {
    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = await response.json();
    const meta = data.meta;
    const start = (meta.current_page - 1) * meta.per_page + 1;
    const end = Math.min(meta.current_page * meta.per_page, meta.total);

    console.log(meta);
    const productCount = (document.querySelector(
      ".product-count"
    ).innerHTML = `Showing ${start}–${end} of ${meta.total} results`);
  } catch (error) {
    console.error("Error fetching total count:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const logo = document.querySelector(".div");

  logo.addEventListener("click", () => {
    window.location.href = "products.html";
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const avatarImg = document.querySelector(".user-menu .ellipse");

  if (user && user.avatar && avatarImg) {
    avatarImg.src = user.avatar; // set avatar dynamically
    avatarImg.alt = `${user.name || "User"} avatar`; // accessibility
  } else {
    avatarImg.src = "images/user-icon.png";
    avatarImg.alt = `user avatar`;
    avatarImg.style.width = "20px";
    avatarImg.style.height = "20px";
  }

  initializeEventListeners();
  initializePriceFilter();
  initializeSortDropdown();
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (paginationWrapper) {
    paginationWrapper.classList.remove("loaded");
  }
  await displayTotalCount();
  await getDataByPage();
});

export function displayProducts(products) {
  if (!products || !Array.isArray(products)) {
    console.error("Invalid products array:", products);
    return;
  }

  let productsHtml = "";

  products.forEach((product) => {
    productsHtml += `
        <article class="div-2" data-product-id="${product.id || "no-id"}">
          <a href="single-product.html?id=${
            product.id || "no-id"
          }" class="product-link">
            <img class="rectangle" src="${product.cover_image || ""}" alt="${
      product.name || "Unnamed Product"
    }" />
            <div class="frame-7">
              <h3 class="product-name">${product.name || "No Name"}</h3>
              <span class="text-wrapper-4" aria-label="Price">$ ${
                product.price || 0
              }</span>
            </div>
          </a>
        </article>
        `;
  });

  const productsGrid = document.querySelector(".products-grid");
  if (productsGrid) {
    productsGrid.innerHTML = productsHtml;
    // Attach event listeners after DOM update
    const cards = document.querySelectorAll(".div-2");
    cards.forEach((card) => {
      const productId = card.getAttribute("data-product-id");
      card.addEventListener("click", (event) => {
        event.preventDefault();
        const clickedId = card.getAttribute("data-product-id");
        console.log("Clicked product ID:", clickedId); // Debug: ID on click
        if (clickedId && clickedId !== "no-id") {
          window.location.href = `single-product.html?id=${clickedId}`;
        } else {
          console.error("No valid product ID for this card:", card);
        }
      });
    });
  } else {
    console.error("Products grid not found in DOM");
  }
}

function updatePagination(links) {
  const paginationWrapper = document.querySelector(".pagination");
  const pageWrapper = document.querySelector(".pagination-wrapper");
  let paginationHtml = "";

  const pages = links
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

  let startPage = Math.max(1, current_page - halfVisible);
  let endPage = Math.min(lastPage, current_page + halfVisible);

  if (endPage - startPage < maxVisiblePages - 1) {
    if (startPage === 1) {
      endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
    } else if (endPage === lastPage) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
  }

  const prevLink = links.find((link) => link.label.includes("Previous"));
  paginationHtml += `
        <button class="pagination-nav" type="button" aria-label="Previous page" ${
          !prevLink?.url ? "disabled" : ""
        } data-url="${prevLink?.url || ""}">
          <img class="heroicons-mini" src="images/chevron-left.png" alt="" />
        </button>
    `;

  let pagesHtml = "";

  if (startPage > 1) {
    const firstPage = pages.find((p) => p.label === 1);
    pagesHtml += `
            <div class="page ${!firstPage?.active ? "num-wrapper" : ""}">
                <button class="page-button ${
                  firstPage?.active ? "page-active" : ""
                }" type="button" aria-label="Go to page 1" data-url="${
      firstPage?.url || ""
    }" ${firstPage?.active ? 'aria-current="page"' : ""}>
                    <span class="num-2 ${
                      firstPage?.active ? "num" : ""
                    }">1</span>
                </button>
            </div>
        `;
    if (startPage > 2) {
      pagesHtml += `
                <div class="num-wrapper">
                    <span class="num-2" aria-hidden="true">...</span>
                </div>
            `;
    }
  }

  pages.forEach((page) => {
    if (page.label >= startPage && page.label <= endPage) {
      if (page.active) {
        pagesHtml += `
                    <div class="page">
                        <button class="page-active" type="button" aria-current="page" aria-label="Page ${page.label}" data-url="${page.url}">
                            <span class="num">${page.label}</span>
                        </button>
                    </div>
                `;
      } else {
        pagesHtml += `
                    <div class="num-wrapper">
                        <button class="page-button" type="button" aria-label="Go to page ${page.label}" data-url="${page.url}">
                            <span class="num-2">${page.label}</span>
                        </button>
                    </div>
                `;
      }
    }
  });

  if (endPage < lastPage) {
    if (endPage < lastPage - 1 && startPage <= 1) {
      pagesHtml += `
                <div class="num-wrapper">
                    <span class="num-2" aria-hidden="true">...</span>
                </div>
            `;
    }
    const lastPageLink = pages.find((p) => p.label === lastPage);
    pagesHtml += `
            <div class="${!lastPageLink?.active ? "num-wrapper" : "page"}">
                <button class="${
                  !lastPageLink?.active ? "page-button" : "page-active"
                }" type="button" aria-label="Go to page ${lastPage}" data-url="${
      lastPageLink?.url || ""
    }" ${lastPageLink?.active ? 'aria-current="page"' : ""}>
                    <span class="${
                      !lastPageLink?.active ? "num-2" : "num"
                    }">${lastPage}</span>
                </button>
            </div>
        `;
  }

  paginationHtml += pagesHtml;

  const nextLink = links.find((link) => link.label.includes("Next"));
  paginationHtml += `
        <button class="pagination-nav" type="button" aria-label="Next page" ${
          !nextLink?.url ? "disabled" : ""
        } data-url="${nextLink?.url || ""}">
          <img class="heroicons-mini" src="images/chevron-right.png" alt="" />
        </button>
    `;

  if (paginationWrapper) {
    paginationWrapper.innerHTML = paginationHtml;
    paginationWrapper.offsetHeight;

    paginationWrapper.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.dataset.url;
        if (url) {
          const pageParam = new URL(url).searchParams.get("page");
          getDataByPage(Number(pageParam));
        }
      });
    });

    if (pageWrapper) {
      pageWrapper.classList.add("loaded");
    }
  }
}

function initializeEventListeners() {
  const filterControl = document.querySelector(".filter-control");
  const priceFilter = document.querySelector(".price-filter");

  if (filterControl && priceFilter) {
    priceFilter.style.display = priceFilter.style.display || "none";
    filterControl.addEventListener("click", function () {
      priceFilter.style.display =
        priceFilter.style.display === "none" ? "flex" : "none";
    });
  }

  const sortControl = document.querySelector(".sort-dropdown");
  const dropdownManu = document.querySelector(".dropdown-menu");
  if (sortControl && dropdownManu) {
    dropdownManu.style.display = dropdownManu.style.display || "none";
    sortControl.addEventListener("click", function () {
      dropdownManu.style.display =
        dropdownManu.style.display === "none" ? "flex" : "none";
    });
  }

  document.addEventListener("click", function (event) {
    const sortControl = document.querySelector(".sort-dropdown");
    const dropdownManu = document.querySelector(".dropdown-menu");
    const filterControl = document.querySelector(".filter-control");
    const priceFilter = document.querySelector(".price-filter");

    if (dropdownManu && sortControl) {
      if (
        !dropdownManu.contains(event.target) &&
        !sortControl.contains(event.target)
      ) {
        dropdownManu.style.display = "none";
      }
    }
    if (priceFilter && filterControl) {
      if (
        !priceFilter.contains(event.target) &&
        !filterControl.contains(event.target)
      ) {
        priceFilter.style.display = "none";
      }
    }
  });
}

function initializePriceFilter() {
  const applyButton = document.querySelector(".apply-button");
  const priceFilter = document.querySelector(".price-filter");

  if (applyButton) {
    applyButton.addEventListener("click", function () {
      const minPriceInput = document.querySelector(
        ".price-inputs .price-input-group:first-child .price-input"
      );
      const maxPriceInput = document.querySelector(
        ".price-inputs .price-input-group:last-child .price-input"
      );
      const minPrice = parseFloat(minPriceInput.value) || 0;
      const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

      if (minPrice > maxPrice) {
        alert("Minimum price cannot be greater than maximum price.");
        return;
      }

      applyFiltersAndSort();
      if (priceFilter) {
        priceFilter.style.display = "none";
      }

      const priceValues = document.querySelector(".price-values");
      const priceRange = document.querySelector(".price-range");
      priceRange.innerText = `${minPriceInput.value || 0}-${
        maxPriceInput.value || "-"
      }`;
      priceValues.style.display = "flex";
    });
  }

  document.addEventListener("click", function (event) {
    const filterControl = document.querySelector(".filter-control");
    const priceFilter = document.querySelector(".price-filter");

    if (priceFilter && filterControl) {
      if (
        !priceFilter.contains(event.target) &&
        !filterControl.contains(event.target)
      ) {
        priceFilter.style.display = "none";
      }
    }
  });
}

function initializeSortDropdown() {
  const dropdownOptions = document.querySelectorAll(".dropdown-option");
  const sortText = document.querySelector(".text-wrapper-3");
  const dropdownManu = document.querySelector(".dropdown-menu");
  if (dropdownOptions && sortText) {
    dropdownOptions.forEach((option) => {
      option.addEventListener("click", function () {
        event.stopPropagation();
        const selectedText = option.textContent;
        const capitalizedText = toCapitalCase(selectedText);
        sortText.textContent = capitalizedText;
        const sortBy = selectedText
          .toLowerCase()
          .replace(/, /g, "-")
          .replace(/ /g, "-");
        currentSort =
          sortBy === "new-products-first"
            ? "default"
            : sortBy === "price-low-to-high"
            ? "price-low"
            : sortBy === "price-high-to-low"
            ? "price-high"
            : "default";
        applyFiltersAndSort();

        if (dropdownManu) {
          dropdownManu.style.display = "none";
        }
      });
    });
  }

  const priceValuesImg = document.querySelector(".price-values-img");

  priceValuesImg.addEventListener("click", () => {
    document.querySelector(".price-values").style.display = "none";
    window.location.reload();
  });
}

function applyFiltersAndSort() {
  const minPriceInput = document.querySelector(
    ".price-inputs .price-input-group:first-child .price-input"
  );
  const maxPriceInput = document.querySelector(
    ".price-inputs .price-input-group:last-child .price-input"
  );
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

  if (minPrice > maxPrice) {
    alert("Minimum price cannot be greater than maximum price.");
    return;
  }

  let filteredProducts = filterProductsByPrice(minPrice, maxPrice);
  const sortedProducts = sortProducts(filteredProducts, currentSort);
  displayProducts(sortedProducts);
}

function filterProductsByPrice(minPrice, maxPrice) {
  return products.filter(
    (product) => product.price >= minPrice && product.price <= maxPrice
  );
}

function sortProducts(products, sortBy) {
  switch (sortBy) {
    case "price-low":
      return products.sort((a, b) => a.price - b.price);
    case "price-high":
      return products.sort((a, b) => b.price - a.price);
    case "name":
      return products.sort((a, b) => a.name.localeCompare(b.name)); // Updated to use 'name' instead of 'title'
    default:
      return [...products];
  }
}

function toCapitalCase(str) {
  return str.replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
}
