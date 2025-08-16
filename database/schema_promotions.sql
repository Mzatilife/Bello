-- Database schema for promotions, sales, and advertisements
-- This should be run in your Supabase SQL editor

-- Sales table to track completed sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES profiles(uid) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(uid) ON DELETE CASCADE,
    sale_price DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions table for paid promotional listings
CREATE TABLE IF NOT EXISTS promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(uid) ON DELETE CASCADE,
    promotion_type VARCHAR(20) NOT NULL CHECK (promotion_type IN ('top_seller', 'featured', 'premium', 'banner')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'featured', 'premium')),
    duration_days INTEGER NOT NULL DEFAULT 7,
    price_paid DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(listing_id, promotion_type) -- One promotion type per listing at a time
);

-- Advertisements table for banner ads and promotional content
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('banner', 'product', 'service', 'event')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    duration_days INTEGER NOT NULL DEFAULT 30,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_audience TEXT[], -- Array of keywords for targeting
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_listing_id ON sales(listing_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_id ON sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX IF NOT EXISTS idx_promotions_seller_id ON promotions(seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(promotion_type);
CREATE INDEX IF NOT EXISTS idx_promotions_tier ON promotions(tier);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON promotions(end_date);

CREATE INDEX IF NOT EXISTS idx_advertisements_type ON advertisements(type);
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements(priority);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_end_date ON advertisements(end_date);

-- RPC functions for complex queries

-- Get top selling items with sales count
CREATE OR REPLACE FUNCTION get_top_selling_items(item_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    listing_id UUID,
    listing_data JSONB,
    sales_count BIGINT,
    total_revenue DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as listing_id,
        to_jsonb(l.*) as listing_data,
        COALESCE(COUNT(s.id), 0) as sales_count,
        COALESCE(SUM(s.sale_price), 0) as total_revenue
    FROM listings l
    LEFT JOIN sales s ON l.id = s.listing_id AND s.status = 'completed'
    WHERE l.status = 'active'
    GROUP BY l.id
    ORDER BY sales_count DESC, total_revenue DESC
    LIMIT item_limit;
END;
$$;

-- Get listings with sales count (similar to above but different structure)
CREATE OR REPLACE FUNCTION get_listings_with_sales_count(item_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    listing_id UUID,
    listing_data JSONB,
    sales_count BIGINT,
    total_revenue DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as listing_id,
        to_jsonb(l.*) as listing_data,
        COALESCE(COUNT(s.id), 0) as sales_count,
        COALESCE(SUM(s.sale_price), 0) as total_revenue
    FROM listings l
    LEFT JOIN sales s ON l.id = s.listing_id AND s.status = 'completed'
    WHERE l.status = 'active'
    GROUP BY l.id
    HAVING COUNT(s.id) > 0
    ORDER BY sales_count DESC, total_revenue DESC
    LIMIT item_limit;
END;
$$;

-- Increment promotion views
CREATE OR REPLACE FUNCTION increment_promotion_views(promotion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE promotions 
    SET views_count = views_count + 1, updated_at = NOW()
    WHERE id = promotion_id;
END;
$$;

-- Increment promotion clicks
CREATE OR REPLACE FUNCTION increment_promotion_clicks(promotion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE promotions 
    SET clicks_count = clicks_count + 1, updated_at = NOW()
    WHERE id = promotion_id;
END;
$$;

-- Increment promotion conversions
CREATE OR REPLACE FUNCTION increment_promotion_conversions(promotion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE promotions 
    SET conversion_count = conversion_count + 1, updated_at = NOW()
    WHERE id = promotion_id;
END;
$$;

-- Increment advertisement views
CREATE OR REPLACE FUNCTION increment_advertisement_views(ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE advertisements 
    SET views_count = views_count + 1, updated_at = NOW()
    WHERE id = ad_id;
END;
$$;

-- Increment advertisement clicks
CREATE OR REPLACE FUNCTION increment_advertisement_clicks(ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE advertisements 
    SET clicks_count = clicks_count + 1, updated_at = NOW()
    WHERE id = ad_id;
END;
$$;

-- Row Level Security (RLS) policies

-- Sales policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales" ON sales
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create sales for their purchases" ON sales
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Promotions policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active promotions" ON promotions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own promotions" ON promotions
    FOR ALL USING (auth.uid() = seller_id);

-- Advertisements policies (public read, admin write)
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active advertisements" ON advertisements
    FOR SELECT USING (is_active = true AND end_date > NOW());

-- Note: For INSERT/UPDATE/DELETE on advertisements, you'll need admin policies
-- or a specific role-based system depending on your needs

-- Triggers for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
