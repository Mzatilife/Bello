import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppContext } from '@/hooks/useAppContext';

interface EnhancedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  fallbackUri?: string | null;
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
  
  // Update currentUri when uri prop changes
  React.useEffect(() => {
    setCurrentUri(uri);
    setError(false);
  }, [uri]);

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
    
    // Debug logging
    console.log('EnhancedImage - URI:', uri, 'Current URI:', currentUri, 'Fallback:', fallbackUri);
    
    // Add cache busting and ensure HTTPS for better cross-device compatibility
    if (imageUri) {
      // Convert HTTP to HTTPS for better security and compatibility
      imageUri = imageUri.replace(/^http:\/\//, 'https://');
      
      // Add cache busting parameter for external images that might be cached differently
      if (imageUri.includes('unsplash.com') || imageUri.includes('placeholder.com')) {
        const separator = imageUri.includes('?') ? '&' : '?';
        imageUri += `${separator}cache=${Date.now()}`;
      }
      
      console.log('EnhancedImage - Final URI:', imageUri);
      return { uri: imageUri };
    }
    
    // If no URI, return a default Unsplash placeholder
    const defaultUri = 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop&crop=center';
    console.log('EnhancedImage - Using default URI:', defaultUri);
    return { uri: defaultUri };
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
