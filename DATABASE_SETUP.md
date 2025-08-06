# Database Setup Guide

This guide will help you set up the required database tables for the E-Marketing app.

## Prerequisites
- Access to your Supabase dashboard
- Admin access to your Supabase project

## 1. Apply Database Migrations

You need to run the SQL migration files to create the required tables in your Supabase database.

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your E-Marketing project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Profiles Table Migration (if not exists)
Copy and paste the content from `database/schema.sql` into the SQL Editor and run it first if you haven't already.

### Step 3: Run Listings Table Migration
Copy and paste the entire content from `database/migrations/001_create_listings_table.sql` into the SQL Editor and click **Run**.

This will create:
- `listings` table with all necessary fields
- Row Level Security (RLS) policies
- Indexes for better performance
- Triggers for automatic timestamp updates

### Step 4: Run Favorites Table Migration
Copy and paste the entire content from `database/migrations/002_create_favorites_table.sql` into the SQL Editor and click **Run**.

This will create:
- `favorites` table for user favorites
- RLS policies
- Indexes and constraints

### Step 5: Verify Tables
After running the migrations, verify the tables were created:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `profiles` (existing)
   - `listings` (new)
   - `favorites` (new)

## 2. Enable Storage (Optional)

If you want to store images directly in Supabase instead of using external URLs:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `images`
3. Set the bucket to **Public** if you want images to be publicly accessible
4. Configure policies as needed

## 3. Test the Setup

After applying the migrations:

1. Run your app: `npm run dev`
2. Log in with a user account
3. Try creating a listing in the **Sell** tab
4. The listing should now save successfully to the database

## Troubleshooting

### Error: relation "listings" does not exist
- Make sure you ran the listings table migration
- Check that the SQL executed without errors
- Verify the table appears in your Supabase Table Editor

### Error: permission denied for table listings
- Check that the RLS policies were created correctly
- Ensure your user is authenticated when creating listings

### Image picker not working
- Make sure you've granted camera and gallery permissions
- The image picker should now work for both profile photos and listing images

## Features Added

✅ **Database Tables**: Listings and Favorites tables with proper relationships
✅ **Image Picker**: Camera and gallery support for both profile and listing images  
✅ **Image Management**: Add/remove images in listings with visual feedback
✅ **Profile UI**: Improved "Edit Profile" button with better styling
✅ **Error Handling**: Better error messages and validation

## Next Steps

After setting up the database:
1. Test listing creation and image upload
2. Test profile editing with photo changes
3. Consider setting up image storage in Supabase Storage for better performance
4. Implement image compression if needed for mobile performance
