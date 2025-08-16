import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink, X, Eye, Clock, Target } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import EnhancedImage from './EnhancedImage';
import NotificationModal from './NotificationModal';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  type: 'banner' | 'product' | 'service' | 'event';
  priority: 'high' | 'medium' | 'low';
  duration_days: number;
  views_count: number;
  clicks_count: number;
  start_date: string;
  end_date: string;
  target_audience?: string[];
  is_active: boolean;
}

interface AdvertisementBannerProps {
  onAdClick?: (ad: Advertisement) => void;
  maxAds?: number;
  autoScroll?: boolean;
  showCloseButton?: boolean;
}

export default function AdvertisementBanner({
  onAdClick,
  maxAds = 3,
  autoScroll = true,
  showCloseButton = true
}: AdvertisementBannerProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [hiddenAds, setHiddenAds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { theme } = useAppContext();
  const styles = createStyles(theme);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  useEffect(() => {
    if (autoScroll && advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => {
          const visibleAds = advertisements.filter(ad => !hiddenAds.includes(ad.id));
          return visibleAds.length > 0 ? (prev + 1) % visibleAds.length : 0;
        });
      }, 5000); // Auto-scroll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoScroll, advertisements, hiddenAds]);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      
      // Mock advertisement data - in a real app, this would come from your backend
      const mockAds: Advertisement[] = [
        {
          id: '1',
          title: 'Flash Sale - 50% Off Electronics',
          description: 'Limited time offer on all electronic items',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=200&fit=crop',
          link: 'https://example.com/electronics-sale',
          type: 'banner',
          priority: 'high',
          duration_days: 7,
          views_count: 1250,
          clicks_count: 89,
          start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          target_audience: ['electronics', 'tech', 'gadgets'],
          is_active: true
        },
        {
          id: '2',
          title: 'New Fashion Collection',
          description: 'Discover the latest trends in African fashion',
          image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=200&fit=crop',
          link: 'https://example.com/fashion-collection',
          type: 'product',
          priority: 'medium',
          duration_days: 14,
          views_count: 890,
          clicks_count: 45,
          start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
          target_audience: ['fashion', 'clothing', 'style'],
          is_active: true
        },
        {
          id: '3',
          title: 'Premium Seller Program',
          description: 'Boost your sales with premium listing features',
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=200&fit=crop',
          type: 'service',
          priority: 'medium',
          duration_days: 30,
          views_count: 456,
          clicks_count: 23,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          target_audience: ['sellers', 'business'],
          is_active: true
        }
      ];

      // Filter active ads and sort by priority
      const activeAds = mockAds
        .filter(ad => ad.is_active && new Date(ad.end_date) > new Date())
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        })
        .slice(0, maxAds);

      setAdvertisements(activeAds);
    } catch (error) {
      console.error('Error loading advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (ad: Advertisement) => {
    try {
      // Track click
      // In a real app, you'd update the clicks_count in your backend
      console.log('Ad clicked:', ad.id);
      
      if (onAdClick) {
        onAdClick(ad);
      } else if (ad.link) {
        // Open external link
        const supported = await Linking.canOpenURL(ad.link);
        if (supported) {
          await Linking.openURL(ad.link);
        } else {
          setErrorMessage('Cannot open this link');
          setErrorModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Error handling ad click:', error);
      setErrorMessage('Failed to open advertisement');
      setErrorModalVisible(true);
    }
  };

  const handleHideAd = (adId: string) => {
    setHiddenAds(prev => [...prev, adId]);
  };

  const getTypeIcon = (type: Advertisement['type']) => {
    switch (type) {
      case 'banner':
        return <Target size={12} color={theme.primary} />;
      case 'product':
        return <Eye size={12} color={theme.success} />;
      case 'service':
        return <Clock size={12} color={theme.warning} />;
      case 'event':
        return <ExternalLink size={12} color={theme.error} />;
      default:
        return null;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return null; // Don't show loading state for ads
  }

  const visibleAds = advertisements.filter(ad => !hiddenAds.includes(ad.id));

  if (visibleAds.length === 0) {
    return null; // Don't render if no ads
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleAds.map((ad, index) => (
          <TouchableOpacity
            key={ad.id}
            style={[
              styles.adCard,
              ad.priority === 'high' && styles.highPriorityCard
            ]}
            onPress={() => handleAdClick(ad)}
            activeOpacity={0.9}
          >
            <View style={styles.imageContainer}>
              <EnhancedImage
                uri={ad.image}
                fallbackUri='https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=200&fit=crop'
                style={styles.adImage}
                showLoadingIndicator={false}
              />
              
              {/* Overlay gradient */}
              <View style={styles.imageOverlay} />
              
              {/* Priority Badge */}
              {ad.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>HOT</Text>
                </View>
              )}
              
              {/* Close Button */}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => handleHideAd(ad.id)}
                >
                  <X size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.adContent}>
              <View style={styles.adHeader}>
                <View style={styles.typeContainer}>
                  {getTypeIcon(ad.type)}
                  <Text style={styles.typeText}>{ad.type.toUpperCase()}</Text>
                </View>
                
                <Text style={styles.daysRemaining}>
                  {getDaysRemaining(ad.end_date)} days left
                </Text>
              </View>
              
              <Text style={styles.adTitle} numberOfLines={1}>
                {ad.title}
              </Text>
              
              <Text style={styles.adDescription} numberOfLines={2}>
                {ad.description}
              </Text>
              
              <View style={styles.adStats}>
                <View style={styles.statItem}>
                  <Eye size={10} color={theme.textSecondary} />
                  <Text style={styles.statText}>
                    {ad.views_count.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <ExternalLink size={10} color={theme.textSecondary} />
                  <Text style={styles.statText}>
                    {ad.clicks_count.toLocaleString()}
                  </Text>
                </View>
                
                {ad.link && (
                  <View style={styles.linkIndicator}>
                    <ExternalLink size={12} color={theme.primary} />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Page Indicators */}
      {visibleAds.length > 1 && (
        <View style={styles.indicators}>
          {visibleAds.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentAdIndex && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      )}
      
      <NotificationModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        type="error"
        title="Link Error"
        message={errorMessage}
        buttons={[
          {
            text: "OK",
            style: "primary",
            onPress: () => setErrorModalVisible(false)
          }
        ]}
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollView: {
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  adCard: {
    width: 320,
    height: 140,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    ...theme.shadow,
  },
  highPriorityCard: {
    borderWidth: 2,
    borderColor: theme.error,
    shadowColor: theme.error,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    width: 140,
    height: '100%',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  priorityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  adContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 4,
  },
  daysRemaining: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.warning,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 11,
    color: theme.textSecondary,
    lineHeight: 14,
    marginBottom: 8,
  },
  adStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 9,
    color: theme.textSecondary,
    marginLeft: 3,
  },
  linkIndicator: {
    padding: 4,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: theme.primary,
    width: 20,
  },
});
