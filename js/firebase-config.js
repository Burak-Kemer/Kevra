// ============================================================
//  KEVRA – Firebase Yapılandırması
//  Kurulum: https://console.firebase.google.com
//  1. Yeni proje oluştur → "Kevra" (veya istediğin ad)
//  2. Proje Ayarları → Genel → "Uygulamanızı kaydedin" (</> Web)
//  3. Aşağıdaki değerleri kendi Firebase projenle değiştir
// ============================================================

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBaHPFjhqrtkC4nzAWn8ViPlBxO5E8Fyic",
    authDomain:        "kevra-88a60.firebaseapp.com",
    projectId:         "kevra-88a60",
    storageBucket:     "kevra-88a60.firebasestorage.app",
    messagingSenderId: "625975713875",
    appId:             "1:625975713875:web:c8f6ffaf58c7d5e7eca6a6",
    measurementId:     "G-QSZH5BZ9YJ"
};

// ============================================================
//  Admin şifresi (Firebase Auth kullanmıyorsan bu kısım geçerli)
//  Admin e-posta: Firebase Console → Authentication → Users'dan ekle
// ============================================================
const ADMIN_CONFIG = {
    email:    "admin@kevra.com.tr",
    password: "Kevra2026!"   // Güçlü bir şifreyle değiştir
};

// ============================================================
//  Firebase başlatma
// ============================================================
let db = null;
let auth = null;
let firebaseReady = false;

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('[KevraDB] Firebase SDK yüklenmedi — localStorage moduna geçiliyor');
            return false;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db   = firebase.firestore();
        auth = firebase.auth();
        firebaseReady = true;
        console.log('[KevraDB] ✅ Firebase bağlantısı kuruldu');
        return true;
    } catch (e) {
        console.warn('[KevraDB] Firebase hatası, localStorage modunda devam:', e.message);
        return false;
    }
}

// ============================================================
//  Firestore koleksiyonları
// ============================================================
const COLLECTIONS = {
    products: 'products',
    orders:   'orders',
    users:    'users',
    coupons:  'coupons'
};

window.FIREBASE_CONFIG  = FIREBASE_CONFIG;
window.ADMIN_CONFIG     = ADMIN_CONFIG;
window.KevraFirebase    = { db, auth, ready: () => firebaseReady, init: initFirebase, COLLECTIONS };

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', initFirebase);