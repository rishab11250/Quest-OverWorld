import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { useTheme } from '../context/ThemeContext';

/**
 * RadialActionMenu - Floating RPG Action Diamond
 * Floating action crystal that expands into quick shortcuts for Scanner, Map, Bounties, and Party.
 */
export default function RadialActionMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isLight } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    playSound('tap');
    triggerHaptic('medium');
    const toVal = expanded ? 0 : 1;
    Animated.spring(anim, {
      toValue: toVal,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const handleAction = (route) => {
    playSound('radar');
    triggerHaptic('light');
    toggleMenu();
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  // Radial Action items
  const actions = [
    {
      id: 'scan',
      label: 'SCAN QR',
      icon: 'qrcode-scan',
      route: '/camera/scanner',
      color: theme?.accent?.gold || colors.accent.gold,
      angle: -90, // straight up
      dist: 80,
    },
    {
      id: 'map',
      label: 'ATLAS',
      icon: 'map-marker-radius',
      route: '/(tabs)/map',
      color: theme?.accent?.cyan || '#48CAE4',
      angle: -140, // top-left
      dist: 75,
    },
    {
      id: 'bounty',
      label: 'BOUNTY',
      icon: 'sword-cross',
      route: '/(tabs)/challenges',
      color: theme?.accent?.green || '#5FBF7A',
      angle: -180, // left
      dist: 80,
    },
  ];

  const mainRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <>
      {/* Backdrop Dimmer */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={toggleMenu} />
      </Animated.View>

      <View
        style={[styles.fabAnchor, { bottom: Math.max(insets.bottom, 8) + 68 }]}
        pointerEvents="box-none"
      >
        {/* Child Radial Action Nodes */}
        {actions.map((act) => {
          const rad = (act.angle * Math.PI) / 180;
          const targetX = Math.cos(rad) * act.dist;
          const targetY = Math.sin(rad) * act.dist;

          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetX],
          });

          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetY],
          });

          const scale = anim.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 0.5, 1],
          });

          const opacity = anim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0.7, 1],
          });

          return (
            <Animated.View
              key={act.id}
              style={[
                styles.actionItemWrap,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                  opacity,
                },
              ]}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: theme?.bg?.card || '#1C1732',
                    borderColor: act.color,
                  },
                ]}
                onPress={() => handleAction(act.route)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={act.icon} size={20} color={act.color} />
              </TouchableOpacity>
              <View
                style={[
                  styles.actionLabelPill,
                  {
                    backgroundColor: theme?.bg?.surface || '#120F22',
                    borderColor: theme?.border?.subtle || '#362E52',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionLabelText,
                    {
                      color: theme?.text?.primary || colors.text.onDark.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {act.label}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {/* Central Floating Diamond FAB Button */}
        <TouchableOpacity
          style={[
            styles.mainFab,
            {
              backgroundColor: theme?.accent?.goldDim || '#9E770C',
              borderColor: theme?.accent?.goldDim || '#9E770C',
              shadowColor: theme?.accent?.gold || colors.accent.gold,
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.85}
        >
          <Animated.View
            style={[
              styles.diamondInner,
              {
                backgroundColor: theme?.accent?.gold || colors.accent.gold,
                transform: [{ rotate: mainRotate }],
              },
            ]}
          >
            {/* Corner pixel studs */}
            <View
              style={[
                styles.diamondCorner,
                styles.cTop,
                { backgroundColor: theme?.accent?.goldDim || '#9E770C' },
              ]}
            />
            <View
              style={[
                styles.diamondCorner,
                styles.cBottom,
                { backgroundColor: theme?.accent?.goldDim || '#9E770C' },
              ]}
            />
            <View
              style={[
                styles.diamondCorner,
                styles.cLeft,
                { backgroundColor: theme?.accent?.goldDim || '#9E770C' },
              ]}
            />
            <View
              style={[
                styles.diamondCorner,
                styles.cRight,
                { backgroundColor: theme?.accent?.goldDim || '#9E770C' },
              ]}
            />

            {/* Retro 8-bit RPG Icon: 4-Point Power Star / Bold Cross */}
            <MaterialCommunityIcons
              name={expanded ? 'close-thick' : 'star-four-points'}
              size={expanded ? 20 : 22}
              color={isLight ? '#1E1A33' : theme?.bg?.dusk || colors.bg.dusk}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0C1C',
    zIndex: 9980,
  },
  fabAnchor: {
    position: 'absolute',
    bottom: 74,
    right: 18,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9990,
  },
  mainFab: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#9E770C',
    paddingBottom: 4, // 3D depth
    borderWidth: 1,
    borderColor: '#9E770C',
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  diamondInner: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  diamondCorner: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#9E770C',
  },
  cTop: { top: 0, alignSelf: 'center' },
  cBottom: { bottom: 0, alignSelf: 'center' },
  cLeft: { left: 0, top: '50%', marginTop: -1.5 },
  cRight: { right: 0, top: '50%', marginTop: -1.5 },
  actionItemWrap: {
    position: 'absolute',
    width: 90,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1C1732',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  actionLabelPill: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#120F22',
    borderWidth: 1,
    borderColor: '#362E52',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabelText: {
    ...typography.displayPixelXs,
    fontSize: 6,
    color: colors.text.onDark.primary,
    letterSpacing: 0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
