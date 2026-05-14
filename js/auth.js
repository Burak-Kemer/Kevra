// KEVRA Authentication System - Complete Version
window.KevraAuth = {
  
  // ========== KULLANICI YÖNETİMİ ==========
  
  getUsers() {
    return KevraStorage.get("kevra_users", []);
  },

  saveUsers(users) {
    KevraStorage.set("kevra_users", users);
  },

  // Kayıt ol
  register(userData) {
    const users = this.getUsers();
    
    // Email kontrolü
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: "Bu e-posta adresi zaten kayıtlı" };
    }

    // Yeni kullanıcı
    const newUser = {
      id: 'user_' + Date.now(),
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
      addresses: [],
      orders: []
    };

    users.push(newUser);
    this.saveUsers(users);

    // Otomatik giriş
    localStorage.setItem("kevra_current_user", JSON.stringify(newUser));
    
    return { success: true, user: newUser };
  },

  // Giriş yap
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, message: "E-posta veya şifre hatalı" };
    }

    localStorage.setItem("kevra_current_user", JSON.stringify(user));
    return { success: true, user };
  },

  // Çıkış yap
  logout() {
    // Dropdown'ı kapat
    const menu = document.getElementById('userDropdownMenu');
    const dropdown = document.getElementById('userDropdown');
    if (menu) menu.classList.remove('show');
    if (dropdown) dropdown.classList.remove('show');

    localStorage.removeItem("kevra_current_user");
    localStorage.removeItem("kevra_cart");
    window.location.href = 'index.html';
  },

  // Mevcut kullanıcı
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("kevra_current_user"));
    } catch {
      return null;
    }
  },

  // Giriş kontrolü
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // Giriş gerektiren sayfa
  requireAuth() {
    if (!this.isLoggedIn()) {
      const currentPage = window.location.pathname.split('/').pop();
      window.location.href = 'giris.html?redirect=' + encodeURIComponent(currentPage);
      return false;
    }
    return true;
  },

  // Kullanıcı bilgilerini güncelle
  updateUser(updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    // Güncelle
    users[userIndex] = { ...users[userIndex], ...updates };
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true, user: users[userIndex] };
  },

  // Şifre değiştir
  changePassword(currentPassword, newPassword) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };
    
    if (users[userIndex].password !== currentPassword) {
      return { success: false, message: "Mevcut şifre yanlış" };
    }

    users[userIndex].password = newPassword;
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true };
  },

  // ========== ADRES YÖNETİMİ ==========

  addAddress(address) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    const newAddress = {
      id: 'addr_' + Date.now(),
      ...address,
      createdAt: new Date().toISOString()
    };

    if (!users[userIndex].addresses) users[userIndex].addresses = [];
    users[userIndex].addresses.push(newAddress);
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true, address: newAddress };
  },

  updateAddress(addressId, updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    const addressIndex = users[userIndex].addresses.findIndex(a => a.id === addressId);
    if (addressIndex === -1) return { success: false, message: "Adres bulunamadı" };

    users[userIndex].addresses[addressIndex] = {
      ...users[userIndex].addresses[addressIndex],
      ...updates
    };
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true };
  },

  deleteAddress(addressId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    users[userIndex].addresses = users[userIndex].addresses.filter(a => a.id !== addressId);
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true };
  },

  getAddresses() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    return currentUser.addresses || [];
  },

  // ========== SİPARİŞ YÖNETİMİ ==========

  createOrder(orderData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    const newOrder = {
      id: 'ORD-' + Date.now(),
      ...orderData,
      status: 'pending',
      statusText: 'Beklemede',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!users[userIndex].orders) users[userIndex].orders = [];
    users[userIndex].orders.unshift(newOrder);
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true, order: newOrder };
  },

  getOrders() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    return currentUser.orders || [];
  },

  getOrder(orderId) {
    const orders = this.getOrders();
    return orders.find(o => o.id === orderId);
  },

  updateOrderStatus(orderId, status, statusText) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: "Oturum açık değil" };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return { success: false, message: "Kullanıcı bulunamadı" };

    const orderIndex = users[userIndex].orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return { success: false, message: "Sipariş bulunamadı" };

    users[userIndex].orders[orderIndex].status = status;
    users[userIndex].orders[orderIndex].statusText = statusText;
    users[userIndex].orders[orderIndex].updatedAt = new Date().toISOString();
    
    this.saveUsers(users);
    localStorage.setItem("kevra_current_user", JSON.stringify(users[userIndex]));
    
    return { success: true };
  },

  // Admin: Tüm siparişleri getir (admin panel için)
  getAllOrders() {
    const users = this.getUsers();
    let allOrders = [];
    users.forEach(user => {
      if (user.orders) {
        user.orders.forEach(order => {
          allOrders.push({
            ...order,
            customerName: user.firstName + ' ' + user.lastName,
            customerEmail: user.email,
            customerPhone: user.phone
          });
        });
      }
    });
    return allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Admin: Sipariş durumu güncelle
  adminUpdateOrderStatus(orderId, status, statusText) {
    const users = this.getUsers();
    
    for (let user of users) {
      if (user.orders) {
        const orderIndex = user.orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          user.orders[orderIndex].status = status;
          user.orders[orderIndex].statusText = statusText;
          user.orders[orderIndex].updatedAt = new Date().toISOString();
          
          this.saveUsers(users);
          
          // Eğer giriş yapmış kullanıcı kendi siparişiyse session'ı da güncelle
          const currentUser = this.getCurrentUser();
          if (currentUser && currentUser.id === user.id) {
            localStorage.setItem("kevra_current_user", JSON.stringify(user));
          }
          
          return { success: true };
        }
      }
    }
    
    return { success: false, message: "Sipariş bulunamadı" };
  }
};

