import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sound';
import colors from '../theme/colors';
import typography from '../theme/typography';

const FloatingXpContext = createContext({
  showFloatingXp: () => {},
});

export const useFloatingXp = () => useContext(FloatingXpContext);

export function FloatingXpProvider({ children }) {
  const [activeItem, setActiveItem] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;

  const showFloatingXp = useCallback(
    ({ amount = 100, label = 'EXPEDITION XP', icon = 'star-shooting', variant = 'gold' } = {}) => {
      playSound('coin');
      triggerHaptic('notification');
      setActiveItem({
        id: Date.now(),
        amount,
        label,
        icon,
        variant,
      });

      anim.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1200),
        Animated.timing(anim, {
          toValue: 2,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setActiveItem(null);
        }
      });
    },
    [anim]
  );

  const translateY = anim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [20, -25, -75],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.4, 1, 2],
    outputRange: [0.6, 1.2, 1.0, 0.85],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 1, 1.8, 2],
    outputRange: [0, 1, 1, 0.6, 0],
  });

  const isGreen = activeItem?.variant === 'green';
  const badgeColor = isGreen ? colors.accent.green : colors.accent.gold;

  return (
    <FloatingXpContext.Provider value={{ showFloatingXp }}>
      {children}

      {activeItem ? (
        <View style={styles.overlayContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.particleCard,
              {
                borderColor: badgeColor,
                shadowColor: badgeColor,
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            {/* Pixel corners */}
            <View style={[styles.corner, styles.cornerTL, { backgroundColor: badgeColor }]} />
            <View style={[styles.corner, styles.cornerTR, { backgroundColor: badgeColor }]} />
            <View style={[styles.corner, styles.cornerBL, { backgroundColor: badgeColor }]} />
            <View style={[styles.corner, styles.cornerBR, { backgroundColor: badgeColor }]} />

            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={activeItem.icon} size={18} color={badgeColor} />
            </View>

            <View style={styles.textWrap}>
              <Text style={[styles.xpText, { color: badgeColor }]}>+{activeItem.amount} XP ⚡</Text>
              <Text style={styles.labelText}>{activeItem.label.toUpperCase()}</Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </FloatingXpContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120,
    zIndex: 999999,
    elevation: 50,
  },
  particleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1635',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 25,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 4,
    height: 4,
  },
  cornerTL: { top: -2, left: -2 },
  cornerTR: { top: -2, right: -2 },
  cornerBL: { bottom: -2, left: -2 },
  cornerBR: { bottom: -2, right: -2 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    alignItems: 'flex-start',
  },
  xpText: {
    ...typography.displayPixelSm,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  labelText: {
    ...typography.captionBold,
    fontSize: 8.5,
    color: colors.text.onDark.secondary,
    letterSpacing: 0.8,
    marginTop: 1,
  },
});
