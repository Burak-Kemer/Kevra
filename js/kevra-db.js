// ============================================================
//  KEVRA Database — Firebase + localStorage Hibrit
//  Firebase varsa Firestore kullanır, yoksa localStorage'a düşer
// ============================================================

// ÖNBELLEK SÜRÜM KONTROLÜ: Bazı tarayıcılarda (özellikle mobil Safari)
// eski bir ziyarette önbelleğe yazılmış ürün listesi (artık silinmiş/sahte
// ürünler içerebilir) günlerce/haftalarca kalabiliyordu — sayfa/uygulama
// kapatılıp açılması bunu temizlemiyor. Bu sürüm numarası her arttığında
// TÜM tarayıcılarda eski ürün önbelleği bir kerelik otomatik temizlenir,
// böylece Firebase'den taze veri gelene kadar (ya da hiç gelmezse) eski
// yanlış veri değil, gerçekten boş bir liste kullanılır.
const PRODUCTS_CACHE_VERSION = '2';
if (localStorage.getItem('kevra_products_cache_v') !== PRODUCTS_CACHE_VERSION) {
    localStorage.removeItem('kevra_products');
    localStorage.setItem('kevra_products_cache_v', PRODUCTS_CACHE_VERSION);
}

const CLOUD_FN_BASE = 'https://europe-west1-kevra-88a60.cloudfunctions.net';

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

    // GÜVENLİK: E-posta tekillik kontrolü ve şifre karşılaştırması artık
    // registerCustomer/loginCustomer Cloud Function'larında (sunucuda)
    // yapılıyor. Eskiden client tüm 'users' koleksiyonunu (şifre hash'leri
    // dahil) indirip tarayıcıda karşılaştırıyordu — bu satırlar kaldırıldı.
    registerUser: async function(userData) {
        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/registerCustomer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const data = await res.json();
                if (data.success) {
                    const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
                    local.push(data.user);
                    localStorage.setItem('kevra_users', JSON.stringify(local));
                }
                return data;
            } catch (e) { console.warn('registerCustomer isteği başarısız, localStorage moduna düşülüyor:', e); }
        }

        // Firebase yoksa (yerel geliştirme / file://): eski localStorage-only yol
        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        if (local.find(u => u.email === userData.email)) {
            return { success: false, message: 'Bu e-posta zaten kayıtlı' };
        }
        const newUser = {
            id: 'user_' + Date.now(), firstName: userData.firstName, lastName: userData.lastName,
            email: userData.email, password: this._hash(userData.password), phone: userData.phone || '',
            address: userData.address || '', city: userData.city || '', zipCode: userData.zipCode || '',
            registerDate: new Date().toISOString(), active: true, addresses: []
        };
        local.push(newUser);
        localStorage.setItem('kevra_users', JSON.stringify(local));
        return { success: true, user: newUser };
    },

    loginUser: async function(email, password) {
        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/loginCustomer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) localStorage.setItem('kevra_current_user', JSON.stringify(data.user));
                return data;
            } catch (e) { console.warn('loginCustomer isteği başarısız, localStorage moduna düşülüyor:', e); }
        }

        // Firebase yoksa: eski localStorage-only yol
        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        const user  = local.find(u => u.email === email);
        if (!user)                                   return { success: false, message: 'Kullanıcı bulunamadı' };
        if (user.password !== this._hash(password))  return { success: false, message: 'Şifre hatalı' };

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

    // GÜVENLİK: Tek bir kullanıcıyı bulmak için 'users' koleksiyonunun
    // tamamını listelemek yerine (Firestore kuralları artık müşterilere
    // bunu izin vermiyor) doğrudan bilinen ID ile tek doküman okunur.
    _getUserById: async function(userId) {
        if (await this._firebaseAvailable()) {
            try {
                const doc = await window.KevraFirebase.db.collection('users').doc(userId).get();
                if (doc.exists) return doc.data();
            } catch (e) { console.warn('Firestore kullanıcı okuma hatası:', e); }
        }
        const local = JSON.parse(localStorage.getItem('kevra_users') || '[]');
        return local.find(u => u.id === userId) || null;
    },

    // Bir kullanıcı kaydını Firestore + localStorage'da tutarlı şekilde
    // günceller. mutate(user) güncellenmiş kaydı döndürmeli.
    _updateUserRecord: async function(userId, mutate) {
        const current = await this._getUserById(userId);
        if (!current) return { success: false, message: 'Kullanıcı bulunamadı' };

        const updated = mutate({ ...current });

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

        const user = await this._getUserById(currentUser.id);
        if (!user) return { success: false, message: 'Kullanıcı bulunamadı' };
        if (user.password !== this._hash(currentPassword)) return { success: false, message: 'Mevcut şifre yanlış' };

        await this._updateUserRecord(currentUser.id, u => ({ ...u, password: this._hash(newPassword) }));
        return { success: true };
    },

    // ===================== ADRESLER =====================

    getAddresses: async function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        const user = await this._getUserById(currentUser.id);
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

    // GÜVENİLİRLİK: Ürünler artık ÖNCELİKLE getProducts Cloud Function'ından
    // (düz HTTPS isteği) çekiliyor. Bazı mobil tarayıcılar/uygulama-içi
    // tarayıcılar (Instagram vb.) Firestore'un client SDK'sının kullandığı
    // gerçek-zamanlı bağlantıyı (WebSocket/uzun bağlantı) engelliyordu —
    // düz bir fetch() isteği bu kısıtlamalardan etkilenmiyor ve bu
    // konuşma boyunca (kayıt/giriş/sipariş uçları) hiç sorun yaşamadı.
    // Firestore client SDK'sı sadece bu istek de başarısız olursa devreye
    // giren ikinci bir yedek.
    getProducts: async function() {
        try {
            const res  = await fetch(CLOUD_FN_BASE + '/getProducts', { method: 'GET' });
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                localStorage.setItem('kevra_products', JSON.stringify(data.products));
                return data.products;
            }
        } catch (e) { console.warn('getProducts isteği başarısız, Firestore SDK deneniyor:', e); }

        if (await this._firebaseAvailable()) {
            // Mobil ağlarda tek seferlik bağlantı takılmaları yaygın olduğu
            // için bir kere daha deneniyor, hemen pes edilmiyor.
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const snap = await window.KevraFirebase.db.collection('products').orderBy('createdAt', 'desc').get();
                    // Firestore'a başarıyla ulaşıldıysa sonucu OLDUĞU GİBİ döndür —
                    // katalog gerçekten boşsa (admin tüm ürünleri sildiyse) bu,
                    // "Firestore'a ulaşılamadı" ile karıştırılıp yerine sahte
                    // varsayılan ürünler gösterilmemeli (bkz. aşağıdaki catch/fallback).
                    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    localStorage.setItem('kevra_products', JSON.stringify(products)); // local cache
                    return products;
                } catch (e) {
                    console.warn('Firestore ürün okuma hatası (deneme ' + (attempt + 1) + '):', e);
                    if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        // GÜVENLİK/DOĞRULUK: Hiçbir yoldan ulaşılamadıysa (offline, ağ
        // hatası) sahte/örnek ürünler ASLA gösterilmez — bu, gerçekte var
        // olmayan (silinmiş) ürünlerin gerçekmiş gibi satışa sunulmasına yol
        // açıyordu. Sadece daha önce gerçekten çekilmiş, bu cihazda
        // önbelleklenmiş veri kullanılır; o da yoksa boş liste döner
        // (arayüz "ürün bulunamadı" durumunu zaten düzgün gösteriyor).
        return JSON.parse(localStorage.getItem('kevra_products') || '[]');
    },

    saveProduct: async function(productData) {
        const id   = productData.id ? String(productData.id) : 'p_' + Date.now();
        const data = { ...productData, id, updatedAt: new Date().toISOString(), createdAt: productData.createdAt || new Date().toISOString() };

        const firebaseAvailable = await this._firebaseAvailable();
        let firestoreOk = false;
        let firestoreError = null;
        if (firebaseAvailable) {
            try {
                await window.KevraFirebase.db.collection('products').doc(id).set(data, { merge: true });
                firestoreOk = true;
            } catch (e) {
                console.warn('Firestore ürün kayıt hatası:', e);
                firestoreError = e.message;
            }
        }

        // GÜVENLİK/DOĞRULUK: Ürünler artık müşteri tarafında getProducts
        // Cloud Function'ı (gerçek Firestore verisi) ile gösteriliyor —
        // Firestore yazması başarısız olduysa admin panelin kendi
        // localStorage önbelleğine "başarılı" yazmak yanıltıcı: admin
        // "eklendi" mesajını görür ama ürün müşterilere hiç görünmez.
        // Bu yüzden Firestore mevcutken yazma başarısız olursa hata
        // döndürülür, sahte bir başarı mesajı gösterilmez.
        if (firebaseAvailable && !firestoreOk) {
            return { success: false, message: 'Ürün kaydedilemedi: ' + (firestoreError || 'Firestore hatası') };
        }

        // localStorage güncelle (Firestore'a başarıyla yazıldı ya da Firebase
        // hiç kullanılamıyor/çevrimdışı geliştirme modu)
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

    // ===================== KATEGORİ GÖRSELLERİ =====================

    // GÜVENİLİRLİK: getProducts ile aynı gerekçe — önce düz HTTPS Cloud
    // Function denenir (Instagram/bazı mobil tarayıcılarda Firestore'un
    // gerçek-zamanlı bağlantısı engellenebiliyordu), sadece o başarısız
    // olursa client SDK'sına düşülür.
    getCategoryImages: async function() {
        try {
            const res  = await fetch(CLOUD_FN_BASE + '/getCategoryImages', { method: 'GET' });
            const data = await res.json();
            if (data.success && data.images) {
                localStorage.setItem('kevra_category_images', JSON.stringify(data.images));
                return data.images;
            }
        } catch (e) { console.warn('getCategoryImages isteği başarısız, Firestore SDK deneniyor:', e); }

        if (await this._firebaseAvailable()) {
            try {
                const doc = await window.KevraFirebase.db.collection('settings').doc('categoryImages').get();
                if (doc.exists) {
                    localStorage.setItem('kevra_category_images', JSON.stringify(doc.data()));
                    return doc.data();
                }
            } catch (e) { console.warn('Kategori görselleri okuma hatası:', e); }
        }
        return JSON.parse(localStorage.getItem('kevra_category_images') || '{}');
    },

    saveCategoryImage: async function(slug, base64) {
        if (await this._firebaseAvailable()) {
            try {
                await window.KevraFirebase.db.collection('settings').doc('categoryImages').set({ [slug]: base64 }, { merge: true });
            } catch (e) { console.warn('Kategori görseli kaydetme hatası:', e); }
        }
        const current = JSON.parse(localStorage.getItem('kevra_category_images') || '{}');
        current[slug] = base64;
        localStorage.setItem('kevra_category_images', JSON.stringify(current));
        return { success: true };
    },

    // ===================== SİPARİŞLER =====================

    // GÜVENLİK: Sipariş artık doğrudan client'tan Firestore'a yazılmıyor —
    // createOrder Cloud Function'ı fiyatları Firestore'daki gerçek ürün
    // kayıtlarından yeniden hesaplar (bkz. firestore.rules'taki 'orders'
    // açıklaması).
    createOrder: async function(orderData) {
        const currentUser = this.getCurrentUser();
        const payload = { ...orderData, userId: currentUser ? currentUser.id : 'guest' };

        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/createOrder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderData: payload })
                });
                const data = await res.json();
                if (data.success) {
                    const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
                    orders.push(data.order);
                    localStorage.setItem('kevra_orders', JSON.stringify(orders));
                }
                return data;
            } catch (e) { console.warn('createOrder isteği başarısız, localStorage moduna düşülüyor:', e); }
        }

        // Firebase yoksa: eski localStorage-only yol (fiyatlar doğrulanmaz)
        const newOrder = {
            id: 'KVR' + Date.now(), userId: payload.userId,
            customer: { firstName: orderData.firstName, lastName: orderData.lastName, email: orderData.email, phone: orderData.phone, address: orderData.address, city: orderData.city, zipCode: orderData.zipCode },
            items: orderData.items, subtotal: orderData.subtotal, shipping: orderData.shipping,
            discount: orderData.discount || 0, total: orderData.total, paymentMethod: orderData.paymentMethod,
            couponCode: orderData.couponCode || null, status: 'Beklemede', shippingStatus: 'Hazırlanıyor',
            createdAt: new Date().toISOString(), notes: orderData.notes || ''
        };
        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        orders.push(newOrder);
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
        return { success: true, order: newOrder };
    },

    // GÜVENLİK: Müşterinin kendi siparişini iptal etmesi artık
    // cancelMyOrder Cloud Function'ı üzerinden yapılır — bu fonksiyon
    // siparişin gerçekten bu kullanıcıya ait olduğunu doğrular. Admin
    // panel sipariş durumu güncellemesi için hâlâ updateOrderStatus
    // kullanır (admin yetkisiyle doğrudan Firestore'a yazar).
    cancelMyOrder: async function(orderId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Oturum açık değil' };
        try {
            const res  = await fetch(CLOUD_FN_BASE + '/cancelMyOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, orderId })
            });
            return await res.json();
        } catch (e) {
            console.warn('cancelMyOrder isteği başarısız:', e);
            return { success: false, message: 'Bağlantı hatası' };
        }
    },

    // GÜVENLİK: Sipariş takibi (bilinen bir sipariş numarasıyla arama) sadece
    // tek bir dokümanı okur — koleksiyonun tamamını listelemez, böylece
    // giriş yapmamış ziyaretçiler de kendi sipariş numaralarıyla sorgu
    // yapabilir ama başkalarının siparişlerini toplu olarak göremez.
    getOrderById: async function(orderId) {
        if (await this._firebaseAvailable()) {
            try {
                const doc = await window.KevraFirebase.db.collection('orders').doc(String(orderId)).get();
                if (doc.exists) return doc.data();
            } catch (e) { console.warn('Firestore sipariş okuma hatası:', e); }
        }
        const local = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        return local.find(o => String(o.id).toLowerCase() === String(orderId).toLowerCase()) || null;
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

    // GÜVENLİK: Tüm 'orders' koleksiyonunu çekip client'ta filtrelemek yerine
    // getMyOrders Cloud Function'ı ile sadece bu kullanıcıya ait siparişler
    // istenir (Firestore kuralları artık müşterilere koleksiyonun tamamını
    // listeletmiyor).
    getUserOrders: async function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];

        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/getMyOrders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id })
                });
                const data = await res.json();
                if (data.success) return data.orders;
            } catch (e) { console.warn('getMyOrders isteği başarısız, localStorage moduna düşülüyor:', e); }
        }

        const local = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        return local.filter(o => o.userId === currentUser.id);
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
        let firestoreOk = false;
        if (await this._firebaseAvailable()) {
            try {
                const update = { status };
                if (shippingStatus) update.shippingStatus = shippingStatus;
                Object.assign(update, extra);
                await window.KevraFirebase.db.collection('orders').doc(orderId).update(update);
                firestoreOk = true;
            } catch (e) { console.warn('Firestore sipariş güncelleme:', e); }
        }

        // localStorage önbelleği varsa (ör. admin veya COD siparişleri) onu da
        // güncelle — ama artık müşteri siparişleri her zaman bu önbellekte
        // olmayabilir (getUserOrders artık Cloud Function'dan geliyor), bu
        // yüzden başarı durumu sadece bu önbelleğin varlığına bağlı değil.
        const orders = JSON.parse(localStorage.getItem('kevra_orders') || '[]');
        const order  = orders.find(o => o.id === orderId);
        if (order) {
            order.status = status;
            if (shippingStatus) order.shippingStatus = shippingStatus;
            Object.assign(order, extra);
            localStorage.setItem('kevra_orders', JSON.stringify(orders));
        }

        return { success: firestoreOk || !!order };
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
        // GÜVENLİK: Eskiden burada, tarayıcıya gönderilen js/firebase-config.js
        // içindeki sabit bir şifre client tarafında karşılaştırılıyordu — yani
        // admin şifresi "sayfa kaynağını görüntüle" ile herkes tarafından
        // okunabiliyordu. Kaldırıldı: Firebase Auth kullanılamıyorsa admin
        // girişi de yapılamaz.
        return { success: false, message: 'Firebase Auth kullanılamıyor, admin girişi yapılamıyor.' };
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

    // ===================== İADE TALEPLERİ =====================

    // GÜVENLİK: İade talebi artık createReturnRequest Cloud Function'ı
    // üzerinden oluşturuluyor — bu, talebin gerçekten bu kullanıcıya ait
    // (ve var olan) bir siparişe karşı açıldığını doğrular.
    saveReturnRequest: async function(returnData) {
        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/createReturnRequest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(returnData)
                });
                const data = await res.json();
                if (data.success) {
                    const returns = JSON.parse(localStorage.getItem('kevra_returns') || '[]');
                    returns.push(data.return);
                    localStorage.setItem('kevra_returns', JSON.stringify(returns));
                }
                return data;
            } catch (e) { console.warn('createReturnRequest isteği başarısız, localStorage moduna düşülüyor:', e); }
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

    // GÜVENLİK: getMyReturns Cloud Function'ı ile sadece bu kullanıcıya ait
    // iade talepleri istenir (bkz. getUserOrders'taki aynı gerekçe).
    getUserReturnRequests: async function() {
        const user = this.getCurrentUser();
        if (!user) return [];

        if (await this._firebaseAvailable()) {
            try {
                const res  = await fetch(CLOUD_FN_BASE + '/getMyReturns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                const data = await res.json();
                if (data.success) return data.returns;
            } catch (e) { console.warn('getMyReturns isteği başarısız, localStorage moduna düşülüyor:', e); }
        }

        const local = JSON.parse(localStorage.getItem('kevra_returns') || '[]');
        return local.filter(r => r.userId === user.id);
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