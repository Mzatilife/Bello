import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { User, Settings, Star, Package, Heart, LogOut, Edit, Moon, Sun, Activity, ShoppingBag, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { BelloIcon } from '@/components/BelloIcon';
import ProfileEditModal from '@/components/ProfileEditModal';
import { Profile } from '@/context/AuthContext';
import { listingsService, favoritesService, Listing } from '@/lib/services';
import { notificationService } from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';
import EnhancedImage from '@/components/EnhancedImage';
import MyListingsModal from '@/components/MyListingsModal';
import FavoritesModal from '@/components/FavoritesModal';
import ListingDetailsModal from '@/components/ListingDetailsModal';

interface UserStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  favoriteListings: number;
  totalOrders: number;
}

interface ActivityItem {
  id: string;
  type: 'joined' | 'listed' | 'sold' | 'favorited' | 'ordered' | 'login';
  title: string;
  description?: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, themeKey, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const { session, user, profile, signOut, loading } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile);
  const [userStats, setUserStats] = useState<UserStats>({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    favoriteListings: 0,
    totalOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [myListingsVisible, setMyListingsVisible] = useState(false);
  const [favoritesVisible, setFavoritesVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingDetailsVisible, setListingDetailsVisible] = useState(false);
  const styles = createStyles(theme);

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadRecentActivity();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      setStatsLoading(true);
      
      // Get user's listings
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, status')
        .eq('user_id', user.id);
      
      // Get user's favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id);
      
      // Get user's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id);
      
      if (!listingsError && listings) {
        const stats = listings.reduce((acc, listing) => {
          acc.totalListings++;
          if (listing.status === 'active') acc.activeListings++;
          if (listing.status === 'sold') acc.soldListings++;
          return acc;
        }, { totalListings: 0, activeListings: 0, soldListings: 0 });
        
        setUserStats({
          ...stats,
          favoriteListings: favorites?.length || 0,
          totalOrders: orders?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  const loadRecentActivity = async () => {
    if (!user) return;
    
    try {
      const activities: ActivityItem[] = [];
      
      // Add join date
      if (currentProfile?.created_at) {
        activities.push({
          id: 'joined',
          type: 'joined',
          title: 'Joined Bello',
          timestamp: currentProfile.created_at,
          icon: User,
          color: theme.primary,
        });
      }
      
      // Add recent listings
      const { data: recentListings } = await supabase
        .from('listings')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      recentListings?.forEach(listing => {
        activities.push({
          id: `listing-${listing.id}`,
          type: 'listed',
          title: 'Listed an item',
          description: listing.title,
          timestamp: listing.created_at,
          icon: Package,
          color: theme.success,
        });
      });
      
      // Add recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);
      
      recentOrders?.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'ordered',
          title: 'Placed an order',
          description: `Order #${order.id.slice(0, 8)}`,
          timestamp: order.created_at,
          icon: ShoppingBag,
          color: theme.primary,
        });
      });
      
      // Add last login
      if (currentProfile?.last_login) {
        activities.push({
          id: 'last-login',
          type: 'login',
          title: 'Last active',
          timestamp: currentProfile.last_login,
          icon: Clock,
          color: '#16A34A',
        });
      }
      
      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentActivity(activities.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };
  
  const handleLogout = async () => {
    notificationService.confirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        const { error } = await signOut();
        if (error) {
          notificationService.error('Error', 'Failed to sign out');
        }
      },
      undefined,
      'Sign Out',
      'Cancel'
    );
  };
  
  const handleMyListings = () => {
    setMyListingsVisible(true);
  };
  
  const handleFavorites = () => {
    setFavoritesVisible(true);
  };

  const handleFavoriteItemPress = (listing: Listing) => {
    setSelectedListing(listing);
    setListingDetailsVisible(true);
    setFavoritesVisible(false);
  };

  const handleListingDetailsClose = () => {
    setListingDetailsVisible(false);
    setSelectedListing(null);
    // Reload stats in case something changed
    if (user) {
      loadUserStats();
    }
  };

  const handleListingUpdate = () => {
    // Reload stats when a listing is updated/deleted
    if (user) {
      loadUserStats();
      loadRecentActivity();
    }
  };
  
  const handleSettings = () => {
    notificationService.info(
      'Settings',
      'App settings and preferences:\n\n• Theme: Switch between light and dark mode\n• Language: Toggle between English and Chichewa\n• Notifications: Manage your notification preferences\n• Account: Edit your profile information',
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Edit Profile', style: 'primary', onPress: () => setEditModalVisible(true) },
      ]
    );
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setCurrentProfile(updatedProfile);
  };

  // Show login prompt if not authenticated
  if (!session || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
        <View style={styles.authContent}>
          <View style={styles.authIcon}>
            <BelloIcon size={64} color={theme.primary} />
          </View>
          <Text style={styles.authTitle}>{t.welcome}</Text>
          <Text style={styles.authSubtitle}>{t.profileSubtitle}</Text>
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>{t.login}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>{t.register}</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 140}}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.profileImageContainer}>
            {currentProfile?.photo_url || user?.user_metadata?.avatar_url ? (
              <EnhancedImage
                uri={currentProfile?.photo_url || user?.user_metadata?.avatar_url}
                fallbackUri={null}
                style={styles.profileImage}
                showLoadingIndicator={false}
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <User size={32} color={theme.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>
                {currentProfile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(true)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
                <Edit size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileEmail}>
              {user?.email || 'No email'}
            </Text>
            {currentProfile?.metadata?.location && (
              <Text style={styles.locationText}>
                📍 {currentProfile.metadata.location}
              </Text>
            )}
            {currentProfile?.metadata?.bio && (
              <Text style={styles.bioText}>
                {currentProfile.metadata.bio}
              </Text>
            )}
            <View style={styles.ratingContainer}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>
                {currentProfile?.metadata?.rating || '4.8'} ({currentProfile?.metadata?.reviews || '0'} reviews)
              </Text>
            </View>
            {currentProfile?.provider && currentProfile.provider !== 'email' && (
              <Text style={styles.providerText}>
                Signed in with {currentProfile.provider.charAt(0).toUpperCase() + currentProfile.provider.slice(1)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.border }]}>
            {themeKey === 'light' ? 
              <Moon size={16} color={theme.textSecondary} /> : 
              <Sun size={16} color={theme.textSecondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statsLoading ? '-' : userStats.totalListings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statsLoading ? '-' : userStats.soldListings}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statsLoading ? '-' : userStats.favoriteListings}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleMyListings}>
          <View style={styles.menuIcon}>
            <Package size={20} color={theme.textSecondary} />
          </View>
          <Text style={styles.menuText}>My Listings</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{userStats.totalListings}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleFavorites}>
          <View style={styles.menuIcon}>
            <Heart size={20} color={theme.textSecondary} />
          </View>
          <Text style={styles.menuText}>Favorites</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{userStats.favoriteListings}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
          <View style={styles.menuIcon}>
            <Settings size={20} color={theme.textSecondary} />
          </View>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuIcon}>
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                <activity.icon size={16} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.title}</Text>
                {activity.description && (
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                )}
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyActivity}>
            <Activity size={32} color={theme.textSecondary} />
            <Text style={styles.emptyActivityText}>No recent activity</Text>
            <Text style={styles.emptyActivitySubtext}>Start browsing and interacting with the marketplace!</Text>
          </View>
        )}
      </View>

      <ProfileEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleProfileUpdate}
      />

      <MyListingsModal
        visible={myListingsVisible}
        onClose={() => setMyListingsVisible(false)}
        onListingUpdate={handleListingUpdate}
      />

      <FavoritesModal
        visible={favoritesVisible}
        onClose={() => setFavoritesVisible(false)}
        onItemPress={handleFavoriteItemPress}
      />

      <ListingDetailsModal
        visible={listingDetailsVisible}
        listing={selectedListing}
        onClose={handleListingDetailsClose}
      />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authContent: {
    width: '100%',
    alignItems: 'center',
  },
  authIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#EFF6FF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    width: '100%',
    backgroundColor: theme.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButtonText: {
    color: theme.primary,
    fontWeight: '600',
    marginRight: 6,
    fontSize: 14,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  providerText: {
    fontSize: 12,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: 2,
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
  },
  languageText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  menuContainer: {
    backgroundColor: theme.surface,
    marginTop: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  badge: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: theme.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  menuIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.background,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
  recentActivity: {
    backgroundColor: theme.surface,
    marginTop: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  activityDescription: {
    fontSize: 13,
    color: theme.text,
    marginBottom: 2,
    fontWeight: '500',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});