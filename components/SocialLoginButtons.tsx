import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '@/hooks/useAppContext';

const SocialLoginButtons = () => {
  const { signInWithOAuth, loading } = useAuth();
  const { theme } = useAppContext();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithOAuth('google');
      
      if (error) {
        console.log('Google sign-in error', error);
        Alert.alert('Error', `Google sign-in failed: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      Alert.alert('Error', 'Google sign-in is not available in this environment');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await signInWithOAuth('apple');
      
      if (error) {
        console.log('Apple sign-in error', error);
        Alert.alert('Error', `Apple sign-in failed: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Apple OAuth error:', err);
      Alert.alert('Error', 'Apple sign-in is not available in this environment');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const { error } = await signInWithOAuth('facebook');
      
      if (error) {
        console.log('Facebook sign-in error', error);
        Alert.alert('Error', `Facebook sign-in failed: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Facebook OAuth error:', err);
      Alert.alert('Error', 'Facebook sign-in is not available in this environment');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.socialButton, styles.googleButton]} 
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        <Icon name="google" size={20} color="#DB4437" />
        <Text style={[styles.socialButtonText, styles.googleButtonText]}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.socialButton, styles.appleButton]} 
        onPress={handleAppleLogin}
        disabled={loading}
      >
        <Icon name="apple" size={20} color="#FFFFFF" />
        <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.socialButton, styles.facebookButton]} 
        onPress={handleFacebookLogin}
        disabled={loading}
      >
        <Icon name="facebook" size={20} color="#FFFFFF" />
        <Text style={[styles.socialButtonText, styles.facebookButtonText]}>Continue with Facebook</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 1,
  },
  googleButton: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  googleButtonText: {
    color: theme.text,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  facebookButtonText: {
    color: '#FFFFFF',
  },
});

export default SocialLoginButtons;