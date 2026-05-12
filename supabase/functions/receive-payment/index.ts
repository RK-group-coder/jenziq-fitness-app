import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 綠界回傳是 POST Form Data
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const HashKey = Deno.env.get("ECPAY_HASH_KEY") ?? "5294y06JbISpM5x9";
    const HashIV = Deno.env.get("ECPAY_HASH_IV") ?? "v77hoKGq4kWxJtE1";

    // 1. 驗證 CheckMacValue
    const receivedCheckMacValue = payload.CheckMacValue;
    const sortedKeys = Object.keys(payload).sort();
    let rawStr = `HashKey=${HashKey}&` + sortedKeys
      .filter(k => k !== "CheckMacValue")
      .map(k => `${k}=${payload[k]}`)
      .join("&") + `&HashIV=${HashIV}`;

    let encodedStr = encodeURIComponent(rawStr).toLowerCase();
    encodedStr = encodedStr
      .replace(/%2d/g, "-")
      .replace(/%5f/g, "_")
      .replace(/%2e/g, ".")
      .replace(/%21/g, "!")
      .replace(/%2a/g, "*")
      .replace(/%28/g, "(")
      .replace(/%29/g, ")");

    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encodedStr));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    if (hashHex !== receivedCheckMacValue) {
      console.error("CheckMacValue mismatch!");
      return new Response("0|CheckMacValue Mismatch", { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. 紀錄 Log
    await supabaseClient.from("payments_log").insert({
      merchant_trade_no: payload.MerchantTradeNo,
      raw_data: payload,
      status: payload.RtnCode,
    });

    // 3. 更新訂單狀態
    if (payload.RtnCode === "1") {
      // 冪等性檢查：確認訂單是否存在且未支付
      const { data: order } = await supabaseClient
        .from("orders")
        .select("status")
        .eq("merchant_trade_no", payload.MerchantTradeNo)
        .single();

      if (order && order.status !== "paid") {
        await supabaseClient
          .from("orders")
          .update({
            status: "paid",
            ecpay_trade_no: payload.TradeNo,
            payment_type: payload.PaymentType,
            paid_at: new Date().toISOString(),
          })
          .eq("merchant_trade_no", payload.MerchantTradeNo);
          
        console.log(`Order ${payload.MerchantTradeNo} paid successfully.`);
      }
    }

    // 4. 回覆綠界
    return new Response("1|OK", { status: 200 });
  } catch (error) {
    console.error("Receive Payment Error:", error);
    return new Response("0|" + error.message, { status: 400 });
  }
});
