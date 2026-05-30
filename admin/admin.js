// Admin Panel JavaScript - KEVRA Premium
// Fullstack versiyon - Firebase entegrasyonu hazir

// ==================== FIREBASE WRAPPER ====================
const KevraDB = {
    // Firestore referansi (firebase-config.js yuklendikten sonra atanacak)
    db: null,
    auth: null,

    init() {
        if (typeof firebase !== 'undefined') {
            this.db = firebase.firestore();
            this.auth = firebase.auth();
        }
    },

    // Urun islemleri
    async getProducts() {
        if (this.db) {
            const snapshot = await this.db.collection('products').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return JSON.parse(localStorage.getItem('kevra_products') || '[]');
    },

    async saveProduct(product) {
        if (this.db) {
            if (product.id) {
                await this.db.collection('products').doc(product.id.toString()).set(product);
            } else {
                const docRef = await this.db.collection('products').add(product);
                product.id = docRef.id;
            }
        }
        // LocalStorage'a da kaydet (offline destegi)
        const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) products[index] = product;
        else products.push(product);
        localStorage.setItem('kevra_products', JSON.stringify(products));
        return product;
    },

    async deleteProduct(id) {
        if (this.db) {
            await this.db.collection('products').doc(id.toString()).delete();
        }
        const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('kevra_products', JSON.stringify(filtered));
    },

    // Siparis islemleri
    async getOrders() {
        if (this.db) {
            const snapshot = await this.db.collection('orders').orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    },

    async saveOrder(order) {
        if (this.db) {
            await this.db.collection('orders').doc(order.id).set(order);
        }
        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        const index = orders.findIndex(o => o.id === order.id);
        if (index >= 0) orders[index] = order;
        else orders.unshift(order);
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
    },

    // Admin auth
    async adminLogin(email, password) {
        if (this.auth) {
            try {
                const result = await this.auth.signInWithEmailAndPassword(email, password);
                const token = await result.user.getIdToken();
                return { success: true, token: token, name: result.user.displayName || 'Admin' };
            } catch (err) {
                return { success: false, message: err.message };
            }
        }
        return { success: false, message: 'Firebase bagli degil' };
    }
};

// Global olarak erisilebilir yap
window.KevraDB = KevraDB;

// ==================== ORNEK VERILER ====================
const sampleProducts = [
    { 
        id: 1, 
        name: 'Siyah Midi Elbise', 
        category: 'Elbise', 
        costPrice: 450,
        price: 899, 
        originalPrice: 1299, 
        discount: true, 
        stock: 25, 
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 
        badge: 'POPULER', 
        badgeType: 'populer', 
        sizes: ['S', 'M', 'L'], 
        colors: ['Siyah'],
        description: 'Zarif ve sik siyah midi elbise, ozel gunler icin ideal.'
    },
    { 
        id: 2, 
        name: 'Ipek Bluz', 
        category: 'Ust Giyim', 
        costPrice: 320,
        price: 899, 
        originalPrice: 899, 
        discount: false, 
        stock: 15, 
        image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', 
        badge: 'YENI', 
        badgeType: 'yeni', 
        sizes: ['XS', 'S', 'M'], 
        colors: ['Beyaz', 'Krem'],
        description: 'Premium ipek kumastan uretilmis sik bluz.'
    },
    { 
        id: 3, 
        name: 'Trenckot', 
        category: 'Dis Giyim', 
        costPrice: 750,
        price: 1499, 
        originalPrice: 1999, 
        discount: true, 
        stock: 5, 
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 
        badge: 'PREMIUM', 
        badgeType: 'premium', 
        sizes: ['M', 'L', 'XL'], 
        colors: ['Bej', 'Siyah'],
        description: 'Klasik kesim premium trenckot.'
    },
    { 
        id: 4, 
        name: 'Gold Zincir Kolye', 
        category: 'Aksesuar', 
        costPrice: 180,
        price: 499, 
        originalPrice: 599, 
        discount: true, 
        stock: 30, 
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', 
        badge: '', 
        badgeType: '', 
        sizes: [], 
        colors: ['Gold'],
        description: 'Sik gold zincir kolye.'
    },
    { 
        id: 5, 
        name: 'Ofis Elbisesi (Bej)', 
        category: 'Elbise', 
        costPrice: 600,
        price: 1199, 
        originalPrice: 1599, 
        discount: true, 
        stock: 12, 
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', 
        badge: 'PREMIUM', 
        badgeType: 'premium', 
        sizes: ['S', 'M', 'L'], 
        colors: ['Bej'],
        description: 'Profesyonel ortamlar icin sik ofis elbisesi.'
    },
    { 
        id: 6, 
        name: 'Kadife Elbise', 
        category: 'Elbise', 
        costPrice: 700,
        price: 1299, 
        originalPrice: 1799, 
        discount: true, 
        stock: 8, 
        image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400', 
        badge: 'YENI', 
        badgeType: 'yeni', 
        sizes: ['XS', 'S', 'M'], 
        colors: ['Bordo', 'Siyah'],
        description: 'Luks kadife kumastan ozel tasarim elbise.'
    }
];

const sampleOrders = [
    { id: 'ORD-001', date: '24.02.2026', customer: 'Zeynep K.', email: 'zeynep@email.com', phone: '0555 123 45 67', items: 3, total: 2247, payment: 'Kredi Karti', status: 'completed', address: 'Istanbul, Kadikoy', products: ['Siyah Midi Elbise', 'Gold Zincir Kolye'] },
    { id: 'ORD-002', date: '24.02.2026', customer: 'Ayse Y.', email: 'ayse@email.com', phone: '0555 234 56 78', items: 2, total: 1548, payment: 'Havale', status: 'processing', address: 'Ankara, Cankaya', products: ['Ipek Bluz', 'Trenckot'] },
    { id: 'ORD-003', date: '23.02.2026', customer: 'Selin A.', email: 'selin@email.com', phone: '0555 345 67 89', items: 1, total: 1499, payment: 'Kredi Karti', status: 'pending', address: 'Izmir, Konak', products: ['Trenckot'] },
    { id: 'ORD-004', date: '23.02.2026', customer: 'Mehmet K.', email: 'mehmet@email.com', phone: '0555 456 78 90', items: 2, total: 599, payment: 'Kapida Odeme', status: 'cancelled', address: 'Bursa, Nilufer', products: ['Gold Zincir Kolye'] },
    { id: 'ORD-005', date: '22.02.2026', customer: 'Elif Y.', email: 'elif@email.com', phone: '0555 567 89 01', items: 4, total: 3896, payment: 'Kredi Karti', status: 'completed', address: 'Istanbul, Besiktas', products: ['Siyah Midi Elbise', 'Ipek Bluz', 'Ofis Elbisesi'] }
];

const sampleCustomers = [
    { id: 1, firstName: 'Zeynep', lastName: 'K.', email: 'zeynep@email.com', phone: '0555 123 45 67', orders: 5, total: 4500, date: '15.01.2026' },
    { id: 2, firstName: 'Ayse', lastName: 'Y.', email: 'ayse@email.com', phone: '0555 234 56 78', orders: 3, total: 2800, date: '20.01.2026' },
    { id: 3, firstName: 'Selin', lastName: 'A.', email: 'selin@email.com', phone: '0555 345 67 89', orders: 8, total: 7200, date: '10.02.2026' },
    { id: 4, firstName: 'Mehmet', lastName: 'K.', email: 'mehmet@email.com', phone: '0555 456 78 90', orders: 2, total: 1200, date: '05.02.2026' },
    { id: 5, firstName: 'Elif', lastName: 'Y.', email: 'elif@email.com', phone: '0555 567 89 01', orders: 4, total: 5600, date: '18.02.2026' }
];

const sampleCategories = [
    { id: 1, name: 'Elbiseler', count: 12, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', desc: 'Tum elbise modelleri' },
    { id: 2, name: 'Ust Giyim', count: 15, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', desc: 'Bluz, gomlek, tisort' },
    { id: 3, name: 'Alt Giyim', count: 10, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', desc: 'Pantolon, etek, sort' },
    { id: 4, name: 'Triko', count: 8, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', desc: 'Kazak, hirka, suveter' },
    { id: 5, name: 'Dis Giyim', count: 6, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', desc: 'Mont, kaban, trenckot' },
    { id: 6, name: 'Aksesuar', count: 12, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', desc: 'Canta, taki, kemer' }
];

// ==================== VERI YUKLEME ====================
function initData() {
    if (!localStorage.getItem('kevra_products')) {
        localStorage.setItem('kevra_products', JSON.stringify(sampleProducts));
    }
    if (!localStorage.getItem('kevra_orders')) {
        localStorage.setItem('kevra_orders', JSON.stringify(sampleOrders));
    }
    if (!localStorage.getItem('kevra_customers')) {
        localStorage.setItem('kevra_customers', JSON.stringify(sampleCustomers));
    }
    if (!localStorage.getItem('kevra_categories')) {
        localStorage.setItem('kevra_categories', JSON.stringify(sampleCategories));
    }
    if (!localStorage.getItem('kevra_activities')) {
        localStorage.setItem('kevra_activities', JSON.stringify([]));
    }
    if (!localStorage.getItem('kevra_settings')) {
        localStorage.setItem('kevra_settings', JSON.stringify({
            storeName: 'KEVRA',
            storeDesc: 'Premium kadin giyim koleksiyonlari.',
            storeEmail: 'info@kevra.com',
            storePhone: '0850 123 45 67',
            storeAddress: 'Istanbul, Turkiye',
            shippingCost: 29.90,
            freeShippingLimit: 150
        }));
    }
    // Admin credentials (ilk kurulum)
    if (!localStorage.getItem('kevra_admin_credentials')) {
        localStorage.setItem('kevra_admin_credentials', JSON.stringify({
            email: 'admin@kevra.com.tr',
            password: 'kevra2026',
            name: 'KEVRA Admin'
        }));
    }
}

// ==================== KIMLIK DOGRULAMA ====================
function checkAuth() {
    const isLoggedIn = localStorage.getItem('kevra_admin_logged_in');
    const token = localStorage.getItem('kevra_admin_token');

    // Token suresi kontrolu (24 saat)
    if (token) {
        const tokenAge = Date.now() - parseInt(token);
        if (tokenAge > 24 * 60 * 60 * 1000) {
            logout();
            return false;
        }
    }

    if (!isLoggedIn && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return false;
    }

    const adminName = localStorage.getItem('kevra_admin_user');
    if (adminName) {
        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.textContent = adminName;
    }
    return true;
}

function logout() {
    if (confirm('Cikis yapmak istediginize emin misiniz?')) {
        localStorage.removeItem('kevra_admin_logged_in');
        localStorage.removeItem('kevra_admin_user');
        localStorage.removeItem('kevra_admin_token');

        // Firebase cikis (eger bagliysa)
        if (KevraDB.auth) {
            KevraDB.auth.signOut().catch(function() {});
        }

        window.location.href = 'login.html';
    }
}

// ==================== SAYFA YONETIMI ====================
function showPage(pageName, element) {
    document.querySelectorAll('.page-section').forEach(function(page) {
        page.classList.remove('active');
    });
    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.classList.remove('active');
    });

    const targetPage = document.getElementById(pageName);
    if (targetPage) targetPage.classList.add('active');
    if (element) element.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }

    if (pageName === 'products') loadProducts();
    if (pageName === 'orders') loadOrders();
    if (pageName === 'customers') loadCustomers();
    if (pageName === 'dashboard') {
        loadProducts();
        loadOrders();
        updateStats();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ==================== MODAL ISLEMLERI ====================
function openModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (modalName === 'addProduct') {
            const saveBtn = document.querySelector('#addProductModal .btn-primary');
            if (saveBtn) {
                saveBtn.onclick = saveProduct;
                saveBtn.textContent = 'Kaydet';
            }
            clearProductForm();
        }
    }
}

function closeModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (modalName === 'addProduct') {
            setTimeout(function() {
                clearProductForm();
                const saveBtn = document.querySelector('#addProductModal .btn-primary');
                if (saveBtn) {
                    saveBtn.onclick = saveProduct;
                    saveBtn.textContent = 'Kaydet';
                }
            }, 300);
        }
    }
}

function clearProductForm() {
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = 'Elbise';
    document.getElementById('prodCostPrice').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodDiscountPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodSizes').value = 'S, M, L';
    document.getElementById('prodColors').value = 'Siyah';
    // Kar marji gostergesini sifirla
    updateProfitMargin();
}

// ==================== KAR MARJI HESAPLAMA ====================
function updateProfitMargin() {
    const costInput = document.getElementById('prodCostPrice');
    const priceInput = document.getElementById('prodPrice');
    const discountInput = document.getElementById('prodDiscountPrice');
    const marginDisplay = document.getElementById('profitMarginDisplay');

    if (!costInput || !priceInput || !marginDisplay) return;

    const cost = parseFloat(costInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const discountPrice = parseFloat(discountInput.value) || 0;

    const sellPrice = (discountPrice > 0 && discountPrice < price) ? discountPrice : price;

    if (cost > 0 && sellPrice > 0) {
        const profit = sellPrice - cost;
        const margin = ((profit / sellPrice) * 100).toFixed(1);
        const marginClass = margin >= 50 ? 'high' : margin >= 30 ? 'medium' : 'low';

        marginDisplay.innerHTML = `
            <div class="profit-margin ${marginClass}">
                <span class="margin-label">Kar Marji:</span>
                <span class="margin-value">%${margin}</span>
                <span class="margin-amount">(${profit.toLocaleString('tr-TR')} TL kar)</span>
            </div>
        `;
        marginDisplay.style.display = 'block';
    } else {
        marginDisplay.style.display = 'none';
    }
}

// ==================== BILDIRIMLER ====================
function showToast(message, type) {
    document.querySelectorAll('.toast').forEach(function(t) { t.remove(); });

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = '<span style="font-size: 20px;">' + icons[type] + '</span> ' + message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function addActivity(message, type) {
    const activities = JSON.parse(localStorage.getItem('kevra_activities') || '[]');
    activities.unshift({
        id: Date.now(),
        message: message,
        type: type,
        time: new Date().toISOString()
    });
    if (activities.length > 20) activities.pop();
    localStorage.setItem('kevra_activities', JSON.stringify(activities));
    loadActivities();
}

function loadActivities() {
    const container = document.getElementById('activityList');
    if (!container) return;

    const activities = JSON.parse(localStorage.getItem('kevra_activities') || '[]');

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h4>Henüz Aktivite Yok</h4><p>Yapilan islemler burada gorunecek</p></div>';
        return;
    }

    const icons = { order: '📦', user: '👤', product: '➕', review: '⭐', campaign: '🎯', info: 'ℹ️' };

    container.innerHTML = activities.map(function(a) {
        const time = formatTime(a.time);
        return '<div class="activity-item"><div class="activity-icon">' + (icons[a.type] || 'ℹ️') + '</div><div class="activity-content"><h4>' + a.message + '</h4><span class="activity-time">' + time + '</span></div></div>';
    }).join('');
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az once';
    if (diff < 3600) return Math.floor(diff / 60) + ' dakika once';
    if (diff < 86400) return Math.floor(diff / 3600) + ' saat once';
    return date.toLocaleDateString('tr-TR');
}

// ==================== URUN YONETIMI ====================
function loadProducts() {
    const grid = document.getElementById('adminProductsGrid');
    const countEl = document.getElementById('productCount');
    const badgeEl = document.getElementById('productBadge');
    const totalEl = document.getElementById('totalProducts');

    if (!grid) return;

    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');

    if (countEl) countEl.textContent = products.length;
    if (badgeEl) badgeEl.textContent = products.length;
    if (totalEl) totalEl.textContent = products.length;

    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">👗</div><h4>Henüz Urun Yok</h4><p>Ilk urununuuzu eklemek icin "Yeni Urun" butonuna tiklayin</p></div>';
        return;
    }

    grid.innerHTML = products.map(function(p) {
        const hasDiscount = p.discount && p.originalPrice > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
        const stockClass = p.stock < 10 ? 'low' : p.stock === 0 ? 'out' : '';
        const stockText = p.stock === 0 ? 'Tukendi' : p.stock + ' adet';

        // Kar marji hesapla
        const costPrice = p.costPrice || 0;
        const sellPrice = p.price || 0;
        const profit = costPrice > 0 ? sellPrice - costPrice : 0;
        const margin = costPrice > 0 && sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(0) : 0;
        const profitBadge = costPrice > 0 ? '<span class="profit-badge" title="Kar: ' + profit + ' TL (%' + margin + ')">💰 ' + profit + 'TL</span>' : '';

        return '<div class="admin-product-card"><div class="admin-product-image"><img src="' + p.image + '" alt="' + p.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'"><div class="admin-product-actions"><button onclick="editProduct(' + p.id + ')" title="Duzenle">✏️</button><button onclick="deleteProduct(' + p.id + ')" title="Sil" style="background: var(--danger);">🗑️</button></div></div><div class="admin-product-info"><h4>' + p.name + '</h4><p style="font-size: 12px; color: #666; margin: 5px 0;">' + p.category + '</p><div class="admin-product-meta"><span class="admin-product-price">₺' + p.price + (hasDiscount ? '<small>₺' + p.originalPrice + '</small>' : '') + (hasDiscount ? '<span class="discount-badge" style="margin-left: 8px;">%' + discountPercent + '</span>' : '') + '</span><span class="admin-product-stock ' + stockClass + '">' + stockText + '</span></div>' + profitBadge + '</div></div>';
    }).join('');
}

function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const costPrice = parseFloat(document.getElementById('prodCostPrice').value) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const discountPrice = parseFloat(document.getElementById('prodDiscountPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const image = document.getElementById('prodImage').value.trim() || 'https://via.placeholder.com/400x400?text=No+Image';
    const desc = document.getElementById('prodDesc').value.trim();
    const sizes = document.getElementById('prodSizes').value.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
    const colors = document.getElementById('prodColors').value.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c; });

    if (!name) {
        showToast('Urun adi gerekli!', 'error');
        document.getElementById('prodName').focus();
        return;
    }
    if (!price || price <= 0) {
        showToast('Gecerli bir fiyat girin!', 'error');
        document.getElementById('prodPrice').focus();
        return;
    }

    const hasDiscount = discountPrice > 0 && discountPrice < price;

    const newProduct = {
        id: Date.now(),
        name: name,
        category: category,
        costPrice: costPrice,
        price: hasDiscount ? discountPrice : price,
        originalPrice: price,
        discount: hasDiscount,
        stock: stock,
        image: image,
        description: desc,
        badge: 'YENI',
        badgeType: 'yeni',
        sizes: sizes.length ? sizes : ['S', 'M', 'L'],
        colors: colors.length ? colors : ['Siyah']
    };

    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    products.push(newProduct);
    localStorage.setItem('kevra_products', JSON.stringify(products));

    // Firebase'e de kaydet
    KevraDB.saveProduct(newProduct).catch(function() {});

    showToast('"' + name + '" urunu eklendi!', 'success');
    addActivity('Yeni urun eklendi: ' + name, 'product');
    closeModal('addProduct');
    loadProducts();
    updateStats();
    syncWithStore();
}

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const product = products.find(function(p) { return p.id === id; });
    if (!product) {
        showToast('Urun bulunamadi!', 'error');
        return;
    }

    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodCostPrice').value = product.costPrice || '';
    document.getElementById('prodPrice').value = product.originalPrice || product.price;
    document.getElementById('prodDiscountPrice').value = product.discount ? product.price : '';
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodImage').value = product.image;
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodSizes').value = product.sizes ? product.sizes.join(', ') : 'S, M, L';
    document.getElementById('prodColors').value = product.colors ? product.colors.join(', ') : 'Siyah';

    // Kar marji guncelle
    updateProfitMargin();

    openModal('addProduct');

    const saveBtn = document.querySelector('#addProductModal .btn-primary');
    if (saveBtn) {
        saveBtn.onclick = function() { updateProduct(id); };
        saveBtn.textContent = 'Guncelle';
    }
}

function updateProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const index = products.findIndex(function(p) { return p.id === id; });
    if (index === -1) {
        showToast('Urun bulunamadi!', 'error');
        return;
    }

    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const costPrice = parseFloat(document.getElementById('prodCostPrice').value) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const discountPrice = parseFloat(document.getElementById('prodDiscountPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const image = document.getElementById('prodImage').value.trim() || products[index].image;
    const desc = document.getElementById('prodDesc').value.trim();
    const sizes = document.getElementById('prodSizes').value.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
    const colors = document.getElementById('prodColors').value.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c; });

    if (!name || !price) {
        showToast('Zorunlu alanlari doldurun!', 'error');
        return;
    }

    const hasDiscount = discountPrice > 0 && discountPrice < price;

    products[index] = {
        ...products[index],
        name: name,
        category: category,
        costPrice: costPrice,
        price: hasDiscount ? discountPrice : price,
        originalPrice: price,
        discount: hasDiscount,
        stock: stock,
        image: image,
        description: desc,
        sizes: sizes.length ? sizes : products[index].sizes,
        colors: colors.length ? colors : products[index].colors,
        badge: products[index].badge || '',
        badgeType: products[index].badgeType || ''
    };

    localStorage.setItem('kevra_products', JSON.stringify(products));

    // Firebase'e de guncelle
    KevraDB.saveProduct(products[index]).catch(function() {});

    showToast('"' + name + '" guncellendi!', 'success');
    addActivity('Urun guncellendi: ' + name, 'product');
    closeModal('addProduct');
    loadProducts();
    updateStats();

    setTimeout(function() {
        const saveBtn = document.querySelector('#addProductModal .btn-primary');
        if (saveBtn) {
            saveBtn.onclick = saveProduct;
            saveBtn.textContent = 'Kaydet';
        }
    }, 500);

    syncWithStore();
}

function deleteProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const product = products.find(function(p) { return p.id === id; });

    if (!product) {
        showToast('Urun bulunamadi!', 'error');
        return;
    }

    if (!confirm('"' + product.name + '" urununu silmek istediginize emin misiniz?')) return;

    const newProducts = products.filter(function(p) { return p.id !== id; });
    localStorage.setItem('kevra_products', JSON.stringify(newProducts));

    // Firebase'den de sil
    KevraDB.deleteProduct(id).catch(function() {});

    showToast('"' + product.name + '" silindi!', 'success');
    addActivity('Urun silindi: ' + product.name, 'product');
    loadProducts();
    updateStats();
    syncWithStore();
}

// ==================== SIPARIS YONETIMI ====================
function loadOrders() {
    const tbody = document.getElementById('ordersTable');
    const recentTbody = document.getElementById('recentOrdersTable');
    const badgeEl = document.getElementById('orderBadge');
    const totalEl = document.getElementById('totalOrders');
    const pendingText = document.getElementById('pendingOrdersText');

    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const pendingCount = orders.filter(function(o) { return o.status === 'pending'; }).length;

    if (badgeEl) badgeEl.textContent = orders.length;
    if (totalEl) totalEl.textContent = orders.length;
    if (pendingText) pendingText.textContent = 'Bekleyen: ' + pendingCount;

    const statusLabels = {
        completed: 'Tamamlandi',
        processing: 'Isleniyor',
        pending: 'Bekliyor',
        cancelled: 'Iptal'
    };

    const statusIcons = {
        completed: '✓',
        processing: '⏳',
        pending: '⏸',
        cancelled: '✕'
    };

    const renderOrder = function(o) {
        return '<tr><td><input type="checkbox" class="order-checkbox" data-id="' + o.id + '"></td><td><strong>#' + o.id + '</strong></td><td>' + o.date + '</td><td><div class="product-cell"><img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(o.customer) + '&background=c9a87c&color=fff" alt=""><div class="product-info"><h4>' + o.customer + '</h4><span>' + o.email + '</span></div></div></td><td>' + o.items + ' urun</td><td><strong>₺' + o.total.toLocaleString() + '</strong></td><td>' + o.payment + '</td><td><span class="status-badge ' + o.status + '">' + statusIcons[o.status] + ' ' + statusLabels[o.status] + '</span></td><td><div class="action-btns"><button class="action-btn" onclick="viewOrder(\'' + o.id + '\')" title="Goruntule">👁️</button><button class="action-btn" onclick="editOrderStatus(\'' + o.id + '\')" title="Durum Degistir">✏️</button><button class="action-btn" onclick="printOrder(\'' + o.id + '\')" title="Yazdir">🖨️</button></div></td></tr>';
    };

    const renderRecentOrder = function(o) {
        return '<tr><td><strong>#' + o.id + '</strong></td><td><div class="product-cell"><img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(o.customer) + '&background=c9a87c&color=fff" alt=""><div class="product-info"><h4>' + o.customer + '</h4><span>' + o.email + '</span></div></div></td><td>' + (o.products ? o.products[0] : 'Urun') + (o.items > 1 ? ' + ' + (o.items - 1) + ' daha' : '') + '</td><td><strong>₺' + o.total.toLocaleString() + '</strong></td><td><span class="status-badge ' + o.status + '">' + statusLabels[o.status] + '</span></td><td><div class="action-btns"><button class="action-btn" onclick="viewOrder(\'' + o.id + '\')" title="Goruntule">👁️</button><button class="action-btn" onclick="editOrderStatus(\'' + o.id + '\')" title="Durum Degistir">✏️</button></div></td></tr>';
    };

    if (tbody) tbody.innerHTML = orders.map(renderOrder).join('');
    if (recentTbody) recentTbody.innerHTML = orders.slice(0, 5).map(renderRecentOrder).join('');

    const totalSales = orders.reduce(function(sum, o) { return o.status !== 'cancelled' ? sum + o.total : sum; }, 0);
    const salesEl = document.getElementById('totalSales');
    if (salesEl) salesEl.textContent = '₺' + totalSales.toLocaleString();
}

function viewOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const order = orders.find(function(o) { return o.id === orderId; });
    if (!order) return;

    document.getElementById('viewOrderId').textContent = '#' + orderId;

    const content = document.getElementById('orderDetailContent');
    const statusLabels = {
        completed: 'Tamamlandi',
        processing: 'Isleniyor',
        pending: 'Bekliyor',
        cancelled: 'Iptal'
    };

    content.innerHTML = '<div style="display: grid; gap: 25px;"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;"><div style="background: var(--light); padding: 25px; border-radius: 16px;"><h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Musteri Bilgileri</h4><p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">' + order.customer + '</p><p style="color: var(--gray); margin-bottom: 5px;">📧 ' + order.email + '</p><p style="color: var(--gray); margin-bottom: 10px;">📱 ' + order.phone + '</p><p style="color: var(--gray); font-size: 13px; line-height: 1.5;">📍 ' + order.address + '</p></div><div style="background: var(--light); padding: 25px; border-radius: 16px;"><h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Siparis Bilgileri</h4><p style="margin-bottom: 10px;"><span style="color: var(--gray);">Tarih:</span> <strong>' + order.date + '</strong></p><p style="margin-bottom: 10px;"><span style="color: var(--gray);">Odeme:</span> <strong>' + order.payment + '</strong></p><p style="margin-bottom: 15px;"><span style="color: var(--gray);">Durum:</span> <span class="status-badge ' + order.status + '">' + statusLabels[order.status] + '</span></p><p style="font-size: 24px; font-weight: 700; color: var(--secondary); margin-top: 15px;">Toplam: ₺' + order.total.toLocaleString() + '</p></div></div><div><h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Urunler</h4><div style="background: var(--light); padding: 20px; border-radius: 16px;">' + (order.products ? order.products.map(function(p) { return '<div style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px;"><span style="color: var(--secondary);">•</span> ' + p + '</div>'; }).join('') : '<p style="color: var(--gray);">Urun detaylari...</p>') + '</div></div></div>';

    openModal('viewOrder');
}

function editOrderStatus(orderId) {
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const statusLabels = { pending: 'Bekliyor', processing: 'Isleniyor', completed: 'Tamamlandi', cancelled: 'Iptal' };

    const currentStatus = JSON.parse(localStorage.getItem('kevra_orders') || '[]').find(function(o) { return o.id === orderId; })?.status;

    const newStatus = prompt(
        'Siparis #' + orderId + ' icin yeni durum secin:\n\n' +
        'Mevcut: ' + statusLabels[currentStatus] + '\n\n' +
        '1: Bekliyor\n' +
        '2: Isleniyor\n' +
        '3: Tamamlandi\n' +
        '4: Iptal'
    );

    if (!newStatus || newStatus < 1 || newStatus > 4) return;

    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const order = orders.find(function(o) { return o.id === orderId; });
    if (order) {
        order.status = statuses[newStatus - 1];
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
        showToast('Siparis #' + orderId + ' durumu guncellendi!', 'success');
        addActivity('Siparis #' + orderId + ' durumu: ' + statusLabels[order.status], 'order');
        loadOrders();
    }
}

function printOrder(orderId) {
    showToast('Siparis yazdiriliyor...', 'info');
    setTimeout(function() {
        window.print();
    }, 500);
}

// ==================== MUSTERI YONETIMI ====================
function loadCustomers() {
    const tbody = document.getElementById('customersTable');
    const countEl = document.getElementById('customerCount');
    const badgeEl = document.getElementById('customerBadge');
    const totalEl = document.getElementById('totalCustomers');

    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');

    if (countEl) countEl.textContent = customers.length;
    if (badgeEl) badgeEl.textContent = customers.length;
    if (totalEl) totalEl.textContent = customers.length;

    if (!tbody) return;

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Henüz musteri yok</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(function(c) {
        return '<tr><td><strong>#' + c.id + '</strong></td><td><div class="product-cell"><img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(c.firstName + ' ' + c.lastName) + '&background=c9a87c&color=fff" alt=""><div class="product-info"><h4>' + c.firstName + ' ' + c.lastName + '</h4><span>' + c.email + '</span></div></div></td><td>' + c.email + '</td><td>' + c.phone + '</td><td><span class="badge" style="background: var(--info);">' + c.orders + '</span></td><td><strong>₺' + c.total.toLocaleString() + '</strong></td><td><div class="action-btns"><button class="action-btn" onclick="viewCustomer(' + c.id + ')" title="Goruntule">👁️</button><button class="action-btn" onclick="editCustomer(' + c.id + ')" title="Duzenle">✏️</button><button class="action-btn" onclick="deleteCustomer(' + c.id + ')" title="Sil" style="color: var(--danger);">🗑️</button></div></td></tr>';
    }).join('');
}

function viewCustomer(id) {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    const customer = customers.find(function(c) { return c.id === id; });
    if (!customer) return;

    alert('Musteri Detayi\n\n' +
          'Ad Soyad: ' + customer.firstName + ' ' + customer.lastName + '\n' +
          'E-posta: ' + customer.email + '\n' +
          'Telefon: ' + customer.phone + '\n' +
          'Siparis Sayisi: ' + customer.orders + '\n' +
          'Toplam Harcama: ₺' + customer.total.toLocaleString() + '\n' +
          'Kayit Tarihi: ' + customer.date);
}

function editCustomer(id) {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    const customer = customers.find(function(c) { return c.id === id; });
    if (!customer) return;

    const newPhone = prompt('Yeni telefon numarasi:', customer.phone);
    if (newPhone === null || newPhone === customer.phone) return;

    customer.phone = newPhone;
    localStorage.setItem('kevra_customers', JSON.stringify(customers));
    showToast('Musteri guncellendi!', 'success');
    loadCustomers();
}

function deleteCustomer(id) {
    if (!confirm('Bu musteriyi silmek istediginize emin misiniz?')) return;

    let customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    customers = customers.filter(function(c) { return c.id !== id; });
    localStorage.setItem('kevra_customers', JSON.stringify(customers));

    showToast('Musteri silindi!', 'success');
    loadCustomers();
    updateStats();
}

// ==================== ISTATISTIKLER ====================
function updateStats() {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');

    const totalSales = orders.reduce(function(sum, o) { return o.status !== 'cancelled' ? sum + o.total : sum; }, 0);

    const elements = {
        'totalProducts': products.length,
        'totalOrders': orders.length,
        'totalCustomers': customers.length,
        'totalSales': '₺' + totalSales.toLocaleString(),
        'productBadge': products.length,
        'orderBadge': orders.length,
        'customerBadge': customers.length
    };

    Object.keys(elements).forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

// ==================== SENKRONIZASYON ====================
function syncWithStore() {
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('kevra_updates');
        channel.postMessage({ type: 'products_updated', timestamp: Date.now() });
    }
}

// ==================== BASLATMA ====================
document.addEventListener('DOMContentLoaded', function() {
    // Firebase baslat
    KevraDB.init();

    if (!checkAuth()) return;

    initData();

    loadProducts();
    loadOrders();
    loadActivities();
    updateStats();

    // Modal disina tiklayinca kapat
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // ESC tusu ile modal kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(function(m) {
                m.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });

    // Kar marji hesaplama event listenerlari
    const costInput = document.getElementById('prodCostPrice');
    const priceInput = document.getElementById('prodPrice');
    const discountInput = document.getElementById('prodDiscountPrice');

    if (costInput) costInput.addEventListener('input', updateProfitMargin);
    if (priceInput) priceInput.addEventListener('input', updateProfitMargin);
    if (discountInput) discountInput.addEventListener('input', updateProfitMargin);
});

