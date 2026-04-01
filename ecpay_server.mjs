/**
 * ECPay Local API Server (for development only)
 * Run with: node ecpay_server.mjs
 */
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';

const ECPAY_CONFIG = {
    MerchantID: '2000132',
    HashKey: '5294y06JbISpM5x9',
    HashIV: 'v77hoKGq4kWxNNIS',
    ActionURL: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

function log(msg) {
    const line = new Date().toISOString() + ' ' + msg + '\n';
    process.stdout.write(line);
    fs.appendFileSync('ecpay_server_log.txt', line);
}

function generateCheckMacValue(data) {
    // Revert to standard ASCII sort (A-Z) which worked in Turn 12
    const keys = Object.keys(data).filter(k => k !== 'CheckMacValue').sort();

    let raw = `HashKey=${ECPAY_CONFIG.HashKey}`;
    for (const k of keys) raw += `&${k}=${data[k]}`;
    raw += `&HashIV=${ECPAY_CONFIG.HashIV}`;

    // PHP urlencode equivalent
    let encoded = encodeURIComponent(raw).replace(/%20/g, '+');
    encoded = encoded
        .replace(/%2[Dd]/g, '-').replace(/%5[Ff]/g, '_')
        .replace(/%2[Ee]/g, '.').replace(/%21/g, '!')
        .replace(/%2[Aa]/g, '*').replace(/%28/g, '(').replace(/%29/g, ')');
    encoded = encoded.toLowerCase();
    
    const hash = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
    
    log('RAW: ' + raw);
    log('ENC: ' + encoded);
    log('HASH: ' + hash);
    
    return hash;
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); } 
            catch { resolve({}); }
        });
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    if (req.method === 'POST' && req.url === '/api/ecpay-checkout') {
        const body = await parseBody(req);
        log('Received: ' + JSON.stringify(body));
        
        if (!body.price || !body.months) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing price or months' }));
            return;
        }

        const now = new Date();
        const tradeDate = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('/') + ' ' + [
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0')
        ].join(':');

        const tradeNo = `JZ${Date.now()}`.substring(0, 20);
        // Use a fixed non-localhost ReturnURL - ECPay Stage rejects localhost URLs
        const returnURL = 'https://your-domain.com/api/ecpay-return';

        const payload = {
            MerchantID:        ECPAY_CONFIG.MerchantID,
            MerchantTradeNo:   tradeNo,
            MerchantTradeDate: tradeDate,
            PaymentType:       'aio',
            TotalAmount:       String(body.price),
            TradeDesc:         'MembershipPlan',
            ItemName:          'MembershipPlan',
            ReturnURL:         returnURL,
            ChoosePayment:     'Credit',
            EncryptType:       '1'
        };

        // Only add periodic parameters if months > 1
        if (parseInt(body.months) > 1) {
            payload.PeriodAmount = String(body.price);
            payload.PeriodType = 'M';
            payload.Frequency = '1';
            payload.ExecTimes = String(body.months);
            payload.PeriodReturnURL = returnURL;
        }

        payload.CheckMacValue = generateCheckMacValue(payload);

        log('All fields: ' + JSON.stringify(payload));

        res.writeHead(200);
        res.end(JSON.stringify({
            action: ECPAY_CONFIG.ActionURL,
            fields: payload
        }));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

// Clear log file on start
fs.writeFileSync('ecpay_server_log.txt', '=== ECPay Server Log ===\n');

server.listen(5174, () => {
    log('ECPay API server running at http://localhost:5174');
});
