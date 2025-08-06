import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { themes } from '@/config/themes';
import { translations } from '@/config/translations';

export const useAppContext = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  const currentTheme = themes[theme];
  const t = translations[language];

  return {
    theme: currentTheme,
    themeKey: theme,
    toggleTheme,
    language,
    toggleLanguage,
    t,
  };
};
