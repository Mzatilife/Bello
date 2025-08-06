-- Create listings table for marketplace items
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  category text,
  condition text,
  location text,
  images text[], -- Array of image URLs
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft', 'deleted')),
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Public listings are viewable by everyone" 
ON public.listings 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can insert their own listings" 
ON public.listings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" 
ON public.listings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" 
ON public.listings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_listings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_listings_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS listings_user_id_idx ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS listings_category_idx ON public.listings(category);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings(status);
CREATE INDEX IF NOT EXISTS listings_created_at_idx ON public.listings(created_at);
CREATE INDEX IF NOT EXISTS listings_price_idx ON public.listings(price);
CREATE INDEX IF NOT EXISTS listings_location_idx ON public.listings(location);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
