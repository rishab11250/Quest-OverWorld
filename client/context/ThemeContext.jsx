import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting } from '../lib/secureStore';
import { triggerHaptic } from '../lib/haptics';

export const THEME_PALETTES = {
  dusk: {
    id: 'dusk',
    name: 'Dusk Obsidian',
    tag: 'DEFAULT',
    bg: {
      dusk: '#161326',
      duskRaised: '#241D3B',
      card: '#1C1732',
      surface: '#292147',
    },
    accent: {
      gold: '#F2C84B',
      goldDim: '#B8964F',
      green: '#5FBF7A',
      greenDim: '#3D8259',
      coral: '#E8664B',
      coralDim: '#B04A38',
      cyan: '#48CAE4',
    },
    border: {
      subtle: '#362E52',
      highlight: '#F2C84B',
      active: '#5A4C80',
    },
    text: {
      primary: '#F8F4E6',
      secondary: '#B8B2D1',
      muted: '#7E75A0',
      gold: '#F2C84B',
    },
  },
  gameboy: {
    id: 'gameboy',
    name: 'GameBoy Classic',
    tag: 'RETRO DMG',
    bg: {
      dusk: '#141E12',
      duskRaised: '#1E2D1A',
      card: '#182415',
      surface: '#263820',
    },
    accent: {
      gold: '#9BBC0F',
      goldDim: '#8BAC0F',
      green: '#9BBC0F',
      greenDim: '#306230',
      coral: '#D4A373',
      coralDim: '#8B5E3C',
      cyan: '#8BAC0F',
    },
    border: {
      subtle: '#2E4726',
      highlight: '#9BBC0F',
      active: '#4E7340',
    },
    text: {
      primary: '#D6E5A3',
      secondary: '#9BBC0F',
      muted: '#628043',
      gold: '#9BBC0F',
    },
  },
  cyber: {
    id: 'cyber',
    name: 'Cyberpunk Neon',
    tag: 'NEON',
    bg: {
      dusk: '#0D0E1A',
      duskRaised: '#171A2E',
      card: '#121424',
      surface: '#202442',
    },
    accent: {
      gold: '#00F5D4',
      goldDim: '#00BFA5',
      green: '#7B2CBF',
      greenDim: '#5A189A',
      coral: '#F72585',
      coralDim: '#B5179E',
      cyan: '#00F5D4',
    },
    border: {
      subtle: '#293259',
      highlight: '#00F5D4',
      active: '#43538A',
    },
    text: {
      primary: '#F0F3F8',
      secondary: '#8DA2D4',
      muted: '#52628E',
      gold: '#00F5D4',
    },
  },
  hearth: {
    id: 'hearth',
    name: 'Dungeon Hearth',
    tag: 'EMBER',
    bg: {
      dusk: '#1A1412',
      duskRaised: '#291E1A',
      card: '#211814',
      surface: '#382822',
    },
    accent: {
      gold: '#FF9E00',
      goldDim: '#CC7A00',
      green: '#55A630',
      greenDim: '#2B7010',
      coral: '#E85D04',
      coralDim: '#9D0208',
      cyan: '#FFD000',
    },
    border: {
      subtle: '#473229',
      highlight: '#FF9E00',
      active: '#6E4E3F',
    },
    text: {
      primary: '#FFF3E6',
      secondary: '#D4B8A9',
      muted: '#8C7062',
      gold: '#FF9E00',
    },
  },
  parchment: {
    id: 'parchment',
    name: 'Sunstone Parchment',
    tag: 'LIGHT',
    isLight: true,
    bg: {
      dusk: '#F8F4E6',
      duskRaised: '#EFE8D3',
      card: '#FCF9F0',
      surface: '#E5DEC8',
    },
    accent: {
      gold: '#C2850A',
      goldDim: '#8F6605',
      green: '#2D7A42',
      greenDim: '#1B522A',
      coral: '#C0392B',
      coralDim: '#8A251A',
      cyan: '#0284C7',
    },
    border: {
      subtle: '#D6C8B8',
      highlight: '#C2850A',
      active: '#8F6605',
    },
    text: {
      primary: '#1E1A33',
      secondary: '#5A5470',
      muted: '#8A82A0',
      gold: '#A36F08',
    },
  },
};

const ThemeContext = createContext({
  themeId: 'dusk',
  theme: THEME_PALETTES.dusk,
  isLight: false,
  setThemeId: () => {},
  palettes: THEME_PALETTES,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState('dusk');

  useEffect(() => {
    getSetting('app_theme_id', 'dusk').then((saved) => {
      if (saved && THEME_PALETTES[saved]) {
        setThemeIdState(saved);
      }
    });
  }, []);

  const setThemeId = useCallback(async (id) => {
    if (THEME_PALETTES[id]) {
      triggerHaptic('medium');
      setThemeIdState(id);
      await setSetting('app_theme_id', id);
    }
  }, []);

  const theme = THEME_PALETTES[themeId] || THEME_PALETTES.dusk;
  const isLight = Boolean(theme.isLight);

  return (
    <ThemeContext.Provider
      value={{ themeId, theme, isLight, setThemeId, palettes: THEME_PALETTES }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
