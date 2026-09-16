import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const CONFETTI_COLORS = [
  '#F2C84B', // Retro Gold
  '#FFE066', // Light Gold
  '#4BB543', // 8-Bit Emerald
  '#52B788', // Mint Green
  '#FF6B6B', // Retro Coral
  '#48CAE4', // Neon Cyan
  '#FFFFFF', // Starlight White
  '#E0AAFF', // Mystic Violet
];

const PARTICLE_SIZES = [
  { w: 6, h: 6 },
  { w: 8, h: 8 },
  { w: 10, h: 10 },
  { w: 6, h: 11 },
  { w: 10, h: 6 },
  { w: 5, h: 5 },
];

/**
 * PixelConfetti - 8-Bit Retro Particle Burst
 * Shoots square confetti particles outward in a celebratory victory fountain.
 */
export default function PixelConfetti({
  active = false,
  particleCount = 38,
  duration = 2400,
  onComplete,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  // Generate deterministic randomized particle trajectories
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Fan upward between -150 deg and -30 deg
      const angleDeg = -150 + Math.random() * 120;
      const angleRad = (angleDeg * Math.PI) / 180;
      const force = 80 + Math.random() * 160;
      const dx = Math.cos(angleRad) * force * 1.2;
      const dyPeak = Math.sin(angleRad) * force - 40;
      const dyFall = dyPeak + 220 + Math.random() * 260;
      const spin = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 720);
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = PARTICLE_SIZES[i % PARTICLE_SIZES.length];

      return {
        id: i,
        dx,
        dyPeak,
        dyFall,
        spin,
        color,
        size,
      };
    });
  }, [particleCount]);

  useEffect(() => {
    if (active) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onComplete) onComplete();
      });
    } else {
      anim.setValue(0);
    }
  }, [active, anim, duration, onComplete]);

  if (!active) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => {
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });

        const translateY = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, p.dyPeak, p.dyFall],
        });

        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0.2, 1.2, 1, 0.6],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                width: p.size.w,
                height: p.size.h,
                backgroundColor: p.color,
                borderColor: 'rgba(0, 0, 0, 0.3)',
                borderWidth: 1,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    borderRadius: 1, // Slight 8-bit bevel
  },
});
