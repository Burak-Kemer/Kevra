// Admin Panel JavaScript - KEVRA Premium
// Tüm fonksiyonlar çalışır durumda

// ==================== VERİ YÖNETİMİ ====================

const sampleProducts = [
    { 
        id: 1, 
        name: 'Siyah Midi Elbise', 
        category: 'Elbise', 
        price: 899, 
        originalPrice: 1299, 
        discount: true, 
        stock: 25, 
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 
        badge: 'POPÜLER', 
        badgeType: 'populer', 
        sizes: ['S', 'M', 'L'], 
        colors: ['Siyah'],
        description: 'Zarif ve şık siyah midi elbise, özel günler için ideal.'
    },
    { 
        id: 2, 
        name: 'İpek Bluz', 
        category: 'Üst Giyim', 
        price: 899, 
        originalPrice: 899, 
        discount: false, 
        stock: 15, 
        image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', 
        badge: 'YENİ', 
        badgeType: 'yeni', 
        sizes: ['XS', 'S', 'M'], 
        colors: ['Beyaz', 'Krem'],
        description: 'Premium ipek kumaştan üretilmiş şık bluz.'
    },
    { 
        id: 3, 
        name: 'Trençkot', 
        category: 'Dış Giyim', 
        price: 1499, 
        originalPrice: 1999, 
        discount: true, 
        stock: 5, 
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 
        badge: 'PREMIUM', 
        badgeType: 'premium', 
        sizes: ['M', 'L', 'XL'], 
        colors: ['Bej', 'Siyah'],
        description: 'Klasik kesim premium trençkot.'
    },
    { 
        id: 4, 
        name: 'Gold Zincir Kolye', 
        category: 'Aksesuar', 
        price: 499, 
        originalPrice: 599, 
        discount: true, 
        stock: 30, 
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', 
        badge: '', 
        badgeType: '', 
        sizes: [], 
        colors: ['Gold'],
        description: 'Şık gold zincir kolye.'
    },
    { 
        id: 5, 
        name: 'Ofis Elbisesi (Bej)', 
        category: 'Elbise', 
        price: 1199, 
        originalPrice: 1599, 
        discount: true, 
        stock: 12, 
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', 
        badge: 'PREMIUM', 
        badgeType: 'premium', 
        sizes: ['S', 'M', 'L'], 
        colors: ['Bej'],
        description: 'Profesyonel ortamlar için şık ofis elbisesi.'
    },
    { 
        id: 6, 
        name: 'Kadife Elbise', 
        category: 'Elbise', 
        price: 1299, 
        originalPrice: 1799, 
        discount: true, 
        stock: 8, 
        image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400', 
        badge: 'YENİ', 
        badgeType: 'yeni', 
        sizes: ['XS', 'S', 'M'], 
        colors: ['Bordo', 'Siyah'],
        description: 'Lüks kadife kumaştan özel tasarım elbise.'
    }
];

const sampleOrders = [
    { id: 'ORD-001', date: '24.02.2026', customer: 'Zeynep K.', email: 'zeynep@email.com', phone: '0555 123 45 67', items: 3, total: 2247, payment: 'Kredi Kartı', status: 'completed', address: 'İstanbul, Kadıköy', products: ['Siyah Midi Elbise', 'Gold Zincir Kolye'] },
    { id: 'ORD-002', date: '24.02.2026', customer: 'Ayşe Y.', email: 'ayse@email.com', phone: '0555 234 56 78', items: 2, total: 1548, payment: 'Havale', status: 'processing', address: 'Ankara, Çankaya', products: ['İpek Bluz', 'Trençkot'] },
    { id: 'ORD-003', date: '23.02.2026', customer: 'Selin A.', email: 'selin@email.com', phone: '0555 345 67 89', items: 1, total: 1499, payment: 'Kredi Kartı', status: 'pending', address: 'İzmir, Konak', products: ['Trençkot'] },
    { id: 'ORD-004', date: '23.02.2026', customer: 'Mehmet K.', email: 'mehmet@email.com', phone: '0555 456 78 90', items: 2, total: 599, payment: 'Kapıda Ödeme', status: 'cancelled', address: 'Bursa, Nilüfer', products: ['Gold Zincir Kolye'] },
    { id: 'ORD-005', date: '22.02.2026', customer: 'Elif Y.', email: 'elif@email.com', phone: '0555 567 89 01', items: 4, total: 3896, payment: 'Kredi Kartı', status: 'completed', address: 'İstanbul, Beşiktaş', products: ['Siyah Midi Elbise', 'İpek Bluz', 'Ofis Elbisesi'] }
];

