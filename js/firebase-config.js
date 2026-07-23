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
let _db   = null;
let _auth = null;
let firebaseReady = false;

// Firestore güvenlik kuralları "request.auth != null" istiyor (bkz.
// firestore.rules). Müşteriler kendi e-posta/şifresiyle Firebase Auth'a
// hiç girmiyor (KevraDB kendi hash'li şifre kontrolünü yapıyor) — bu
// yüzden her sayfa yüklendiğinde otomatik, görünmez bir anonim oturum
// açılıyor. Bu, Firestore'un "giriş yapılmış" saymasını sağlıyor.
// authReady: Firestore'a ilk istekten önce beklenmesi gereken promise.
let _resolveAuthReady;
const authReady = new Promise(resolve => { _resolveAuthReady = resolve; });

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('[KevraDB] Firebase SDK yüklenmedi — localStorage moduna geçiliyor');
            _resolveAuthReady();
            return false;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        _db   = firebase.firestore();
        _auth = firebase.auth();
        firebaseReady = true;
        console.log('[KevraDB] ✅ Firebase bağlantısı kuruldu');

        // onAuthStateChanged: SDK'nin (varsa) kalıcı oturumu geri yükleyip
        // yüklemediğini kesin olarak bildirdiği ilk an. currentUser'ı
        // senkron okumak güvenilir değil — henüz geri yüklenmemiş olabilir.
        const unsubscribe = _auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) {
                _resolveAuthReady();
            } else {
                _auth.signInAnonymously()
                    .then(() => console.log('[KevraDB] ✅ Anonim oturum açıldı'))
                    .catch(e => console.warn('[KevraDB] Anonim oturum hatası:', e.message))
                    .finally(() => _resolveAuthReady());
            }
        }, e => {
            console.warn('[KevraDB] Auth durumu hatası:', e.message);
            _resolveAuthReady();
        });
        return true;
    } catch (e) {
        console.warn('[KevraDB] Firebase hatası, localStorage modunda devam:', e.message);
        _resolveAuthReady();
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

window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.ADMIN_CONFIG    = ADMIN_CONFIG;

// Getter kullan — initFirebase() sonrası _db/_auth güncellenir,
// window.KevraFirebase.db her erişimde güncel değeri döner
window.KevraFirebase = {
    get db()   { return _db; },
    get auth() { return _auth; },
    ready: () => firebaseReady,
    init:  initFirebase,
    authReady,
    COLLECTIONS
};

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', initFirebase);