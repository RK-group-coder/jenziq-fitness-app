import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, baseUrl } = await req.json();

    // 1. 從資料庫讀取訂單資訊，防止前端修改金額
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // 2. 準備綠界參數
    const MerchantID = "2000132"; // 測試帳號
    const HashKey = Deno.env.get("ECPAY_HASH_KEY") ?? "5294y06JbISpM5x9";
    const HashIV = Deno.env.get("ECPAY_HASH_IV") ?? "v77hoKGq4kWxJtE1";

    const tradeDate = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(/\//g, "/");

    const params: Record<string, string> = {
      MerchantID,
      MerchantTradeNo: order.merchant_trade_no,
      MerchantTradeDate: tradeDate.replace(/,/g, ""),
      PaymentType: "aio",
      TotalAmount: order.amount.toString(),
      TradeDesc: encodeURIComponent("JENZiQ 訂單付款"),
      ItemName: "JENZiQ 商品一批",
      ReturnURL: `${baseUrl}/functions/v1/receive-payment`,
      OrderResultURL: `${baseUrl}/profile?order=${order.id}`,
      ChoosePayment: "ALL",
      EncryptType: "1",
      CheckMacValue: "",
    };

    // 3. 計算 CheckMacValue
    const sortedKeys = Object.keys(params).sort();
    let rawStr = `HashKey=${HashKey}&` + sortedKeys
      .filter(k => k !== "CheckMacValue")
      .map(k => `${k}=${params[k]}`)
      .join("&") + `&HashIV=${HashIV}`;

    // URL Encode 並替換特定字元
    let encodedStr = encodeURIComponent(rawStr).toLowerCase();
    encodedStr = encodedStr
      .replace(/%2d/g, "-")
      .replace(/%5f/g, "_")
      .replace(/%2e/g, ".")
      .replace(/%21/g, "!")
      .replace(/%2a/g, "*")
      .replace(/%28/g, "(")
      .replace(/%29/g, ")");

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(encodedStr)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    params.CheckMacValue = hashHex;

    return new Response(JSON.stringify(params), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
