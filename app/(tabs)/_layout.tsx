import { Tabs } from 'expo-router';
import { Home, Plus, User, Search, ShoppingBag, Lock } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AuthModal from '@/components/AuthModal';
import React, { useState } from 'react';

export default function TabLayout() {
  const { theme } = useAppContext();
  const { user } = useAuth();
  const router = useRouter();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: '',
    description: '',
    icon: 'lock' as 'lock' | 'user' | 'login' | 'sell' | 'cart'
  });
  
  const handleProtectedTabPress = (tabName: string, isProtected: boolean) => {
    if (isProtected && !user) {
      setAuthModalConfig({
        title: `${tabName} Requires Login`,
        description: `You need to be logged in to access ${tabName}. Please sign in or create an account to continue.`,
        icon: tabName.toLowerCase() as any,
      });
      setAuthModalVisible(true);
      return false;
    }
    return true;
  };

  const renderProtectedIcon = (IconComponent: any, size: number, color: string, isProtected: boolean) => {
    if (isProtected && !user) {
      return (
        <View style={{ position: 'relative' }}>
          <IconComponent size={size} color='#94A3B8' strokeWidth={2.5} />
          <View style={{ 
            position: 'absolute', 
            top: -2, 
            right: -2, 
            backgroundColor: '#EF4444', 
            borderRadius: 6, 
            width: 12, 
            height: 12, 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Lock size={8} color="white" />
          </View>
        </View>
      );
    }
    return <IconComponent size={size} color={color} strokeWidth={2.5} />;
  };
  
  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary || '#2563EB',
        tabBarInactiveTintColor: theme.textSecondary || '#64748B',
        tabBarStyle: {
          backgroundColor: theme.surface || '#FFFFFF',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 30,
          left: 25,
          right: 25,
          height: 75,
          borderRadius: 37.5,
          paddingBottom: 15,
          paddingTop: 15,
          paddingHorizontal: 20,
          borderWidth: 2,
          borderColor: theme.primary || '#2563EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 25,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={26} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => (
            <Search size={26} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ size, color }) => renderProtectedIcon(Plus, 26, color, true),
        }}
        listeners={{
          tabPress: (e) => {
            if (!handleProtectedTabPress('Sell', true)) {
              e.preventDefault();
            }
          }
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          title: 'Cart',
          tabBarIcon: ({ size, color }) => renderProtectedIcon(ShoppingBag, 26, color, true),
        }}
        listeners={{
          tabPress: (e) => {
            if (!handleProtectedTabPress('Cart', true)) {
              e.preventDefault();
            }
          }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={26} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
    <AuthModal 
      visible={authModalVisible}
      onClose={() => setAuthModalVisible(false)}
      title={authModalConfig.title}
      description={authModalConfig.description}
      icon={authModalConfig.icon}
    />
    </>
  );
}
