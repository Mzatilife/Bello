import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Lock, User, LogIn, Plus, ShoppingBag, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/hooks/useAppContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: 'lock' | 'user' | 'login' | 'sell' | 'cart';
  onSignIn?: () => void;
  onSignUp?: () => void;
}

export default function AuthModal({ 
  visible, 
  onClose, 
  title, 
  description, 
  icon = 'lock',
  onSignIn,
  onSignUp 
}: AuthModalProps) {
  const router = useRouter();
  const { theme, t } = useAppContext();
  const styles = createStyles(theme);

  const getIcon = () => {
    const iconColor = theme.primary || '#2563EB';
    const iconSize = 48;
    
    switch (icon) {
      case 'user':
        return <User size={iconSize} color={iconColor} />;
      case 'login':
        return <LogIn size={iconSize} color={iconColor} />;
      case 'sell':
        return <Plus size={iconSize} color={iconColor} />;
      case 'cart':
        return <ShoppingBag size={iconSize} color={iconColor} />;
      default:
        return <Lock size={iconSize} color={iconColor} />;
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push('/auth/login');
    }
    onClose();
  };

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      router.push('/auth/register');
    }
    onClose();
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
          {/* Header with Close Button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.signInButton}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>{t.signIn}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.signUpButton}
                onPress={handleSignUp}
                activeOpacity={0.8}
              >
                <Text style={styles.signUpButtonText}>{t.signUp}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderRadius: 20,
    maxWidth: 380,
    width: '100%',
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.border + '40',
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: (theme.primary || '#2563EB') + '15',
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  signInButton: {
    backgroundColor: theme.primary || '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.primary || '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  signInButtonText: {
    color: theme.surface || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.primary || '#2563EB',
  },
  signUpButtonText: {
    color: theme.primary || '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});
