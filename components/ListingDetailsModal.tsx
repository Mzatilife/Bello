import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share
} from 'react-native';
import {
  X,
  Heart,
  Share as ShareIcon,
  MapPin,
  Calendar,
  User,
  Star,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Listing, listingsService, favoritesService } from '@/lib/services';

interface ListingDetailsModalProps {
  visible: boolean;
  listing: Listing | null;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ListingDetailsModal({ visible, listing, onClose }: ListingDetailsModalProps) {
  const { theme, t } = useAppContext();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listingDetails, setListingDetails] = useState<any>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const styles = createStyles(theme);

  useEffect(() => {
    if (listing) {
      loadListingDetails();
      if (user) {
        checkIfFavorited();
      }
    }
  }, [listing, user]);

  const loadListingDetails = async () => {
    if (!listing) return;
    
    try {
      const { data, error } = await listingsService.getListingWithProfile(listing.id);
      if (!error && data) {
        setListingDetails(data);
        setFavoritesCount(data.favorites_count || 0);
      }
    } catch (error) {
      console.error('Error loading listing details:', error);
    }
  };

  const checkIfFavorited = async () => {
    if (!listing || !user) return;
    
    try {
      const { data } = await favoritesService.isFavorited(listing.id);
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking if favorited:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!listing || !user) {
      Alert.alert('Login Required', 'Please log in to add items to favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        const { error } = await favoritesService.removeFromFavorites(listing.id);
        if (!error) {
          setIsFavorited(false);
          setFavoritesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await favoritesService.addToFavorites(listing.id);
        if (!error) {
          setIsFavorited(true);
          setFavoritesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!listing) return;

    try {
      await Share.share({
        message: `Check out this item: ${listing.title} - MK${listing.price.toLocaleString()}`,
        title: listing.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePrevImage = () => {
    if (!listing?.images || listing.images.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? listing.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!listing?.images || listing.images.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === listing.images!.length - 1 ? 0 : prev + 1
    );
  };

  if (!listing) return null;

  const hasImages = listing.images && listing.images.length > 0;
  const currentImage = hasImages ? listing.images![currentImageIndex] : null;

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
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <ShareIcon size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={[styles.actionButton, { opacity: loading ? 0.5 : 1 }]}
              disabled={loading}
            >
              <Heart
                size={20}
                color={isFavorited ? '#EF4444' : theme.text}
                fill={isFavorited ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Images */}
          {hasImages ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentImage }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {listing.images!.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.prevButton]}
                    onPress={handlePrevImage}
                  >
                    <ChevronLeft size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.nextButton]}
                    onPress={handleNextImage}
                  >
                    <ChevronRight size={24} color="white" />
                  </TouchableOpacity>
                  <View style={styles.imageIndicator}>
                    <Text style={styles.imageIndicatorText}>
                      {currentImageIndex + 1} / {listing.images!.length}
                    </Text>
                  </View>
                </>
              )}
              {listing.status === 'sold' && (
                <View style={styles.soldOverlay}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}

          {/* Listing Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.priceSection}>
              <Text style={styles.price}>MK{listing.price.toLocaleString()}</Text>
              {listing.status === 'sold' && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>SOLD</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{listing.title}</Text>

            {listing.location && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text style={styles.location}>{listing.location}</Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={theme.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(listing.created_at).toLocaleDateString()}
                </Text>
              </View>
              {listing.condition && (
                <View style={styles.metaItem}>
                  <Star size={16} color={theme.textSecondary} />
                  <Text style={styles.metaText}>{listing.condition}</Text>
                </View>
              )}
            </View>

            {listing.category && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Category:</Text>
                <Text style={styles.categoryText}>{listing.category}</Text>
              </View>
            )}

            {listing.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{listing.description}</Text>
              </View>
            )}

            {/* Seller Info */}
            <View style={styles.sellerSection}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  {listingDetails?.profiles?.photo_url ? (
                    <Image 
                      source={{ uri: listingDetails.profiles.photo_url }} 
                      style={styles.sellerAvatarImage}
                    />
                  ) : (
                    <User size={24} color={theme.textSecondary} />
                  )}
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>
                    {listingDetails?.profiles?.display_name || 'Anonymous Seller'}
                  </Text>
                  <View style={styles.sellerRating}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {favoritesCount > 0 
                        ? `${Math.min(5.0, 3.5 + (favoritesCount * 0.1)).toFixed(1)} (${favoritesCount} ${favoritesCount === 1 ? 'favorite' : 'favorites'})`
                        : 'New seller'
                      }
                    </Text>
                  </View>
                  {listingDetails?.seller_listings_count && (
                    <Text style={styles.sellerStats}>
                      {listingDetails.seller_listings_count} active listings
                    </Text>
                  )}
                  {listingDetails?.profiles?.created_at && (
                    <Text style={styles.sellerJoined}>
                      Joined {new Date(listingDetails.profiles.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {listing.status !== 'sold' && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.messageButton}>
              <MessageCircle size={20} color={theme.surface} />
              <Text style={styles.buttonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callButton}>
              <Phone size={20} color={theme.primary} />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  soldOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: theme.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  soldText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  noImageContainer: {
    height: 200,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  detailsContainer: {
    padding: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.success,
  },
  statusBadge: {
    backgroundColor: theme.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 16,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
  },
  sellerSection: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 20,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  sellerStats: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  sellerJoined: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  callButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
