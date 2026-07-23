const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'europe-west1', invoker: 'public' });

const MERCHANT_ID   = '713189';
const MERCHANT_KEY  = '979FtiUwRNdkuDww';
const MERCHANT_SALT = '3nU2uRMt2auih4Ao';
const TEST_MODE     = 0; // Canlı mod - gerçek ödeme alınıyor

const ALLOWED_ORIGINS = ['https://kevra.com.tr', 'https://www.kevra.com.tr'];

function getCorsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin':  allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// ───────────────────────────────────────────
// POST /createPaytrToken
// ───────────────────────────────────────────
exports.createPaytrToken = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { orderData } = req.body;
        if (!orderData) { res.status(400).json({ success: false, reason: 'orderData eksik' }); return; }

        const merchantOid    = 'KVR' + Date.now();
        const userIp         = (req.headers['x-forwarded-for'] || '1.2.3.4').split(',')[0].trim();
        const email          = String(orderData.email || '');
        const noInstallment  = '0';
        const maxInstallment = '0';
        const currency       = 'TL';
        const testMode       = String(TEST_MODE);

        // GÜVENLİK: Tutarı client'in gönderdiği orderData.total'a DEĞİL, Firestore'daki
        // gerçek ürün fiyatlarına göre sunucuda yeniden hesapla. Aksi halde istek
        // tarayıcıdan değiştirilip istenen tutar ödenebilir (fiyat manipülasyonu).
        const cartItems = Array.isArray(orderData.items) ? orderData.items : [];
        if (cartItems.length === 0) { res.status(400).json({ success: false, reason: 'Sepet boş' }); return; }

        let subtotal = 0;
        const verifiedItems = [];
        for (const item of cartItems) {
            const prodSnap = await db.collection('products').doc(String(item.id)).get();
            if (!prodSnap.exists) { res.status(400).json({ success: false, reason: 'Geçersiz ürün: ' + item.id }); return; }
            const prod  = prodSnap.data();
            const qty   = Math.max(1, parseInt(item.quantity, 10) || 1);
            const price = Number(prod.price) || 0;
            subtotal += price * qty;
            verifiedItems.push({
                id: item.id, name: prod.name, price, quantity: qty,
                size: item.size || null, color: item.color || null, image: prod.image || null
            });
        }

        // Kupon indirimi de client'tan gelen tutara değil, sunucudaki sabit
        // kupon listesine göre hesaplanır.
        const COUPONS    = { KEVRA10: 0.10, KEVRA20: 0.20, WELCOME: 0.15, VIP25: 0.25 };
        const couponCode = orderData.couponCode ? String(orderData.couponCode).toUpperCase() : null;
        const discount   = (couponCode && COUPONS[couponCode] != null) ? Math.round(subtotal * COUPONS[couponCode]) : 0;
        const shipping   = 0;
        const total      = subtotal - discount + shipping;

        const paymentAmount = String(Math.round(total * 100)); // kuruş

        // Sepet: fiyatlar TL string ('18.00'), adet integer — PayTR Node.js örneğine göre
        const basket = verifiedItems.map(item => [
            String(item.name),
            Number(item.price).toFixed(2),
            Number(item.quantity)
        ]);
        const userBasket = Buffer.from(JSON.stringify(basket)).toString('base64');

        // PayTR Node.js örneğine göre: hashStr + MERCHANT_SALT mesaj, MERCHANT_KEY key
        const hashStr = MERCHANT_ID + userIp + merchantOid + email +
                        paymentAmount + userBasket + noInstallment +
                        maxInstallment + currency + testMode;
        const paytrToken = crypto
            .createHmac('sha256', MERCHANT_KEY)
            .update(hashStr + MERCHANT_SALT)
            .digest('base64');

        console.log('[PayTR] merchantOid:', merchantOid, 'userIp:', userIp);
        console.log('[PayTR] paymentAmount:', paymentAmount, 'token:', paytrToken);

        // Firestore'a bekleyen sipariş kaydet (fiyatlar sunucuda doğrulanmış değerlerle)
        await db.collection('orders').doc(merchantOid).set({
            ...orderData,
            items:         verifiedItems,
            subtotal,
            discount,
            shipping,
            total,
            id:            merchantOid,
            status:        'Beklemede',
            paymentStatus: 'pending',
            createdAt:     admin.firestore.FieldValue.serverTimestamp(),
        });

        // PayTR API'ye token isteği gönder
        const postData = querystring.stringify({
            merchant_id:      MERCHANT_ID,
            merchant_key:     MERCHANT_KEY,
            merchant_salt:    MERCHANT_SALT,
            user_ip:          userIp,
            merchant_oid:     merchantOid,
            email:            email,
            payment_amount:   paymentAmount,
            paytr_token:      paytrToken,
            user_basket:      userBasket,
            debug_on:         '1',
            no_installment:   noInstallment,
            max_installment:  maxInstallment,
            user_name:        (orderData.firstName || '') + ' ' + (orderData.lastName || ''),
            user_address:     (orderData.address || '') + ', ' + (orderData.district || '') + '/' + (orderData.city || ''),
            user_phone:       String(orderData.phone || ''),
            merchant_ok_url:  'https://kevra.com.tr/odeme-basarili.html',
            merchant_fail_url:'https://kevra.com.tr/odeme-basarisiz.html',
            timeout_limit:    '30',
            currency:         currency,
            test_mode:        testMode,
            lang:             'tr',
        });

        const paytrRes = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'www.paytr.com',
                port:     443,
                path:     '/odeme/api/get-token',
                method:   'POST',
                headers: {
                    'Content-Type':   'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };
            const r = https.request(options, resp => {
                let data = '';
                resp.on('data', c => data += c);
                resp.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
            });
            r.on('error', reject);
            r.write(postData);
            r.end();
        });

        if (paytrRes.status === 'success') {
            res.json({ success: true, token: paytrRes.token, orderId: merchantOid });
        } else {
            await db.collection('orders').doc(merchantOid).delete();
            res.json({ success: false, reason: paytrRes.reason || 'PayTR hatası' });
        }

    } catch (e) {
        console.error('createPaytrToken error:', e);
        res.status(500).json({ success: false, reason: e.message });
    }
});

