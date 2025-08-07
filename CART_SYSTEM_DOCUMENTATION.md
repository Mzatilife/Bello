# Bello Cart & Order System Documentation

## Overview

The Bello marketplace now includes a comprehensive cart and order system with commission-based revenue sharing. The system handles:

- **Cart Management**: Users can add items to cart, manage quantities, and proceed to checkout
- **Order Processing**: Convert cart items to orders with proper tracking
- **Commission Handling**: 15% commission is deducted from each sale
- **Delivery Management**: Company handles delivery and tracking
- **Seller Payments**: Sellers receive payment after successful delivery

## Business Model

### Revenue Flow
1. **Customer Payment**: Customer pays full amount upfront (items + delivery fee)
2. **Company Commission**: 15% of item value goes to company
3. **Delivery Fee**: Fixed MK 5,000 delivery fee goes to company
4. **Seller Payment**: Remaining 85% of item value goes to seller after delivery

### Example Transaction
- Item Price: MK 10,000
- Commission (15%): MK 1,500 (to company)
- Seller Amount: MK 8,500 (to seller after delivery)
- Delivery Fee: MK 5,000 (to company)
- **Total Customer Pays**: MK 15,000
- **Company Revenue**: MK 6,500 (commission + delivery)
- **Seller Receives**: MK 8,500 (after delivery)

## Database Schema

### New Tables Created

#### `cart_items`
- Stores user cart items with quantities
- Links users to listings they want to purchase
- Prevents users from adding their own items

#### `orders` 
- Main order information with delivery details
- Tracks order status from pending to completed
- Includes commission calculations and delivery address

#### `order_items`
- Individual items within an order
- Stores price, commission, and seller amount snapshots
- Links to original listings and sellers

#### `seller_payments`
- Tracks payments owed to sellers
- Status: pending → processing → paid
- Created automatically when orders are placed

#### `delivery_tracking`
- Order status updates and delivery tracking
- Timeline of order progress
- Can include location updates

## Key Features Implemented

### 🛒 Cart Management
- **Add to Cart**: From listing details modal
- **Quantity Management**: Increase/decrease quantities
- **Remove Items**: Individual items or clear entire cart
- **Real-time Updates**: Cart count badge updates automatically
- **Validation**: Prevents adding own listings or inactive items

### 🛍️ Checkout Process
- **Order Summary**: Shows all cart items with totals
- **Delivery Info**: Collects customer address and phone
- **Price Breakdown**: Subtotal, delivery fee, and total
- **Validation**: Ensures all required fields are filled
- **Order Creation**: Atomically creates order, items, and payment records

### 📦 Order Management
- **Order Numbers**: Auto-generated format (BLO-YYYYMMDD-XXXXX)
- **Status Tracking**: pending → confirmed → processing → shipped → delivered → completed
- **Commission Calculation**: Automatic 15% deduction
- **Seller Payments**: Created as "pending" until delivery

### 💰 Payment Processing
- **Customer Payment**: Full amount collected upfront
- **Commission Handling**: 15% automatically calculated and reserved
- **Seller Payments**: Released after successful delivery
- **Payment Status**: Tracked separately from order status

## File Structure

```
📁 database/migrations/
└── 003_create_cart_and_orders_tables.sql    # Database schema

📁 lib/
├── cartServices.ts                           # Cart & order services
└── services.ts                              # Updated with new features

📁 components/
├── CartModal.tsx                             # Cart management UI
└── ListingDetailsModal.tsx                   # Updated with "Add to Cart"

📁 app/(tabs)/
├── checkout.tsx                              # Checkout screen
├── index.tsx                                 # Updated with cart icon
└── orders.tsx                               # (Future: order history)
```

## API Services

### Cart Services (`cartService`)
```typescript
// Add item to cart
addToCart(listingId: string, quantity: number)

// Update quantities
updateCartItemQuantity(cartItemId: string, quantity: number)

// Remove items
removeFromCart(cartItemId: string)
clearCart()

// Get cart data
getCartItems()
getCartSummary()
```

