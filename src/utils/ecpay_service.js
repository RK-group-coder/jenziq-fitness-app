/**
 * JENZiQ ECPay Payment Service
 * This module handles the core logic for ECPay (綠界科技) integration.
 * Currently configured for STAGE (Testing) environment.
 * 
 * CheckMacValue is generated SERVER-SIDE to avoid JS/PHP encoding discrepancies
 * and to protect HashKey/HashIV from being exposed in browser.
 */

/**
 * Get the payment payload from our local API server (which computes CheckMacValue)
 * The API server uses Node.js crypto (SHA256) with correct PHP-urlencode equivalent.
 */
export const getPeriodicCheckoutPayload = async (plan, user) => {
    const response = await fetch('http://localhost:5174/api/ecpay-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            price: plan.price,
            months: plan.months
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error('ECPay API Error: ' + err);
    }

    return await response.json();
};

/**
 * Dynamic Form Submission to ECPay
 */
export const redirectToECPay = (payload) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = payload.action;

    Object.entries(payload.fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
};
