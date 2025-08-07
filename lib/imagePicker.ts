import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { notificationService } from './notificationService';

export interface ImagePickerResult {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  fileSize?: number;
  fileName?: string;
}

export class ImagePickerService {
  // Request camera permissions
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Request media library permissions
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  // Show action sheet for image selection
  static async showImagePicker(): Promise<ImagePickerResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose how you want to select an image',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.pickFromCamera();
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickFromGallery();
              resolve(result);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  // Pick image from camera
  static async pickFromCamera(): Promise<ImagePickerResult | null> {
    try {
      // Request permissions
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        notificationService.showNotification({
          type: 'warning',
          title: 'Permission Required',
          message: 'Camera permission is required to take photos.',
        });
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: asset.type || 'image',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
      };
    } catch (error) {
      console.error('Error picking from camera:', error);
      notificationService.showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to take photo. Please try again.',
      });
      return null;
    }
  }

  // Pick image from gallery
  static async pickFromGallery(): Promise<ImagePickerResult | null> {
    try {
      // Request permissions
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        notificationService.showNotification({
          type: 'warning',
          title: 'Permission Required',
          message: 'Gallery permission is required to select photos.',
        });
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: asset.type || 'image',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
      };
    } catch (error) {
      console.error('Error picking from gallery:', error);
      notificationService.showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to select image. Please try again.',
      });
      return null;
    }
  }

  // Pick multiple images from gallery
  static async pickMultipleFromGallery(maxCount: number = 5): Promise<ImagePickerResult[]> {
    try {
      // Request permissions
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        notificationService.showNotification({
          type: 'warning',
          title: 'Permission Required',
          message: 'Gallery permission is required to select photos.',
        });
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxCount,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets) {
        return [];
      }

      return result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName,
      }));
    } catch (error) {
      console.error('Error picking multiple images:', error);
      notificationService.showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to select images. Please try again.',
      });
      return [];
    }
  }

  // Validate image file
  static validateImage(image: ImagePickerResult): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (image.fileSize && image.fileSize > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }

    // Check dimensions (minimum 100x100, maximum 4000x4000)
    if (image.width && image.height) {
      if (image.width < 100 || image.height < 100) {
        return { valid: false, error: 'Image must be at least 100x100 pixels' };
      }
      if (image.width > 4000 || image.height > 4000) {
        return { valid: false, error: 'Image must be smaller than 4000x4000 pixels' };
      }
    }

    return { valid: true };
  }

  // Get image info
  static async getImageInfo(uri: string): Promise<{ width: number; height: number } | null> {
    try {
      const result = await ImagePicker.getImageAsync(uri);
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      return null;
    }
  }
}

export default ImagePickerService;