// ========== HEADER KULLANICI MENÜSÜ ==========

function updateUserMenu() {
    const container = document.getElementById('userMenuContainer');
    if (!container) return;

    const currentUser = KevraAuth.getCurrentUser();

    if (currentUser) {
        // Giriş yapılmış - Premium Dropdown
        const firstName = currentUser.firstName || 'Kullanıcı';
        const lastName = currentUser.lastName || '';
        const email = currentUser.email || '';
        const avatarText = (firstName.charAt(0) + (lastName ? lastName.charAt(0) : '')).toUpperCase();

        container.innerHTML = `
            <div class="user-dropdown" id="userDropdown">
                <button class="user-menu-btn" onclick="toggleUserDropdown(event)">
                    <div class="user-avatar">${avatarText}</div>
                    <span class="user-name">${firstName}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="user-dropdown-menu" id="userDropdownMenu">
                    <div class="dropdown-user-info">
                        <div class="dropdown-avatar">${avatarText}</div>
                        <div class="dropdown-user-details">
                            <div class="dropdown-name">${firstName} ${lastName}</div>
                            <div class="dropdown-email">${email}</div>
                        </div>
                    </div>
                    <a href="profil.html" class="dropdown-item">
                        <div class="dropdown-item-icon">👤</div>
                        <span>Profilim</span>
                    </a>
                    <a href="profil.html#siparisler" class="dropdown-item">
                        <div class="dropdown-item-icon">📦</div>
                        <span>Siparişlerim</span>
                    </a>
                    <a href="sepetim.html" class="dropdown-item">
                        <div class="dropdown-item-icon">🛒</div>
                        <span>Sepetim</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout" onclick="handleLogout()">
                        <div class="dropdown-item-icon">🚪</div>
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </div>
        `;
    } else {
        // Giriş yapılmamış
        container.innerHTML = `
            <a href="giris.html" class="header-link">Giriş Yap</a>
        `;
    }
}

// Dropdown Aç/Kapa
function toggleUserDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    const menu = document.getElementById('userDropdownMenu');
    
    if (dropdown && menu) {
        dropdown.classList.toggle('show');
        menu.classList.toggle('show');
    }
}

// Dropdown dışına tıklayınca kapat
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const menu = document.getElementById('userDropdownMenu');
    
    if (dropdown && menu && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
        menu.classList.remove('show');
    }
});

// Çıkış Yap
function handleLogout() {
    KevraAuth.logout();
    window.location.href = 'index.html';
}