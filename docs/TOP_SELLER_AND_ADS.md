# Top Seller Carousel & Advertisement Features

This document explains the newly added Top Seller Carousel and Advertisement Banner features for the Bello marketplace app.

## Features Overview

### 1. Top Seller Carousel
- **Purpose**: Showcases the best-selling items and promoted listings
- **Location**: Home screen, between search bar and categories
- **Functionality**:
  - Combines actual sales data with paid promotional items
  - Shows ranking badges (#1, #2, etc.)
  - Displays sales count and promotion tier badges
  - Supports three promotion tiers: Basic, Featured, Premium
  - Responsive horizontal scroll with smooth animations

### 2. Advertisement Banner
- **Purpose**: Display promotional content and banner advertisements
- **Location**: Home screen, above the Top Seller Carousel
- **Functionality**:
  - Auto-scrolling banner with page indicators
  - Support for different ad types: Banner, Product, Service, Event
  - Priority system: High, Medium, Low
  - Click tracking and analytics
  - User can close/hide specific ads
  - External link support

## Components

### TopSellerCarousel Component
**File**: `components/TopSellerCarousel.tsx`

**Props**:
- `onItemPress?: (item: TopSellerItem) => void` - Callback when item is tapped
- `onLikeToggle?: (itemId: string) => void` - Callback for like button
- `likedItems?: string[]` - Array of liked item IDs

**Features**:
- Automatic fallback to mock data if promotion services unavailable
- Visual indicators for promoted vs organic top sellers
- Sales count badges
- Premium item highlighting with golden border
- Heart button for favorites

### AdvertisementBanner Component
**File**: `components/AdvertisementBanner.tsx`

**Props**:
- `onAdClick?: (ad: Advertisement) => void` - Callback when ad is clicked
- `maxAds?: number` - Maximum ads to show (default: 3)
- `autoScroll?: boolean` - Enable auto-scrolling (default: true)
- `showCloseButton?: boolean` - Show close button on ads (default: true)

**Features**:
- Auto-scroll every 5 seconds
- Page indicators for multiple ads
- Type-specific icons and styling
- Days remaining countdown
- View/click statistics display

## Database Schema

### Required Tables

1. **sales** - Track completed transactions
2. **promotions** - Manage paid promotional listings
3. **advertisements** - Store banner ads and promotional content

### Key Database Functions

- `get_top_selling_items()` - Get items ranked by sales
- `get_listings_with_sales_count()` - Get items with sales data
- `increment_promotion_views()` - Track promotion views
- `increment_promotion_clicks()` - Track promotion clicks
- `increment_advertisement_views()` - Track ad views
- `increment_advertisement_clicks()` - Track ad clicks

## Services

### promotionServices.ts
**File**: `lib/promotionServices.ts`

Contains four main service modules:

1. **salesService** - Handle sales tracking
2. **promotionService** - Manage promotional listings
3. **topSellerService** - Combine sales and promotion data
4. **advertisementService** - Manage advertisements

## Setup Instructions

### 1. Database Setup
Run the SQL schema from `database/schema_promotions.sql` in your Supabase SQL editor:

```sql
-- Copy and run the entire schema_promotions.sql file
```

### 2. Component Integration
The components are already integrated into the home screen. They will:
- Automatically fall back to mock data if database tables don't exist
- Work with existing listings and favorites systems
- Handle authentication states gracefully

### 3. Configuration Options

#### Top Seller Carousel
```tsx
<TopSellerCarousel
  onItemPress={handleItemPress}
  onLikeToggle={toggleLike}
  likedItems={likedItems}
/>
```

#### Advertisement Banner
```tsx
<AdvertisementBanner
  onAdClick={(ad) => console.log('Ad clicked:', ad.title)}
  maxAds={3}
  autoScroll={true}
  showCloseButton={true}
/>
```

## Business Logic

### Top Seller Ranking Algorithm
Items are ranked using a scoring system:
- **Sales count**: 100 points per sale
- **Revenue**: 0.01 points per MK of revenue
- **Promotion bonuses**:
  - Premium tier: +1000 points
  - Featured tier: +500 points
  - Basic tier: +200 points

### Promotion Tiers

#### Basic Tier
- Standard promotion badge
- Teal color scheme
- Low priority boost

#### Featured Tier
- "FEATURED" badge
- Red color scheme
- Medium priority boost

#### Premium Tier
- "PREMIUM" badge with crown icon
- Gold color scheme with special effects
- High priority boost
- Golden border and glow effect

## Revenue Model

### Promotion Pricing (Suggested)
- **Basic**: MK 5,000 per week
- **Featured**: MK 15,000 per week
- **Premium**: MK 30,000 per week

### Advertisement Pricing (Suggested)
- **Banner ads**: MK 20,000 per month
- **Product promotions**: MK 10,000 per month
- **Service ads**: MK 15,000 per month

## Analytics & Tracking

Both components support comprehensive analytics:

### Promotion Metrics
- Views count
- Clicks count
- Conversion count (sales after clicks)
- ROI calculations

### Advertisement Metrics
- Impressions (views)
- Click-through rate
- Days remaining
- Performance by ad type

## Development Notes

### Testing Without Database
The components include fallback mechanisms that work with mock data, allowing you to test the UI without setting up the complete database schema.

### Performance Considerations
- Database queries are optimized with proper indexing
- Components use React hooks for efficient re-rendering
- Images are lazy-loaded with fallback support

### Customization
Both components are fully customizable through props and can be easily styled to match your app's theme and branding.

## Future Enhancements

### Potential Features
1. **A/B Testing**: Test different promotion styles
2. **Geotargeting**: Show location-specific ads
3. **User Targeting**: Personalized promotions based on user behavior
4. **Seasonal Promotions**: Time-based promotional campaigns
5. **Bulk Promotion Management**: Dashboard for managing multiple promotions
6. **Advanced Analytics**: Detailed reporting and insights

### Integration Possibilities
- Payment gateway integration for promotion purchases
- Admin dashboard for managing advertisements
- Email notifications for promotion performance
- Social media sharing for top sellers
- Push notifications for promoted items

## Support

For issues or questions about these features:
1. Check the component props and configuration
2. Verify database schema is properly set up
3. Review console logs for any service errors
4. Test with mock data fallback first

The features are designed to be robust and handle various edge cases, including missing data, authentication states, and network issues.
