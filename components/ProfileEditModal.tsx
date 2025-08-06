import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Alert,
  Image 
} from 'react-native';
import { X, User, Mail, Phone, MapPin, Save, Camera } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/lib/services';
import { Profile } from '@/context/AuthContext';
import ImagePickerService from '@/lib/imagePicker';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (profile: Profile) => void;
}

export default function ProfileEditModal({ visible, onClose, onUpdate }: ProfileEditModalProps) {
  const { theme, t } = useAppContext();
  const { profile, user } = useAuth();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone_number: '',
    location: '',
    bio: '',
    photo_url: '',
  });

  useEffect(() => {
    if (profile && user) {
      setFormData({
        display_name: profile.display_name || user.user_metadata?.full_name || '',
        email: profile.email || user.email || '',
        phone_number: profile.phone_number || user.phone || '',
        location: profile.metadata?.location || '',
        bio: profile.metadata?.bio || '',
        photo_url: profile.photo_url || user.user_metadata?.avatar_url || '',
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      Alert.alert(t.errorTitle, 'Display name is required');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        display_name: formData.display_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        photo_url: formData.photo_url.trim() || null,
        metadata: {
          ...(profile?.metadata || {}),
          location: formData.location.trim(),
          bio: formData.bio.trim(),
        },
      };

      const { data, error } = await profileService.updateProfile(updates);

      if (error) {
        console.error('Profile update error:', error);
        Alert.alert(t.errorTitle, 'Failed to update profile');
        return;
      }

      if (data) {
        onUpdate(data);
        Alert.alert(t.successTitle, 'Profile updated successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t.errorTitle, 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePhoto = async () => {
    const result = await ImagePickerService.showImagePicker();
    if (result?.uri) {
      handleInputChange('photo_url', result.uri);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <Image
              source={{
                uri: formData.photo_url || 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=200'
              }}
              style={styles.profilePhoto}
            />
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
              <Camera size={16} color={theme.surface} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.display_name}
                onChangeText={(value) => handleInputChange('display_name', value)}
                placeholder="Enter your display name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Mail size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, styles.disabledText]}
                value={formData.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <Text style={styles.helpText}>Email cannot be changed here</Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(value) => handleInputChange('phone_number', value)}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={theme.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Enter your location"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photo URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo URL</Text>
            <TextInput
              style={styles.input}
              value={formData.photo_url}
              onChangeText={(value) => handleInputChange('photo_url', value)}
              placeholder="Enter image URL"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color={theme.surface} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.primary,
    borderRadius: 16,
  },
  changePhotoText: {
    color: theme.surface,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabledInput: {
    backgroundColor: theme.border,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    marginLeft: 12,
  },
  disabledText: {
    color: theme.textSecondary,
  },
  textArea: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
    height: 100,
  },
  helpText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: theme.textSecondary,
  },
  saveButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