const sampleCustomers = [
    { id: 1, firstName: 'Zeynep', lastName: 'K.', email: 'zeynep@email.com', phone: '0555 123 45 67', orders: 5, total: 4500, date: '15.01.2026' },
    { id: 2, firstName: 'Ayşe', lastName: 'Y.', email: 'ayse@email.com', phone: '0555 234 56 78', orders: 3, total: 2800, date: '20.01.2026' },
    { id: 3, firstName: 'Selin', lastName: 'A.', email: 'selin@email.com', phone: '0555 345 67 89', orders: 8, total: 7200, date: '10.02.2026' },
    { id: 4, firstName: 'Mehmet', lastName: 'K.', email: 'mehmet@email.com', phone: '0555 456 78 90', orders: 2, total: 1200, date: '05.02.2026' },
    { id: 5, firstName: 'Elif', lastName: 'Y.', email: 'elif@email.com', phone: '0555 567 89 01', orders: 4, total: 5600, date: '18.02.2026' }
];

const sampleCategories = [
    { id: 1, name: 'Elbiseler', count: 12, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', desc: 'Tüm elbise modelleri' },
    { id: 2, name: 'Üst Giyim', count: 15, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400', desc: 'Bluz, gömlek, tişört' },
    { id: 3, name: 'Alt Giyim', count: 10, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400', desc: 'Pantolon, etek, şort' },
    { id: 4, name: 'Triko', count: 8, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', desc: 'Kazak, hırka, süveter' },
    { id: 5, name: 'Dış Giyim', count: 6, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', desc: 'Mont, kaban, trençkot' },
    { id: 6, name: 'Aksesuar', count: 12, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', desc: 'Çanta, takı, kemer' }
];

// LocalStorage'a veri yükle (ilk kez açılıyorsa)
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
            storeDesc: 'Premium kadın giyim koleksiyonları.',
            storeEmail: 'info@kevra.com',
            storePhone: '0850 123 45 67',
            storeAddress: 'İstanbul, Türkiye',
            shippingCost: 29.90,
            freeShippingLimit: 150
        }));
    }
}

// ==================== KİMLİK DOĞRULAMA ====================

function checkAuth() {
    const isLoggedIn = localStorage.getItem('kevra_admin_logged_in');
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
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('kevra_admin_logged_in');
        localStorage.removeItem('kevra_admin_user');
        window.location.href = 'login.html';
    }
}

// ==================== SAYFA YÖNETİMİ ====================

function showPage(pageName, element) {
    // Tüm sayfaları gizle
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    
    // Tüm menü item'larını pasif yap
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Seçili sayfayı göster
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Tıklanan menüyü aktif yap
    if (element) {
        element.classList.add('active');
    }
    
    // Mobil'de sidebar'ı kapat
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    // Sayfaya özel yükleme fonksiyonları
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

// ==================== MODAL İŞLEMLERİ ====================

function openModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Düzenleme modu kontrolü
        if (modalName === 'addProduct') {
            const saveBtn = document.querySelector('#addProductModal .btn-primary');
            if (saveBtn) {
                saveBtn.onclick = saveProduct;
                saveBtn.textContent = '💾 Kaydet';
            }
            // Formu temizle
            clearProductForm();
        }
    }
}

function closeModal(modalName) {
    const modal = document.getElementById(modalName + 'Modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Formu temizle
        if (modalName === 'addProduct') {
            setTimeout(() => {
                clearProductForm();
                const saveBtn = document.querySelector('#addProductModal .btn-primary');
                if (saveBtn) {
                    saveBtn.onclick = saveProduct;
                    saveBtn.textContent = '💾 Kaydet';
                }
            }, 300);
        }
    }
}

