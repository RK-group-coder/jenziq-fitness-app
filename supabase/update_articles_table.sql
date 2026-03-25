-- Update Articles Table to include Source and Link URL
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS link_url TEXT;

-- If you are starting fresh, use this:
/*
CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    source TEXT,
    publish_date DATE DEFAULT CURRENT_DATE,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
*/
