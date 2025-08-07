import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Search, Bell, MapPin, Heart, Star, Grid, List, Moon, Sun, ShoppingCart } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { BelloIcon } from '@/components/BelloIcon';
import ListingDetailsModal from '@/components/ListingDetailsModal';
import { listingsService, favoritesService, Listing } from '@/lib/services';
import { cartService } from '@/lib/cartServices';
import { supabase } from '@/lib/supabase';
import CartModal from '@/components/CartModal';
import EnhancedImage from '@/components/EnhancedImage';
import { useListingsRefresh } from '@/context/ListingsRefreshContext';

const mockItems = [
  // Cosmetics
  {
    id: '1',
    title: 'Zoezi Skin Lightening Cream',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    location: 'Lilongwe',
    rating: 4.2,
    sold: false,
    category: 'cosmetics'
  },
  {
    id: '2',
    title: 'African Queen Hair Oil',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    location: 'Blantyre',
    rating: 4.5,
    sold: false,
    category: 'cosmetics'
  },
  // Thrift Items
  {
    id: '3',
    title: 'Second-hand Jeans',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    location: 'Mzuzu',
    rating: 4.0,
    sold: true,
    category: 'thrift'
  },
  {
    id: '4',
    title: 'Vintage Chitenje Dress',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    location: 'Zomba',
    rating: 4.7,
    sold: false,
    category: 'thrift'
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'All' }]);
  
  const { theme, themeKey, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const { user } = useAuth();
  const { refreshTrigger } = useListingsRefresh();
  
  const styles = createStyles(theme);

  useEffect(() => {
    loadListings();
    loadCategories();
  }, [activeCategory, searchQuery, refreshTrigger]); // Add refreshTrigger dependency

  useEffect(() => {
    if (user) {
      loadFavorites();
      loadCartCount();
    } else {
      setLikedItems([]);
      setCartItemsCount(0);
    }
  }, [user]);

  const loadListings = async () => {
    try {
      setLoading(true);
      // Find the actual category name from the categories array
      const selectedCategory = categories.find(cat => cat.id === activeCategory);
      const categoryName = selectedCategory && selectedCategory.id !== 'all' ? selectedCategory.name : undefined;
      
      const { data, error } = await listingsService.getListings({
        category: categoryName,
        search: searchQuery || undefined,
        limit: 20
      });
      
      if (!error && data) {
        setListings(data);
      } else if (error) {
        console.error('Error loading listings:', error);
      }
    } catch (error) {
      console.error('Exception loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);
      
      if (!error && data) {
        const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
        const categoryOptions = [
          { id: 'all', name: 'All' },
          ...uniqueCategories.map(cat => ({
            id: (cat as string).toLowerCase().replace(/[^a-z0-9]/g, ''), 
            name: cat as string
          }))
        ];
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const { data } = await favoritesService.getFavorites();
      if (data) {
        const favoriteIds = data.map((fav: any) => fav.listing_id);
        setLikedItems(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadCartCount = async () => {
    try {
      const { data } = await cartService.getCartSummary();
      if (data) {
        setCartItemsCount(data.totalItems);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const toggleLike = async (itemId: string) => {
    if (!user) {
      // Handle non-authenticated user
      return;
    }

    try {
      if (likedItems.includes(itemId)) {
        await favoritesService.removeFromFavorites(itemId);
        setLikedItems(prev => prev.filter(id => id !== itemId));
      } else {
        await favoritesService.addToFavorites(itemId);
        setLikedItems(prev => [...prev, itemId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleItemPress = (listing: Listing) => {
    setSelectedListing(listing);
    setDetailsModalVisible(true);
  };

  // Use the loaded listings directly since filtering is done server-side
  const filteredItems = listings;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <BelloIcon size={28} color={theme.primary} />
            <Text style={styles.greeting}>{t.greeting}</Text>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.border }]}>
              {themeKey === 'light' ? 
                <Moon size={16} color={theme.textSecondary} /> : 
                <Sun size={16} color={theme.textSecondary} />
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleLanguage} style={[styles.languageButton, { backgroundColor: theme.border }]}>
              <Text style={[styles.languageText, { color: theme.text }]}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cartButton} onPress={() => setCartModalVisible(true)}>
              <ShoppingCart size={24} color={theme.textSecondary} />
              {cartItemsCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemsCount > 99 ? '99+' : cartItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#64748B"
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.categoriesTitle}</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              onPress={() => setViewMode('grid')} 
              style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
            >
              <Grid size={20} color={viewMode === 'grid' ? '#2563EB' : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode('list')} 
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
            >
              <List size={20} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryCard,
                activeCategory === category.id && styles.activeCategoryCard
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.activeCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>{t.recentItems}</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.itemsGrid}>
            {filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => handleItemPress(item)}>
                <View style={styles.imageContainer}>
                  <EnhancedImage 
                    uri={item.images && item.images[0] ? item.images[0] : null}
                    fallbackUri='https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
                    style={styles.itemImage}
                    showLoadingIndicator={true}
                  />
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={() => toggleLike(item.id)}
                  >
                    <Heart 
                      size={20} 
                      color={likedItems.includes(item.id) ? '#EF4444' : '#64748B'}
                      fill={likedItems.includes(item.id) ? '#EF4444' : 'none'}
                    />
                  </TouchableOpacity>
                  {item.status === 'sold' && (
                    <View style={styles.soldBadge}>
                      <Text style={styles.soldText}>{t.sold}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.itemPrice}>MK{item.price.toLocaleString()}</Text>
                  <View style={styles.itemMeta}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.itemLocation}>{item.location}</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{item.condition || 'Good'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.itemsList}>
            {filteredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => handleItemPress(item)}>
                <EnhancedImage 
                  uri={item.images && item.images[0] ? item.images[0] : null}
                  fallbackUri='https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'
                  style={styles.listImage}
                  showLoadingIndicator={true}
                />
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemPrice}>MK{item.price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.itemMeta}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.itemLocation}>{item.location}</Text>
                  </View>
                  <View style={styles.listItemFooter}>
                    <View style={styles.ratingContainer}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>{item.condition || 'Good'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleLike(item.id)}>
                      <Heart 
                        size={16} 
                        color={likedItems.includes(item.id) ? '#EF4444' : '#64748B'}
                        fill={likedItems.includes(item.id) ? '#EF4444' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {item.status === 'sold' && (
                  <View style={styles.listSoldBadge}>
                    <Text style={styles.soldText}>{t.sold}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ListingDetailsModal
        visible={detailsModalVisible}
        listing={selectedListing}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedListing(null);
          // Reload cart count in case something was added
          if (user) {
            loadCartCount();
          }
        }}
      />
      
      <CartModal
        visible={cartModalVisible}
        onClose={() => {
          setCartModalVisible(false);
          // Reload cart count after modal closes
          if (user) {
            loadCartCount();
          }
        }}
      />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    padding: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  languageButton: {
    padding: 6,
    backgroundColor: theme.border,
    borderRadius: 4,
    marginRight: 12,
  },
  languageText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 8,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  categoriesContainer: {
    paddingVertical: 16,
    backgroundColor: theme.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 6,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: theme.surface,
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: theme.background,
    marginRight: 8,
  },
  activeCategoryCard: {
    backgroundColor: theme.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeCategoryText: {
    color: theme.surface,
  },
  itemsContainer: {
    padding: 20,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 16,
    ...theme.shadow,
  },
  itemsList: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    ...theme.shadow,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listSoldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldText: {
    color: theme.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.success,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
});
