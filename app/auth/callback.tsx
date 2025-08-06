import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/hooks/useAppContext';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, t } = useAppContext();
  const styles = createStyles(theme);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        if (params.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            params.code as string
          );

          if (error) {
            console.error('Auth callback error:', error);
            router.replace('/(tabs)/auth/login');
            return;
          }

          if (data.session) {
            console.log('OAuth successful, redirecting to home');
            router.replace('/(tabs)/');
          }
        } else {
          // No code parameter, redirect to login
          router.replace('/(tabs)/auth/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        router.replace('/(tabs)/auth/login');
      }
    };

    handleAuthCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: theme.text,
  },
});
