import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import colors from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 22;

/**
 * AtmosphericBackground - Ambient Floating Stardust & Embers
 * Gentle GPU-driven upward drifting stardust particles giving a living atmosphere.
 */
export default function AtmosphericBackground() {
  const { theme, isLight } = useTheme();

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const startX = Math.random() * SCREEN_WIDTH;
      const driftX = (Math.random() - 0.5) * 60;
      const size = Math.random() > 0.7 ? 4 : Math.random() > 0.4 ? 3 : 2;
      const duration = 7000 + Math.random() * 8000;
      const delay = Math.random() * 6000;
      const opacityMax = 0.35 + Math.random() * 0.45;
      const isGold = i % 3 === 0;

      return {
        id: i,
        startX,
        driftX,
        size,
        duration,
        delay,
        opacityMax,
        isGold,
      };
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <ParticleItem key={p.id} config={p} theme={theme} isLight={isLight} />
      ))}
    </View>
  );
}

function ParticleItem({ config, theme, isLight }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, config]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT + 20, -30],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [config.startX, config.startX + config.driftX, config.startX],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, config.opacityMax, config.opacityMax * 0.8, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.2, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          backgroundColor: config.isGold
            ? theme?.accent?.gold || colors.accent.gold
            : isLight
              ? '#B8A896'
              : theme?.text?.secondary || '#C9C3DD',
          shadowColor: config.isGold
            ? theme?.accent?.gold || colors.accent.gold
            : isLight
              ? '#D5C4AF'
              : '#FFFFFF',
          shadowOpacity: 0.6,
          shadowRadius: config.size * 2,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 1, // Retro 8-bit square
  },
});
