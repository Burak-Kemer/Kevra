// KEVRA Database - LocalStorage Yönetimi
const KevraDB = {
    // ========== KULLANICI İŞLEMLERİ ==========
    
    registerUser: function(userData) {
        const users = this.getAllUsers();
        
        // Email kontrolü
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Bu email adresi zaten kayıtlı' };
        }
        
        const newUser = {
            id: 'user_' + Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: this.hashPassword(userData.password),
            phone: userData.phone,
            address: userData.address,
            city: userData.city,
            zipCode: userData.zipCode || '',
            registerDate: new Date().toISOString(),
            active: true
        };
        
        users.push(newUser);
        localStorage.setItem('kevra_users', JSON.stringify(users));
        
        return { success: true, user: newUser };
    },
    
    loginUser: function(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'Kullanıcı bulunamadı' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Şifre hatalı' };
        }
        
        const session = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            address: user.address,
            city: user.city,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('kevra_current_user', JSON.stringify(session));
        return { success: true, user: session };
    },
    
    logout: function() {
        localStorage.removeItem('kevra_current_user');
        localStorage.removeItem('kevra_cart');
    },
    
    isLoggedIn: function() {
        return !!localStorage.getItem('kevra_current_user');
    },
    
    getCurrentUser: function() {
        const session = localStorage.getItem('kevra_current_user');
        return session ? JSON.parse(session) : null;
    },
    
    getAllUsers: function() {
        return JSON.parse(localStorage.getItem('kevra_users') || '[]');
    },
    
    // ========== ÜRÜN İŞLEMLERİ ==========
    
    getProducts: function() {
        let products = JSON.parse(localStorage.getItem('kevra_products') || '[]');
        if (products.length === 0) {
            products = this.getDefaultProducts();
            localStorage.setItem('kevra_products', JSON.stringify(products));
        }
        return products;
    },
    
    getDefaultProducts: function() {
        return [
            { id: 1, name: 'Siyah Midi Elbise', category: 'elbise', price: 1000, originalPrice: 2000, discount: 50, stock: 24, image: 'img/dress1.jpg', status: 'active', badge: 'İndirim', badgeType: 'indirim' },
            { id: 2, name: 'Çiçekli Maxi Elbise', category: 'elbise', price: 749, stock: 18, image: 'img/dress2.jpg', status: 'new', badge: 'Yeni', badgeType: 'yeni' },
            { id: 3, name: 'Ofis Elbisesi (Bej)', category: 'elbise', price: 1199, originalPrice: 1599, discount: 25, stock: 15, image: 'img/dress3.jpg', status: 'premium', badge: 'Premium', badgeType: 'premium' },
            { id: 4, name: 'Kokteyl Elbisesi', category: 'elbise', price: 1599, originalPrice: 2299, discount: 30, stock: 8, image: 'img/dress4.jpg', status: 'indirim', badge: 'İndirim', badgeType: 'indirim' },
            { id: 5, name: 'Günlük Tişört Elbise', category: 'elbise', price: 449, stock: 40, image: 'img/dress5.jpg', status: 'active' },
            { id: 6, name: 'Dantel Detaylı Elbise', category: 'elbise', price: 999, originalPrice: 1399, discount: 29, stock: 12, image: 'img/dress6.jpg', status: 'new', badge: 'Yeni', badgeType: 'yeni' },
            { id: 7, name: 'Kadife Elbise', category: 'elbise', price: 1299, originalPrice: 1799, discount: 28, stock: 10, image: 'img/dress7.jpg', status: 'premium', badge: 'Premium', badgeType: 'premium' },
            { id: 8, name: 'Asimetrik Kesim Elbise', category: 'elbise', price: 899, stock: 20, image: 'img/dress8.jpg', status: 'active' }
        ];
    },
    
    // ========== SİPARİŞ İŞLEMLERİ ==========
    
    createOrder: function(orderData) {
        const orders = this.getAllOrders();
        const currentUser = this.getCurrentUser();
        
        const newOrder = {
            id: 'ORD' + Date.now(),
            userId: currentUser ? currentUser.id : 'guest',
            customer: {
                firstName: orderData.firstName,
                lastName: orderData.lastName,
                email: orderData.email,
                phone: orderData.phone,
                address: orderData.address
            },
            items: orderData.items,
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            discount: orderData.discount || 0,
            total: orderData.total,
            paymentMethod: orderData.paymentMethod,
            status: 'Beklemede',
            shippingStatus: 'Hazırlanıyor',
            createdAt: new Date().toISOString(),
            notes: orderData.notes || ''
        };
        
        orders.push(newOrder);
        localStorage.setItem('kevra_orders', JSON.stringify(orders));
        
        return { success: true, order: newOrder };
    },
    
    getUserOrders: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        
        const orders = this.getAllOrders();
        return orders.filter(o => o.userId === currentUser.id);
    },
    
    getAllOrders: function() {
        return JSON.parse(localStorage.getItem('kevra_orders') || '[]');
    },
    
    updateOrderStatus: function(orderId, status, shippingStatus) {
        const orders = this.getAllOrders();
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            order.status = status;
            if (shippingStatus) order.shippingStatus = shippingStatus;
            localStorage.setItem('kevra_orders', JSON.stringify(orders));
            return { success: true };
        }
        
        return { success: false, message: 'Sipariş bulunamadı' };
    },
    
    // ========== YARDIMCI FONKSİYONLAR ==========
    
    hashPassword: function(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },
    
    clearAll: function() {
        localStorage.removeItem('kevra_users');
        localStorage.removeItem('kevra_orders');
        localStorage.removeItem('kevra_current_user');
        localStorage.removeItem('kevra_cart');
        localStorage.removeItem('kevra_products');
    }
};

// Global olarak erişilebilir yap
window.KevraDB = KevraDB;

// Eski DB referansı için alias (geriye uyumluluk)
window.DB = KevraDB;