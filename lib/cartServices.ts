import { supabase } from './supabase';

// Types
export interface CartItem {
  id: string;
  user_id: string;
  listing_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined data from listings
  listing?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
    user_id: string;
    location: string;
    category: string;
  };
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  total_amount: number;
  commission_amount: number;
  commission_rate: number;
  delivery_fee: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: {
    name: string;
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
  };
  phone_number: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  listing_id?: string;
  seller_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_amount: number;
  seller_amount: number;
  title: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

export interface CheckoutData {
  delivery_address: {
    name: string;
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
  };
  phone_number: string;
  notes?: string;
}

// Cart Services
export const cartService = {
  // Add item to cart
  addToCart: async (listingId: string, quantity: number = 1) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Check if listing is available and not the user's own listing
    const { data: listing } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (!listing) {
      throw new Error('Listing not found or not available');
    }

    if (listing.user_id === user.id) {
      throw new Error('You cannot add your own listing to cart');
    }

    // Try to update existing cart item or insert new one
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        listing_id: listingId,
        quantity: quantity,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, listing_id'
      })
      .select()
      .single();

    return { data, error };
  },

  // Remove item from cart
  removeFromCart: async (cartItemId: string) => {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .select();

    return { data, error };
  },

  // Update cart item quantity
  updateCartItemQuantity: async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return cartService.removeFromCart(cartItemId);
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItemId)
      .select()
      .single();

    return { data, error };
  },

  // Get user's cart items with listing details
  getCartItems: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          images,
          status,
          user_id,
          location,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Clear entire cart
  clearCart: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .select();

    return { data, error };
  },

  // Get cart summary (total items, total price)
  getCartSummary: async () => {
    const { data: cartItems, error } = await cartService.getCartItems();
    
    if (error || !cartItems) {
      return { data: null, error };
    }

    const summary = cartItems.reduce(
      (acc, item) => {
        if (item.listing && item.listing.status === 'active') {
          acc.totalItems += item.quantity;
          acc.totalPrice += item.quantity * item.listing.price;
          acc.validItems += 1;
        }
        return acc;
      },
      { totalItems: 0, totalPrice: 0, validItems: 0 }
    );

    return { data: summary, error: null };
  },
};

// Order Services
export const orderService = {
  // Create order from cart
  createOrderFromCart: async (checkoutData: CheckoutData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Get cart items
    const { data: cartItems, error: cartError } = await cartService.getCartItems();
    if (cartError || !cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty or could not be loaded');
    }

    // Filter valid items
    const validCartItems = cartItems.filter(
      item => item.listing && item.listing.status === 'active'
    );

    if (validCartItems.length === 0) {
      throw new Error('No valid items in cart');
    }

    // Calculate totals
    const subtotal = validCartItems.reduce(
      (sum, item) => sum + (item.quantity * item.listing!.price),
      0
    );
    
    const commissionRate = 0.15; // 15% commission
    const commissionAmount = subtotal * commissionRate;
    const deliveryFee = 5000; // MK 5000 delivery fee
    const totalAmount = subtotal + deliveryFee;

    try {
      // Start transaction by creating the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: '', // Will be set by trigger/function
          buyer_id: user.id,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          delivery_fee: deliveryFee,
          delivery_address: checkoutData.delivery_address,
          phone_number: checkoutData.phone_number,
          notes: checkoutData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Generate order number if not set by trigger
      if (!order.order_number) {
        const orderNumber = await orderService.generateOrderNumber();
        await supabase
          .from('orders')
          .update({ order_number: orderNumber })
          .eq('id', order.id);
        order.order_number = orderNumber;
      }

      // Create order items and seller payments
      const orderItems = [];
      const sellerPayments = [];

      for (const cartItem of validCartItems) {
        const listing = cartItem.listing!;
        const itemTotal = cartItem.quantity * listing.price;
        const itemCommission = itemTotal * commissionRate;
        const sellerAmount = itemTotal - itemCommission;

        const orderItem = {
          order_id: order.id,
          listing_id: listing.id,
          seller_id: listing.user_id,
          quantity: cartItem.quantity,
          unit_price: listing.price,
          total_price: itemTotal,
          commission_amount: itemCommission,
          seller_amount: sellerAmount,
          title: listing.title,
          description: `${listing.category} - ${listing.location}`,
          image_url: listing.images?.[0] || null,
        };

        orderItems.push(orderItem);

        // Create seller payment record
        sellerPayments.push({
          seller_id: listing.user_id,
          order_id: order.id,
          amount: sellerAmount,
          status: 'pending',
        });
      }

      // Insert order items
      const { data: createdOrderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (orderItemsError) throw orderItemsError;

      // Create seller payment records
      const sellerPaymentsWithOrderItemIds = sellerPayments.map((payment, index) => ({
        ...payment,
        order_item_id: createdOrderItems![index].id,
      }));

      const { error: paymentsError } = await supabase
        .from('seller_payments')
        .insert(sellerPaymentsWithOrderItemIds);

      if (paymentsError) throw paymentsError;

      // Add initial tracking entry
      await supabase
        .from('delivery_tracking')
        .insert({
          order_id: order.id,
          status: 'pending',
          message: 'Order placed successfully',
        });

      // Clear cart after successful order creation
      await cartService.clearCart();

      return { data: order, error: null };
    } catch (error) {
      console.error('Error creating order:', error);
      return { data: null, error };
    }
  },

  // Get user's orders
  getUserOrders: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get specific order by ID
  getOrder: async (orderId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        delivery_tracking (*)
      `)
      .eq('id', orderId)
      .single();

    return { data, error };
  },

  // Generate order number
  generateOrderNumber: async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of orders today
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
      .lt('created_at', `${today.toISOString().slice(0, 10)}T23:59:59.999Z`);

    const orderNumber = `BLO-${dateStr}-${String((count || 0) + 1).padStart(5, '0')}`;
    return orderNumber;
  },

  // Update order status (admin function)
  updateOrderStatus: async (orderId: string, status: string, trackingMessage?: string) => {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    // Add tracking entry
    if (!error && trackingMessage) {
      await supabase
        .from('delivery_tracking')
        .insert({
          order_id: orderId,
          status,
          message: trackingMessage,
        });
    }

    return { data, error };
  },

  // Process seller payments (admin function)
  processSellerPayment: async (paymentId: string, paymentDetails?: any) => {
    const { data, error } = await supabase
      .from('seller_payments')
      .update({
        status: 'processing',
        payment_details: paymentDetails,
        processed_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    return { data, error };
  },

  // Mark seller payment as completed (admin function)
  completeSellerPayment: async (paymentId: string) => {
    const { data, error } = await supabase
      .from('seller_payments')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    return { data, error };
  },

  // Get seller's pending payments
  getSellerPayments: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('seller_payments')
      .select(`
        *,
        order_items (*),
        orders (order_number, status, delivered_at)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },
};

// Delivery Services
export const deliveryService = {
  // Add tracking update
  addTrackingUpdate: async (orderId: string, status: string, message: string, location?: string) => {
    const { data, error } = await supabase
      .from('delivery_tracking')
      .insert({
        order_id: orderId,
        status,
        message,
        location,
      })
      .select()
      .single();

    return { data, error };
  },

  // Get tracking history for an order
  getTrackingHistory: async (orderId: string) => {
    const { data, error } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    return { data, error };
  },
};
