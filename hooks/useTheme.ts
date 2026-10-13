import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'original' | 'white' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundCard: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  inputBackground: string;
  inputBorder: string;
  tabBarBackground: string;
  tabBarBorder: string;
  cardBorder: string;
  headerBackground: string;
}

const THEMES: Record<ThemeType, ThemeColors> = {
  original: {
    background: '#1b1b2f',
    backgroundSecondary: '#0a0a1a',
    backgroundCard: '#1f2b3d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#888888',
    border: '#2a3a55',
    primary: '#00c853',
    inputBackground: '#2f2f4f',
    inputBorder: '#2a3a55',
    tabBarBackground: '#1b1b2f',
    tabBarBorder: '#2a3a55',
    cardBorder: '#2a3a55',
    headerBackground: '#1b1b2f',
  },
  white: {
    background: '#f5f5f5',
    backgroundSecondary: '#ffffff',
    backgroundCard: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#333333',
    textMuted: '#666666',
    border: '#dddddd',
    primary: '#00c853',
    inputBackground: '#f0f0f0',
    inputBorder: '#dddddd',
    tabBarBackground: '#ffffff',
    tabBarBorder: '#dddddd',
    cardBorder: '#eeeeee',
    headerBackground: '#ffffff',
  },
  dark: {
    background: '#000000',
    backgroundSecondary: '#0a0a0a',
    backgroundCard: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#888888',
    border: '#2a2a2a',
    primary: '#00c853',
    inputBackground: '#2a2a2a',
    inputBorder: '#3a3a3a',
    tabBarBackground: '#000000',
    tabBarBorder: '#2a2a2a',
    cardBorder: '#2a2a2a',
    headerBackground: '#0a0a0a',
  },
};

const THEME_KEY = '@app_theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('original');
  const [colors, setColors] = useState<ThemeColors>(THEMES.original);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved && saved in THEMES) {
        const theme = saved as ThemeType;
        setCurrentTheme(theme);
        setColors(THEMES[theme]);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeTheme = async (theme: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
      setCurrentTheme(theme);
      setColors(THEMES[theme]);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  return {
    currentTheme,
    colors,
    loading,
    changeTheme,
    themes: THEMES,
  };
}