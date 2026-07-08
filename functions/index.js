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

        const merchantOid    = 'ORD' + Date.now();
        const userIp         = (req.headers['x-forwarded-for'] || '1.2.3.4').split(',')[0].trim();
        const email          = String(orderData.email || '');
        const paymentAmount  = String(Math.round(Number(orderData.total) * 100)); // kuruş
        const noInstallment  = '0';
        const maxInstallment = '0';
        const currency       = 'TL';
        const testMode       = String(TEST_MODE);

        // Sepet: fiyatlar TL string ('18.00'), adet integer — PayTR Node.js örneğine göre
        const basket = orderData.items.map(item => [
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
