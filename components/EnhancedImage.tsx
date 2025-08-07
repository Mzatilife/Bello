import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppContext } from '@/hooks/useAppContext';

interface EnhancedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  fallbackUri?: string;
  showLoadingIndicator?: boolean;
}

export default function EnhancedImage({ 
  uri, 
  fallbackUri, 
  showLoadingIndicator = false,
  style,
  ...props 
}: EnhancedImageProps) {
  const { theme } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUri, setCurrentUri] = useState(uri);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    
    // Try fallback URI if available and not already using it
    if (fallbackUri && currentUri !== fallbackUri) {
      setCurrentUri(fallbackUri);
      setError(false);
    }
  };

  // Create a more reliable image source
  const getImageSource = () => {
    let imageUri = currentUri || fallbackUri;
    
    // Add cache busting and ensure HTTPS for better cross-device compatibility
    if (imageUri) {
      // Convert HTTP to HTTPS for better security and compatibility
      imageUri = imageUri.replace(/^http:\/\//, 'https://');
      
      // Add cache busting parameter for external images that might be cached differently
      if (imageUri.includes('unsplash.com') || imageUri.includes('placeholder.com')) {
        const separator = imageUri.includes('?') ? '&' : '?';
        imageUri += `${separator}cache=${Date.now()}`;
      }
      
      return { uri: imageUri };
    }
    
    // If no URI, return a default Unsplash placeholder
    return { uri: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop&crop=center' };
  };

  const imageSource = getImageSource();

  return (
    <View style={[StyleSheet.flatten(style), { position: 'relative' }]}>
      <Image
        {...props}
        source={imageSource}
        style={[StyleSheet.flatten(style), error && { opacity: 0.7 }]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // Add headers for better compatibility
        headers={{
          'Cache-Control': 'no-cache',
          'User-Agent': 'BelloApp/1.0',
        }}
      />
      
      {loading && showLoadingIndicator && (
        <View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.border,
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}>
          <ActivityIndicator color={theme.primary} size="small" />
        </View>
      )}
    </View>
  );
}

// Create a placeholder image asset if it doesn't exist
export const createPlaceholderImage = () => {
  // You would typically put a placeholder.png file in assets/images/
  // For now, we'll use a solid color as fallback
  return null;
};
