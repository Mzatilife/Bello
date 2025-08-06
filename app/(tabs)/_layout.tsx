import { Tabs } from 'expo-router';
import { Home, Plus, User, Search, MessageCircle, Lock } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { View } from 'react-native';

export default function TabLayout() {
  const { theme } = useAppContext();
  const { user } = useAuth();
  
  const renderProtectedIcon = (IconComponent: any, size: number, color: string, isProtected: boolean) => {
    if (isProtected && !user) {
      return (
        <View style={{ position: 'relative' }}>
          <IconComponent size={size} color={color} strokeWidth={2.5} />
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
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => renderProtectedIcon(MessageCircle, 26, color, true),
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
  );
}
