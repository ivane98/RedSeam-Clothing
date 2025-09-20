let products = [];
let current_page = 1;
let lastPage = 1;

async function displayTotalCount() {
  try {
    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products`
    );
    const data = await response.json();

    const productCount = (document.querySelector(
      ".product-count"
    ).innerHTML = `Showing 1–10 of ${data.meta.total} results`);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getDataByPage(page = 1) {
  try {
    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products?page=${page}`
    );
    const data = await response.json();
    products = data.data;
    current_page = data.meta.current_page;
    lastPage = data.meta.last_page;
    console.log(
      "Initial Load - Current Page:",
      current_page,
      "Last Page:",
      lastPage,
      "Links:",
      data.meta.links
    ); // Debug
    displayProducts(products);
    updatePagination(data.meta.links);
  } catch (error) {
    console.error("Error:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeEventListeners();
  initializePriceFilter();
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (paginationWrapper) {
    paginationWrapper.classList.remove("loaded");
  }
  await displayTotalCount();
  await getDataByPage();
});

export function displayProducts(products) {
  let productsHtml = "";

  products.forEach((product) => {
    productsHtml += `
        <article class="div-2">
        <img class="rectangle" src=${product.cover_image}
          alt=${product.name} />
        <div class="frame-7">
          <h3 class="product-name">${product.name}</h3>
          <span class="text-wrapper-4" aria-label="Price">$ ${product.price}</span>
        </div>
      </article>
        
        `;
  });

  document.querySelector(".products-grid").innerHTML = productsHtml;
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

function initializeEventListeners() {
  // Filter control click handler
  const filterControl = document.querySelector(".filter-control");
  const priceFilter = document.querySelector(".price-filter");

  if (filterControl && priceFilter) {
    filterControl.addEventListener("click", function () {
      priceFilter.style.display =
        priceFilter.style.display === "none" ? "flex" : "none";
    });
  }

  // Sort control click handler
  const sortControl = document.querySelector(".sort-dropdown");
  const dropdownManu = document.querySelector(".dropdown-menu");
  if (sortControl && dropdownManu) {
    sortControl.addEventListener("click", function () {
      dropdownManu.style.display =
        dropdownManu.style.display === "none" ? "flex" : "none";
    });
  }
  document.addEventListener("click", function (event) {
    const sortControl = document.querySelector(".sort-dropdown");
    const dropdownManu = document.querySelector(".dropdown-menu");

    if (dropdownManu && sortControl) {
      if (
        !dropdownManu.contains(event.target) &&
        !sortControl.contains(event.target)
      ) {
        dropdownManu.style.display = "none";
      }
    }
  });
}

function initializePriceFilter() {
  const applyButton = document.querySelector(".apply-button");
  const priceFilter = document.querySelector(".price-filter");

  if (applyButton) {
    applyButton.addEventListener("click", function () {
      // Add price filter functionality here
      console.log("Price filter applied");

      // Hide the filter after applying
      if (priceFilter) {
        priceFilter.style.display = "none";
      }
    });
  }

  // Close filter when clicking outside
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

// Utility functions for future enhancements
function filterProductsByPrice(minPrice, maxPrice) {
  // Filter products by price range
  return products.filter(
    (product) => product.price >= minPrice && product.price <= maxPrice
  );
}

function sortProducts(products, sortBy) {
  // Sort products by different criteria
  switch (sortBy) {
    case "price-low":
      return products.sort((a, b) => a.price - b.price);
    case "price-high":
      return products.sort((a, b) => b.price - a.price);
    case "name":
      return products.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return products;
  }
}
