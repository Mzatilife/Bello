-- Create audit trail table for tracking listing deletions and modifications
CREATE TABLE IF NOT EXISTS public.listing_audit_trail (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('deleted', 'updated', 'status_changed')),
  old_data jsonb,
  new_data jsonb,
  reason text,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.listing_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view audit trail for their own listings" 
ON public.listing_audit_trail 
FOR SELECT 
USING (user_id = auth.uid() OR performed_by = auth.uid());

CREATE POLICY "System can insert audit trail entries" 
ON public.listing_audit_trail 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert audit entries

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS listing_audit_trail_listing_id_idx ON public.listing_audit_trail(listing_id);
CREATE INDEX IF NOT EXISTS listing_audit_trail_user_id_idx ON public.listing_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS listing_audit_trail_action_idx ON public.listing_audit_trail(action);
CREATE INDEX IF NOT EXISTS listing_audit_trail_performed_at_idx ON public.listing_audit_trail(performed_at);

-- Create function to automatically create audit trail entries when listings are updated
CREATE OR REPLACE FUNCTION public.create_listing_audit_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle deletion (status change to 'deleted')
  IF NEW.status = 'deleted' AND OLD.status != 'deleted' THEN
    INSERT INTO public.listing_audit_trail (
      listing_id,
      user_id,
      action,
      old_data,
      new_data,
      reason,
      performed_by,
      metadata
    )
    VALUES (
      OLD.id,
      OLD.user_id,
      'deleted',
      to_jsonb(OLD),
      to_jsonb(NEW),
      'User deleted listing',
      auth.uid(),
      jsonb_build_object(
        'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
        'timestamp', now(),
        'previous_status', OLD.status
      )
    );
  
  -- Handle status changes (sold, draft, etc.)
  ELSIF NEW.status != OLD.status AND NEW.status != 'deleted' THEN
    INSERT INTO public.listing_audit_trail (
      listing_id,
      user_id,
      action,
      old_data,
      new_data,
      reason,
      performed_by,
      metadata
    )
    VALUES (
      OLD.id,
      OLD.user_id,
      'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      format('Status changed from %s to %s', OLD.status, NEW.status),
      auth.uid(),
      jsonb_build_object(
        'timestamp', now(),
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  
  -- Handle other significant updates (price, title changes)
  ELSIF (OLD.price != NEW.price OR OLD.title != NEW.title OR OLD.description != NEW.description) THEN
    INSERT INTO public.listing_audit_trail (
      listing_id,
      user_id,
      action,
      old_data,
      new_data,
      reason,
      performed_by,
      metadata
    )
    VALUES (
      OLD.id,
      OLD.user_id,
      'updated',
      jsonb_build_object(
        'title', OLD.title,
        'price', OLD.price,
        'description', OLD.description
      ),
      jsonb_build_object(
        'title', NEW.title,
        'price', NEW.price,
        'description', NEW.description
      ),
      'Listing details updated',
      auth.uid(),
      jsonb_build_object(
        'timestamp', now(),
        'fields_changed', array_remove(ARRAY[
          CASE WHEN OLD.title != NEW.title THEN 'title' END,
          CASE WHEN OLD.price != NEW.price THEN 'price' END,
          CASE WHEN OLD.description != NEW.description THEN 'description' END
        ], NULL)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create audit trail entries
CREATE TRIGGER create_listing_audit_entry_trigger
  AFTER UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.create_listing_audit_entry();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.listing_audit_trail TO authenticated;
GRANT SELECT ON public.listing_audit_trail TO anon;
