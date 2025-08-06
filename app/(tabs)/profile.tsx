import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { User, Settings, Star, Package, Heart, LogOut, Edit, Moon, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { BelloIcon } from '@/components/BelloIcon';
import ProfileEditModal from '@/components/ProfileEditModal';
import { Profile } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, themeKey, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const { session, user, profile, signOut, loading } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile);
  const styles = createStyles(theme);

  React.useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out');
    }
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
          <Image
            source={{ 
              uri: currentProfile?.photo_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=200' 
            }}
            style={styles.profileImage}
          />
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
          <Text style={styles.statNumber}>{currentProfile?.metadata?.listings || '0'}</Text>
          <Text style={styles.statLabel}>{t.listings}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentProfile?.metadata?.sold || '0'}</Text>
          <Text style={styles.statLabel}>{t.sold}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentProfile?.metadata?.purchased || '0'}</Text>
          <Text style={styles.statLabel}>{t.purchased}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Package size={20} color="#64748B" />
          </View>
          <Text style={styles.menuText}>{t.myListings}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Heart size={20} color="#64748B" />
          </View>
          <Text style={styles.menuText}>{t.favorites}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Settings size={20} color="#64748B" />
          </View>
          <Text style={styles.menuText}>{t.settings}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuIcon}>
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text style={[styles.menuText, styles.logoutText]}>{t.logout}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
        {currentProfile?.created_at && (
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <User size={16} color={theme.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Joined Bello</Text>
              <Text style={styles.activityTime}>
                {new Date(currentProfile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        {currentProfile?.last_login && (
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Star size={16} color="#16A34A" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Last active</Text>
              <Text style={styles.activityTime}>
                {new Date(currentProfile.last_login).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ProfileEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleProfileUpdate}
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
    color: '#1E293B',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#2563EB',
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
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
  recentActivity: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
    backgroundColor: '#F1F5F9',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },
});