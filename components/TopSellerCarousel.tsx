import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Star, TrendingUp, Crown, MapPin, Heart } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { listingsService, favoritesService, Listing } from '@/lib/services';
import { topSellerService, TopSellerData } from '@/lib/promotionServices';
import EnhancedImage from './EnhancedImage';

interface TopSellerItem extends Listing {
  is_promoted?: boolean;
  sales_count?: number;
  promotion_tier?: 'premium' | 'featured' | 'basic';
}

interface TopSellerCarouselProps {
  onItemPress?: (item: TopSellerItem) => void;
  onLikeToggle?: (itemId: string) => void;
  likedItems?: string[];
}

export default function TopSellerCarousel({ 
  onItemPress, 
  onLikeToggle, 
  likedItems = [] 
}: TopSellerCarouselProps) {
  const [topSellerItems, setTopSellerItems] = useState<TopSellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, t } = useAppContext();
  const { user } = useAuth();
  const styles = createStyles(theme);

  useEffect(() => {
    loadTopSellers();
  }, []);

  const loadTopSellers = async () => {
    try {
      setLoading(true);
      
      // Try to get top sellers from the promotion service first
      const { data: topSellersData, error: topSellersError } = await topSellerService.getTopSellers(15);
      
      if (topSellersData && !topSellersError) {
        // Convert TopSellerData to TopSellerItem format
        const convertedItems: TopSellerItem[] = topSellersData.map(item => ({
          ...item,
          is_promoted: item.is_promoted,
          sales_count: item.sales_count,
          promotion_tier: item.promotion?.tier as 'premium' | 'featured' | 'basic' | undefined
        }));
        
        setTopSellerItems(convertedItems);
        return;
      }
      
      // Fallback: Get regular listings and simulate sales/promotion data
      console.log('Using fallback method for top sellers');
      const { data: listings, error } = await listingsService.getListings({ limit: 50 });
      
      if (error || !listings) {
        console.error('Error loading top sellers:', error);
        return;
      }

      // For demo purposes, we'll simulate sales data and promoted items
      const processedItems: TopSellerItem[] = listings.map((listing, index) => {
        // Simulate some items being promoted
        const isPromoted = Math.random() > 0.7; // 30% chance of being promoted
        const salesCount = Math.floor(Math.random() * 50) + 5; // Random sales count
        
        let promotionTier: 'premium' | 'featured' | 'basic' | undefined;
        if (isPromoted) {
          const rand = Math.random();
          if (rand > 0.8) promotionTier = 'premium';
          else if (rand > 0.5) promotionTier = 'featured';
          else promotionTier = 'basic';
        }

        return {
          ...listing,
          is_promoted: isPromoted,
          sales_count: salesCount,
          promotion_tier: promotionTier,
        };
      });

      // Sort by promotion tier first, then by sales count
      const sortedItems = processedItems.sort((a, b) => {
        // Premium promoted items first
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;
        
        // Among promoted items, sort by tier
        if (a.is_promoted && b.is_promoted) {
          const tierWeight = { premium: 3, featured: 2, basic: 1 };
          const aWeight = tierWeight[a.promotion_tier || 'basic'];
          const bWeight = tierWeight[b.promotion_tier || 'basic'];
          if (aWeight !== bWeight) return bWeight - aWeight;
        }
        
        // Then by sales count
        return (b.sales_count || 0) - (a.sales_count || 0);
      });

      // Take top 15 items
      setTopSellerItems(sortedItems.slice(0, 15));
    } catch (error) {
      console.error('Error loading top sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    if (!user) return;
    
    if (onLikeToggle) {
      onLikeToggle(itemId);
    } else {
      // Default behavior if no handler provided
      try {
        if (likedItems.includes(itemId)) {
          await favoritesService.removeFromFavorites(itemId);
        } else {
          await favoritesService.addToFavorites(itemId);
        }
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    }
  };

  const renderPromotionBadge = (item: TopSellerItem) => {
    if (!item.is_promoted || !item.promotion_tier) return null;

    const badgeColors = {
      premium: { bg: '#FFD700', text: '#000', icon: '#FFD700' },
      featured: { bg: '#FF6B6B', text: '#FFF', icon: '#FF6B6B' },
      basic: { bg: '#4ECDC4', text: '#FFF', icon: '#4ECDC4' }
    };

    const colors = badgeColors[item.promotion_tier];

    return (
      <View style={[styles.promotionBadge, { backgroundColor: colors.bg }]}>
        <Crown size={10} color={colors.text} />
        <Text style={[styles.promotionText, { color: colors.text }]}>
          {item.promotion_tier.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderSalesBadge = (salesCount: number) => {
    return (
      <View style={styles.salesBadge}>
        <TrendingUp size={10} color="#22C55E" />
        <Text style={styles.salesText}>{salesCount}+ sold</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={24} color={theme.primary} />
          <Text style={styles.title}>Top Sellers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading top sellers...</Text>
        </View>
      </View>
    );
  }

  if (topSellerItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={24} color={theme.primary} />
          <Text style={styles.title}>Top Sellers</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No top sellers available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingUp size={24} color={theme.primary} />
          <Text style={styles.title}>Top Sellers</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {topSellerItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              item.is_promoted && styles.promotedCard,
              item.promotion_tier === 'premium' && styles.premiumCard
            ]}
            onPress={() => onItemPress?.(item)}
          >
            <View style={styles.imageContainer}>
              <EnhancedImage
                uri={item.images && item.images[0] ? item.images[0] : null}
                fallbackUri='https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
                style={styles.itemImage}
                showLoadingIndicator={true}
              />
              
              {/* Rank Badge */}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              
              {/* Like Button */}
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => handleLike(item.id)}
              >
                <Heart
                  size={16}
                  color={likedItems.includes(item.id) ? '#EF4444' : '#FFF'}
                  fill={likedItems.includes(item.id) ? '#EF4444' : 'none'}
                />
              </TouchableOpacity>
              
              {/* Promotion Badge */}
              {renderPromotionBadge(item)}
              
              {/* Sales Badge */}
              {item.sales_count && renderSalesBadge(item.sales_count)}
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.itemPrice}>
                MK{item.price.toLocaleString()}
              </Text>
              
              {item.location && (
                <View style={styles.locationContainer}>
                  <MapPin size={10} color={theme.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}
              
              <View style={styles.ratingContainer}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>
                  {item.condition || 'Good'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: theme.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 8,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.primary,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.surface,
  },
  scroll: {
    paddingLeft: 20,
  },
  scrollContent: {
    paddingRight: 20,
  },
  itemCard: {
    width: 160,
    backgroundColor: theme.background,
    borderRadius: 16,
    marginRight: 12,
    ...theme.shadow,
  },
  promotedCard: {
    borderWidth: 2,
    borderColor: theme.primary,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.surface,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 6,
  },
  promotionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  promotionText: {
    fontSize: 8,
    fontWeight: '700',
    marginLeft: 3,
  },
  salesBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  salesText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 3,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.success,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 10,
    color: theme.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});