function clearProductForm() {
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = 'Elbise';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodDiscountPrice').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodImage').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodSizes').value = 'S, M, L';
    document.getElementById('prodColors').value = 'Siyah';
}

// ==================== BİLDİRİMLER ====================

function showToast(message, type = 'success') {
    // Önceki toast'ları temizle
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };
    
    toast.innerHTML = `<span style="font-size: 20px;">${icons[type]}</span> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function addActivity(message, type = 'info') {
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h4>Henüz Aktivite Yok</h4>
                <p>Yapılan işlemler burada görünecek</p>
            </div>
        `;
        return;
    }
    
    const icons = {
        order: '📦',
        user: '👤',
        product: '➕',
        review: '⭐',
        campaign: '🎯',
        info: 'ℹ️'
    };
    
    container.innerHTML = activities.map(a => {
        const time = formatTime(a.time);
        return `
            <div class="activity-item">
                <div class="activity-icon">${icons[a.type] || 'ℹ️'}</div>
                <div class="activity-content">
                    <h4>${a.message}</h4>
                    <span class="activity-time">${time}</span>
                </div>
            </div>
        `;
    }).join('');
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return Math.floor(diff / 60) + ' dakika önce';
    if (diff < 86400) return Math.floor(diff / 3600) + ' saat önce';
    return date.toLocaleDateString('tr-TR');
}

// ==================== ÜRÜN YÖNETİMİ ====================

