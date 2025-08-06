import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Hybrid storage: Use SecureStore for small values, AsyncStorage for large ones
const HybridStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      // First try SecureStore
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue) {
        return secureValue;
      }
      
      // Fallback to AsyncStorage for large values
      const asyncValue = await AsyncStorage.getItem(`large_${key}`);
      return asyncValue;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Use SecureStore for small values (more secure)
      if (value.length <= 2048) {
        // Remove any large value that might exist
        await AsyncStorage.removeItem(`large_${key}`);
        await SecureStore.setItemAsync(key, value);
      } else {
        // Use AsyncStorage for large values
        console.warn(`Using AsyncStorage for large value: ${key} (${value.length} bytes)`);
        // Remove any secure value that might exist
        await SecureStore.deleteItemAsync(key).catch(() => {});
        await AsyncStorage.setItem(`large_${key}`, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      // Remove from both storages
      await SecureStore.deleteItemAsync(key).catch(() => {});
      await AsyncStorage.removeItem(`large_${key}`).catch(() => {});
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: HybridStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
