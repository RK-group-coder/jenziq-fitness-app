-- 1. 建立商品表
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL, -- supplements (肌力補充), apparel (專業服飾)
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 建立訂單表
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
    merchant_trade_no TEXT UNIQUE NOT NULL, -- 綠界商店訂單編號
    ecpay_trade_no TEXT, -- 綠界交易序號
    payment_type TEXT, -- 綠界付款方式
    items JSONB NOT NULL, -- 存商品清單 [{id, name, qty, price}]
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_method TEXT, -- convenience_store, home_delivery
    delivery_info JSONB, -- 存收件資訊/店號
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 建立金流日誌表
CREATE TABLE IF NOT EXISTS public.payments_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    merchant_trade_no TEXT NOT NULL,
    raw_data JSONB NOT NULL, -- 綠界回傳的完整資料
    status TEXT, -- 付款結果 RtnCode
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 啟用 RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;

-- 策略：所有人可讀取商品
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- 策略：使用者可查看自己的訂單
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- 策略：使用者可建立訂單
CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 策略：只有管理者可查看日誌
CREATE POLICY "Only admins can view payment logs" ON public.payments_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'manager'
        )
    );

-- 插入測試資料
INSERT INTO public.products (name, description, price, image_url, category, stock)
VALUES 
('JENZiQ | 草莓口味肌酸(測試商品)', '專業肌力補充，草莓口味。', 599, 'https://via.placeholder.com/400x400?text=Creatine+Strawberry', 'supplements', 100),
('JENZiQ | 原味肌酸(測試商品)', '專業肌力補充，原味。', 599, 'https://via.placeholder.com/400x400?text=Creatine+Original', 'supplements', 100);
