-- Fix profile creation conflicts and improve image handling
-- This migration addresses issues with multiple devices and profile creation

-- Drop existing trigger to recreate with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with better conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert, but ignore if already exists to prevent conflicts
  INSERT INTO public.profiles (
    uid,
    email,
    display_name,
    photo_url,
    provider,
    is_email_verified,
    metadata
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'display_name', 
      new.raw_user_meta_data->>'name',
      CASE 
        WHEN new.email IS NOT NULL THEN split_part(new.email, '@', 1)
        ELSE 'User'
      END
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    CASE 
      WHEN new.app_metadata->>'provider' IS NOT NULL THEN new.app_metadata->>'provider'
      WHEN array_length(ARRAY(SELECT jsonb_array_elements_text(new.app_metadata->'providers')), 1) > 0 THEN 
        (SELECT jsonb_array_elements_text(new.app_metadata->'providers') LIMIT 1)
      ELSE 'email'
    END,
    COALESCE((new.email_confirmed_at IS NOT NULL), false),
    COALESCE(new.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (uid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    photo_url = COALESCE(EXCLUDED.photo_url, public.profiles.photo_url),
    provider = EXCLUDED.provider,
    is_email_verified = EXCLUDED.is_email_verified,
    metadata = EXCLUDED.metadata,
    last_login = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update the last_login function to handle errors better
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = timezone('utc'::text, now())
  WHERE uid = new.id;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in update_last_login: %', SQLERRM;
    RETURN new;
END;
$$;

-- Add index for better image URL performance
CREATE INDEX IF NOT EXISTS profiles_photo_url_idx ON public.profiles(photo_url) WHERE photo_url IS NOT NULL;

-- Add a function to clean up orphaned profiles (optional)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.profiles 
  WHERE uid NOT IN (
    SELECT id FROM auth.users
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission on the cleanup function to authenticated users
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_profiles() TO authenticated;

-- Add a view for easier profile debugging (optional)
CREATE OR REPLACE VIEW public.profile_debug AS
SELECT 
  p.*,
  CASE 
    WHEN au.id IS NULL THEN 'ORPHANED'
    ELSE 'VALID'
  END as profile_status
FROM public.profiles p
LEFT JOIN auth.users au ON p.uid = au.id;

-- Grant access to the debug view for authenticated users
GRANT SELECT ON public.profile_debug TO authenticated;
