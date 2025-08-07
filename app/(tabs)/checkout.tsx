import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { cartService, orderService, CartItem, CheckoutData } from '@/lib/cartServices';
import { notificationService } from '@/lib/notificationService';

export default function CheckoutScreen() {
  const router = useRouter();
  const { theme, t } = useAppContext();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malawi',
    phone_number: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const styles = createStyles(theme);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    if (!user) {
      router.replace('/(tabs)');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await cartService.getCartItems();
      if (!error && data) {
      const validItems = data.filter(item => item.listing && item.listing.status === 'active');
        if (validItems.length === 0) {
          notificationService.warning('Cart Empty', 'Your cart is empty or no valid items found.', [
            { text: 'Go Shopping', style: 'primary', onPress: () => router.replace('/(tabs)') }
          ]);
          return;
        }
        setCartItems(validItems);
      } else {
        notificationService.error('Error', 'Failed to load cart items');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      notificationService.error('Error', 'Failed to load cart items');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^(\+265|0)?[1-9]\d{7,8}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid Malawian phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      notificationService.error('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setProcessing(true);
    try {
      const checkoutData: CheckoutData = {
        delivery_address: {
          name: formData.name,
          street: formData.street,
          city: formData.city,
          state: formData.state || undefined,
          postal_code: formData.postal_code || undefined,
          country: formData.country,
        },
        phone_number: formData.phone_number,
        notes: formData.notes || undefined,
      };

      const { data: order, error } = await orderService.createOrderFromCart(checkoutData);

      if (error) {
        console.error('Order creation error:', error);
        notificationService.error('Order Failed', 'Failed to create your order. Please try again.');
        return;
      }

      if (order) {
        notificationService.orderSuccess(
          order.order_number,
          () => router.replace('/(tabs)/profile' as any), // View orders in profile for now
          () => router.replace('/(tabs)')
        );
      }
    } catch (error) {
      console.error('Checkout error:', error);
      notificationService.error('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.listing!.price), 0);
  const deliveryFee = 5000; // MK 5000 delivery fee
  const total = subtotal + deliveryFee;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({totalItems} items)</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image
                source={{ uri: item.listing!.images?.[0] || 'https://via.placeholder.com/60' }}
                style={styles.orderItemImage}
              />
              <View style={styles.orderItemDetails}>
                <Text style={styles.orderItemTitle} numberOfLines={1}>
                  {item.listing!.title}
                </Text>
                <Text style={styles.orderItemPrice}>
                  MK{item.listing!.price.toLocaleString()} x {item.quantity}
                </Text>
              </View>
              <Text style={styles.orderItemTotal}>
                MK{(item.listing!.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>MK{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee:</Text>
              <Text style={styles.totalValue}>MK{deliveryFee.toLocaleString()}</Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotal]}>
              <Text style={styles.finalTotalLabel}>Total:</Text>
              <Text style={styles.finalTotalValue}>MK{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              value={formData.street}
              onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
              placeholder="Enter your street address"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={2}
            />
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="City"
                placeholderTextColor={theme.textSecondary}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>State/Region</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                placeholder="State/Region"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone_number && styles.inputError]}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="+265 1 234 5678 or 01 234 5678"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Any special delivery instructions..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentInfo}>
            <AlertCircle size={20} color={theme.warning} />
            <Text style={styles.paymentInfoText}>
              Payment will be processed through our secure system. You will pay the full amount upfront, 
              and we will handle delivery and seller payments.
            </Text>
          </View>
        </View>

        {/* Commission Notice */}
        <View style={styles.section}>
          <View style={styles.commissionNotice}>
            <Package size={20} color={theme.primary} />
            <Text style={styles.commissionNoticeText}>
              We charge a 15% service fee and handle all deliveries. Sellers receive their payment after successful delivery.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color={theme.surface} />
          ) : (
            <CheckCircle size={20} color={theme.surface} />
          )}
          <Text style={styles.placeOrderButtonText}>
            {processing ? 'Placing Order...' : `Place Order - MK${total.toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    ...theme.shadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.success,
  },
  totalsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  finalTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.success,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
  },
  inputError: {
    borderColor: theme.error,
  },
  errorText: {
    fontSize: 12,
    color: theme.error,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.warning + '20',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  commissionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.primary + '20',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  commissionNoticeText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.success || theme.primary,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
    minHeight: 56,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: theme.surface,
    fontSize: 18,
    fontWeight: '700',
  },
});