function loadProducts() {
    const grid = document.getElementById('adminProductsGrid');
    const countEl = document.getElementById('productCount');
    const badgeEl = document.getElementById('productBadge');
    const totalEl = document.getElementById('totalProducts');
    
    if (!grid) return;
    
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    
    // İstatistikleri güncelle
    if (countEl) countEl.textContent = products.length;
    if (badgeEl) badgeEl.textContent = products.length;
    if (totalEl) totalEl.textContent = products.length;
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">👗</div>
                <h4>Henüz Ürün Yok</h4>
                <p>İlk ürününüzü eklemek için "Yeni Ürün" butonuna tıklayın</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(p => {
        const hasDiscount = p.discount && p.originalPrice > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
        const stockClass = p.stock < 10 ? 'low' : p.stock === 0 ? 'out' : '';
        const stockText = p.stock === 0 ? 'Tükendi' : p.stock + ' adet';
        
        return `
            <div class="admin-product-card">
                <div class="admin-product-image">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    ${p.badge ? `<span class="product-badge ${p.badgeType}" style="position: absolute; top: 15px; left: 15px;">${p.badge}</span>` : ''}
                    <div class="admin-product-actions">
                        <button onclick="editProduct(${p.id})" title="Düzenle">✏️</button>
                        <button onclick="deleteProduct(${p.id})" title="Sil" style="background: var(--danger);">🗑️</button>
                    </div>
                </div>
                <div class="admin-product-info">
                    <h4>${p.name}</h4>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">${p.category}</p>
                    <div class="admin-product-meta">
                        <span class="admin-product-price">
                            ₺${p.price}
                            ${hasDiscount ? `<small>₺${p.originalPrice}</small>` : ''}
                            ${hasDiscount ? `<span class="discount-badge" style="margin-left: 8px;">%${discountPercent}</span>` : ''}
                        </span>
                        <span class="admin-product-stock ${stockClass}">${stockText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const discountPrice = parseFloat(document.getElementById('prodDiscountPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const image = document.getElementById('prodImage').value.trim() || 'https://via.placeholder.com/400x400?text=No+Image';
    const desc = document.getElementById('prodDesc').value.trim();
    const sizes = document.getElementById('prodSizes').value.split(',').map(s => s.trim()).filter(s => s);
    const colors = document.getElementById('prodColors').value.split(',').map(c => c.trim()).filter(c => c);
    
    // Validasyon
    if (!name) {
        showToast('Ürün adı gerekli!', 'error');
        document.getElementById('prodName').focus();
        return;
    }
    if (!price || price <= 0) {
        showToast('Geçerli bir fiyat girin!', 'error');
        document.getElementById('prodPrice').focus();
        return;
    }
    
    const hasDiscount = discountPrice > 0 && discountPrice < price;
    
    const newProduct = {
        id: Date.now(),
        name,
        category,
        price: hasDiscount ? discountPrice : price,
        originalPrice: price,
        discount: hasDiscount,
        stock,
        image,
        description: desc,
        badge: 'YENİ',
        badgeType: 'yeni',
        sizes: sizes.length ? sizes : ['S', 'M', 'L'],
        colors: colors.length ? colors : ['Siyah']
    };
    
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    products.push(newProduct);
    localStorage.setItem('kevra_products', JSON.stringify(products));
    
    showToast(`"${name}" ürünü eklendi!`, 'success');
    addActivity(`Yeni ürün eklendi: ${name}`, 'product');
    closeModal('addProduct');
    loadProducts();
    updateStats();
    
    // Ana sayfayı da güncelle (eğer açıksa)
    syncWithStore();
}

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const product = products.find(p => p.id === id);
    if (!product) {
        showToast('Ürün bulunamadı!', 'error');
        return;
    }
    
    // Formu doldur
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodPrice').value = product.originalPrice || product.price;
    document.getElementById('prodDiscountPrice').value = product.discount ? product.price : '';
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodImage').value = product.image;
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodSizes').value = product.sizes ? product.sizes.join(', ') : 'S, M, L';
    document.getElementById('prodColors').value = product.colors ? product.colors.join(', ') : 'Siyah';
    
    openModal('addProduct');
    
    // Butonu güncelleme moduna al
    const saveBtn = document.querySelector('#addProductModal .btn-primary');
    if (saveBtn) {
        saveBtn.onclick = function() { updateProduct(id); };
        saveBtn.textContent = '💾 Güncelle';
    }
}

function updateProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        showToast('Ürün bulunamadı!', 'error');
        return;
    }
    
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const discountPrice = parseFloat(document.getElementById('prodDiscountPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const image = document.getElementById('prodImage').value.trim() || products[index].image;
    const desc = document.getElementById('prodDesc').value.trim();
    const sizes = document.getElementById('prodSizes').value.split(',').map(s => s.trim()).filter(s => s);
    const colors = document.getElementById('prodColors').value.split(',').map(c => c.trim()).filter(c => c);
    
    if (!name || !price) {
        showToast('Zorunlu alanları doldurun!', 'error');
        return;
    }
    
    const hasDiscount = discountPrice > 0 && discountPrice < price;
    
    // Mevcut ürünü koru, sadece değişenleri güncelle
    products[index] = {
        ...products[index],
        name,
        category,
        price: hasDiscount ? discountPrice : price,
        originalPrice: price,
        discount: hasDiscount,
        stock,
        image,
        description: desc,
        sizes: sizes.length ? sizes : products[index].sizes,
        colors: colors.length ? colors : products[index].colors,
        // Badge'i koru veya güncelle
        badge: products[index].badge || '',
        badgeType: products[index].badgeType || ''
    };
    
    localStorage.setItem('kevra_products', JSON.stringify(products));
    showToast(`"${name}" güncellendi!`, 'success');
    addActivity(`Ürün güncellendi: ${name}`, 'product');
    closeModal('addProduct');
    loadProducts();
    updateStats();
    
    // Butonu eski haline getir
    setTimeout(() => {
        const saveBtn = document.querySelector('#addProductModal .btn-primary');
        if (saveBtn) {
            saveBtn.onclick = saveProduct;
            saveBtn.textContent = '💾 Kaydet';
        }
    }, 500);
    
    // Ana sayfayı da güncelle
    syncWithStore();
}

function deleteProduct(id) {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const product = products.find(p => p.id === id);
    
    if (!product) {
        showToast('Ürün bulunamadı!', 'error');
        return;
    }
    
    if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    
    const newProducts = products.filter(p => p.id !== id);
    localStorage.setItem('kevra_products', JSON.stringify(newProducts));
    
    showToast(`"${product.name}" silindi!`, 'success');
    addActivity(`Ürün silindi: ${product.name}`, 'product');
    loadProducts();
    updateStats();
    
    // Ana sayfayı da güncelle
    syncWithStore();
}

// ==================== SİPARİŞ YÖNETİMİ ====================

function loadOrders() {
    const tbody = document.getElementById('ordersTable');
    const recentTbody = document.getElementById('recentOrdersTable');
    const badgeEl = document.getElementById('orderBadge');
    const totalEl = document.getElementById('totalOrders');
    const pendingText = document.getElementById('pendingOrdersText');
    
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    
    if (badgeEl) badgeEl.textContent = orders.length;
    if (totalEl) totalEl.textContent = orders.length;
    if (pendingText) pendingText.textContent = `Bekleyen: ${pendingCount}`;
    
    const statusLabels = {
        completed: 'Tamamlandı',
        processing: 'İşleniyor',
        pending: 'Bekliyor',
        cancelled: 'İptal'
    };
    
    const statusIcons = {
        completed: '✓',
        processing: '⏳',
        pending: '⏸',
        cancelled: '✕'
    };
    
    const renderOrder = (o) => `
        <tr>
            <td><input type="checkbox" class="order-checkbox" data-id="${o.id}"></td>
            <td><strong>#${o.id}</strong></td>
            <td>${o.date}</td>
            <td>
                <div class="product-cell">
                    <img src="https://ui-avatars.com/api/?name=${o.customer}&background=c9a87c&color=fff" alt="">
                    <div class="product-info">
                        <h4>${o.customer}</h4>
                        <span>${o.email}</span>
                    </div>
                </div>
            </td>
            <td>${o.items} ürün</td>
            <td><strong>₺${o.total.toLocaleString()}</strong></td>
            <td>${o.payment}</td>
            <td><span class="status-badge ${o.status}">${statusIcons[o.status]} ${statusLabels[o.status]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="viewOrder('${o.id}')" title="Görüntüle">👁️</button>
                    <button class="action-btn" onclick="editOrderStatus('${o.id}')" title="Durum Değiştir">✏️</button>
                    <button class="action-btn" onclick="printOrder('${o.id}')" title="Yazdır">🖨️</button>
                </div>
            </td>
        </tr>
    `;
    
    const renderRecentOrder = (o) => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>
                <div class="product-cell">
                    <img src="https://ui-avatars.com/api/?name=${o.customer}&background=c9a87c&color=fff" alt="">
                    <div class="product-info">
                        <h4>${o.customer}</h4>
                        <span>${o.email}</span>
                    </div>
                </div>
            </td>
            <td>${o.products ? o.products[0] : 'Ürün'} ${o.items > 1 ? '+ ' + (o.items - 1) + ' daha' : ''}</td>
            <td><strong>₺${o.total.toLocaleString()}</strong></td>
            <td><span class="status-badge ${o.status}">${statusLabels[o.status]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="viewOrder('${o.id}')" title="Görüntüle">👁️</button>
                    <button class="action-btn" onclick="editOrderStatus('${o.id}')" title="Durum Değiştir">✏️</button>
                </div>
            </td>
        </tr>
    `;
    
    if (tbody) tbody.innerHTML = orders.map(renderOrder).join('');
    if (recentTbody) recentTbody.innerHTML = orders.slice(0, 5).map(renderRecentOrder).join('');
    
    // Toplam satışları hesapla
    const totalSales = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0);
    const salesEl = document.getElementById('totalSales');
    if (salesEl) salesEl.textContent = '₺' + totalSales.toLocaleString();
}

function viewOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    document.getElementById('viewOrderId').textContent = '#' + orderId;
    
    const content = document.getElementById('orderDetailContent');
    const statusLabels = {
        completed: 'Tamamlandı',
        processing: 'İşleniyor',
        pending: 'Bekliyor',
        cancelled: 'İptal'
    };
    
    content.innerHTML = `
        <div style="display: grid; gap: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                <div style="background: var(--light); padding: 25px; border-radius: 16px;">
                    <h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Müşteri Bilgileri</h4>
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${order.customer}</p>
                    <p style="color: var(--gray); margin-bottom: 5px;">📧 ${order.email}</p>
                    <p style="color: var(--gray); margin-bottom: 10px;">📱 ${order.phone}</p>
                    <p style="color: var(--gray); font-size: 13px; line-height: 1.5;">📍 ${order.address}</p>
                </div>
                <div style="background: var(--light); padding: 25px; border-radius: 16px;">
                    <h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Sipariş Bilgileri</h4>
                    <p style="margin-bottom: 10px;"><span style="color: var(--gray);">Tarih:</span> <strong>${order.date}</strong></p>
                    <p style="margin-bottom: 10px;"><span style="color: var(--gray);">Ödeme:</span> <strong>${order.payment}</strong></p>
                    <p style="margin-bottom: 15px;"><span style="color: var(--gray);">Durum:</span> <span class="status-badge ${order.status}">${statusLabels[order.status]}</span></p>
                    <p style="font-size: 24px; font-weight: 700; color: var(--secondary); margin-top: 15px;">Toplam: ₺${order.total.toLocaleString()}</p>
                </div>
            </div>
            <div>
                <h4 style="margin-bottom: 15px; color: var(--gray); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ürünler</h4>
                <div style="background: var(--light); padding: 20px; border-radius: 16px;">
                    ${order.products ? order.products.map(p => `
                        <div style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px;">
                            <span style="color: var(--secondary);">•</span> ${p}
                        </div>
                    `).join('') : '<p style="color: var(--gray);">Ürün detayları...</p>'}
                </div>
            </div>
        </div>
    `;
    
    openModal('viewOrder');
}

function editOrderStatus(orderId) {
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const statusLabels = { pending: 'Bekliyor', processing: 'İşleniyor', completed: 'Tamamlandı', cancelled: 'İptal' };
    
    const currentStatus = JSON.parse(localStorage.getItem('kevra_orders') || '[]').find(o => o.id === orderId)?.status;
    
    const newStatus = prompt(
        `Sipariş #${orderId} için yeni durum seçin:\n\n` +
        `Mevcut: ${statusLabels[currentStatus]}\n\n` +
        `1: Bekliyor\n` +
        `2: İşleniyor\n` +
        `3: Tamamlandı\n` +
        `4: İptal`
    );
    
    if (!newStatus || newStatus < 1 || newStatus > 4) return;
    
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = statuses[newStatus - 1];
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
        showToast(`Sipariş #${orderId} durumu güncellendi!`, 'success');
        addActivity(`Sipariş #${orderId} durumu: ${statusLabels[order.status]}`, 'order');
        loadOrders();
    }
}

