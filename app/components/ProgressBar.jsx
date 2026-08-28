import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function ProgressBar({
  current = 0,
  max = 250,
  label = 'XP PROGRESS',
  color = colors.accent.gold,
  height = 10,
}) {
  const percent = Math.min(Math.max((current % max) / max, 0), 1);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  const widthInterpolated = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
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
        />
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
    color: colors.accent.gold,
  },
  track: {
    backgroundColor: '#1E1A33',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#3D3560',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
