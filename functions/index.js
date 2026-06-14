const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'europe-west1' });

const MERCHANT_ID   = '713189';
const MERCHANT_KEY  = '979FtiUwRNdkuDww';
const MERCHANT_SALT = '3nU2uRMt2auih4Ao';
const TEST_MODE     = 1; // Canlıya geçince 0 yap

const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  'https://kevra.com.tr',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// ───────────────────────────────────────────
// POST /createPaytrToken
// Sipariş verilerini alır, PayTR token üretir
// ───────────────────────────────────────────
exports.createPaytrToken = onRequest(async (req, res) => {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.set(k, v));

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { orderData } = req.body;
        if (!orderData) { res.status(400).json({ success: false, reason: 'orderData eksik' }); return; }

        const merchantOid   = 'ORD' + Date.now();
        const userIp        = (req.headers['x-forwarded-for'] || '1.2.3.4').split(',')[0].trim();
        const email         = orderData.email;
        const paymentAmount = Math.round(orderData.total * 100); // kuruş

        // Sepet: [[ürün adı, birim fiyat (kuruş str), adet str], ...]
        const basket = orderData.items.map(item => [
            item.name,
            String(Math.round(item.price * 100)),
            String(item.quantity)
        ]);
        const userBasket = Buffer.from(JSON.stringify(basket)).toString('base64');

        const noInstallment  = 0;
        const maxInstallment = 0;
        const currency       = 'TL';

        // HMAC-SHA256 token
        const hashStr = MERCHANT_ID + userIp + merchantOid + email +
                        paymentAmount + userBasket + noInstallment +
                        maxInstallment + currency + TEST_MODE;
        const paytrToken = crypto
            .createHmac('sha256', MERCHANT_KEY + MERCHANT_SALT)
            .update(hashStr)
            .digest('base64');

        // Firestore'a bekleyen sipariş kaydet
        await db.collection('orders').doc(merchantOid).set({
            ...orderData,
            id:            merchantOid,
            status:        'Beklemede',
            paymentStatus: 'pending',
            createdAt:     admin.firestore.FieldValue.serverTimestamp(),
        });

        // PayTR API'ye token isteği gönder
        const postData = querystring.stringify({
            merchant_id:      MERCHANT_ID,
            user_ip:          userIp,
            merchant_oid:     merchantOid,
            email:            email,
            payment_amount:   paymentAmount,
            paytr_token:      paytrToken,
            user_basket:      userBasket,
            debug_on:         1,
            no_installment:   noInstallment,
            max_installment:  maxInstallment,
            user_name:        orderData.firstName + ' ' + orderData.lastName,
            user_address:     orderData.address + ', ' + orderData.district + '/' + orderData.city,
            user_phone:       orderData.phone,
            merchant_ok_url:  'https://kevra.com.tr/odeme-basarili.html',
            merchant_fail_url:'https://kevra.com.tr/odeme-basarisiz.html',
            timeout_limit:    30,
            currency:         currency,
            test_mode:        TEST_MODE,
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
            const r = https.request(options, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
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
exports.paytrCallback = onRequest(async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    try {
        const { merchant_oid, status, total_amount, hash } = req.body;

        // Hash doğrula
        const hashStr      = MERCHANT_ID + merchant_oid + total_amount + status;
        const expectedHash = crypto
            .createHmac('sha256', MERCHANT_KEY + MERCHANT_SALT)
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

        res.send('OK'); // PayTR "OK" bekliyor
    } catch (e) {
        console.error('paytrCallback error:', e);
        res.status(500).send('ERROR');
    }
});