function printOrder(orderId) {
    showToast('Sipariş yazdırılıyor...', 'info');
    setTimeout(() => {
        window.print();
    }, 500);
}

// ==================== MÜŞTERİ YÖNETİMİ ====================

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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">Henüz müşteri yok</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>#${c.id}</strong></td>
            <td>
                <div class="product-cell">
                    <img src="https://ui-avatars.com/api/?name=${c.firstName}+${c.lastName}&background=c9a87c&color=fff" alt="">
                    <div class="product-info">
                        <h4>${c.firstName} ${c.lastName}</h4>
                        <span>${c.email}</span>
                    </div>
                </div>
            </td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="badge" style="background: var(--info);">${c.orders}</span></td>
            <td><strong>₺${c.total.toLocaleString()}</strong></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="viewCustomer(${c.id})" title="Görüntüle">👁️</button>
                    <button class="action-btn" onclick="editCustomer(${c.id})" title="Düzenle">✏️</button>
                    <button class="action-btn" onclick="deleteCustomer(${c.id})" title="Sil" style="color: var(--danger);">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewCustomer(id) {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    alert(`👤 Müşteri Detayı\n\n` +
          `Ad Soyad: ${customer.firstName} ${customer.lastName}\n` +
          `E-posta: ${customer.email}\n` +
          `Telefon: ${customer.phone}\n` +
          `Sipariş Sayısı: ${customer.orders}\n` +
          `Toplam Harcama: ₺${customer.total.toLocaleString()}\n` +
          `Kayıt Tarihi: ${customer.date}`);
}

