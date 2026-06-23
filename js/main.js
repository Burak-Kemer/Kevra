// ==========================
// KEVRA - MAIN JAVASCRIPT (GÜNCELLENMİŞ)
// ==========================

// 70 Kadın Ürünü
let allProducts = [];

// Admin'den gelen ürünleri yükle
const storedProducts = localStorage.getItem("kevra_products");

try {
    if (storedProducts) {
        allProducts = JSON.parse(storedProducts);
    } else {
        throw new Error("No stored products");
    }
} catch (e) {
    console.warn("LocalStorage bozuk veya boş, default ürünler yükleniyor");
    allProducts = [
        { id: 1, name: "Siyah Midi Elbise", price: 899, originalPrice: 1299, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800", description: "Klasik siyah midi elbise. Her ortama uygun, zamansız tasarım.", badge: "Popüler", badgeType: "popular", category: "elbise", discount: true, colors: ["Siyah", "Bordo", "Lacivert"], sizes: ["XS", "S", "M", "L", "XL"], stock: 25 },
        { id: 2, name: "Çiçekli Maxi Elbise", price: 749, originalPrice: 749, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800", description: "Yaz için ideal çiçek desenli maxi elbise.", badge: "Yeni", badgeType: "yeni", category: "elbise", discount: false, colors: ["Pembe", "Mavi", "Sarı"], sizes: ["S", "M", "L"], stock: 18 },
        { id: 3, name: "Ofis Elbisesi (Bej)", price: 1199, originalPrice: 1599, image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800", description: "Profesyonel ortamlar için şık ofis elbisesi.", badge: "Premium", badgeType: "premium", category: "elbise", discount: true, colors: ["Bej", "Siyah", "Gri"], sizes: ["XS", "S", "M", "L", "XL"], stock: 15 },
        { id: 4, name: "Kokteyl Elbisesi", price: 1599, originalPrice: 2299, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800", description: "Özel davetler için parıltılı kokteyl elbisesi.", badge: "İndirim", badgeType: "indirim", category: "elbise", discount: true, colors: ["Altın", "Gümüş", "Siyah"], sizes: ["S", "M", "L"], stock: 8 }
    ];
}

// State
let cart = JSON.parse(localStorage.getItem('kevra_cart')) || [];
let favorites = JSON.parse(localStorage.getItem('kevra_favorites')) || [];
let currentPage = 1;
let productsPerPage = 12;
let filteredProducts = [...allProducts];

// Quick View için geçici değişkenler
let currentQVProduct = null;
let selectedQVSize = null;
let selectedQVColor = null;

// Format Price
function formatPrice(price) {
    return price.toLocaleString('tr-TR') + ' ₺';
}

// Save Cart & Favorites
function saveCart() {
    localStorage.setItem('kevra_cart', JSON.stringify(cart));
}

function saveFavorites() {
    localStorage.setItem('kevra_favorites', JSON.stringify(favorites));
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toastText");
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// Create Product Card
function createProductCard(product) {
    const hasDiscount = product.discount && product.originalPrice > product.price;
    const discountPercent = hasDiscount ? Math.round((1 - product.price/product.originalPrice) * 100) : 0;
    const isFav = favorites.includes(product.id);
    
    return `
        <div class="product-card" data-id="${product.id}" data-product-id="${product.id}">
            ${product.badge ? `<div class="product-badge ${product.badgeType}">${product.badge}</div>` : ""}
            
            <button class="fav-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); toggleFavorite('${product.id}', event)">
                ${isFav ? '♥' : '♡'}
            </button>

            <div class="product-image" onclick="openProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <button class="quick-view-btn" onclick="event.stopPropagation(); openQuickView('${product.id}')">Hızlı İncele</button>
            </div>

            <div class="product-info">
                <h3 onclick="openProductDetail('${product.id}')">${product.name}</h3>
                <div class="product-price">
                    ${hasDiscount ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${hasDiscount ? `<span class="discount-percent">%${discountPercent}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCartWithVariant('${product.id}')">
                    🛒 Sepete Ekle
                </button>
            </div>
        </div>
    `;
}

// ================= QUICK VIEW MODAL =================

function openQuickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentQVProduct = product;
    selectedQVSize = null;
    selectedQVColor = null;
    
    // Hata mesajlarını gizle
    const sizeError = document.getElementById('sizeError');
    const colorError = document.getElementById('colorError');
    if (sizeError) sizeError.classList.remove('show');
    if (colorError) colorError.classList.remove('show');
    
    // Modal elementlerini doldur
    const qvImg = document.getElementById('qvImg');
    const qvName = document.getElementById('qvName');
    const qvPrice = document.getElementById('qvPrice');
    const qvDesc = document.getElementById('qvDesc');
    const qvBadge = document.getElementById('qvBadge');
    const qvOriginalPrice = document.getElementById('qvOriginalPrice');
    const qvDiscount = document.getElementById('qvDiscount');
    const qvStock = document.getElementById('qvStock');
    
    if (qvImg) qvImg.src = product.image;
    if (qvImg) qvImg.alt = product.name;
    if (qvName) qvName.textContent = product.name;
    if (qvPrice) qvPrice.textContent = formatPrice(product.price);
    if (qvDesc) qvDesc.textContent = product.description;
    
    // Badge
    if (qvBadge) {
        if (product.badge) {
            qvBadge.textContent = product.badge;
            qvBadge.style.display = 'inline-block';
        } else {
            qvBadge.style.display = 'none';
        }
    }
    
    // İndirim bilgisi
    const hasDiscount = product.discount && product.originalPrice > product.price;
    if (qvOriginalPrice) {
        if (hasDiscount) {
            qvOriginalPrice.textContent = formatPrice(product.originalPrice);
            qvOriginalPrice.style.display = 'inline';
        } else {
            qvOriginalPrice.style.display = 'none';
        }
    }
    
    if (qvDiscount) {
        if (hasDiscount) {
            const discountPercent = Math.round((1 - product.price/product.originalPrice) * 100);
            qvDiscount.textContent = '%' + discountPercent;
            qvDiscount.style.display = 'inline';
        } else {
            qvDiscount.style.display = 'none';
        }
    }
    
    // Stok bilgisi
    if (qvStock) {
        if (product.stock > 0) {
            qvStock.innerHTML = '<span>✓</span> Stokta var (' + product.stock + ' adet)';
            qvStock.className = 'quick-view-stock';
        } else {
            qvStock.innerHTML = '<span>✗</span> Stokta yok';
            qvStock.className = 'quick-view-stock out-of-stock';
        }
    }
    
    // Bedenler
    const sizesContainer = document.getElementById('qvSizes');
    if (sizesContainer && product.sizes) {
        sizesContainer.innerHTML = product.sizes.map((size) => 
            `<button class="qv-size-btn" onclick="selectQVSize(this, '${size}')">${size}</button>`
        ).join('');
    }
    
    // Renkler
    const colorsContainer = document.getElementById('qvColors');
    if (colorsContainer && product.colors) {
        const colorMap = {
            'Beyaz': '#ffffff', 'Siyah': '#000000', 'Pembe': '#f4a0b5',
            'Mavi': '#1a56db', 'Haki': '#8b8c5e', 'Mürdüm': '#4a0e2e',
            'Bordo': '#800020', 'Acı Kahve': '#4e2c0e', 'Sarı': '#f5c518',
            'Vizon': '#c4a882', 'Bej': '#e8d5b7', 'Lacivert': '#000080',
            'Yağ Yeşili': '#4a5240', 'Kahverengi': '#6b3a2a', 'Krem': '#f5f0e0',
            'Antrasit': '#3b3b3b', 'Gri': '#808080', 'Taş': '#b0a898',
            'Küf Yeşili': '#7a8c6e', 'Hardal': '#c49a22'
        };
        
        colorsContainer.innerHTML = product.colors.map((color) => {
            const bgColor = colorMap[color] || color.toLowerCase();
            const dotBorder = (color === 'Beyaz' || color === 'Krem' || color === 'Bej') ? 'border: 1px solid #ddd;' : '';
            return `<button class="qv-color-btn" onclick="selectQVColor(this, '${color}')">
                <span class="color-dot" style="background: ${bgColor}; ${dotBorder}"></span>
                ${color}
            </button>`;
        }).join('');
    }
    
    // Favori butonu
    const favBtn = document.getElementById('qvFavBtn');
    if (favBtn) {
        const isFav = favorites.includes(product.id);
        favBtn.textContent = isFav ? '♥' : '♡';
        favBtn.className = isFav ? 'qv-add-fav active' : 'qv-add-fav';
    }
    
    // Modalı göster
    const modal = document.getElementById('quickViewModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentQVProduct = null;
    selectedQVSize = null;
    selectedQVColor = null;
}

function selectQVSize(btn, size) {
    selectedQVSize = size;
    document.querySelectorAll('#qvSizes .qv-size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const sizeError = document.getElementById('sizeError');
    if (sizeError) sizeError.classList.remove('show');
}

function selectQVColor(btn, color) {
    selectedQVColor = color;
    document.querySelectorAll('#qvColors .qv-color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const colorError = document.getElementById('colorError');
    if (colorError) colorError.classList.remove('show');
}

function addToCartFromQuickView() {
    if (!currentQVProduct) return;
    
    let hasError = false;
    
    if (!selectedQVSize) {
        const sizeError = document.getElementById('sizeError');
        if (sizeError) sizeError.classList.add('show');
        hasError = true;
    }
    
    if (!selectedQVColor) {
        const colorError = document.getElementById('colorError');
        if (colorError) colorError.classList.add('show');
        hasError = true;
    }
    
    if (hasError) {
        showToast('Lütfen beden ve renk seçin', 'error');
        return;
    }
    
    const existing = cart.find(item => 
        item.id === currentQVProduct.id && 
        item.size === selectedQVSize && 
        item.color === selectedQVColor
    );
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: currentQVProduct.id,
            name: currentQVProduct.name,
            price: currentQVProduct.price,
            image: currentQVProduct.image,
            quantity: 1,
            size: selectedQVSize,
            color: selectedQVColor
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${currentQVProduct.name} sepete eklendi`);
    closeQuickView();
}

function toggleFavFromQuickView() {
    if (!currentQVProduct) return;
    
    const index = favorites.indexOf(currentQVProduct.id);
    const favBtn = document.getElementById('qvFavBtn');
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`${currentQVProduct.name} favorilerden çıkarıldı`, "error");
        if (favBtn) {
            favBtn.textContent = '♡';
            favBtn.classList.remove('active');
        }
    } else {
        favorites.push(currentQVProduct.id);
        showToast(`${currentQVProduct.name} favorilere eklendi`);
        if (favBtn) {
            favBtn.textContent = '♥';
            favBtn.classList.add('active');
        }
    }
    
    saveFavorites();
    updateFavUI();
    renderProducts(filteredProducts);
}

// ================= SEPETE EKLE (ZORUNLU BEDEN/RENK) =================

function addToCartWithVariant(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Hemen hızlı incele modalını aç (beden/renk seçimi için)
    openQuickView(productId);
}

// PRODUCT DETAIL (Full page)
function openProductDetail(productId) {
    openQuickView(productId);
}

// Render Products
function renderProducts(products = null, container = null) {
    if (!products) products = filteredProducts;
    
    let targetContainer = container;
    if (!targetContainer) {
        targetContainer = document.getElementById("shopProducts") || document.getElementById("featuredProducts");
    }
    
    if (!targetContainer) {
        console.log("Ürün konteyneri bulunamadı");
        return;
    }
    
    const isShopPage = document.body.classList.contains('shop-page');
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginated = isShopPage ? products.slice(start, end) : products;
    
    // Boş durum kontrolü
    if (products.length === 0) {
        targetContainer.innerHTML = `
            <div style="text-align: center; padding: 60px; grid-column: 1/-1;">
                <span style="font-size: 48px;">🔍</span>
                <h3>Ürün bulunamadı</h3>
                <p>Farklı bir arama yapmayı deneyin</p>
            </div>
        `;
        return;
    }
    
    targetContainer.innerHTML = paginated.map(p => createProductCard(p)).join('');
    
    if (isShopPage) {
        renderPagination(products.length);
        const resultsCount = document.getElementById("resultsCount");
        if (resultsCount) resultsCount.textContent = products.length;
    }
}

// Pagination
function renderPagination(total) {
    const totalPages = Math.ceil(total / productsPerPage);
    const container = document.getElementById("pageNumbers");
    if (!container) return;
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span>...</span>`;
        }
    }
    container.innerHTML = html;
    
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function goToPage(page) {
    currentPage = page;
    renderProducts(filteredProducts);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(direction) {
    goToPage(currentPage + direction);
}

// Add to Cart (Basit - direkt ekleme)
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            size: product.sizes ? product.sizes[0] : 'M',
            color: product.colors ? product.colors[0] : 'Siyah'
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.name} sepete eklendi`);
}

// ================= FAVORI YONETIMI =================

function toggleFavorite(productId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`${product.name} favorilerden çıkarıldı`, 'info');
    } else {
        favorites.push(productId);
        showToast(`${product.name} favorilere eklendi`, 'success');
    }
    
    saveFavorites();
    updateFavUI();
    
    // Ürün kartlarını güncelle
    const favBtns = document.querySelectorAll(`[data-id="${productId}"] .fav-btn`);
    favBtns.forEach(btn => {
        const isFav = favorites.includes(productId);
        btn.classList.toggle('active', isFav);
        btn.innerHTML = isFav ? '♥' : '♡';
    });
}

