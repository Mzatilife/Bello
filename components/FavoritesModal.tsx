import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  X,
  Heart,
  MapPin,
  Calendar,
  Star,
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Listing, favoritesService } from '@/lib/services';
import EnhancedImage from '@/components/EnhancedImage';
import { notificationService } from '@/lib/notificationService';

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  onItemPress?: (listing: Listing) => void;
}

interface FavoriteWithListing {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings: Listing;
}

export default function FavoritesModal({ visible, onClose, onItemPress }: FavoritesModalProps) {
  const { theme } = useAppContext();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible && user) {
      loadFavorites();
    }
  }, [visible, user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await favoritesService.getFavoritesWithListings();
      
      if (!error && data) {
        // Filter out favorites where the listing might be deleted or null
        const validFavorites = data.filter(
          (fav: FavoriteWithListing) => fav.listings && fav.listings.status !== 'deleted'
        );
        setFavorites(validFavorites);
      } else {
        console.error('Error loading favorites:', error);
      }
    } catch (error) {
      console.error('Exception loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (listingId: string) => {
    setRemovingFavorite(listingId);
    
    try {
      const { error } = await favoritesService.removeFromFavorites(listingId);
      
      if (!error) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId));
        
        notificationService.success('Removed', 'Item removed from favorites');
      } else {
        notificationService.error('Error', 'Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      notificationService.error('Error', 'Failed to remove from favorites');
    } finally {
      setRemovingFavorite(null);
    }
  };

  const handleItemPress = (listing: Listing) => {
    if (onItemPress) {
      onItemPress(listing);
    }
  };

  const renderFavoriteItem = (favorite: FavoriteWithListing) => {
    const listing = favorite.listings;
    
    return (
      <TouchableOpacity 
        key={favorite.id} 
        style={styles.favoriteItem}
        onPress={() => handleItemPress(listing)}
      >
        <View style={styles.favoriteImage}>
          <EnhancedImage
            uri={listing.images && listing.images[0] ? listing.images[0] : null}
            fallbackUri="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400"
            style={styles.itemImage}
            showLoadingIndicator={true}
          />
          {listing.status === 'sold' && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>SOLD</Text>
            </View>
          )}
        </View>
        
        <View style={styles.favoriteContent}>
          <Text style={styles.favoriteTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          
          <Text style={styles.favoritePrice}>
            MK{listing.price.toLocaleString()}
          </Text>
          
          {listing.location && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={theme.textSecondary} />
              <Text style={styles.locationText}>{listing.location}</Text>
            </View>
          )}
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={12} color={theme.textSecondary} />
              <Text style={styles.metaText}>
                {new Date(listing.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            {listing.condition && (
              <View style={styles.metaItem}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.metaText}>{listing.condition}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.favoriteFooter}>
            <Text style={styles.favoritedDate}>
              Added {new Date(favorite.created_at).toLocaleDateString()}
            </Text>
            
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: listing.status === 'active' 
                  ? theme.success + '20' 
                  : theme.error + '20'
              }
            ]}>
              <Text style={[
                styles.statusText,
                {
                  color: listing.status === 'active' 
                    ? theme.success 
                    : theme.error
                }
              ]}>
                {listing.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Remove from Favorites Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.removeButton,
              { opacity: removingFavorite === listing.id ? 0.5 : 1 }
            ]}
            onPress={() => handleRemoveFavorite(listing.id)}
            disabled={removingFavorite === listing.id}
          >
            {removingFavorite === listing.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Heart size={16} color="#EF4444" fill="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Favorites</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Summary */}
        {!loading && (
          <View style={styles.summaryContainer}>
            <Heart size={20} color="#EF4444" fill="#EF4444" />
            <Text style={styles.summaryText}>
              {favorites.length} favorite {favorites.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading your favorites...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={48} color={theme.textSecondary} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
              Items you favorite will appear here. Browse the marketplace and tap the heart icon on items you like!
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.favoritesContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
              />
            }
          >
            {favorites.map(renderFavoriteItem)}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 32,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  favoritesContainer: {
    flex: 1,
    padding: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadow,
  },
  favoriteImage: {
    position: 'relative',
  },
  itemImage: {
    width: 100,
    height: 120,
  },
  soldBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: theme.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteContent: {
    flex: 1,
    padding: 12,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  favoritePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.success,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginLeft: 2,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  favoritedDate: {
    fontSize: 11,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow,
  },
});
