import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Camera, Image as ImageIcon, MapPin, DollarSign, Package, FileText, Grid, List, Moon, Sun, X } from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import AuthPrompt from '@/components/AuthPrompt';
import { listingsService, CreateListingData } from '@/lib/services';
import ImagePickerService from '@/lib/imagePicker';
import { notificationService } from '@/lib/notificationService';
import { useListingsRefresh } from '@/context/ListingsRefreshContext';
import { useRouter } from 'expo-router';

// Language content
const translations = {
  en: {
    title: "Sell Your Item",
    subtitle: "Add photos and details to get started",
    photos: "Photos",
    addPhoto: "Add Photo",
    itemDetails: "Item Details",
    itemTitle: "Item title *",
    price: "Price *",
    description: "Description *",
    location: "Location",
    category: "Category",
    categories: ["Electronics", "Clothing", "Home", "Cosmetics", "Books", "Thrift", "Other"],
    condition: "Condition",
    conditions: ["New", "Like New", "Good", "Fair", "Poor"],
    publish: "Publish Listing",
    errorTitle: "Error",
    errorMessage: "Please fill in all required fields",
    successTitle: "Success",
    successMessage: "Your item has been listed successfully!"
  },
  ny: {
    title: "Gulitsani Zinthu Zanu",
    subtitle: "Onjezerani zithunzi ndi zambiri kuti muyambe",
    photos: "Zithunzi",
    addPhoto: "Onjezani Chithunzi",
    itemDetails: "Zambiri za Chinthu",
    itemTitle: "Dzina la chinthu *",
    price: "Mtengo *",
    description: "Kufotokozera *",
    location: "Malo",
    category: "Gulu",
    categories: ["Zida Zamagetsi", "Zovala", "Zanyumba", "Zokongoletsa", "Mabuku", "Zachikale", "Zina"],
    condition: "Kalengedwe",
    conditions: ["Yatsopano", "Monga Yatsopano", "Yabwino", "Yokwanira", "Yosakoma"],
    publish: "Tulutsani Zinthu",
    errorTitle: "Vuto",
    errorMessage: "Chonde lembani zonse zofunikira",
    successTitle: "Zabwino",
    successMessage: "Zinthu zanu zatulutsidwa bwino!"
  }
};

