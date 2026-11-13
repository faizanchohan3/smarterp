import { useColorScheme } from 'react-native';
import { useApp } from '@/store/app';

export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  brand: string;
  brandInk: string;
  brandSoft: string;
  accent: string;
  gold: string;
  goldSoft: string;
  protein: string;
  carb: string;
  fat: string;
  water: string;
  danger: string;
};

export const light: Palette = {
  bg: '#F2F5EF',
  surface: '#FFFFFF',
  surface2: '#E8EEE6',
  ink: '#14231A',
  muted: '#5B6B61',
  line: '#D8E1D8',
  brand: '#1E6A48',
  brandInk: '#FFFFFF',
  brandSoft: '#D7EBDD',
  accent: '#E9822A',
  gold: '#9C7414',
  goldSoft: '#F6EBCB',
  protein: '#C94C73',
  carb: '#B8830F',
  fat: '#2F83B4',
  water: '#2F83B4',
  danger: '#C0392B',
};

export const dark: Palette = {
  bg: '#0D1410',
  surface: '#151F19',
  surface2: '#1C2921',
  ink: '#E5EEE8',
  muted: '#94A49A',
  line: '#26342B',
  brand: '#4CC38A',
  brandInk: '#06130C',
  brandSoft: '#173A28',
  accent: '#FF9F4A',
  gold: '#E2B84E',
  goldSoft: '#3A3016',
  protein: '#F07A9C',
  carb: '#F2C150',
  fat: '#65B6E4',
  water: '#65B6E4',
  danger: '#FF7466',
};

/** Colors for the current theme, honouring the user's Appearance setting. */
export function useColors(): Palette {
  const system = useColorScheme();
  const { state } = useApp();
  const pref = state.theme;
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return isDark ? dark : light;
}

export function useIsDark(): boolean {
  const system = useColorScheme();
  const { state } = useApp();
  return state.theme === 'dark' || (state.theme === 'system' && system === 'dark');
}

export const radius = { sm: 10, md: 14, lg: 18 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
