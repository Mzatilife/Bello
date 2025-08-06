import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, User, LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/hooks/useAppContext';

interface AuthPromptProps {
  title: string;
  description: string;
  icon?: 'lock' | 'user' | 'login';
}

export default function AuthPrompt({ title, description, icon = 'lock' }: AuthPromptProps) {
  const router = useRouter();
  const { theme, t } = useAppContext();
  const styles = createStyles(theme);

  const getIcon = () => {
    switch (icon) {
      case 'user':
        return <User size={48} color={theme.textSecondary} />;
      case 'login':
        return <LogIn size={48} color={theme.textSecondary} />;
      default:
        return <Lock size={48} color={theme.textSecondary} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>{t.signIn}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>{t.signUp}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: theme.background,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  registerButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