// Update Cart UI
function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById("cartCount");
    const cartDrawerCount = document.getElementById("cartDrawerCount");
    
    if (cartCount) cartCount.textContent = count;
    if (cartDrawerCount) cartDrawerCount.textContent = count;
    
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const subTotal = document.getElementById("subTotal");
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 80px 20px;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">🛒</span>
                <h3 style="margin-bottom: 10px; font-size: 20px;">Sepetiniz Boş</h3>
                <p style="color: #666;">Alışverişe başlamak için ürünlerimize göz atın</p>
                <button onclick="document.getElementById('closeCartBtn').click(); location.href='shop.html'" 
                        style="margin-top: 20px; padding: 12px 24px; background: #1a1a1a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Alışverişe Başla
                </button>
            </div>
        `;
        if (cartTotal) cartTotal.textContent = "0 ₺";
        if (subTotal) subTotal.textContent = "0 ₺";
        
        // ✅ EKLENEN: Boş sepette checkoutTotal'ı da sıfırla
        const checkoutTotal = document.getElementById("checkoutTotal");
        if (checkoutTotal) checkoutTotal.textContent = "0 ₺";
        
        return;
    }
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid #eee; align-items: flex-start; background: white; margin-bottom: 10px; border-radius: 12px;">
            <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 130px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="flex: 1;">
                <h4 style="font-size: 16px; margin-bottom: 8px; font-weight: 600; color: #1a1a1a;">${item.name}</h4>
                
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    ${item.size ? `<span style="padding: 6px 14px; background: linear-gradient(135deg, #f5f5f5, #e8e8e8); border-radius: 20px; font-size: 13px; color: #555; font-weight: 500; border: 1px solid #e0e0e0;">📏 ${item.size}</span>` : ''}
                    ${item.color ? `<span style="padding: 6px 14px; background: linear-gradient(135deg, #f5f5f5, #e8e8e8); border-radius: 20px; font-size: 13px; color: #555; font-weight: 500; border: 1px solid #e0e0e0;">🎨 ${item.color}</span>` : ''}
                </div>
                
                <p style="color: #c9a87c; font-weight: 700; font-size: 18px; margin-bottom: 15px;">${formatPrice(item.price)}</p>
                
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; border: 2px solid #e0e0e0; border-radius: 25px; overflow: hidden; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <button onclick="updateCartQty('${item.id}', -1)"
                                style="width: 36px; height: 36px; border: none; background: white; cursor: pointer; font-size: 18px; color: #666; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">−</button>
                        <span style="min-width: 45px; text-align: center; font-weight: 700; font-size: 16px; color: #1a1a1a;">${item.quantity}</span>
                        <button onclick="updateCartQty('${item.id}', 1)"
                                style="width: 36px; height: 36px; border: none; background: white; cursor: pointer; font-size: 18px; color: #666; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')"
                            style="padding: 8px 16px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c; border-radius: 20px; cursor: pointer; font-size: 13px; transition: all 0.3s; font-weight: 500;">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartTotal) cartTotal.textContent = formatPrice(total);
    if (subTotal) subTotal.textContent = formatPrice(total);
    
    // ✅ EKLENEN: Ödemeye Geç butonundaki tutarı da güncelle
    const checkoutTotal = document.getElementById("checkoutTotal");
    if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
}

// Update Favorites UI
function updateFavUI() {
    const favCount = document.getElementById("favCount");
    const favDrawerCount = document.getElementById("favDrawerCount");

    // Sadece allProducts'ta gerçekten var olan favorileri say
    const validFavProducts = favorites
        .map(id => allProducts.find(p => String(p.id) === String(id)))
        .filter(Boolean);

    const displayCount = validFavProducts.length;
    if (favCount) favCount.textContent = displayCount;
    if (favDrawerCount) favDrawerCount.textContent = displayCount;

    const favItems = document.getElementById("favItems");
    if (!favItems) return;

    if (displayCount === 0) {
        favItems.innerHTML = `
            <div style="text-align: center; padding: 80px 20px;">
                <span style="font-size: 64px; display: block; margin-bottom: 20px;">♡</span>
                <h3 style="margin-bottom: 10px; font-size: 20px;">Favorileriniz Boş</h3>
                <p style="color: #666;">Beğendiğiniz ürünleri burada görebilirsiniz</p>
                <button onclick="document.getElementById('closeFavBtn').click(); location.href='shop.html'"
                        style="margin-top: 20px; padding: 12px 24px; background: #1a1a1a; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Ürünleri Keşfet
                </button>
            </div>
        `;
        return;
    }

    favItems.innerHTML = validFavProducts.map(product => {
        if (!product) return '';
        return `
            <div style="display: flex; gap: 15px; padding: 20px; border-bottom: 1px solid #eee; align-items: center; background: white; margin-bottom: 10px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 130px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="flex: 1;">
                    <h4 style="font-size: 16px; margin-bottom: 8px; font-weight: 600; color: #1a1a1a;">${product.name}</h4>
                    <p style="color: #c9a87c; font-weight: 700; font-size: 18px; margin-bottom: 15px;">${formatPrice(product.price)}</p>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="addToCartWithVariant('${product.id}')"
                                style="padding: 12px 20px; background: #1a1a1a; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s; flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            🛒 Sepete Ekle
                        </button>
                        <button onclick="toggleFavorite('${product.id}', event)"
                                style="padding: 12px 20px; background: transparent; border: 2px solid #e74c3c; color: #e74c3c; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s; min-width: 80px;">
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateCartQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
    showToast('Ürün sepetten kaldırıldı');
}

