import { supabase } from './supabase';
import { Listing } from './services';

// Types for promotions and sales
export interface SalesRecord {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  sale_price: number;
  sale_date: string;
  status: 'completed' | 'pending' | 'cancelled';
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  listing_id: string;
  seller_id: string;
  promotion_type: 'top_seller' | 'featured' | 'premium' | 'banner';
  tier: 'basic' | 'featured' | 'premium';
  duration_days: number;
  price_paid: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  views_count: number;
  clicks_count: number;
  conversion_count: number;
  created_at: string;
  updated_at: string;
}

export interface TopSellerData extends Listing {
  sales_count: number;
  total_revenue: number;
  promotion?: Promotion;
  is_promoted: boolean;
  rank_score: number; // Calculated score for ranking
}

// Sales Services
export const salesService = {
  // Record a sale
  recordSale: async (data: {
    listing_id: string;
    buyer_id: string;
    sale_price: number;
    payment_method?: string;
  }): Promise<{ data: SalesRecord | null, error: any }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Get listing to find seller_id
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', data.listing_id)
      .single();

    if (listingError || !listing) {
      return { data: null, error: listingError || 'Listing not found' };
    }

    const { data: sale, error } = await supabase
      .from('sales')
      .insert([{
        ...data,
        seller_id: listing.user_id,
        status: 'completed',
        sale_date: new Date().toISOString(),
      }])
      .select()
      .single();

    if (!error && sale) {
      // Update listing status to sold
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', data.listing_id);
    }

    return { data: sale, error };
  },

  // Get sales for a listing
  getListingSales: async (listingId: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('listing_id', listingId)
      .order('sale_date', { ascending: false });

    return { data, error };
  },

  // Get seller's sales summary
  getSellerSales: async (sellerId?: string) => {
    const targetSellerId = sellerId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetSellerId) throw new Error('No seller ID provided');

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        listings!listing_id (
          title,
          price,
          images
        )
      `)
      .eq('seller_id', targetSellerId)
      .order('sale_date', { ascending: false });

    return { data, error };
  },

  // Get top selling items
  getTopSellingItems: async (limit: number = 20) => {
    const { data, error } = await supabase
      .rpc('get_top_selling_items', { item_limit: limit });

    return { data, error };
  }
};

// Promotion Services
export const promotionService = {
  // Create a promotion
  createPromotion: async (data: {
    listing_id: string;
    promotion_type: Promotion['promotion_type'];
    tier: Promotion['tier'];
    duration_days: number;
    price_paid: number;
  }): Promise<{ data: Promotion | null, error: any }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (data.duration_days * 24 * 60 * 60 * 1000));

    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert([{
        ...data,
        seller_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        views_count: 0,
        clicks_count: 0,
        conversion_count: 0,
      }])
      .select()
      .single();

    return { data: promotion, error };
  },

  // Get active promotions for a listing
  getListingPromotions: async (listingId: string) => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('tier', { ascending: false }); // Premium first

    return { data, error };
  },

  // Get seller's promotions
  getSellerPromotions: async (sellerId?: string) => {
    const targetSellerId = sellerId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetSellerId) throw new Error('No seller ID provided');

    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        listings!listing_id (
          title,
          price,
          images,
          status
        )
      `)
      .eq('seller_id', targetSellerId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Track promotion view
  trackPromotionView: async (promotionId: string) => {
    const { data, error } = await supabase
      .rpc('increment_promotion_views', { promotion_id: promotionId });

    return { data, error };
  },

  // Track promotion click
  trackPromotionClick: async (promotionId: string) => {
    const { data, error } = await supabase
      .rpc('increment_promotion_clicks', { promotion_id: promotionId });

    return { data, error };
  },

  // Track promotion conversion (when someone buys after clicking)
  trackPromotionConversion: async (promotionId: string) => {
    const { data, error } = await supabase
      .rpc('increment_promotion_conversions', { promotion_id: promotionId });

    return { data, error };
  },

  // Deactivate expired promotions
  deactivateExpiredPromotions: async () => {
    const { data, error } = await supabase
      .from('promotions')
      .update({ is_active: false })
      .lt('end_date', new Date().toISOString())
      .eq('is_active', true);

    return { data, error };
  }
};