// ───────────────────────────────────────────
// POST /paytrCallback
// PayTR ödeme sonucunu bildirir
// ───────────────────────────────────────────
exports.paytrCallback = onRequest({ invoker: 'public' }, async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { merchant_oid, status, total_amount, hash } = req.body;

        // PayTR Node.js örneğine göre: merchant_oid + salt + status + total_amount, key=MERCHANT_KEY
        const hashStr      = merchant_oid + MERCHANT_SALT + status + total_amount;
        const expectedHash = crypto
            .createHmac('sha256', MERCHANT_KEY)
            .update(hashStr)
            .digest('base64');

        if (hash !== expectedHash) {
            console.error('paytrCallback: geçersiz hash', { merchant_oid });
            res.status(400).send('PAYTR notification failed: bad hash');
            return;
        }

        if (status === 'success') {
            await db.collection('orders').doc(merchant_oid).update({
                status:        'Hazırlanıyor',
                paymentStatus: 'paid',
                paidAt:        admin.firestore.FieldValue.serverTimestamp(),
                paidAmount:    parseInt(total_amount) / 100,
            });
        } else {
            await db.collection('orders').doc(merchant_oid).update({
                status:        'İptal Edildi',
                paymentStatus: 'failed',
            });
        }

        res.send('OK');
    } catch (e) {
        console.error('paytrCallback error:', e);
        res.status(500).send('ERROR');
    }
});

// ───────────────────────────────────────────
// Yardımcı: js/kevra-db.js _hash() ile birebir aynı algoritma.
// Zaten kayıtlı kullanıcıların şifreleri bu formatta saklı olduğu için
// uyumluluğu bozmamak adına aynı yöntem korunuyor.
// ───────────────────────────────────────────
function legacyHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
    return hash.toString();
}

