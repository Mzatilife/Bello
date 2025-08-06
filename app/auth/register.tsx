import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, Moon, Sun, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/hooks/useAppContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, themeKey, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, loading } = useAuth();
  
  const styles = createStyles(theme);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(t.errorTitle, t.errorMessage);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.errorTitle, t.errorPasswordMatch);
      return;
    }

    const { error } = await signUp(email, password, {
      full_name: fullName,
      language_preference: language,
    });

    if (error) {
      Alert.alert(t.errorTitle, error.message);
    } else {
      Alert.alert(t.successTitle, t.verificationSent, [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{t.createAccount}</Text>
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
          </View>
        </View>
        <Text style={styles.subtitle}>{t.joinMarketplace}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <User size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={t.fullNamePlaceholder}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={t.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={theme.textSecondary}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color={theme.textSecondary} />
            ) : (
              <Eye size={20} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={t.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor={theme.textSecondary}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? (
              <EyeOff size={20} color={theme.textSecondary} />
            ) : (
              <Eye size={20} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? "..." : t.signUp}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.orDivider}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>{t.haveAccount}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.signinLink}>{t.signIn}</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: theme.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
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
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    marginLeft: 12,
  },
  registerButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: theme.textSecondary,
  },
  registerButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: theme.textSecondary,
    fontSize: 14,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  signinLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