// Top Seller Services
export const topSellerService = {
  // Get top sellers combining actual sales and promotions
  getTopSellers: async (limit: number = 15): Promise<{ data: TopSellerData[] | null, error: any }> => {
    try {
      // First, get listings with their sales data
      const { data: salesData, error: salesError } = await supabase
        .rpc('get_listings_with_sales_count', { item_limit: limit * 2 }); // Get more to allow for filtering

      if (salesError) {
        console.error('Error fetching sales data:', salesError);
        return { data: null, error: salesError };
      }

      // Get active promotions
      const { data: promotions, error: promotionError } = await supabase
        .from('promotions')
        .select(`
          *,
          listings!listing_id (*)
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .eq('promotion_type', 'top_seller');

      if (promotionError) {
        console.error('Error fetching promotions:', promotionError);
        // Continue without promotions
      }

      // Combine and rank items
      const combinedItems: TopSellerData[] = [];
      const processedListings = new Set<string>();

      // Add promoted items first
      if (promotions) {
        for (const promotion of promotions) {
          const listing = promotion.listings;
          if (listing && listing.status === 'active') {
            const salesCount = salesData?.find(s => s.listing_id === listing.id)?.sales_count || 0;
            const totalRevenue = salesData?.find(s => s.listing_id === listing.id)?.total_revenue || 0;
            
            // Calculate rank score (promotion gets bonus points)
            const tierBonus = { premium: 1000, featured: 500, basic: 200 };
            const promotionBonus = tierBonus[promotion.tier as keyof typeof tierBonus] || 0;
            const rankScore = (salesCount * 100) + (totalRevenue * 0.01) + promotionBonus;

            combinedItems.push({
              ...listing,
              sales_count: salesCount,
              total_revenue: totalRevenue,
              promotion,
              is_promoted: true,
              rank_score: rankScore
            });
            
            processedListings.add(listing.id);
          }
        }
      }

      // Add top selling items that aren't already promoted
      if (salesData) {
        for (const item of salesData) {
          if (!processedListings.has(item.listing_id) && combinedItems.length < limit) {
            const rankScore = (item.sales_count * 100) + (item.total_revenue * 0.01);
            
            combinedItems.push({
              ...item.listing_data,
              sales_count: item.sales_count,
              total_revenue: item.total_revenue,
              promotion: undefined,
              is_promoted: false,
              rank_score: rankScore
            });
          }
        }
      }

      // Sort by rank score and limit results
      const sortedItems = combinedItems
        .sort((a, b) => b.rank_score - a.rank_score)
        .slice(0, limit);

      return { data: sortedItems, error: null };
    } catch (error) {
      console.error('Error in getTopSellers:', error);
      return { data: null, error };
    }
  },

  // Calculate seller ranking score
  calculateRankingScore: (salesCount: number, totalRevenue: number, hasPromotion: boolean, promotionTier?: string) => {
    let score = (salesCount * 100) + (totalRevenue * 0.01);
    
    if (hasPromotion) {
      const tierBonus = { premium: 1000, featured: 500, basic: 200 };
      score += tierBonus[promotionTier as keyof typeof tierBonus] || 0;
    }
    
    return score;
  }
};

// Advertisement Services
export const advertisementService = {
  // Get active advertisements
  getActiveAdvertisements: async (limit: number = 5) => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Track advertisement view
  trackAdvertisementView: async (adId: string) => {
    const { data, error } = await supabase
      .rpc('increment_advertisement_views', { ad_id: adId });

    return { data, error };
  },

  // Track advertisement click
  trackAdvertisementClick: async (adId: string) => {
    const { data, error } = await supabase
      .rpc('increment_advertisement_clicks', { ad_id: adId });

    return { data, error };
  }
};

export default {
  salesService,
  promotionService,
  topSellerService,
  advertisementService
};