function editCustomer(id) {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const newPhone = prompt('Yeni telefon numarası:', customer.phone);
    if (newPhone === null || newPhone === customer.phone) return;
    
    customer.phone = newPhone;
    localStorage.setItem('kevra_customers', JSON.stringify(customers));
    showToast('Müşteri güncellendi!', 'success');
    loadCustomers();
}

function deleteCustomer(id) {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
    
    let customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    customers = customers.filter(c => c.id !== id);
    localStorage.setItem('kevra_customers', JSON.stringify(customers));
    
    showToast('Müşteri silindi!', 'success');
    loadCustomers();
    updateStats();
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function updateStats() {
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    
    const totalSales = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0);
    
    // Tüm istatistik elementlerini güncelle
    const elements = {
        'totalProducts': products.length,
        'totalOrders': orders.length,
        'totalCustomers': customers.length,
        'totalSales': '₺' + totalSales.toLocaleString(),
        'productBadge': products.length,
        'orderBadge': orders.length,
        'customerBadge': customers.length
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

// Ana mağaza sayfası ile senkronizasyon
function syncWithStore() {
    // localStorage zaten güncellendi, ana sayfa otomatik olarak yeni verileri görecek
    // Bu fonksiyon ek senkronizasyon işlemleri için kullanılabilir
    
    // Örneğin: Broadcast Channel API ile diğer sekmelere bildirim gönderme
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('kevra_updates');
        channel.postMessage({ type: 'products_updated', timestamp: Date.now() });
    }
}

// ==================== BAŞLATMA ====================

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initData();
    
    // İlk yükleme
    loadProducts();
    loadOrders();
    loadActivities();
    updateStats();
    
    // Modal dışına tıklayınca kapat
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // ESC tuşu ile modal kapatma
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => {
                m.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });
});

