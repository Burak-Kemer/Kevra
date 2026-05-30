// ============================================================
//  KEVRA Database — Firebase + localStorage Hibrit
//  Firebase varsa Firestore kullanır, yoksa localStorage'a düşer
// ============================================================

const KevraDB = {

    // ===================== KULLANICI =====================

    registerUser: async function(userData) {
        const users = await this.getAllUsers();
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Bu e-posta zaten kayıtlı' };
        }

        const newUser = {
            id:           'user_' + Date.now(),
            firstName:    userData.firstName,
            lastName:     userData.lastName,
            email:        userData.email,
            password:     this._hash(userData.password),
            phone:        userData.phone || '',
            address:      userData.address || '',
            city:         userData.city || '',
            zipCode:      userData.zipCode || '',
            registerDate: new Date().toISOString(),
            active:       true
        };

        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                await window.KevraFirebase.db.collection('users').doc(newUser.id).set(newUser);
            } catch (e) { console.warn('Firestore yazma hatası:', e); }
        }

        // localStorage'a da yaz (hız + offline)
        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        local.push(newUser);
        localStorage.setItem('kevra_users', JSON.stringify(local));

        return { success: true, user: newUser };
    },

    loginUser: async function(email, password) {
        const users = await this.getAllUsers();
        const user  = users.find(u => u.email === email);
        if (!user)                                       return { success: false, message: 'Kullanıcı bulunamadı' };
        if (user.password !== this._hash(password))     return { success: false, message: 'Şifre hatalı' };

        const session = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, loginTime: new Date().toISOString() };
        localStorage.setItem('kevra_current_user', JSON.stringify(session));
        return { success: true, user: session };
    },

    logout: function() {
        localStorage.removeItem('kevra_current_user');
        localStorage.removeItem('kevra_cart');
    },

    isLoggedIn:      function() { return !!localStorage.getItem('kevra_current_user'); },
    getCurrentUser:  function() { const s = localStorage.getItem('kevra_current_user'); return s ? JSON.parse(s) : null; },

    getAllUsers: async function() {
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                const snap = await window.KevraFirebase.db.collection('users').get();
                return snap.docs.map(d => d.data());
            } catch (e) { console.warn('Firestore okuma hatası:', e); }
        }
        return JSON.parse(localStorage.getItem('kevra_users') || '[]');
    },

    // ===================== ÜRÜNLER =====================

    getProducts: async function() {
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                const snap = await window.KevraFirebase.db.collection('products').orderBy('createdAt', 'desc').get();
                if (!snap.empty) {
                    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    localStorage.setItem('kevra_products', JSON.stringify(products)); // local cache
                    return products;
                }
            } catch (e) { console.warn('Firestore ürün okuma hatası:', e); }
        }
        // localStorage fallback
        let products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
        if (products.length === 0) {
            products = this._defaultProducts();
            localStorage.setItem('kevra_products', JSON.stringify(products));
        }
        return products;
    },

    saveProduct: async function(productData) {
        const id   = productData.id ? String(productData.id) : 'p_' + Date.now();
        const data = { ...productData, id, updatedAt: new Date().toISOString(), createdAt: productData.createdAt || new Date().toISOString() };

        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                await window.KevraFirebase.db.collection('products').doc(id).set(data, { merge: true });
            } catch (e) { console.warn('Firestore ürün kayıt hatası:', e); }
        }

        // localStorage güncelle
        const products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
        const idx = products.findIndex(p => String(p.id) === String(id));
        if (idx >= 0) products[idx] = data; else products.push(data);
        localStorage.setItem('kevra_products', JSON.stringify(products));
        return { success: true, product: data };
    },

    deleteProduct: async function(productId) {
        const id = String(productId);
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try { await window.KevraFirebase.db.collection('products').doc(id).delete(); } catch (e) {}
        }
        const products = JSON.parse(localStorage.getItem('kevra_products') || '[]').filter(p => String(p.id) !== id);
        localStorage.setItem('kevra_products', JSON.stringify(products));
        return { success: true };
    },

    // ===================== SİPARİŞLER =====================

    createOrder: async function(orderData) {
        const currentUser = this.getCurrentUser();
        const newOrder = {
            id:            'ORD' + Date.now(),
            userId:        currentUser ? currentUser.id : 'guest',
            customer:      { firstName: orderData.firstName, lastName: orderData.lastName, email: orderData.email, phone: orderData.phone, address: orderData.address, city: orderData.city, zipCode: orderData.zipCode },
            items:         orderData.items,
            subtotal:      orderData.subtotal,
            shipping:      orderData.shipping,
            discount:      orderData.discount || 0,
            total:         orderData.total,
            paymentMethod: orderData.paymentMethod,
            couponCode:    orderData.couponCode || null,
            status:        'Beklemede',
            shippingStatus:'Hazırlanıyor',
            createdAt:     new Date().toISOString(),
            notes:         orderData.notes || ''
        };

        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                await window.KevraFirebase.db.collection('orders').doc(newOrder.id).set(newOrder);
            } catch (e) { console.warn('Firestore sipariş hatası:', e); }
        }

        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        orders.push(newOrder);
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
        return { success: true, order: newOrder };
    },

    getAllOrders: async function() {
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                const snap = await window.KevraFirebase.db.collection('orders').orderBy('createdAt', 'desc').get();
                return snap.docs.map(d => d.data());
            } catch (e) { console.warn('Firestore sipariş okuma:', e); }
        }
        return JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    },

    getUserOrders: async function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        const all = await this.getAllOrders();
        return all.filter(o => o.userId === currentUser.id);
    },

    updateOrderStatus: async function(orderId, status, shippingStatus) {
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                const update = { status };
                if (shippingStatus) update.shippingStatus = shippingStatus;
                await window.KevraFirebase.db.collection('orders').doc(orderId).update(update);
            } catch (e) { console.warn('Firestore sipariş güncelleme:', e); }
        }
        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        const order  = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (shippingStatus) order.shippingStatus = shippingStatus;
            localStorage.setItem('kevra_orders', JSON.stringify(orders));
            return { success: true };
        }
        return { success: false };
    },

    // ===================== ADMIN AUTH =====================

    adminLogin: async function(email, password) {
        // Firebase Auth varsa
        if (window.KevraFirebase && window.KevraFirebase.ready() && window.KevraFirebase.auth) {
            try {
                const cred = await window.KevraFirebase.auth.signInWithEmailAndPassword(email, password);
                localStorage.setItem('kevra_admin_logged_in', 'true');
                localStorage.setItem('kevra_admin_user', email);
                localStorage.setItem('kevra_admin_uid', cred.user.uid);
                return { success: true };
            } catch (e) {
                return { success: false, message: 'Firebase hata: ' + e.message };
            }
        }
        // Fallback: config'deki bilgilerle karşılaştır
        const cfg = window.ADMIN_CONFIG || {};
        if (email === cfg.email && password === cfg.password) {
            localStorage.setItem('kevra_admin_logged_in', 'true');
            localStorage.setItem('kevra_admin_user', email);
            return { success: true };
        }
        return { success: false, message: 'Kullanıcı adı veya şifre hatalı' };
    },

    adminLogout: async function() {
        if (window.KevraFirebase && window.KevraFirebase.ready() && window.KevraFirebase.auth) {
            try { await window.KevraFirebase.auth.signOut(); } catch (e) {}
        }
        localStorage.removeItem('kevra_admin_logged_in');
        localStorage.removeItem('kevra_admin_user');
        localStorage.removeItem('kevra_admin_uid');
        window.location.replace('admin-login.html');
    },

    isAdminLoggedIn: function() { return !!localStorage.getItem('kevra_admin_logged_in'); },

    // ===================== YARDIMCI =====================

    _hash: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
        return hash.toString();
    },

    _defaultProducts: function() {
        return [
            { id: 1, name: 'Siyah Midi Elbise',   category: 'elbise', price: 1000, originalPrice: 2000, discount: true, stock: 24, image: 'img/dress1.jpg', badge: 'indirim',  badgeType: 'indirim',  sizes: ['S','M','L','XL'],  colors: ['Siyah','Bordo'] },
            { id: 2, name: 'Çiçekli Maxi Elbise', category: 'elbise', price: 749,  originalPrice: 749,  discount: false, stock: 18, image: 'img/dress2.jpg', badge: 'yeni',     badgeType: 'yeni',     sizes: ['XS','S','M','L'],  colors: ['Krem','Pembe'] },
            { id: 3, name: 'Ofis Elbisesi (Bej)', category: 'elbise', price: 1199, originalPrice: 1599, discount: true, stock: 15, image: 'img/dress3.jpg', badge: 'popular',  badgeType: 'popular',  sizes: ['S','M','L','XL'],  colors: ['Bej','Siyah'] }
        ];
    },

    clearAll: function() {
        ['kevra_users','kevra_orders','kevra_current_user','kevra_cart','kevra_products'].forEach(k => localStorage.removeItem(k));
    }
};

window.KevraDB = KevraDB;
window.DB      = KevraDB;  // geriye uyumluluk