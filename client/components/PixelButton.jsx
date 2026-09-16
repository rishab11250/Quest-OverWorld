import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { triggerHaptic } from '../lib/haptics';
import { useTheme } from '../context/ThemeContext';

/**
 * PixelButton - Tactile 3D Retro Pixel Button
 * Simulates physical arcade button depression with a stepped bottom border
 * that flattens when pressed.
 */
export default function PixelButton({
  title,
  icon,
  iconSize = 16,
  onPress,
  variant = 'gold', // 'gold' | 'green' | 'dusk' | 'coral'
  disabled = false,
  style,
  surfaceStyle,
  textStyle,
  children,
  haptic = 'medium',
  ...rest
}) {
  const { theme: appTheme, isLight } = useTheme();
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    triggerHaptic('light');
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.timing(pressAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (e) => {
    if (disabled) return;
    if (haptic) triggerHaptic(haptic);
    if (onPress) onPress(e);
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const getTheme = () => {
    switch (variant) {
      case 'green':
        return {
          baseBg: appTheme?.accent?.greenDim || '#1A5920',
          surfaceBg: appTheme?.accent?.green || colors.accent.green,
          textColor: '#FFFFFF',
          borderColor: appTheme?.accent?.greenDim || '#1A5920',
        };
      case 'coral':
        return {
          baseBg: appTheme?.accent?.coralDim || '#8A1F1F',
          surfaceBg: appTheme?.accent?.coral || colors.accent.coral,
          textColor: '#FFFFFF',
          borderColor: appTheme?.accent?.coralDim || '#8A1F1F',
        };
      case 'dusk':
        return {
          baseBg: appTheme?.bg?.dusk || '#110D20',
          surfaceBg: appTheme?.bg?.surface || '#282046',
          textColor: appTheme?.accent?.gold || colors.accent.gold,
          borderColor: appTheme?.border?.subtle || '#3D3360',
        };
      case 'gold':
      default:
        return {
          baseBg: appTheme?.accent?.goldDim || '#9E770C',
          surfaceBg: appTheme?.accent?.gold || colors.accent.gold,
          textColor: isLight ? '#1E1A33' : appTheme?.bg?.dusk || colors.bg.dusk,
          borderColor: appTheme?.accent?.goldDim || '#9E770C',
        };
    }
  };

  const theme = getTheme();

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.baseContainer,
        { backgroundColor: theme.baseBg, borderColor: theme.borderColor },
        disabled && styles.disabledBase,
        style,
      ]}
      {...rest}
    >
      <Animated.View
        style={[
          styles.surface,
          {
            backgroundColor: theme.surfaceBg,
            transform: [{ translateY }],
          },
          disabled && styles.disabledSurface,
          surfaceStyle,
        ]}
      >
        {/* Pixel corners */}
        <View style={[styles.pixelCorner, styles.cornerTL, { backgroundColor: theme.baseBg }]} />
        <View style={[styles.pixelCorner, styles.cornerTR, { backgroundColor: theme.baseBg }]} />

        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={theme.textColor}
            style={styles.icon}
          />
        ) : null}

        {title ? (
          <Text style={[styles.text, { color: theme.textColor }, textStyle]}>{title}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 8,
    paddingBottom: 4, // Exposes 4px bottom dark ledge for 3D depth
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  pixelCorner: {
    position: 'absolute',
    width: 3,
    height: 3,
    top: 0,
  },
  cornerTL: {
    left: 0,
  },
  cornerTR: {
    right: 0,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    ...typography.displayPixelSm,
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  disabledBase: {
    opacity: 0.5,
  },
  disabledSurface: {
    backgroundColor: '#352E50',
  },
});
