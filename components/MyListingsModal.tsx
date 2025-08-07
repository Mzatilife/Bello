import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  X,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Eye,
  Heart,
  Package,
  Star,
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Listing, listingsService } from '@/lib/services';
import EnhancedImage from '@/components/EnhancedImage';
import { notificationService } from '@/lib/notificationService';
import EditListingModal from '@/components/EditListingModal';

interface MyListingsModalProps {
  visible: boolean;
  onClose: () => void;
  onListingUpdate?: () => void;
}

export default function MyListingsModal({ visible, onClose, onListingUpdate }: MyListingsModalProps) {
  const { theme } = useAppContext();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedListingForEdit, setSelectedListingForEdit] = useState<Listing | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible && user) {
      loadUserListings();
    }
  }, [visible, user]);

  const loadUserListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await listingsService.getUserListings();
      
      if (!error && data) {
        setListings(data);
      } else {
        console.error('Error loading user listings:', error);
      }
    } catch (error) {
      console.error('Exception loading user listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserListings();
    setRefreshing(false);
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListingForEdit(listing);
    setEditModalVisible(true);
  };

  const handleListingUpdated = (updatedListing: Listing) => {
    // Update the listing in the local state
    setListings(prev => 
      prev.map(listing => 
        listing.id === updatedListing.id ? updatedListing : listing
      )
    );
    
    // Notify parent component
    if (onListingUpdate) {
      onListingUpdate();
    }
  };

  const handleDeleteListing = (listing: Listing) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteListing(listing.id)
        }
      ]
    );
  };

  const confirmDeleteListing = async (listingId: string) => {
    try {
      const { error } = await listingsService.deleteListing(listingId);
      
      if (!error) {
        // Remove from local state
        setListings(prev => prev.filter(listing => listing.id !== listingId));
        
        notificationService.success('Success', 'Listing deleted successfully');
        
        // Notify parent to refresh if needed
        if (onListingUpdate) {
          onListingUpdate();
        }
      } else {
        notificationService.error('Error', 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      notificationService.error('Error', 'Failed to delete listing');
    }
  };

  const getFilteredListings = () => {
    switch (activeFilter) {
      case 'active':
        return listings.filter(listing => listing.status === 'active');
      case 'sold':
        return listings.filter(listing => listing.status === 'sold');
      default:
        return listings.filter(listing => listing.status !== 'deleted');
    }
  };

  const filteredListings = getFilteredListings();

  const renderListingItem = (listing: Listing) => (
    <View key={listing.id} style={styles.listingItem}>
      <View style={styles.listingImage}>
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
      
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        
        <Text style={styles.listingPrice}>
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
          
          <View style={styles.metaItem}>
            <Eye size={12} color={theme.textSecondary} />
            <Text style={styles.metaText}>{listing.views || 0}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Heart size={12} color={theme.textSecondary} />
            <Text style={styles.metaText}>{listing.likes || 0}</Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: listing.status === 'active' 
                ? theme.success + '20' 
                : listing.status === 'sold' 
                ? theme.error + '20' 
                : theme.textSecondary + '20'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: listing.status === 'active' 
                  ? theme.success 
                  : listing.status === 'sold' 
                  ? theme.error 
                  : theme.textSecondary
              }
            ]}>
              {listing.status.toUpperCase()}
            </Text>
          </View>
          
          {listing.condition && (
            <View style={styles.conditionRow}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Action Buttons */}
      {listing.status !== 'sold' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditListing(listing)}
          >
            <Edit size={16} color={theme.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteListing(listing)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
          <Text style={styles.headerTitle}>My Listings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['all', 'active', 'sold'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter && styles.activeFilterTabText
              ]}>
                {filter === 'all' 
                  ? `All (${listings.filter(l => l.status !== 'deleted').length})`
                  : filter === 'active'
                  ? `Active (${listings.filter(l => l.status === 'active').length})`
                  : `Sold (${listings.filter(l => l.status === 'sold').length})`
                }
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading your listings...</Text>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={48} color={theme.textSecondary} />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' 
                ? 'No Listings Yet'
                : activeFilter === 'active'
                ? 'No Active Listings'
                : 'No Sold Items'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' 
                ? "You haven't created any listings yet. Start selling by adding your first item!"
                : activeFilter === 'active'
                ? "You don't have any active listings at the moment."
                : "You haven't sold any items yet."
              }
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.listingsContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
              />
            }
          >
            {filteredListings.map(renderListingItem)}
          </ScrollView>
        )}
      </View>

      <EditListingModal
        visible={editModalVisible}
        listing={selectedListingForEdit}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedListingForEdit(null);
        }}
        onUpdate={handleListingUpdated}
      />
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
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: theme.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeFilterTabText: {
    color: theme.surface,
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
  listingsContainer: {
    flex: 1,
    padding: 16,
  },
  listingItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadow,
  },
  listingImage: {
    position: 'relative',
  },
  itemImage: {
    width: 100,
    height: 100,
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
  listingContent: {
    flex: 1,
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  listingPrice: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginLeft: 2,
  },
  actionButtons: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow,
  },
});
