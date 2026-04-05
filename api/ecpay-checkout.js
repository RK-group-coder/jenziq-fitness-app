import crypto from 'crypto';

const ECPAY_CONFIG = {
    MerchantID: '2000132',
    HashKey: '5294y06JbISpM5x9',
    HashIV: 'v77hoKGq4kWxNNIS',
    ActionURL: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
};

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

export default async function handler(req, res) {
    // 解決 CORS 問題
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;
        console.log('ECPay Checkout Request:', body);
        
        if (!body.price || !body.months) {
            return res.status(400).json({ error: 'Missing price or months' });
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
        
        // 注意：ReturnURL 必須要是您的 Vercel 網址，暫時先留白讓後端處理
        // 但通常測試時可以用一個假的，或者傳入目前 Host
        const host = req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const returnURL = `${protocol}://${host}/api/ecpay-return`;

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

        return res.status(200).json({ 
            action: ECPAY_CONFIG.ActionURL, 
            fields: payload 
        });
    } catch (error) {
        console.error('ECPay Checkout Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
