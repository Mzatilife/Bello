import { supabase } from './supabase';
import { Profile } from '../context/AuthContext';

// Listings types
export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  condition?: string;
  location?: string;
  images?: string[];
  status: 'active' | 'sold' | 'draft' | 'deleted';
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateListingData {
  title: string;
  description?: string;
  price: number;
  category?: string;
  condition?: string;
  location?: string;
  images?: string[];
  status?: 'active' | 'draft';
}

// Profile Services
export const profileService = {
  // Update user profile
  updateProfile: async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', user.id)
      .select()
      .single();

    return { data, error };
  },

  // Get user profile
  getProfile: async (userId?: string) => {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('No user ID provided');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', targetUserId)
      .single();

    return { data, error };
  },
};

// Listings Services
export const listingsService = {
  // Create a new listing
  createListing: async (listingData: CreateListingData): Promise<{ data: Listing | null, error: any }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('listings')
      .insert([{
        ...listingData,
        user_id: user.id,
        status: listingData.status || 'active',
      }])
      .select()
      .single();

    return { data, error };
  },

  // Get all active listings
  getListings: async (filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%, description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Get user's listings
  getUserListings: async (userId?: string) => {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('No user ID provided');

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', targetUserId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Update a listing
  updateListing: async (listingId: string, updates: Partial<CreateListingData>) => {
    const { data, error } = await supabase
      .from('listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  },

  // Delete a listing (soft delete)
  deleteListing: async (listingId: string) => {
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  },

  // Mark listing as sold
  markAsSold: async (listingId: string) => {
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: 'sold',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    return { data, error };
  },
};

// Favorites Services
export const favoritesService = {
  // Add to favorites
  addToFavorites: async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('favorites')
      .insert([{
        user_id: user.id,
        listing_id: listingId,
      }])
      .select()
      .single();

    return { data, error };
  },

  // Remove from favorites
  removeFromFavorites: async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .select();

    return { data, error };
  },

  // Get user's favorites
  getFavorites: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Check if listing is favorited
  isFavorited: async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .single();

    return { data: !!data, error: error?.code === 'PGRST116' ? null : error };
  },
};

// Image upload service (for future use with Supabase Storage)
export const uploadService = {
  // Upload image to Supabase Storage
  uploadImage: async (file: File, bucket: string = 'images'): Promise<{ data: string | null, error: any }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) return { data: null, error };

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { data: urlData.publicUrl, error: null };
  },

  // Delete image from storage
  deleteImage: async (url: string, bucket: string = 'images') => {
    const fileName = url.split('/').pop();
    if (!fileName) return { error: new Error('Invalid file URL') };

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    return { data, error };
  },
};
