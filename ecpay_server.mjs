import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env.local
if (fs.existsSync('.env.local')) {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const ECPAY_CONFIG = {
    MerchantID: '2000132',
    HashKey: '5294y06JbISpM5x9',
    HashIV: 'v77hoKGq4kWxNNIS',
    ActionURL: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

function log(msg) {
    const line = new Date().toISOString() + ' ' + msg + '\n';
    process.stdout.write(line);
    fs.appendFileSync('ecpay_server_log.txt', line);
}

function generateCheckMacValue(data) {
    const keys = Object.keys(data).filter(k => k !== 'CheckMacValue').sort();
    let raw = `HashKey=${ECPAY_CONFIG.HashKey}`;
    for (const k of keys) raw += `&${k}=${data[k]}`;
    raw += `&HashIV=${ECPAY_CONFIG.HashIV}`;

    let encoded = encodeURIComponent(raw).replace(/%20/g, '+');
    encoded = encoded
        .replace(/%2[Dd]/g, '-').replace(/%5[Ff]/g, '_')
        .replace(/%2[Ee]/g, '.').replace(/%21/g, '!')
        .replace(/%2[Aa]/g, '*').replace(/%28/g, '(').replace(/%29/g, ')');
    encoded = encoded.toLowerCase();
    const hash = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
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
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    // --- ECPay Handler ---
    if (req.method === 'POST' && req.url === '/api/ecpay-checkout') {
        const body = await parseBody(req);
        log('ECPay Request: ' + JSON.stringify(body));
        
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

        if (parseInt(body.months) > 1) {
            payload.PeriodAmount = String(body.price);
            payload.PeriodType = 'M';
            payload.Frequency = '1';
            payload.ExecTimes = String(body.months);
            payload.PeriodReturnURL = returnURL;
        }

        payload.CheckMacValue = generateCheckMacValue(payload);
        res.writeHead(200);
        res.end(JSON.stringify({ action: ECPAY_CONFIG.ActionURL, fields: payload }));
        return;
    }

    // --- AI Chat/Vision Proxy Handler ---
    if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/api/chat.js')) {
        const body = await parseBody(req);
        log('AI Request: ' + body.model);

        if (!OPENAI_API_KEY) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'OpenAI API Key is missing in local environment.' }));
            return;
        }

        try {
            const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify(body),
            });

            const data = await apiRes.json();
            res.writeHead(apiRes.status);
            res.end(JSON.stringify(data));
        } catch (error) {
            log('Proxy Error: ' + error.message);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Proxy error', details: error.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
});

fs.writeFileSync('ecpay_server_log.txt', '=== Integrated JZ-Dev Server Log ===\n');

server.listen(5174, () => {
    log('JZ Integrated API server (ECPay + AI) running at http://localhost:5174');
    log('Proxying /api/chat to OpenAI...');
});