// ==================== EKSİK FONKSİYONLAR ====================

function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    if (orders.length === 0) {
        showToast('Dışa aktarılacak sipariş yok!', 'warning');
        return;
    }
    
    // CSV formatına çevir
    const headers = ['Sipariş No', 'Tarih', 'Müşteri', 'Email', 'Telefon', 'Ürünler', 'Tutar', 'Ödeme', 'Durum', 'Adres'];
    const csvContent = [
        headers.join(';'),
        ...orders.map(o => [
            o.id,
            o.date,
            o.customer,
            o.email,
            o.phone,
            o.items,
            o.total,
            o.payment,
            o.status,
            o.address
        ].join(';'))
    ].join('\n');
    
    // İndir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Siparişler dışa aktarıldı! 📥', 'success');
    addActivity('Siparişler dışa aktarıldı', 'order');
}

function bulkOrderAction() {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    if (checkboxes.length === 0) {
        showToast('Lütfen en az bir sipariş seçin!', 'warning');
        return;
    }
    
    const action = prompt(
        'Toplu işlem seçin:\n\n' +
        '1: Tamamlandı olarak işaretle\n' +
        '2: İşleniyor olarak işaretle\n' +
        '3: Bekliyor olarak işaretle\n' +
        '4: İptal et'
    );
    
    if (!action || action < 1 || action > 4) return;
    
    const statuses = {
        '1': 'completed',
        '2': 'processing', 
        '3': 'pending',
        '4': 'cancelled'
    };
    
    const statusLabels = {
        '1': 'Tamamlandı',
        '2': 'İşleniyor',
        '3': 'Bekliyor',
        '4': 'İptal'
    };
    
    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    let updatedCount = 0;
    
    checkboxes.forEach(cb => {
        const orderId = cb.getAttribute('data-id');
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = statuses[action];
            updatedCount++;
        }
    });
    
    localStorage.setItem('kevra_orders', JSON.stringify(orders));
    showToast(`${updatedCount} sipariş güncellendi! ✓`, 'success');
    addActivity(`${updatedCount} sipariş toplu güncellendi`, 'order');
    loadOrders();
}

