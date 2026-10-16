import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
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

const COIN_COUNT = 6;

export function FloatingXpProvider({ children }) {
  const [activeItem, setActiveItem] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;

  // Precomputed coin radial angles
  const coins = useMemo(() => {
    return Array.from({ length: COIN_COUNT }).map((_, i) => {
      const angle = (i * (360 / COIN_COUNT) * Math.PI) / 180;
      const radius = 45 + (i % 2) * 15;
      return {
        id: i,
        dx: Math.cos(angle) * radius,
        dyPeak: Math.sin(angle) * radius - 20,
        dyDrop: Math.sin(angle) * radius + 35,
      };
    });
  }, []);

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
          {/* Radial GPU Coin Physics Fountain */}
          {coins.map((c) => {
            const coinX = anim.interpolate({
              inputRange: [0, 0.4, 1, 2],
              outputRange: [0, c.dx * 0.7, c.dx, 0],
            });
            const coinY = anim.interpolate({
              inputRange: [0, 0.35, 1, 2],
              outputRange: [0, c.dyPeak, c.dyDrop, -40],
            });
            const coinRotate = anim.interpolate({
              inputRange: [0, 1, 2],
              outputRange: ['0deg', '360deg', '720deg'],
            });
            const coinOpacity = anim.interpolate({
              inputRange: [0, 0.15, 0.8, 1.6, 2],
              outputRange: [0, 1, 1, 0.7, 0],
            });

            return (
              <Animated.View
                key={c.id}
                style={[
                  styles.microCoin,
                  {
                    transform: [
                      { perspective: 400 },
                      { translateX: coinX },
                      { translateY: coinY },
                      { rotateY: coinRotate },
                    ],
                    opacity: coinOpacity,
                  },
                ]}
              >
                <View style={styles.microCoinInner} />
              </Animated.View>
            );
          })}

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
    zIndex: 10,
  },
  microCoin: {
    position: 'absolute',
    top: 135,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F2C84B',
    borderWidth: 1.5,
    borderColor: '#FFF4D6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#F2C84B',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  microCoinInner: {
    width: 5,
    height: 5,
    backgroundColor: '#B8860B',
    borderRadius: 1,
  },
  corner: {
    position: 'absolute',
    width: 4,
    height: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
  },
  cornerTR: {
    top: -2,
    right: -2,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    gap: 2,
  },
  xpText: {
    ...typography.displayPixelSm,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  labelText: {
    ...typography.captionBold,
    fontSize: 10,
    color: '#D8D4E8',
    letterSpacing: 0.8,
  },
});
