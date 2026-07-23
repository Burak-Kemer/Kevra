// ============================================================
//  KEVRA Database — Firebase + localStorage Hibrit
//  Firebase varsa Firestore kullanır, yoksa localStorage'a düşer
// ============================================================

const KevraDB = {

    // Firestore çağrılarından önce (varsa) anonim oturumun açılmasını
    // bekler — sayfa yeni yüklendiğinde Firestore isteği anonim girişten
    // önce atılıp 403 almasını önler. Bkz. js/firebase-config.js.
    _firebaseAvailable: async function() {
        if (!window.KevraFirebase) return false;
        if (window.KevraFirebase.authReady) await window.KevraFirebase.authReady;
        return window.KevraFirebase.ready();
    },

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
            active:       true,
            addresses:    []
        };

        if (await this._firebaseAvailable()) {
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

        const session = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, photo: user.photo || null, loginTime: new Date().toISOString() };
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
        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        if (await this._firebaseAvailable()) {
            try {
                const snap = await window.KevraFirebase.db.collection('users').get();
                const fsData = snap.docs.map(d => d.data());
                if (fsData.length > 0) return fsData;
                // Firestore boş ama localStorage'da veri var → migrate
                if (local.length > 0) {
                    for (const u of local) {
                        await window.KevraFirebase.db.collection('users').doc(u.id).set(u).catch(() => {});
                    }
                }
            } catch (e) { console.warn('Firestore okuma hatası:', e); }
        }
        return local;
    },

    // Bir kullanıcı kaydını Firestore + localStorage'da tutarlı şekilde
    // günceller. mutate(user) güncellenmiş kaydı döndürmeli.
    _updateUserRecord: async function(userId, mutate) {
        const users = await this.getAllUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return { success: false, message: 'Kullanıcı bulunamadı' };

        const updated = mutate({ ...users[idx] });

        if (await this._firebaseAvailable()) {
            try {
                await window.KevraFirebase.db.collection('users').doc(userId).set(updated, { merge: true });
            } catch (e) { console.warn('Firestore kullanıcı güncelleme hatası:', e); }
        }

        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        const localIdx = local.findIndex(u => u.id === userId);
        if (localIdx !== -1) local[localIdx] = updated; else local.push(updated);
        localStorage.setItem('kevra_users', JSON.stringify(local));

        return { success: true, user: updated };
    },

    updateUser: async function(updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const result = await this._updateUserRecord(currentUser.id, user => ({ ...user, ...updates }));
        if (!result.success) return result;

        // Header/menüde kullanılan oturum bilgisini de güncelle
        const session = { ...currentUser, ...updates };
        delete session.password;
        localStorage.setItem('kevra_current_user', JSON.stringify(session));

        return { success: true, user: result.user };
    },

    changePassword: async function(currentPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const users = await this.getAllUsers();
        const user = users.find(u => u.id === currentUser.id);
        if (!user) return { success: false, message: 'Kullanıcı bulunamadı' };
        if (user.password !== this._hash(currentPassword)) return { success: false, message: 'Mevcut şifre yanlış' };

        await this._updateUserRecord(currentUser.id, u => ({ ...u, password: this._hash(newPassword) }));
        return { success: true };
    },

    // ===================== ADRESLER =====================

    getAddresses: async function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        const users = await this.getAllUsers();
        const user = users.find(u => u.id === currentUser.id);
        return (user && user.addresses) || [];
    },

    addAddress: async function(address) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const newAddress = { id: 'addr_' + Date.now(), ...address, createdAt: new Date().toISOString() };
        const result = await this._updateUserRecord(currentUser.id, user => {
            const addresses = user.addresses ? [...user.addresses, newAddress] : [newAddress];
            return { ...user, addresses };
        });
        if (!result.success) return result;
        return { success: true, address: newAddress };
    },

    updateAddress: async function(addressId, updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const result = await this._updateUserRecord(currentUser.id, user => ({
            ...user,
            addresses: (user.addresses || []).map(a => a.id === addressId ? { ...a, ...updates } : a)
        }));
        return result.success ? { success: true } : result;
    },

    deleteAddress: async function(addressId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const result = await this._updateUserRecord(currentUser.id, user => ({
            ...user,
            addresses: (user.addresses || []).filter(a => a.id !== addressId)
        }));
        return result.success ? { success: true } : result;
    },

    setDefaultAddress: async function(addressId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };

        const result = await this._updateUserRecord(currentUser.id, user => ({
            ...user,
            addresses: (user.addresses || []).map(a => ({ ...a, isDefault: a.id === addressId }))
        }));
        return result.success ? { success: true } : result;
    },

    // ===================== ÜRÜNLER =====================

    getProducts: async function() {
        if (await this._firebaseAvailable()) {
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

        if (await this._firebaseAvailable()) {
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
        if (await this._firebaseAvailable()) {
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
            id:            'KVR' + Date.now(),
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

        if (await this._firebaseAvailable()) {
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
        const local = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        if (await this._firebaseAvailable()) {
            try {
                const snap = await window.KevraFirebase.db.collection('orders').orderBy('createdAt', 'desc').get();
                const fsData = snap.docs.map(d => d.data());
                if (fsData.length > 0) {
                    // Firestore'da veri var — localStorage ile senkronize et
                    localStorage.setItem('kevra_orders', JSON.stringify(fsData));
                    return fsData;
                }
                // Firestore boş ama localStorage'da veri var → tek seferlik migrate
                if (local.length > 0) {
                    console.log('[KevraDB] Siparişler localStorage → Firestore migrate ediliyor...');
                    const batch = window.KevraFirebase.db.batch();
                    for (const order of local) {
                        const ref = window.KevraFirebase.db.collection('orders').doc(String(order.id));
                        batch.set(ref, order);
                    }
                    await batch.commit();
                    console.log('[KevraDB] ✅ Migrate tamamlandı:', local.length, 'sipariş');
                }
            } catch (e) { console.warn('Firestore sipariş okuma:', e); }
        }
        return local;
    },

    getUserOrders: async function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        const all = await this.getAllOrders();
        return all.filter(o => o.userId === currentUser.id);
    },

    deleteAllOrders: async function() {
        if (window.KevraFirebase && window.KevraFirebase.ready()) {
            try {
                const snap = await window.KevraFirebase.db.collection('orders').get();
                const chunkSize = 400; // Firestore batch limiti: 500 işlem
                for (let i = 0; i < snap.docs.length; i += chunkSize) {
                    const batch = window.KevraFirebase.db.batch();
                    snap.docs.slice(i, i + chunkSize).forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
            } catch (e) { console.warn('Firestore sipariş silme hatası:', e); }
        }
        localStorage.removeItem('kevra_orders');
        return { success: true };
    },

    updateOrderStatus: async function(orderId, status, shippingStatus, extra = {}) {
        if (await this._firebaseAvailable()) {
            try {
                const update = { status };
                if (shippingStatus) update.shippingStatus = shippingStatus;
                Object.assign(update, extra);
                await window.KevraFirebase.db.collection('orders').doc(orderId).update(update);
            } catch (e) { console.warn('Firestore sipariş güncelleme:', e); }
        }
        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        const order  = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (shippingStatus) order.shippingStatus = shippingStatus;
            Object.assign(order, extra);
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

    // ===================== İADE TALEPLERİ =====================

    saveReturnRequest: async function(returnData) {
        if (await this._firebaseAvailable()) {
            try {
                await window.KevraFirebase.db.collection('returns').doc(returnData.id).set(returnData);
            } catch (e) { console.warn('Firestore iade kaydetme:', e); }
        }
        const returns = JSON.parse(localStorage.getItem('kevra_returns') || '[]');
        const idx = returns.findIndex(r => r.id === returnData.id);
        if (idx !== -1) returns[idx] = returnData; else returns.push(returnData);
        localStorage.setItem('kevra_returns', JSON.stringify(returns));
        return { success: true };
    },

    getAllReturnRequests: async function() {
        if (await this._firebaseAvailable()) {
            try {
                const snap = await window.KevraFirebase.db.collection('returns').get();
                const returns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                localStorage.setItem('kevra_returns', JSON.stringify(returns));
                return returns;
            } catch (e) { console.warn('Firestore iadeler:', e); }
        }
        return JSON.parse(localStorage.getItem('kevra_returns') || '[]');
    },

    getUserReturnRequests: async function() {
        const user = this.getCurrentUser();
        if (!user) return [];
        const all = await this.getAllReturnRequests();
        return all.filter(r => r.userId === user.id);
    },

    updateReturnStatus: async function(returnId, status, statusText) {
        const now = new Date().toISOString();
        if (await this._firebaseAvailable()) {
            try {
                await window.KevraFirebase.db.collection('returns').doc(returnId).update({ status, statusText, updatedAt: now });
            } catch (e) { console.warn('Firestore iade güncelleme:', e); }
        }
        const returns = JSON.parse(localStorage.getItem('kevra_returns') || '[]');
        const ret = returns.find(r => r.id === returnId);
        if (ret) { ret.status = status; ret.statusText = statusText; ret.updatedAt = now; }
        localStorage.setItem('kevra_returns', JSON.stringify(returns));
        return { success: true };
    },

    clearAll: function() {
        ['kevra_users','kevra_orders','kevra_current_user','kevra_cart','kevra_products'].forEach(k => localStorage.removeItem(k));
    }
};

window.KevraDB = KevraDB;
window.DB      = KevraDB;  // geriye uyumluluk