// Setup Search - GÜNCELLENMİŞ MODERN ARAMA
function setupSearch() {
    const searchModal = document.getElementById("searchModal");
    const searchInput = document.getElementById("searchInput");
    const openSearch = document.getElementById("openSearch");
    const closeSearch = document.getElementById("closeSearch");
    const searchResults = document.getElementById("searchResults");
    
    if (openSearch && searchModal) {
        openSearch.addEventListener('click', () => {
            searchModal.classList.add("active");
            document.body.style.overflow = 'hidden';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                searchResults.innerHTML = '';
            }
        });
    }
    
    if (closeSearch && searchModal) {
        closeSearch.addEventListener('click', () => {
            searchModal.classList.remove("active");
            document.body.style.overflow = '';
        });
    }
    
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.classList.remove("active");
                document.body.style.overflow = '';
            }
        });
    }
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (!query) {
                searchResults.innerHTML = '';
                return;
            }
            
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
            );
            
            if (filtered.length === 0) {
                searchResults.innerHTML = `
                    <div class="search-empty">
                        <div class="search-empty-icon">🔍</div>
                        <h3>Sonuç bulunamadı</h3>
                        <p>\"${query}\" için arama sonucu yok</p>
                    </div>
                `;
                return;
            }
            
            // Sonuç sayısı
            const countHtml = `
                <div class="search-count">
                    <strong>${filtered.length}</strong> ürün bulundu
                </div>
            `;
            
            // Arama sonuçları
            const resultsHtml = filtered.slice(0, 6).map(p => {
                const hasDiscount = p.discount && p.originalPrice > p.price;
                const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
                
                return `
                    <div class="search-item">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                        <div class="search-item-info">
                            <div class="search-item-name">${p.name}</div>
                            <div class="search-item-category">${p.category}</div>
                            <div class="search-item-price">
                                ${formatPrice(p.price)}
                                ${hasDiscount ? `<span class="search-item-original">${formatPrice(p.originalPrice)}</span>` : ''}
                            </div>
                            ${p.badge ? `<span class="search-item-badge ${p.badgeType}">${p.badge}</span>` : ''}
                        </div>
                        <div class="search-item-actions">
                            <button class="search-view-btn" onclick="event.stopPropagation(); openQuickView(${p.id}); document.getElementById('searchModal').classList.remove('active'); document.body.style.overflow = '';">
                                👁️ İncele
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Tüm sonuçları gör linki
            const viewAllHtml = filtered.length > 6 ? `
                <a href="shop.html?search=${encodeURIComponent(query)}" class="search-view-all" onclick="document.getElementById('searchModal').classList.remove('active');">
                    Tüm ${filtered.length} sonucu gör →
                </a>
            ` : '';
            
            searchResults.innerHTML = countHtml + resultsHtml + viewAllHtml;
        });
        
        // Enter tuşu ile shop.html'e yönlendir
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// Setup Menu
function setupMenu() {
    const sideMenu = document.getElementById("sideMenu");
    const openMenuBtn = document.getElementById("openMenuBtn");
    const closeMenuBtn = document.getElementById("closeMenuBtn");
    const menuOverlay = document.getElementById("menuOverlay");
    
    function openMenu() {
        if (sideMenu) sideMenu.classList.add("active");
        if (menuOverlay) menuOverlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        if (sideMenu) sideMenu.classList.remove("active");
        if (menuOverlay) menuOverlay.classList.remove("active");
        document.body.style.overflow = '';
    }
    
    if (openMenuBtn) openMenuBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
}

// Setup Drawers - SEPET VE FAVORI DRAWERLARI
function setupDrawers() {
    // Cart Drawer
    const cartBtn = document.getElementById("cartBtn");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartOverlay = document.getElementById("cartOverlay");
    const closeCartBtn = document.getElementById("closeCartBtn");
    const continueBtn = document.getElementById("continueBtn");
    
    function openCart() {
        if (cartDrawer) cartDrawer.classList.add("open");
        if (cartOverlay) cartOverlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
    
    function closeCart() {
        if (cartDrawer) cartDrawer.classList.remove("open");
        if (cartOverlay) cartOverlay.classList.remove("active");
        document.body.style.overflow = '';
    }
    
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (continueBtn) continueBtn.addEventListener('click', closeCart);
    
    // Favorites Drawer
    const favBtn = document.getElementById("favBtn");
    const favDrawer = document.getElementById("favDrawer");
    const favOverlay = document.getElementById("favOverlay");
    const closeFavBtn = document.getElementById("closeFavBtn");
    
    function openFav() {
        if (favDrawer) favDrawer.classList.add("open");
        if (favOverlay) favOverlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
    
    function closeFav() {
        if (favDrawer) favDrawer.classList.remove("open");
        if (favOverlay) favOverlay.classList.remove("active");
        document.body.style.overflow = '';
    }
    
    if (favBtn) favBtn.addEventListener('click', openFav);
    if (closeFavBtn) closeFavBtn.addEventListener('click', closeFav);
    if (favOverlay) favOverlay.addEventListener('click', closeFav);
}

// ESC TUŞU DESTEĞİ
function setupEscapeKey() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Quick View modalını kapat
            const qvModal = document.getElementById('quickViewModal');
            if (qvModal && qvModal.classList.contains('active')) {
                closeQuickView();
                return;
            }
            
            // Search modalını kapat
            const searchModal = document.getElementById('searchModal');
            if (searchModal && searchModal.classList.contains('active')) {
                searchModal.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }
            
            // Cart drawer'ı kapat
            const cartDrawer = document.getElementById('cartDrawer');
            const cartOverlay = document.getElementById('cartOverlay');
            if (cartDrawer && cartDrawer.classList.contains('open')) {
                cartDrawer.classList.remove('open');
                if (cartOverlay) cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }
            
            // Favorites drawer'ı kapat
            const favDrawer = document.getElementById('favDrawer');
            const favOverlay = document.getElementById('favOverlay');
            if (favDrawer && favDrawer.classList.contains('open')) {
                favDrawer.classList.remove('open');
                if (favOverlay) favOverlay.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }
            
            // Side menu'yu kapat
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            if (sideMenu && sideMenu.classList.contains('active')) {
                sideMenu.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
                return;
            }
        }
    });
}

// Filter Functions
function toggleSizeFilter(btn) {
    btn.classList.toggle('active');
    applyFilters();
}

function toggleColorFilter(btn) {
    btn.classList.toggle('active');
    applyFilters();
}

function applyFilters() {
    let result = [...allProducts];
    
    // Category filter
    const checkedCategories = Array.from(document.querySelectorAll('.filter-checkbox input[data-filter="category"]:checked')).map(cb => cb.value);
    if (checkedCategories.length > 0) {
        result = result.filter(p => checkedCategories.includes(p.category));
    }
    
    // Discount only
    const onlyDiscount = document.getElementById("onlyDiscount");
    if (onlyDiscount && onlyDiscount.checked) {
        result = result.filter(p => p.discount);
    }
    
    // Size filter
    const activeSizes = Array.from(document.querySelectorAll('.size-filter-btn.active')).map(btn => btn.dataset.size);
    if (activeSizes.length > 0) {
        result = result.filter(p => p.sizes && p.sizes.some(s => activeSizes.includes(s)));
    }
    
    // Sort
    const sortSelect = document.getElementById("sortSelect");
    const sortValue = sortSelect ? sortSelect.value : 'newest';
    switch(sortValue) {
        case 'price-asc':
            result.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            result.sort((a, b) => b.price - a.price);
            break;
    }
    
    filteredProducts = result;
    currentPage = 1;
    renderProducts(filteredProducts);
    
    // Show/hide clear filters button
    const clearFilters = document.getElementById("clearFilters");
    if (clearFilters) {
        const hasActiveFilters = checkedCategories.length > 0 || activeSizes.length > 0 || (onlyDiscount && onlyDiscount.checked);
        clearFilters.style.display = hasActiveFilters ? 'block' : 'none';
    }
}

function clearAllFilters() {
    document.querySelectorAll('.filter-checkbox input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.size-filter-btn, .color-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    const onlyDiscount = document.getElementById("onlyDiscount");
    if (onlyDiscount) onlyDiscount.checked = false;
    
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.value = "newest";
    
    filteredProducts = [...allProducts];
    currentPage = 1;
    renderProducts(filteredProducts);
    
    const clearFilters = document.getElementById("clearFilters");
    if (clearFilters) clearFilters.style.display = 'none';
}

function toggleView(btn, view) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = document.getElementById("shopProducts");
    if (grid) grid.classList.toggle('list-view', view === 'list');
}

function openMobileFilters() {
    const sidebar = document.getElementById("shopSidebar");
    if (sidebar) sidebar.classList.add("active");
}

// Check URL Params
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const search = params.get('search');
    const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
    
    if (search) {
        filteredProducts = allProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.category.toLowerCase().includes(search.toLowerCase())
        );
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = `"${search}" için sonuçlar`;
    } else if (category) {
        const names = {
            elbise: "Elbiseler", ust: "Üst Giyim", alt: "Alt Giyim",
            triko: "Triko", dis: "Dış Giyim", aksesuar: "Aksesuar",
            indirim: "İndirimli Ürünler", yeni: "Yeni Gelenler"
        };
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = names[category] || "Tüm Ürünler";
        
        if (category === 'indirim') {
            filteredProducts = allProducts.filter(p => p.discount);
        } else if (category === 'yeni') {
            filteredProducts = allProducts.filter(p => p.badgeType === 'yeni');
        } else {
            filteredProducts = allProducts.filter(p => p.category === category);
        }
    } else {
        filteredProducts = [...allProducts];
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = "Tüm Ürünler";
    }
    
    currentPage = 1;
    renderProducts(filteredProducts);
}

// Header Scroll Effect
function setupHeaderScroll() {
    const header = document.getElementById('mainHeader');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function renderFromProducts() {
    const isShopPage = document.body.classList.contains('shop-page');
    if (isShopPage) {
        checkUrlParams();
    } else {
        const featuredContainer = document.getElementById("featuredProducts");
        if (featuredContainer) {
            let featured = allProducts.filter(p => p.badgeType === 'popular' || p.badgeType === 'premium');
            if (featured.length === 0) featured = allProducts.slice(0, 4);
            else if (featured.length > 4) featured = featured.slice(0, 4);
            renderProducts(featured, featuredContainer);
        }
    }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
    updateUserMenu();
    updateCartUI();
    updateFavUI();
    setupSearch();
    setupMenu();
    setupDrawers();
    setupHeaderScroll();
    setupEscapeKey();

    // localStorage'daki veriyle hızlı ilk render
    renderFromProducts();

    // Firebase'den güncel ürünleri çek ve yeniden render et
    if (window.KevraDB && typeof window.KevraDB.getProducts === 'function') {
        window.KevraDB.getProducts().then(function(freshProducts) {
            if (freshProducts && freshProducts.length > 0) {
                allProducts = freshProducts;
                filteredProducts = [...allProducts];
                // Artık var olmayan ürünlere ait favorileri temizle
                const validIds = new Set(freshProducts.map(p => String(p.id)));
                favorites = favorites.filter(id => validIds.has(String(id)));
                saveFavorites();
                renderFromProducts();
                updateFavUI();
            }
        }).catch(function(e) {
            console.warn('Firebase ürün yükleme hatası:', e);
        });
    }

    if (typeof updateUserMenu === 'function') {
        updateUserMenu();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    
    // Touch swipe desteği için
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    
    const minSwipeDistance = 50;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, false);
    
    function handleSwipe() {
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = touchEndY - touchStartY;
        
        // Dikey kaydırma yataydan büyükse işlem yapma (scroll)
        if (Math.abs(swipeDistanceY) > Math.abs(swipeDistanceX)) {
            return;
        }
        
        // Sol menü açma (sağdan sola kaydırma)
        if (swipeDistanceX > minSwipeDistance && touchStartX < 50) {
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            if (sideMenu && !sideMenu.classList.contains('active')) {
                sideMenu.classList.add('active');
                if (menuOverlay) menuOverlay.classList.add('active');
            }
        }
        
        // Sol menü kapama (soldan sağa kaydırma)
        if (swipeDistanceX < -minSwipeDistance) {
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            if (sideMenu && sideMenu.classList.contains('active')) {
                sideMenu.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
            }
        }
        
        // Sepet kapama (sağdan sola kaydırma)
        if (swipeDistanceX < -minSwipeDistance && touchStartX > window.innerWidth - 50) {
            const cartDrawer = document.getElementById('cartDrawer');
            const cartOverlay = document.getElementById('cartOverlay');
            if (cartDrawer && cartDrawer.classList.contains('open')) {
                cartDrawer.classList.remove('open');
                if (cartOverlay) cartOverlay.classList.remove('active');
            }
        }
    }
    
    // Mobil menü linkleri için dokunmatik alan optimizasyonu
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('touchstart', function() {
            this.style.background = 'rgba(201, 168, 124, 0.1)';
        });
        link.addEventListener('touchend', function() {
            this.style.background = '';
        });
    });
    
    // Ürün kartlarında double-tap zoom engelleme
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        let lastTouchEnd = 0;
        card.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    });
    
    // Virtual keyboard için input optimizasyonu
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            // iOS'ta keyboard açılınca scroll pozisyonunu koru
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }
    
    // Passive event listeners için scroll optimizasyonu
    document.addEventListener('scroll', function() {
        // Scroll performans optimizasyonu
    }, { passive: true });
    
    // Header scroll behavior (mobil için)
    let lastScrollTop = 0;
    const header = document.getElementById('mainHeader');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (window.innerWidth <= 992) {
            // Mobil: Scroll down = header gizle, scroll up = header göster
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                if (header) header.style.transform = 'translateY(-100%)';
            } else {
                if (header) header.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
    
    // iOS Safari bottom bar için safe area kontrolü
    const setSafeArea = () => {
        const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px';
        document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
    };
    
    setSafeArea();
    window.addEventListener('resize', setSafeArea);
    
});

// ================= MOBİL MENÜ TOGGLE =================
function toggleMobileMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (sideMenu.classList.contains('active')) {
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sideMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ================= MOBİL ARAMA TOGGLE =================
function toggleMobileSearch() {
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    
    if (searchModal.classList.contains('active')) {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput.focus(), 100);
    }
}