// ==================== EK FONKSIYONLAR ====================
function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    if (orders.length === 0) {
        showToast('Disa aktarilacak siparis yok!', 'warning');
        return;
    }

    const headers = ['Siparis No', 'Tarih', 'Musteri', 'Email', 'Telefon', 'Urunler', 'Tutar', 'Odeme', 'Durum', 'Adres'];
    const csvContent = [
        headers.join(';'),
        ...orders.map(function(o) {
            return [o.id, o.date, o.customer, o.email, o.phone, o.items, o.total, o.payment, o.status, o.address].join(';');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'siparisler_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();

    showToast('Siparisler disa aktarildi!', 'success');
    addActivity('Siparisler disa aktarildi', 'order');
}

function bulkOrderAction() {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('Lutfen en az bir siparis secin!', 'warning');
        return;
    }

    const action = prompt(
        'Toplu islem secin:\n\n' +
        '1: Tamamlandi olarak isaretle\n' +
        '2: Isleniyor olarak isaretle\n' +
        '3: Bekliyor olarak isaretle\n' +
        '4: Iptal et'
    );

    if (!action || action < 1 || action > 4) return;

    const statuses = { '1': 'completed', '2': 'processing', '3': 'pending', '4': 'cancelled' };
    const statusLabels = { '1': 'Tamamlandi', '2': 'Isleniyor', '3': 'Bekliyor', '4': 'Iptal' };

    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    let updatedCount = 0;

    checkboxes.forEach(function(cb) {
        const orderId = cb.getAttribute('data-id');
        const order = orders.find(function(o) { return o.id === orderId; });
        if (order) {
            order.status = statuses[action];
            updatedCount++;
        }
    });

    localStorage.setItem('kevra_orders', JSON.stringify(orders));
    showToast(updatedCount + ' siparis guncellendi!', 'success');
    addActivity(updatedCount + ' siparis toplu guncellendi', 'order');
    loadOrders();
}

function toggleSelectAllOrders() {
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('.order-checkbox');
    checkboxes.forEach(function(cb) { cb.checked = selectAll.checked; });
}

function exportCustomers() {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    if (customers.length === 0) {
        showToast('Disa aktarilacak musteri yok!', 'warning');
        return;
    }

    const headers = ['ID', 'Ad', 'Soyad', 'Email', 'Telefon', 'Siparis', 'Toplam', 'Kayit Tarihi'];
    const csvContent = [
        headers.join(';'),
        ...customers.map(function(c) {
            return [c.id, c.firstName, c.lastName, c.email, c.phone, c.orders, c.total, c.date].join(';');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'musteriler_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();

    showToast('Musteriler disa aktarildi!', 'success');
}

function filterProducts() {
    const searchTerm = prompt('Aranacak urun adi veya kategori:');
    if (!searchTerm) {
        loadProducts();
        return;
    }

    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const filtered = products.filter(function(p) {
        return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               p.category.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const grid = document.getElementById('adminProductsGrid');
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">🔍</div><h4>Sonuc Bulunamadi</h4><p>"' + searchTerm + '" icin sonuc yok</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(function(p) {
        const hasDiscount = p.discount && p.originalPrice > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
        const stockClass = p.stock < 10 ? 'low' : p.stock === 0 ? 'out' : '';
        const stockText = p.stock === 0 ? 'Tukendi' : p.stock + ' adet';

        return '<div class="admin-product-card"><div class="admin-product-image"><img src="' + p.image + '" alt="' + p.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'"><div class="admin-product-actions"><button onclick="editProduct(' + p.id + ')" title="Duzenle">✏️</button><button onclick="deleteProduct(' + p.id + ')" title="Sil" style="background: var(--danger);">🗑️</button></div></div><div class="admin-product-info"><h4>' + p.name + '</h4><p style="font-size: 12px; color: #666; margin: 5px 0;">' + p.category + '</p><div class="admin-product-meta"><span class="admin-product-price">₺' + p.price + (hasDiscount ? '<small>₺' + p.originalPrice + '</small>' : '') + (hasDiscount ? '<span class="discount-badge" style="margin-left: 8px;">%' + discountPercent + '</span>' : '') + '</span><span class="admin-product-stock ' + stockClass + '">' + stockText + '</span></div></div></div>';
    }).join('');

    showToast(filtered.length + ' urun bulundu', 'success');
}

function searchContent() {
    const query = document.getElementById('globalSearch')?.value.toLowerCase();
    if (!query) return;

    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const found = products.filter(function(p) {
        return p.name.toLowerCase().includes(query) || 
               p.category.toLowerCase().includes(query);
    });

    if (found.length > 0) {
        showPage('products', document.querySelectorAll('.menu-item')[2]);
        const grid = document.getElementById('adminProductsGrid');
        grid.innerHTML = found.map(function(p) {
            return '<div class="admin-product-card"><div class="admin-product-image"><img src="' + p.image + '" alt="' + p.name + '"><div class="admin-product-actions"><button onclick="editProduct(' + p.id + ')">✏️</button><button onclick="deleteProduct(' + p.id + ')">🗑️</button></div></div><div class="admin-product-info"><h4>' + p.name + '</h4><div class="admin-product-meta"><span class="admin-product-price">₺' + p.price + '</span><span class="admin-product-stock">' + p.stock + ' adet</span></div></div></div>';
        }).join('');
        showToast(found.length + ' urun bulundu', 'success');
    } else {
        showToast('Sonuc bulunamadi', 'error');
    }
}

function showMessages() {
    showToast('Mesajlar yakinda geliyor!', 'info');
}

function showNotifications() {
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'none';
    showToast('Tum bildirimler okundu', 'success');
}