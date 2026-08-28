import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function ProgressBar({
  current = 0,
  max = 250,
  label = 'XP PROGRESS',
  color = colors.accent.gold,
  height = 12,
}) {
  const percent = Math.min(Math.max((current % max) / max, 0), 1);
  const fillAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Fill Animation
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  // Continuous Gold Particle Shimmer Loop
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  const widthInterpolated = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 240],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {current % max} / {max} XP
        </Text>
      </View>

      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor: color,
            },
          ]}
        >
          {/* Shimmer Light Particle */}
          <Animated.View
            style={[
              styles.shimmerParticle,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  counter: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
  },
  track: {
    backgroundColor: '#161326',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 1.5,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerParticle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ skewX: '-20deg' }],
  },
});
