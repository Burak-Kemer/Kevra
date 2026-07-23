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
        const verified = await verifyCartAndTotals(orderData);
        if (verified.error) { res.status(400).json({ success: false, reason: verified.error }); return; }
        const { verifiedItems, subtotal, discount, shipping, total, couponCode } = verified;

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
            couponCode,
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
        const { firstName, lastName, password, phone, address, city, zipCode } = req.body || {};
        const email = String(req.body && req.body.email || '').trim().toLowerCase();
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
        const rawEmail = String(req.body && req.body.email || '').trim();
        const { password } = req.body || {};
        if (!rawEmail || !password) { res.json({ success: false, message: 'E-posta ve şifre gerekli' }); return; }

        const emailNorm = rawEmail.toLowerCase();
        let snap = await db.collection('users').where('email', '==', emailNorm).limit(1).get();
        // Geriye dönük uyumluluk: e-posta normalize edilmeden ÖNCE kaydolmuş
        // hesaplar orijinal büyük/küçük harfle saklanmış olabilir.
        if (snap.empty && emailNorm !== rawEmail) {
            snap = await db.collection('users').where('email', '==', rawEmail).limit(1).get();
        }
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

// ───────────────────────────────────────────
// Yardımcı: sepetteki ürünleri Firestore'daki gerçek fiyatlarla doğrular
// ve sunucu tarafında toplamları hesaplar (createPaytrToken ile aynı mantık).
// ───────────────────────────────────────────
async function verifyCartAndTotals(orderData) {
    const cartItems = Array.isArray(orderData.items) ? orderData.items : [];
    if (cartItems.length === 0) return { error: 'Sepet boş' };

    let subtotal = 0;
    const verifiedItems = [];
    for (const item of cartItems) {
        const prodSnap = await db.collection('products').doc(String(item.id)).get();
        if (!prodSnap.exists) return { error: 'Geçersiz ürün: ' + item.id };
        const prod  = prodSnap.data();
        const qty   = Math.max(1, parseInt(item.quantity, 10) || 1);
        const price = Number(prod.price) || 0;
        subtotal += price * qty;
        verifiedItems.push({
            id: item.id, name: prod.name, price, quantity: qty,
            size: item.size || null, color: item.color || null, image: prod.image || null
        });
    }

    const COUPONS    = { KEVRA10: 0.10, KEVRA20: 0.20, WELCOME: 0.15, VIP25: 0.25 };
    const couponCode = orderData.couponCode ? String(orderData.couponCode).toUpperCase() : null;
    const discount   = (couponCode && COUPONS[couponCode] != null) ? Math.round(subtotal * COUPONS[couponCode]) : 0;
    const shipping   = 0;
    const total      = subtotal - discount + shipping;

    return { verifiedItems, subtotal, discount, shipping, total, couponCode };
}

// ───────────────────────────────────────────
// POST /createOrder
// Havale / kapıda ödeme siparişleri artık doğrudan client'tan Firestore'a
// yazılmıyor — Firestore kuralları 'orders' koleksiyonuna client yazmasını
// tamamen kapattı (aksi halde herkes sahte "ödendi" siparişi oluşturabilir
// veya başkasının siparişini değiştirebilirdi). Fiyatlar da createPaytrToken
// ile aynı şekilde sunucuda doğrulanır.
// ───────────────────────────────────────────
exports.createOrder = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const orderData = req.body && req.body.orderData;
        if (!orderData) { res.json({ success: false, message: 'orderData eksik' }); return; }

        const verified = await verifyCartAndTotals(orderData);
        if (verified.error) { res.json({ success: false, message: verified.error }); return; }

        const newOrder = {
            id:             'KVR' + Date.now(),
            userId:         orderData.userId || 'guest',
            customer:       {
                firstName: orderData.firstName || '', lastName: orderData.lastName || '',
                email: orderData.email || '', phone: orderData.phone || '',
                address: orderData.address || '', city: orderData.city || '', zipCode: orderData.zipCode || ''
            },
            items:          verified.verifiedItems,
            subtotal:       verified.subtotal,
            shipping:       verified.shipping,
            discount:       verified.discount,
            total:          verified.total,
            paymentMethod:  orderData.paymentMethod || '',
            couponCode:     verified.couponCode,
            status:         'Beklemede',
            shippingStatus: 'Hazırlanıyor',
            createdAt:      new Date().toISOString(),
            notes:          orderData.notes || ''
        };

        await db.collection('orders').doc(newOrder.id).set(newOrder);
        res.json({ success: true, order: newOrder });
    } catch (e) {
        console.error('createOrder error:', e);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ───────────────────────────────────────────
// POST /cancelMyOrder
// GÜVENLİK: Siparişin gerçekten verilen userId'ye ait olduğunu doğrular —
// aksi halde sipariş takibi herkese açık olduğu için (meşru bir özellik)
// bir sipariş numarasını bilen herkes başkasının siparişini iptal edebilirdi.
// ───────────────────────────────────────────
exports.cancelMyOrder = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { userId, orderId } = req.body || {};
        if (!userId || !orderId) { res.json({ success: false, message: 'Eksik bilgi' }); return; }

        const ref  = db.collection('orders').doc(String(orderId));
        const snap = await ref.get();
        if (!snap.exists) { res.json({ success: false, message: 'Sipariş bulunamadı' }); return; }

        const order = snap.data();
        if (order.userId !== userId) { res.json({ success: false, message: 'Bu sipariş size ait değil' }); return; }

        const nonCancellable = ['Kargoda', 'Teslim Edildi', 'İptal Edildi', 'shipped', 'delivered', 'cancelled'];
        if (nonCancellable.includes(order.status)) {
            res.json({ success: false, message: 'Bu sipariş artık iptal edilemez' });
            return;
        }

        await ref.update({ status: 'İptal Edildi', shippingStatus: 'İptal Edildi' });
        res.json({ success: true });
    } catch (e) {
        console.error('cancelMyOrder error:', e);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ───────────────────────────────────────────
// POST /createReturnRequest
// GÜVENLİK: İade talebinin, verilen userId'ye ait ve gerçekten var olan bir
// siparişe karşı açıldığını doğrular.
// ───────────────────────────────────────────
exports.createReturnRequest = onRequest({ invoker: 'public' }, async (req, res) => {
    const corsHeaders = getCorsHeaders(req.headers.origin || '');
    Object.entries(corsHeaders).forEach(([k, v]) => res.set(k, v));
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { userId, userEmail, userName, orderId, reason, reasonText, method, methodText, description } = req.body || {};
        if (!userId || !orderId || !reason || !method) {
            res.json({ success: false, message: 'Eksik bilgi' });
            return;
        }

        const orderSnap = await db.collection('orders').doc(String(orderId)).get();
        if (!orderSnap.exists || orderSnap.data().userId !== userId) {
            res.json({ success: false, message: 'Sipariş bulunamadı' });
            return;
        }

        const newReturn = {
            id:          'RET-' + Date.now(),
            userId, orderId: String(orderId),
            userEmail:   userEmail   || '',
            userName:    userName    || '',
            reason:      reason      || '',
            reasonText:  reasonText  || '',
            method:      method      || '',
            methodText:  methodText  || '',
            description: description || '',
            status:      'pending',
            statusText:  'İnceleniyor',
            createdAt:   new Date().toISOString()
        };
        await db.collection('returns').doc(newReturn.id).set(newReturn);
        res.json({ success: true, return: newReturn });
    } catch (e) {
        console.error('createReturnRequest error:', e);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});
