import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Search, X, Clock, TrendingUp, Moon, Sun, Heart, MapPin, Star, Grid, List } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { listingsService, favoritesService, Listing } from '@/lib/services';
import { supabase } from '@/lib/supabase';
import ListingDetailsModal from '@/components/ListingDetailsModal';

interface Item {
  id: string;
  title: string;
  price: number;
  image: string;
  location: string;
  category: string;
  sold: boolean;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'All' }]);
  const { theme, themeKey, toggleTheme, toggleLanguage, t, language } = useAppContext();
  const { user } = useAuth();

  const styles = createStyles(theme);

  useEffect(() => {
    loadListings();
    loadCategories();
    if (user) {
      loadFavorites();
    }
  }, [selectedCategory, searchQuery]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await listingsService.getListings({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        limit: 50
      });
      
      if (!error && data) {
        setListings(data);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
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

  const toggleLike = async (itemId: string) => {
    if (!user) return;

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

  // Fallback Malawian products for when no database results
  const fallbackResults = [
    {
      id: '1',
      title: language === 'ny' ? 'Zoezi Skin Lightening Cream' : 'Zoezi Skin Cream',
      price: 7500,
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
      location: 'Lilongwe',
      category: 'cosmetics',
      sold: false
    },
    {
      id: '2',
      title: language === 'ny' ? 'Chitenje Waukulu' : 'Traditional Chitenje',
      price: 12000,
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
      location: 'Blantyre',
      category: 'thrift',
      sold: false
    },
    {
      id: '3',
      title: language === 'ny' ? 'Mtedza Wa Malawi' : 'Malawi Shea Butter',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
      location: 'Mangochi',
      category: 'cosmetics',
      sold: true
    },
    {
      id: '4',
      title: language === 'ny' ? 'Galimoto Yachikale' : 'Used Car',
      price: 45000,
      image: 'https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?w=400',
      location: 'Mzuzu',
      category: 'thrift',
      sold: false
    },
  ];

  // Use database listings if available, otherwise use fallback
  const searchResults = listings.length > 0 ? listings : [];
  const filteredResults = searchResults;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t.searchTitle}</Text>
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
          </View>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.selectedCategoryChipText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.resultsText}>
          {filteredResults.length} {t.resultsText}
        </Text>
        <View style={styles.viewControls}>
          <TouchableOpacity
            style={[styles.viewButton, isGridView && styles.activeViewButton]}
            onPress={() => setIsGridView(true)}
          >
            <Grid size={18} color={isGridView ? '#2563EB' : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, !isGridView && styles.activeViewButton]}
            onPress={() => setIsGridView(false)}
          >
            <List size={18} color={!isGridView ? '#2563EB' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.resultsContainer} 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : filteredResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        ) : isGridView ? (
          <View style={styles.gridContainer}>
            {filteredResults.map((item) => (
              <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => handleItemPress(item)}>
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }} 
                    style={styles.gridImage} 
                  />
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={() => toggleLike(item.id)}
                  >
                    <Heart 
                      size={16} 
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
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.itemLocation}>{item.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredResults.map((item) => (
              <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => handleItemPress(item)}>
                <Image 
                  source={{ uri: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' }} 
                  style={styles.listImage} 
                />
                <View style={styles.listItemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemPrice}>MK{item.price.toLocaleString()}</Text>
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.itemLocation}>{item.location}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.listLikeButton}>
                  <Heart 
                    size={16} 
                    color={likedItems.includes(item.id) ? '#EF4444' : '#64748B'}
                    fill={likedItems.includes(item.id) ? '#EF4444' : 'none'}
                  />
                </TouchableOpacity>
                {item.status === 'sold' && (
                  <View style={styles.listSoldBadge}>
                    <Text style={styles.soldText}>{t.sold}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ListingDetailsModal
        visible={detailsModalVisible}
        listing={selectedListing}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedListing(null);
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.surface,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  themeButton: {
    padding: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  languageButton: {
    padding: 6,
    borderRadius: 4,
  },
  languageText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  categoryScroll: {
    paddingLeft: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.background,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  selectedCategoryChipText: {
    color: theme.surface,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  viewControls: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: theme.surface,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  gridContainer: {
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
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    ...theme.shadow,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    padding: 12,
  },
  listItemInfo: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLocation: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
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
  listSoldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldText: {
    color: theme.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  listLikeButton: {
    padding: 8,
    alignSelf: 'flex-start',
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