export default function SellScreen() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { theme, themeKey, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const { user } = useAuth();
  const { triggerRefresh } = useListingsRefresh();
  const router = useRouter();
  const localTranslations = translations[language];
  const styles = createStyles(theme);

  // Show auth prompt if user is not logged in
  if (!user) {
    return (
      <AuthPrompt
        title={language === 'en' ? "Start Selling Today" : "Yambani Kugulitsa Lero"}
        description={language === 'en' ? "Create an account to list your items and start selling in the marketplace." : "Pangani akaunti kuti muzilembetsa zinthu zanu ndi kuyamba kugulitsa m'msika."}
        icon="user"
      />
    );
  }

  const handleImagePick = async () => {
    const newImages = await ImagePickerService.pickMultipleFromGallery(5 - images.length);
    if (newImages.length > 0) {
      const newImageUris = newImages.map(image => image.uri);
      setImages(prev => [...prev, ...newImageUris]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      notificationService.error(localTranslations.errorTitle, 'Item title is required');
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      notificationService.error(localTranslations.errorTitle, 'Please enter a valid price');
      return false;
    }
    if (!description.trim()) {
      notificationService.error(localTranslations.errorTitle, 'Item description is required');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setIsPublishing(true);
    try {
      const listingData: CreateListingData = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category: category || 'Other',
        condition: condition || 'Good',
        location: location.trim() || null,
        images: images.length > 0 ? images : undefined,
        status: 'active'
      };

      const { data, error } = await listingsService.createListing(listingData);

      if (error) {
        console.error('Error creating listing:', error);
        notificationService.error(localTranslations.errorTitle, 'Failed to create listing. Please try again.');
        return;
      }

      if (data) {
        // Trigger refresh of listings on home and search pages
        triggerRefresh();
        
        // Clear the form
        setTitle('');
        setPrice('');
        setDescription('');
        setCategory('');
        setCondition('');
        setLocation('');
        setImages([]);
        
        // Show success notification with actions
        notificationService.success(
          localTranslations.successTitle, 
          localTranslations.successMessage,
          [
            { text: 'Add Another', style: 'cancel' },
            { text: 'View Listings', style: 'primary', onPress: () => router.push('/(tabs)') },
          ],
          false // Don't auto-close
        );
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      notificationService.error(localTranslations.errorTitle, 'An unexpected error occurred. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 140}}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{localTranslations.title}</Text>
            <Text style={styles.subtitle}>{localTranslations.subtitle}</Text>
          </View>
          <View style={styles.headerControls}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: theme.border }]}>
              {themeKey === 'light' ? 
                <Moon size={16} color={theme.textSecondary} /> : 
                <Sun size={16} color={theme.textSecondary} />
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleLanguage} style={[styles.languageButton, { backgroundColor: theme.border }]}>
              <Text style={[styles.languageText, { color: theme.text }]}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
            <View style={styles.viewToggle}>
              <TouchableOpacity 
                onPress={() => setViewMode('grid')} 
                style={[styles.viewButton, viewMode === 'grid' && styles.activeViewButton]}
              >
                <Grid size={20} color={viewMode === 'grid' ? '#2563EB' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setViewMode('list')} 
                style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              >
                <List size={20} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localTranslations.photos}</Text>
          {viewMode === 'grid' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.uploadedImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addImageButton} onPress={handleImagePick}>
                <Camera size={24} color="#64748B" />
                <Text style={styles.addImageText}>{localTranslations.addPhoto}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.listImageContainer}>
              {images.length > 0 ? (
                <View style={styles.listImageScroll}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.listImageWrapper}>
                      <Image source={{ uri: image }} style={styles.listUploadedImage} />
                    </View>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity style={styles.listAddImageButton} onPress={handleImagePick}>
                <Camera size={24} color="#64748B" />
                <Text style={styles.addImageText}>{localTranslations.addPhoto}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localTranslations.itemDetails}</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <FileText size={20} color="#64748B" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={localTranslations.itemTitle}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <DollarSign size={20} color="#64748B" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={localTranslations.price}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Package size={20} color="#64748B" />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={localTranslations.description}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <MapPin size={20} color="#64748B" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={localTranslations.location}
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localTranslations.category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {localTranslations.categories.map((cat: string) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.selectedCategoryChip
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryChipText,
                  category === cat && styles.selectedCategoryChipText
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localTranslations.condition}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {localTranslations.conditions.map((cond: string) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.categoryChip,
                  condition === cond && styles.selectedCategoryChip
                ]}
                onPress={() => setCondition(cond)}
              >
                <Text style={[
                  styles.categoryChipText,
                  condition === cond && styles.selectedCategoryChipText
                ]}>
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={[styles.publishButton, isPublishing && styles.publishButtonDisabled]} 
          onPress={handlePublish}
          disabled={isPublishing}
        >
          <Text style={styles.publishButtonText}>
            {isPublishing ? 'Publishing...' : localTranslations.publish}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.surface,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  themeButton: {
    padding: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  languageButton: {
    padding: 6,
    borderRadius: 4,
  },
  languageText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    padding: 6,
    borderRadius: 6,
  },
  activeViewButton: {
    backgroundColor: '#FFFFFF',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 12,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  listImageContainer: {
    gap: 12,
  },
  listImageScroll: {
    gap: 12,
  },
  listImageWrapper: {
    width: '100%',
  },
  listUploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  listAddImageButton: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  addImageText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inputIcon: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    paddingVertical: 16,
    paddingRight: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.background,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  selectedCategoryChipText: {
    color: theme.surface,
  },
  publishButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  publishButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
});