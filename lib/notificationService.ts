import { NotificationButton } from '@/components/NotificationModal';

export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: NotificationButton[];
  autoClose?: boolean;
  autoCloseDelay?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

class NotificationService {
  private listeners: Array<(notification: NotificationOptions) => void> = [];
  
  subscribe(listener: (notification: NotificationOptions) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private show(options: NotificationOptions) {
    this.listeners.forEach(listener => listener(options));
  }
  
  // Generic method to show notifications with full options
  showNotification(options: NotificationOptions) {
    const { onConfirm, onCancel, ...notificationOptions } = options;
    
    // Create buttons if onConfirm or onCancel are provided and no explicit buttons are set
    let buttons = options.buttons;
    if (!buttons && (onConfirm || onCancel)) {
      buttons = [];
      if (onCancel) {
        buttons.push({ text: 'Cancel', style: 'cancel', onPress: onCancel });
      }
      if (onConfirm) {
        buttons.push({ text: 'OK', style: 'primary', onPress: onConfirm });
      }
    }
    
    const defaultOptions = {
      type: options.type || 'info',
      autoClose: options.type === 'success' ? true : false,
      autoCloseDelay: options.type === 'success' ? 3000 : undefined,
      ...notificationOptions,
      buttons,
    };
    this.show(defaultOptions);
  }
  
  success(title: string, message: string, buttons?: NotificationButton[], autoClose = true) {
    this.show({
      type: 'success',
      title,
      message,
      buttons,
      autoClose,
      autoCloseDelay: autoClose ? 3000 : undefined,
    });
  }
  
  error(title: string, message: string, buttons?: NotificationButton[]) {
    this.show({
      type: 'error',
      title,
      message,
      buttons,
      autoClose: false,
    });
  }
  
  warning(title: string, message: string, buttons?: NotificationButton[]) {
    this.show({
      type: 'warning',
      title,
      message,
      buttons,
      autoClose: false,
    });
  }
  
  info(title: string, message: string, buttons?: NotificationButton[], autoClose = false) {
    this.show({
      type: 'info',
      title,
      message,
      buttons,
      autoClose,
      autoCloseDelay: autoClose ? 3000 : undefined,
    });
  }
  
  // Convenience methods that match Alert API
  alert(title: string, message: string, buttons?: NotificationButton[]) {
    this.info(title, message, buttons);
  }
  
  confirm(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText = 'Cancel'
  ) {
    this.show({
      type: 'warning',
      title,
      message,
      buttons: [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        { text: confirmText, style: 'primary', onPress: onConfirm },
      ],
      autoClose: false,
    });
  }
  
  orderSuccess(orderNumber: string, onViewOrders?: () => void, onContinueShopping?: () => void) {
    this.show({
      type: 'success',
      title: 'Order Placed Successfully!',
      message: `Your order #${orderNumber} has been placed. You will receive confirmation shortly.`,
      buttons: [
        { 
          text: 'Continue Shopping', 
          style: 'cancel', 
          onPress: onContinueShopping 
        },
        { 
          text: 'View Orders', 
          style: 'primary', 
          onPress: onViewOrders 
        },
      ],
      autoClose: false,
    });
  }
  
  cartSuccess(onViewCart?: () => void, onContinueShopping?: () => void) {
    this.show({
      type: 'success',
      title: 'Added to Cart',
      message: 'Item has been added to your cart successfully!',
      buttons: [
        { 
          text: 'Continue Shopping', 
          style: 'cancel', 
          onPress: onContinueShopping 
        },
        { 
          text: 'View Cart', 
          style: 'primary', 
          onPress: onViewCart 
        },
      ],
      autoClose: false,
    });
  }
  
  linkNotification(title: string, message: string, linkText: string, url: string, onClose?: () => void) {
    this.show({
      type: 'info',
      title,
      message,
      buttons: [
        { text: 'Close', style: 'cancel', onPress: onClose },
        { text: linkText, style: 'link', url },
      ],
      autoClose: false,
    });
  }
  
  loginRequired(title = 'Login Required', message = 'Please log in to continue', onLogin?: () => void) {
    this.show({
      type: 'warning',
      title,
      message,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', style: 'primary', onPress: onLogin },
      ],
      autoClose: false,
    });
  }
}

export const notificationService = new NotificationService();