### Order Services (`orderService`)
```typescript
// Create order from cart
createOrderFromCart(checkoutData: CheckoutData)

// Get order data
getUserOrders()
getOrder(orderId: string)

// Admin functions
updateOrderStatus(orderId: string, status: string)
processSellerPayment(paymentId: string)
completeSellerPayment(paymentId: string)
```

## Security & Permissions

### Row Level Security (RLS)
- **Cart Items**: Users can only manage their own cart
- **Orders**: Buyers see their orders, sellers see their order items
- **Seller Payments**: Sellers see only their payments
- **Admin Access**: Special permissions for order management

### Validation
- **Cart**: No adding own listings or inactive items
- **Checkout**: Required fields and phone number validation
- **Orders**: Atomic transactions prevent data corruption

## Commission System Details

### Automatic Calculations
```typescript
const subtotal = 10000;                    // Item price
const commissionRate = 0.15;              // 15%
const commissionAmount = subtotal * 0.15;  // MK 1,500
const sellerAmount = subtotal - commissionAmount; // MK 8,500
const deliveryFee = 5000;                  // Fixed fee
const total = subtotal + deliveryFee;      // MK 15,000
```

### Payment Flow
1. **Order Created**: Commission and seller amounts calculated
2. **Payment Received**: Full amount from customer
3. **Delivery Processed**: Company handles logistics
4. **Order Delivered**: Status updated to "delivered"
5. **Payment Released**: Seller receives their portion

## Delivery & Tracking

### Order Statuses
- **pending**: Order placed, awaiting confirmation
- **confirmed**: Order confirmed, preparing for processing
- **processing**: Items being prepared for shipment
- **shipped**: Order dispatched for delivery
- **delivered**: Successfully delivered to customer
- **completed**: All processes completed, payments released

### Tracking System
- Real-time status updates
- Delivery location tracking (optional)
- Customer notifications
- Seller notifications

## Future Enhancements

### Phase 2 Features
- [ ] **Payment Integration**: Real payment processing (mobile money, cards)
- [ ] **Advanced Tracking**: GPS tracking, delivery photos
- [ ] **Seller Dashboard**: Order management, payment history
- [ ] **Customer Support**: Chat system, dispute resolution
- [ ] **Analytics**: Sales reports, commission tracking

### Phase 3 Features  
- [ ] **Multi-vendor Shipping**: Different shipping options per seller
- [ ] **Bulk Orders**: Wholesale functionality
- [ ] **Subscription Model**: Recurring orders
- [ ] **Advanced Commissions**: Tiered rates based on seller performance

## Testing the System

### To Test Cart Functionality:
1. **Add Items**: Use "Add to Cart" from listing details
2. **Manage Cart**: Open cart modal, adjust quantities
3. **Checkout**: Fill delivery information, place order
4. **Verify Database**: Check orders, order_items, seller_payments tables

### Admin Testing:
1. **Order Management**: Update order statuses
2. **Payment Processing**: Process seller payments
3. **Tracking Updates**: Add delivery tracking entries

## Development Notes

### Key Design Decisions
- **Commission First**: Commission calculated at order creation
- **Atomic Transactions**: Order creation is all-or-nothing
- **Seller Protection**: Payments held until delivery confirmation
- **Customer Protection**: Full order tracking and status updates

### Performance Considerations
- **Cart Badge**: Efficient count updates
- **Database Indexes**: Optimized queries for cart and orders
- **Caching**: Cart summary cached for quick access

### Error Handling
- **Cart Errors**: Graceful handling of unavailable items
- **Checkout Errors**: Form validation and error messages
- **Payment Errors**: Transaction rollback on failures

This system provides a robust foundation for the Bello marketplace's e-commerce functionality while ensuring proper revenue sharing and delivery management.
