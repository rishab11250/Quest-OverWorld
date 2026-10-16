import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import colors from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { getTimeOfDayAtmosphere } from '../theme/atmosphere';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 26;

/**
 * AtmosphericBackground - GPU Physics Particle System & Micro-Interactions
 * Ambient environmental particle physics driven on the native GPU compositor thread.
 * Synchronizes with time-of-day (solar dust, embers, cosmic stars, shooting streaks).
 */
export default function AtmosphericBackground() {
  const { theme, isLight } = useTheme();
  const atmosphere = getTimeOfDayAtmosphere();
  const isNightOrDusk = atmosphere.period === 'night' || atmosphere.period === 'dusk';

  // 1. Environmental ambient particles
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const startX = Math.random() * SCREEN_WIDTH;
      const driftX = (Math.random() - 0.5) * 85;
      const size = Math.random() > 0.75 ? 4 : Math.random() > 0.45 ? 3 : 2;
      const duration = 6500 + Math.random() * 8000;
      const delay = Math.random() * 5000;
      const opacityMax = 0.35 + Math.random() * 0.5;
      const spin = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

      // Period-dependent coloring
      let colorType = 'accent';
      if (atmosphere.period === 'night') {
        colorType = i % 4 === 0 ? 'accent' : i % 3 === 0 ? 'cyan' : 'star';
      } else if (atmosphere.period === 'dusk') {
        colorType = i % 3 === 0 ? 'coral' : 'gold';
      } else {
        colorType = i % 2 === 0 ? 'gold' : 'muted';
      }

      return {
        id: i,
        startX,
        driftX,
        size,
        duration,
        delay,
        opacityMax,
        spin,
        colorType,
      };
    });
  }, [atmosphere.period]);

  // 2. Shooting Star / Cosmic Streak Micro-Interaction
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNightOrDusk || isLight) return;

    let timeoutId = null;
    const triggerStreak = () => {
      streakAnim.setValue(0);
      Animated.timing(streakAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Schedule next random cosmic streak (between 12 and 22 seconds)
        const nextDelay = 12000 + Math.random() * 10000;
        timeoutId = setTimeout(triggerStreak, nextDelay);
      });
    };

    timeoutId = setTimeout(triggerStreak, 4000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isNightOrDusk, isLight, streakAnim]);

  const streakX = streakAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, SCREEN_WIDTH + 60],
  });

  const streakY = streakAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.15, SCREEN_HEIGHT * 0.42],
  });

  const streakOpacity = streakAnim.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0, 0.8, 0.6, 0],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <PhysicsParticle key={p.id} config={p} theme={theme} isLight={isLight} atmosphere={atmosphere} />
      ))}

      {/* Occasional Cosmic Shooting Star Streak */}
      {isNightOrDusk && !isLight ? (
        <Animated.View
          style={[
            styles.shootingStar,
            {
              transform: [{ translateX: streakX }, { translateY: streakY }, { rotate: '28deg' }],
              opacity: streakOpacity,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function PhysicsParticle({ config, theme, isLight, atmosphere }) {
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
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [
      config.startX,
      config.startX + config.driftX,
      config.startX - config.driftX * 0.5,
      config.startX,
    ],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, config.opacityMax, config.opacityMax * 0.75, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1.25, 0.8],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${config.spin}deg`],
  });

  let pColor = theme?.accent?.gold || colors.accent.gold;
  if (config.colorType === 'coral') pColor = colors.accent.coral;
  else if (config.colorType === 'cyan') pColor = '#48CAE4';
  else if (config.colorType === 'star') pColor = '#E0AAFF';
  else if (config.colorType === 'muted') pColor = isLight ? '#B8A896' : theme?.text?.secondary || '#A099C0';

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.size,
          backgroundColor: pColor,
          shadowColor: pColor,
          shadowOpacity: 0.75,
          shadowRadius: config.size * 2,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
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
    borderRadius: 1, // Retro 8-bit square particle
  },
  shootingStar: {
    position: 'absolute',
    width: 65,
    height: 2,
    backgroundColor: '#FFE066',
    borderRadius: 1,
    shadowColor: '#FFF',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});