// ───────────────────────────────────────────
// POST /registerCustomer
// GÜVENLİK: E-posta tekillik kontrolü ve şifre saklama sunucuda yapılır.
// Eskiden client tüm 'users' koleksiyonunu (şifre hash'leri dahil) indirip
// tarayıcıda karşılaştırıyordu — artık hiçbir kullanıcı verisi client'a
// dökülmüyor.
// ───────────────────────────────────────────
exports.registerCustomer = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { firstName, lastName, email, password, phone, address, city, zipCode } = req.body || {};
        if (!email || !password || String(password).length < 6) {
            res.json({ success: false, message: 'Geçersiz e-posta veya şifre (en az 6 karakter)' });
            return;
        }

        const existing = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!existing.empty) {
            res.json({ success: false, message: 'Bu e-posta zaten kayıtlı' });
            return;
        }

        const newUser = {
            id:           'user_' + Date.now(),
            firstName:    firstName || '',
            lastName:     lastName  || '',
            email,
            password:     legacyHash(password),
            phone:        phone   || '',
            address:      address || '',
            city:         city    || '',
            zipCode:      zipCode || '',
            addresses:    [],
            registerDate: new Date().toISOString(),
            active:       true
        };
        await db.collection('users').doc(newUser.id).set(newUser);

        const session = { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, phone: newUser.phone };
        res.json({ success: true, user: session });
    } catch (e) {
        console.error('registerCustomer error:', e);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ───────────────────────────────────────────
// POST /loginCustomer
// GÜVENLİK: Şifre karşılaştırması sunucuda yapılır, başka kullanıcıların
// verisi client'a hiç gönderilmez.
// ───────────────────────────────────────────
exports.loginCustomer = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { email, password } = req.body || {};
        if (!email || !password) { res.json({ success: false, message: 'E-posta ve şifre gerekli' }); return; }

        const snap = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snap.empty) { res.json({ success: false, message: 'Kullanıcı bulunamadı' }); return; }

        const user = snap.docs[0].data();
        if (user.password !== legacyHash(password)) {
            res.json({ success: false, message: 'Şifre hatalı' });
            return;
        }

        const session = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, loginTime: new Date().toISOString() };
        res.json({ success: true, user: session });
    } catch (e) {
        console.error('loginCustomer error:', e);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ───────────────────────────────────────────
// POST /getMyOrders
// GÜVENLİK: Sadece verilen userId'ye ait siparişleri döner — Firestore
// kuralları artık 'orders' koleksiyonunun tamamını client'ın listelemesine
// izin vermiyor, bu uç nokta Admin SDK ile dar kapsamlı sorgu yapar.
// ───────────────────────────────────────────
exports.getMyOrders = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { userId } = req.body || {};
        if (!userId) { res.json({ success: true, orders: [] }); return; }

        const snap = await db.collection('orders').where('userId', '==', userId).get();
        const orders = snap.docs.map(d => {
            const data = d.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
            if (data.paidAt && typeof data.paidAt.toDate === 'function')       data.paidAt    = data.paidAt.toDate().toISOString();
            return data;
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.json({ success: true, orders });
    } catch (e) {
        console.error('getMyOrders error:', e);
        res.status(500).json({ success: false, orders: [] });
    }
});

// ───────────────────────────────────────────
// POST /getMyReturns
// GÜVENLİK: Sadece verilen userId'ye ait iade taleplerini döner.
// ───────────────────────────────────────────
exports.getMyReturns = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { userId } = req.body || {};
        if (!userId) { res.json({ success: true, returns: [] }); return; }

        const snap = await db.collection('returns').where('userId', '==', userId).get();
        const returns = snap.docs.map(d => {
            const data = d.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
            return data;
        });
        res.json({ success: true, returns });
    } catch (e) {
        console.error('getMyReturns error:', e);
        res.status(500).json({ success: false, returns: [] });
    }
});
