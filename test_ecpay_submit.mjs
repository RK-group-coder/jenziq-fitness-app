/**
 * 完整模擬提交到 ECPay Stage 並抓取回應
 * 用來驗證 CheckMacValue 是否被接受
 */
import https from 'https';
import querystring from 'querystring';
import fs from 'fs';

const log = fs.readFileSync('ecpay_server_log.txt', 'utf8');
const lastRequest = [...log.matchAll(/All fields: (\{.*\})/g)].pop();

if (!lastRequest) {
    console.log('No request found in log. Please trigger a payment first.');
    process.exit(1);
}

const fields = JSON.parse(lastRequest[1]);
console.log('\n=== SUBMITTING TO ECPAY STAGE ===');
console.log('Fields:', JSON.stringify(fields, null, 2));

const postData = querystring.stringify(fields);

const options = {
    hostname: 'payment-stage.ecpay.com.tw',
    path: '/Cashier/AioCheckOut/V5',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('\nSending POST to ECPay Stage...');

const req = https.request(options, (res) => {
    console.log('HTTP Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Check if it's the error page
        if (data.includes('10200073')) {
            console.log('\n❌ ECPay returned CheckMacValue Error (10200073)');
            // Extract whatever info we can
            const match = data.match(/訊息代碼[\s\S]*?(\d{8})/);
            if (match) console.log('Code:', match[1]);
        } else if (data.includes('form') || data.includes('Credit') || res.statusCode === 302) {
            console.log('\n✅ SUCCESS! Payment page returned (no error)');
        } else {
            console.log('\nResponse preview:', data.substring(0, 500));
        }
        
        // Save response to file
        fs.writeFileSync('ecpay_response.html', data);
        console.log('\nFull response saved to ecpay_response.html');
    });
});

req.on('error', e => console.error('Error:', e));
req.write(postData);
req.end();
