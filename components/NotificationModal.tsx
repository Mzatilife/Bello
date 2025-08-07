import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Linking,
} from 'react-native';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react-native';
import { useAppContext } from '@/hooks/useAppContext';

export interface NotificationButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary' | 'link';
  url?: string; // For link buttons
}

export interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: NotificationButton[];
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationModal({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', style: 'default', onPress: onClose }],
  autoClose = false,
  autoCloseDelay = 3000,
}: NotificationModalProps) {
  const { theme } = useAppContext();
  const styles = createStyles(theme);

  React.useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDelay, onClose]);

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { 
          icon: CheckCircle, 
          color: theme.success || '#10B981',
          bgColor: (theme.success || '#10B981') + '20'
        };
      case 'error':
        return { 
          icon: XCircle, 
          color: theme.error || '#EF4444',
          bgColor: (theme.error || '#EF4444') + '20'
        };
      case 'warning':
        return { 
          icon: AlertCircle, 
          color: theme.warning || '#F59E0B',
          bgColor: (theme.warning || '#F59E0B') + '20'
        };
      case 'info':
      default:
        return { 
          icon: Info, 
          color: theme.primary || '#2563EB',
          bgColor: (theme.primary || '#2563EB') + '20'
        };
    }
  };

  const { icon: Icon, color, bgColor } = getIconAndColor();

  const handleButtonPress = (button: NotificationButton) => {
    if (button.url) {
      Linking.openURL(button.url).catch(err => {
        console.error('Failed to open URL:', err);
      });
    }
    if (button.onPress) {
      button.onPress();
    } else {
      onClose();
    }
  };

  const getButtonStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'primary':
        return [styles.button, styles.primaryButton];
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      case 'cancel':
        return [styles.button, styles.cancelButton];
      case 'link':
        return [styles.button, styles.linkButton];
      case 'default':
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'primary':
        return [styles.buttonText, styles.primaryButtonText];
      case 'destructive':
        return [styles.buttonText, styles.destructiveButtonText];
      case 'cancel':
        return [styles.buttonText, styles.cancelButtonText];
      case 'link':
        return [styles.buttonText, styles.linkButtonText];
      case 'default':
      default:
        return [styles.buttonText, styles.defaultButtonText];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <Icon size={32} color={color} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          {buttons.length > 0 && (
            <View style={[
              styles.buttonContainer,
              buttons.length > 2 ? styles.buttonContainerColumn : styles.buttonContainerRow
            ]}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    getButtonStyle(button.style),
                    buttons.length > 1 && index > 0 && styles.buttonSpacing
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buttonContent}>
                    <Text style={getButtonTextStyle(button.style)}>
                      {button.text}
                    </Text>
                    {button.style === 'link' && button.url && (
                      <ExternalLink size={16} color={theme.primary} style={styles.linkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  buttonContainerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonContainerColumn: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacing: {
    marginLeft: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIcon: {
    marginLeft: 8,
  },
  defaultButton: {
    backgroundColor: theme.border,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  destructiveButton: {
    backgroundColor: theme.error,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  linkButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: theme.text,
  },
  primaryButtonText: {
    color: theme.surface,
  },
  destructiveButtonText: {
    color: theme.surface,
  },
  cancelButtonText: {
    color: theme.textSecondary,
  },
  linkButtonText: {
    color: theme.primary,
  },
});
