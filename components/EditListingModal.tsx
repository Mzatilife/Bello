import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Save,
  Camera,
  Package,
  MapPin,
  DollarSign,
  FileText,
  Tag,
  Star,
  Image as ImageIcon,
  Plus,
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Listing, listingsService, CreateListingData } from '@/lib/services';
import { notificationService } from '@/lib/notificationService';
import EnhancedImage from '@/components/EnhancedImage';

interface EditListingModalProps {
  visible: boolean;
  listing: Listing | null;
  onClose: () => void;
  onUpdate: (updatedListing: Listing) => void;
}

const CONDITIONS = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Very Good', value: 'very_good' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
];

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Recreation',
  'Books',
  'Cosmetics',
  'Thrift',
  'Vehicles',
  'Services',
  'Other'
];

export default function EditListingModal({ visible, listing, onClose, onUpdate }: EditListingModalProps) {
  const { theme } = useAppContext();
  const { user } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // UI state
  const [loading, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible && listing) {
      // Populate form with existing listing data
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPrice(listing.price?.toString() || '');
      setCategory(listing.category || '');
      setCondition(listing.condition || '');
      setLocation(listing.location || '');
      setImages(listing.images || []);
      setErrors({});
    }
  }, [visible, listing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Please enter a valid price';
      } else if (priceNum > 10000000) {
        newErrors.price = 'Price cannot exceed MK 10,000,000';
      }
    }

    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (description && description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!listing || !user) return;
    
    if (!validateForm()) {
      notificationService.error('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    
    try {
      const updateData: Partial<CreateListingData> = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category: category.trim(),
        condition: condition.trim() || undefined,
        location: location.trim(),
        images: images.length > 0 ? images : undefined,
      };

      const { data, error } = await listingsService.updateListing(listing.id, updateData);
      
      if (!error && data) {
        notificationService.success('Success', 'Listing updated successfully!');
        onUpdate(data);
        onClose();
      } else {
        console.error('Error updating listing:', error);
        notificationService.error('Error', 'Failed to update listing. Please try again.');
      }
    } catch (error) {
      console.error('Exception updating listing:', error);
      notificationService.error('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while saving
    onClose();
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        notificationService.warning(
          'Permission Required',
          'We need access to your photo library to add images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        setImages(prev => {
          if (prev.length >= 5) {
            notificationService.warning('Limit Reached', 'You can only add up to 5 images.');
            return prev;
          }
          return [...prev, newImageUri];
        });
        notificationService.success('Image Added', 'Image added successfully!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      notificationService.error('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        notificationService.warning(
          'Permission Required',
          'We need access to your camera to take photos.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImageUri = result.assets[0].uri;
        setImages(prev => {
          if (prev.length >= 5) {
            notificationService.warning('Limit Reached', 'You can only add up to 5 images.');
            return prev;
          }
          return [...prev, newImageUri];
        });
        notificationService.success('Photo Taken', 'Photo added successfully!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      notificationService.error('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    notificationService.confirm(
      'Add Image',
      'Choose how you want to add an image:',
      () => takePhoto(),
      () => pickImage(),
      'Take Photo',
      'Choose from Library'
    );
  };

  const renderImageSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Camera size={20} color={theme.primary} />
        <Text style={styles.sectionTitle}>Images ({images.length}/5)</Text>
      </View>
      
      {images.length > 0 ? (
        <ScrollView horizontal style={styles.imagesScroll} showsHorizontalScrollIndicator={false}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <EnhancedImage
                uri={uri}
                fallbackUri={null}
                style={styles.listingImage}
                showLoadingIndicator={true}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noImagesContainer}>
          <Camera size={32} color={theme.textSecondary} />
          <Text style={styles.noImagesText}>No images added yet</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.addImageButton, { opacity: images.length >= 5 ? 0.5 : 1 }]}
        disabled={images.length >= 5}
        onPress={showImagePickerOptions}
      >
        <Plus size={20} color={theme.primary} />
        <Text style={styles.addImageText}>
          {images.length >= 5 ? 'Maximum 5 images' : 'Add Images'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!listing) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Listing</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Save size={18} color={theme.primary} />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Title *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="What are you selling?"
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Price */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Price (MK) *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price in Malawian Kwacha"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Category *</Text>
            </View>
            <TouchableOpacity 
              style={[styles.picker, errors.category && styles.inputError]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={[styles.pickerText, !category && styles.placeholderText]}>
                {category || 'Select a category'}
              </Text>
            </TouchableOpacity>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Condition */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Condition</Text>
            </View>
            <TouchableOpacity 
              style={styles.picker}
              onPress={() => setShowConditionPicker(true)}
            >
              <Text style={[styles.pickerText, !condition && styles.placeholderText]}>
                {condition ? CONDITIONS.find(c => c.value === condition)?.label : 'Select condition'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Location *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={location}
              onChangeText={setLocation}
              placeholder="City or area"
              placeholderTextColor={theme.textSecondary}
              maxLength={50}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your item..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.characterCount}>{description.length}/1000</Text>
          </View>

          {/* Images */}
          {renderImageSection()}
        </ScrollView>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pickerOption, category === cat && styles.selectedOption]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, category === cat && styles.selectedOptionText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Condition Picker Modal */}
        <Modal
          visible={showConditionPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Condition</Text>
                <TouchableOpacity onPress={() => setShowConditionPicker(false)}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond.value}
                    style={[styles.pickerOption, condition === cond.value && styles.selectedOption]}
                    onPress={() => {
                      setCondition(cond.value);
                      setShowConditionPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, condition === cond.value && styles.selectedOptionText]}>
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.primary + '20',
    borderRadius: 20,
  },
  saveButtonText: {
    color: theme.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  picker: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: theme.text,
  },
  placeholderText: {
    color: theme.textSecondary,
  },
  imagesScroll: {
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  listingImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  noImagesText: {
    color: theme.textSecondary,
    marginTop: 8,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '10',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  addImageText: {
    color: theme.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '50',
  },
  selectedOption: {
    backgroundColor: theme.primary + '10',
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.text,
  },
  selectedOptionText: {
    color: theme.primary,
    fontWeight: '600',
  },
});
