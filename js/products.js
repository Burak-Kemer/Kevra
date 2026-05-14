// =======================
// PRODUCTS MODULE
// =======================

const formatPrice = (price) => `${price.toLocaleString("tr-TR")} ₺`;

function createProductCard(product) {
  const hasDiscount = product.discount && product.originalPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price/product.originalPrice) * 100) : 0;

  const isFav = favorites.includes(product.id);

  return `
    <div class="product-card" data-id="${product.id}">
      ${product.badge ? `<div class="product-badge ${product.badgeType}">${product.badge}</div>` : ""}
      
      <button class="fav-btn ${isFav ? "active" : ""}" data-id="${product.id}" onclick="event.stopPropagation(); toggleFavorite(${product.id})">
        ♥
      </button>

      <div class="product-image" onclick="openProductDetail(${product.id})">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-price">
          <span class="current-price">${formatPrice(product.price)}</span>
        </div>
        <button onclick="addToCart(${product.id})">
          Sepete Ekle
        </button>
      </div>
    </div>
  `;
}

function renderProducts(products = null, container = null) {
  if (!products) products = filteredProducts;

  const shopProducts =
    container ||
    document.getElementById("shopProducts") ||
    document.getElementById("featuredProducts");

  if (!shopProducts) return;

  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;

  const paginated = products.slice(start, end);

  shopProducts.innerHTML = paginated.map(p => createProductCard(p)).join('');

  renderPagination(products.length);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / productsPerPage);
  const container = document.getElementById("pageNumbers");
  if (!container) return;

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="goToPage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderProducts(filteredProducts);
}