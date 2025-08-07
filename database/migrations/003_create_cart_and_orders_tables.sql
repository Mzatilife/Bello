-- Create cart table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  commission_amount decimal(10,2) NOT NULL CHECK (commission_amount >= 0),
  commission_rate decimal(5,4) DEFAULT 0.15 NOT NULL, -- 15% commission rate
  delivery_fee decimal(10,2) DEFAULT 0.00,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  delivery_address jsonb NOT NULL,
  phone_number text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  commission_amount decimal(10,2) NOT NULL CHECK (commission_amount >= 0),
  seller_amount decimal(10,2) NOT NULL CHECK (seller_amount >= 0),
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create seller payments table
CREATE TABLE IF NOT EXISTS public.seller_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payment_method text DEFAULT 'bank_transfer',
  payment_details jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create delivery tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  message text NOT NULL,
  location text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Cart Items Policies
CREATE POLICY "Users can manage their own cart items" 
ON public.cart_items 
FOR ALL 
USING (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Buyers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE uid = auth.uid() AND role = 'admin'
  )
);

-- Order Items Policies
CREATE POLICY "Buyers can view their order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND buyer_id = auth.uid()
  )
);

CREATE POLICY "Sellers can view their order items" 
ON public.order_items 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Admin can view all order items" 
ON public.order_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE uid = auth.uid() AND role = 'admin'
  )
);

-- Seller Payments Policies
CREATE POLICY "Sellers can view their own payments" 
ON public.seller_payments 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Admin can manage all seller payments" 
ON public.seller_payments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE uid = auth.uid() AND role = 'admin'
  )
);

-- Delivery Tracking Policies
CREATE POLICY "Buyers can view their order tracking" 
ON public.delivery_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND buyer_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all delivery tracking" 
ON public.delivery_tracking 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE uid = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS cart_items_listing_id_idx ON public.cart_items(listing_id);
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_seller_id_idx ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS seller_payments_seller_id_idx ON public.seller_payments(seller_id);
CREATE INDEX IF NOT EXISTS seller_payments_status_idx ON public.seller_payments(status);
CREATE INDEX IF NOT EXISTS delivery_tracking_order_id_idx ON public.delivery_tracking(order_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_payments_updated_at
  BEFORE UPDATE ON public.seller_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  order_num text;
  counter integer;
BEGIN
  -- Generate order number format: BLO-YYYYMMDD-XXXXX
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(order_number FROM 'BLO-[0-9]{8}-([0-9]{5})') 
      AS INTEGER
    )
  ), 0) + 1
  INTO counter
  FROM public.orders
  WHERE order_number LIKE 'BLO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  order_num := 'BLO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::text, 5, '0');
  
  RETURN order_num;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.seller_payments TO authenticated;
GRANT ALL ON public.delivery_tracking TO authenticated;
GRANT SELECT ON public.cart_items TO anon;
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