function toggleSelectAllOrders() {
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('.order-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

function exportCustomers() {
    const customers = JSON.parse(localStorage.getItem('kevra_customers') || '[]');
    if (customers.length === 0) {
        showToast('Dışa aktarılacak müşteri yok!', 'warning');
        return;
    }
    
    const headers = ['ID', 'Ad', 'Soyad', 'Email', 'Telefon', 'Sipariş', 'Toplam', 'Kayıt Tarihi'];
    const csvContent = [
        headers.join(';'),
        ...customers.map(c => [
            c.id,
            c.firstName,
            c.lastName,
            c.email,
            c.phone,
            c.orders,
            c.total,
            c.date
        ].join(';'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `musteriler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Müşteriler dışa aktarıldı! 📥', 'success');
}

function filterProducts() {
    const searchTerm = prompt('Aranacak ürün adı veya kategori:');
    if (!searchTerm) {
        loadProducts(); // Filtreyi temizle
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const grid = document.getElementById('adminProductsGrid');
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🔍</div>
                <h4>Sonuç Bulunamadı</h4>
                <p>"${searchTerm}" için sonuç yok</p>
            </div>
        `;
        return;
    }
    
    // Filtrelenmiş ürünleri göster (loadProducts ile aynı mantık)
    grid.innerHTML = filtered.map(p => {
        const hasDiscount = p.discount && p.originalPrice > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price/p.originalPrice) * 100) : 0;
        const stockClass = p.stock < 10 ? 'low' : p.stock === 0 ? 'out' : '';
        const stockText = p.stock === 0 ? 'Tükendi' : p.stock + ' adet';
        
        return `
            <div class="admin-product-card">
                <div class="admin-product-image">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    ${p.badge ? `<span class="product-badge ${p.badgeType}" style="position: absolute; top: 15px; left: 15px;">${p.badge}</span>` : ''}
                    <div class="admin-product-actions">
                        <button onclick="editProduct(${p.id})" title="Düzenle">✏️</button>
                        <button onclick="deleteProduct(${p.id})" title="Sil" style="background: var(--danger);">🗑️</button>
                    </div>
                </div>
                <div class="admin-product-info">
                    <h4>${p.name}</h4>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">${p.category}</p>
                    <div class="admin-product-meta">
                        <span class="admin-product-price">
                            ₺${p.price}
                            ${hasDiscount ? `<small>₺${p.originalPrice}</small>` : ''}
                            ${hasDiscount ? `<span class="discount-badge" style="margin-left: 8px;">%${discountPercent}</span>` : ''}
                        </span>
                        <span class="admin-product-stock ${stockClass}">${stockText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    showToast(`${filtered.length} ürün bulundu`, 'success');
}

function searchContent() {
    const query = document.getElementById('globalSearch')?.value.toLowerCase();
    if (!query) return;
    
    // Ürünlerde ara
    const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
    const found = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
    );
    
    if (found.length > 0) {
        showPage('products', document.querySelectorAll('.menu-item')[2]);
        const grid = document.getElementById('adminProductsGrid');
        grid.innerHTML = found.map(p => `
            <div class="admin-product-card">
                <div class="admin-product-image">
                    <img src="${p.image}" alt="${p.name}">
                    <div class="admin-product-actions">
                        <button onclick="editProduct(${p.id})">✏️</button>
                        <button onclick="deleteProduct(${p.id})">🗑️</button>
                    </div>
                </div>
                <div class="admin-product-info">
                    <h4>${p.name}</h4>
                    <div class="admin-product-meta">
                        <span class="admin-product-price">₺${p.price}</span>
                        <span class="admin-product-stock">${p.stock} adet</span>
                    </div>
                </div>
            </div>
        `).join('');
        showToast(`${found.length} ürün bulundu`, 'success');
    } else {
        showToast('Sonuç bulunamadı', 'error');
    }
}

function showMessages() {
    showToast('Mesajlar yakında geliyor! 📧', 'info');
}

function showNotifications() {
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'none';
    showToast('Tüm bildirimler okundu', 'success');
}