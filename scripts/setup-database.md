# 🚀 Database Setup Instructions - Updated

To fix the "Error creating listing: {}" error and enable all new features (image picker, favorites, listing details), you need to set up the complete database schema.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project
3. Go to the **SQL Editor** tab
4. First, copy the contents of `database/schema.sql` and run it
5. Then, copy the contents of `database/migrations/001_create_listings_table.sql` and run it
6. Finally, copy the contents of `database/migrations/002_create_favorites_table.sql` and run it

## Option 2: Using Supabase CLI (If you have it installed)

```bash
# Apply the migration
supabase db reset
```

Or manually run:

```bash
supabase db push
```

## What these migrations do:

### Migration 1 - Profiles Table:
1. **Creates the profiles table** with all necessary columns
2. **Sets up Row Level Security (RLS)** policies so users can only access their own profiles
3. **Creates a trigger** that automatically creates a profile whenever a new user signs up
4. **Adds timestamp management** for created_at and updated_at fields

### Migration 2 - Listings & Favorites Tables:
1. **Creates the listings table** for marketplace items
2. **Creates the favorites table** for user favorites
3. **Sets up proper RLS policies** for data security
4. **Adds indexes** for better query performance
5. **Creates relationships** between users, listings, and favorites

## After running the migrations:

✅ **Fixed Issues:**
- ❌ "Error creating listing: {}" → ✅ Listings now save to database
- ❌ Mock data only → ✅ Real database listings on Home and Search
- ❌ Basic image picker → ✅ Camera and gallery support
- ❌ Simple edit icon → ✅ Professional "Edit Profile" button

✅ **New Features Added:**
- 📸 **Image Management**: Real camera/gallery access for both profile and listing images
- ❤️ **Favorites System**: Add/remove favorites with database persistence  
- 🔍 **Listing Details**: Tap any item to see full details in a modal
- 🖼️ **Database Images**: Profile and listing images load from database
- 📱 **Image Gallery**: Swipe through multiple listing images
- 💝 **Share Functionality**: Share listings with others
- 🏷️ **Status Badges**: Visual indicators for sold items
- 🔄 **Real-time Sync**: All data synced with Supabase database

## Verification & Testing:

After applying all migrations, test these features:

1. **Database Tables**: Go to Supabase Table Editor and verify you have:
   - ✅ `profiles` table
   - ✅ `listings` table  
   - ✅ `favorites` table

2. **Listing Creation**: 
   - Go to Sell tab
   - Create a listing with images from camera/gallery
   - Should save successfully (no more errors)

3. **Image Features**:
   - Edit profile photo using camera or gallery
   - Upload multiple images to listings
   - Images should display on Home and Search screens

4. **Favorites & Details**:
   - Tap heart icons to add/remove favorites
   - Tap any listing to see detailed view with image gallery
   - Share functionality should work

## Troubleshooting:

**"relation 'listings' does not exist"**
- Run the listings migration: `database/migrations/001_create_listings_table.sql`

**"permission denied"**  
- Check that RLS policies were created in the migrations

**Images not showing**
- Upload new images - old mock data is replaced with real database content

**App crashes when opening listing details**
- Make sure all migrations were applied successfully
