import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  MapPin,
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { cartService, CartItem } from '@/lib/cartServices';
import { useRouter } from 'expo-router';
import { notificationService } from '@/lib/notificationService';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartModal({ visible, onClose }: CartModalProps) {
  const { theme, t } = useAppContext();
  const { user } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    if (visible && user) {
      loadCartItems();
    }
  }, [visible, user]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await cartService.getCartItems();
      if (!error && data) {
        setCartItems(data);
      } else if (error) {
        console.error('Error loading cart items:', error);
      }
    } catch (error) {
      console.error('Exception loading cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      setUpdating(cartItemId);
      const { error } = await cartService.updateCartItemQuantity(cartItemId, newQuantity);
      
      if (!error) {
        if (newQuantity <= 0) {
          setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        } else {
          setCartItems(prev => 
            prev.map(item => 
              item.id === cartItemId 
                ? { ...item, quantity: newQuantity }
                : item
            )
          );
        }
      } else {
        notificationService.error('Error', 'Failed to update cart item');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      notificationService.error('Error', 'Failed to update cart item');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    notificationService.confirm(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      () => updateQuantity(cartItemId, 0),
      undefined,
      'Remove',
      'Cancel'
    );
  };

  const clearCart = async () => {
    notificationService.confirm(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      async () => {
        try {
          setLoading(true);
          const { error } = await cartService.clearCart();
          if (!error) {
            setCartItems([]);
          } else {
            notificationService.error('Error', 'Failed to clear cart');
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
          notificationService.error('Error', 'Failed to clear cart');
        } finally {
          setLoading(false);
        }
      },
      undefined,
      'Clear',
      'Cancel'
    );
  };

  const proceedToCheckout = () => {
    onClose();
    router.push('/(tabs)/checkout' as any);
  };

  // Calculate totals
  const validItems = cartItems.filter(item => item.listing && item.listing.status === 'active');
  const subtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.listing!.price), 0);
  const deliveryFee = validItems.length > 0 ? 5000 : 0; // MK 5000 delivery fee
  const total = subtotal + deliveryFee;
  const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!user) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={theme.textSecondary} />
            <Text style={styles.emptyText}>Please log in to view your cart</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart ({totalItems})</Text>
          <View style={styles.headerActions}>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading cart...</Text>
          </View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={theme.textSecondary} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>Add items from the marketplace to get started</Text>
            <TouchableOpacity style={styles.shopButton} onPress={onClose}>
              <Text style={styles.shopButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  {item.listing ? (
                    <>
                      <Image
                        source={{
                          uri: item.listing.images?.[0] || 'https://via.placeholder.com/100',
                        }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.listing.title}
                        </Text>
                        <View style={styles.itemMeta}>
                          <MapPin size={12} color={theme.textSecondary} />
                          <Text style={styles.itemLocation}>{item.listing.location}</Text>
                        </View>
                        <Text style={styles.itemPrice}>
                          MK{item.listing.price.toLocaleString()}
                        </Text>
                        {item.listing.status !== 'active' && (
                          <Text style={styles.unavailableText}>No longer available</Text>
                        )}
                      </View>
                      <View style={styles.itemActions}>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, item.quantity - 1)}
                            style={[styles.quantityButton, { opacity: updating === item.id ? 0.5 : 1 }]}
                            disabled={updating === item.id}
                          >
                            <Minus size={16} color={theme.text} />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                            style={[styles.quantityButton, { opacity: updating === item.id ? 0.5 : 1 }]}
                            disabled={updating === item.id}
                          >
                            <Plus size={16} color={theme.text} />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeItem(item.id)}
                          style={styles.removeButton}
                        >
                          <Trash2 size={16} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={styles.invalidItem}>
                      <Text style={styles.invalidItemText}>Item no longer available</Text>
                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {validItems.length > 0 && (
              <View style={styles.footer}>
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>MK{subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                    <Text style={styles.summaryValue}>MK{deliveryFee.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>MK{total.toLocaleString()}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={proceedToCheckout}>
                  <CreditCard size={20} color={theme.surface} />
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.error,
  },
  clearButtonText: {
    color: theme.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.primary,
    borderRadius: 8,
  },
  shopButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.success,
  },
  unavailableText: {
    fontSize: 12,
    color: theme.error,
    fontStyle: 'italic',
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.border,
    borderRadius: 20,
    marginBottom: 12,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 16,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  invalidItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invalidItemText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.success,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: theme.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
