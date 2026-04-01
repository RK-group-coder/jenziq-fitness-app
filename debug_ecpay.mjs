import crypto from 'crypto';
import fs from 'fs';

const HASHKEY = '5294y06JbYqUOuvM';
const HASHIV  = 'v77hoKGq4kWxRGZt';

const params = {
    MerchantID: '2000132',
    MerchantTradeNo: 'JZ1743447407123',
    MerchantTradeDate: '2026/04/01 01:56:47',
    PaymentType: 'aio',
    TotalAmount: '1600',
    TradeDesc: 'MembershipPlan',
    ItemName: 'MembershipPlan',
    ReturnURL: 'https://your-domain.com/api/ecpay-return',
    ChoosePayment: 'Credit',
    EncryptType: '1',
    PeriodAmount: '1600',
    PeriodType: 'M',
    Frequency: '1',
    ExecTimes: '12',
    PeriodReturnURL: 'https://your-domain.com/api/ecpay-return'
};

function buildRaw(p) {
    const keys = Object.keys(p).filter(k => k !== 'CheckMacValue').sort();
    let raw = `HashKey=${HASHKEY}`;
    for (const k of keys) raw += `&${k}=${p[k]}`;
    raw += `&HashIV=${HASHIV}`;
    return raw;
}

const raw = buildRaw(params);

// NEW METHOD: PHP urlencode() equivalent (encodeURIComponent + %20->+) then str_replace
let newMethod = encodeURIComponent(raw).replace(/%20/g, '+');
newMethod = newMethod
    .replace(/%2[Dd]/g, '-')
    .replace(/%5[Ff]/g, '_')
    .replace(/%2[Ee]/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2[Aa]/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
newMethod = newMethod.toLowerCase();
const newHash = crypto.createHash('sha256').update(newMethod).digest('hex').toUpperCase();

// OLD METHOD A (encodeURIComponent → lowercase only)
const methodA = encodeURIComponent(raw).toLowerCase();
const hashA = crypto.createHash('sha256').update(methodA).digest('hex').toUpperCase();

let out = '';
out += `RAW:\n${raw}\n\n`;
out += `NEW_ENC:\n${newMethod}\n\nNEW_HASH: ${newHash}\n\n`;
out += `A_ENC:\n${methodA}\n\nA_HASH: ${hashA}\n\n`;
out += `SAME? ${newHash === hashA ? 'YES' : 'NO'}\n`;

// Show what's different
if (newMethod !== methodA) {
    out += '\nDIFFS (NEW vs A):\n';
    let diffCount = 0;
    for (let i = 0; i < Math.min(newMethod.length, methodA.length); i++) {
        if (newMethod[i] !== methodA[i]) {
            out += `  pos ${i}: NEW="${newMethod.substring(i,i+15)}" A="${methodA.substring(i,i+15)}"\n`;
            diffCount++;
            if (diffCount > 3) { out += '  ...\n'; break; }
        }
    }
}

fs.writeFileSync('ecpay_debug_out.txt', out, 'utf8');
process.stdout.write(`NEW: ${newHash}\n`);
process.stdout.write(`  A: ${hashA}\n`);
process.stdout.write(`Same: ${newHash === hashA}\n`);
