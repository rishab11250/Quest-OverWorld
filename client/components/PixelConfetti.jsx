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
 * PixelConfetti - 8-Bit Retro GPU Particle Physics Shrapnel
 * Parabolic gravitational trajectory with 3D axis tumbling (rotateX, rotateY, rotateZ)
 * and ground impact bounce restitution.
 */
export default function PixelConfetti({
  active = false,
  particleCount = 42,
  duration = 2600,
  onComplete,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  // Generate deterministic randomized particle trajectories
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Fan upward between -165 deg and -15 deg
      const angleDeg = -165 + Math.random() * 150;
      const angleRad = (angleDeg * Math.PI) / 180;
      const velocity = 100 + Math.random() * 180;

      const dx = Math.cos(angleRad) * velocity * 1.3;
      const dyApex = Math.sin(angleRad) * velocity - 60; // Upward peak
      const dyGround = dyApex + 240 + Math.random() * 260; // Fall to ground
      const dyBounce = dyGround - 35 - Math.random() * 45; // Elastic bounce peak
      const dyFinal = dyGround + 20;

      const spinX = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
      const spinY = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
      const spinZ = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540);

      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = PARTICLE_SIZES[i % PARTICLE_SIZES.length];

      return {
        id: i,
        dx,
        dyApex,
        dyGround,
        dyBounce,
        dyFinal,
        spinX,
        spinY,
        spinZ,
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
        easing: Easing.linear,
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
        // Horizontal drift with subtle deceleration
        const translateX = anim.interpolate({
          inputRange: [0, 0.4, 0.7, 1],
          outputRange: [0, p.dx * 0.65, p.dx * 0.9, p.dx],
        });

        // Parabolic gravitational arc + ground bounce restitution
        const translateY = anim.interpolate({
          inputRange: [0, 0.28, 0.68, 0.82, 1],
          outputRange: [0, p.dyApex, p.dyGround, p.dyBounce, p.dyFinal],
        });

        // 3D Axis Tumbling on the GPU
        const rotateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spinX}deg`],
        });

        const rotateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spinY}deg`],
        });

        const rotateZ = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spinZ}deg`],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.12, 0.8, 1],
          outputRange: [0.15, 1.25, 1.0, 0.45],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.08, 0.75, 1],
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
                borderColor: 'rgba(0, 0, 0, 0.25)',
                borderWidth: 0.8,
                transform: [
                  { perspective: 600 },
                  { translateX },
                  { translateY },
                  { scale },
                  { rotateX },
                  { rotateY },
                  { rotateZ },
                ],
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
    borderRadius: 1, // Retro 8-bit square particle
  },
});
