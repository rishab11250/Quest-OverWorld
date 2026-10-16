import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { useRpgDrawer } from '../context/DrawerContext';
import { useTheme } from '../context/ThemeContext';

const CORE_TABS = [
  {
    name: 'home',
    label: 'QUEST',
    icon: 'compass-rose',
    iconFocused: 'compass',
  },
  {
    name: 'map',
    label: 'ATLAS',
    icon: 'map-legend',
    iconFocused: 'map-marker-radius',
  },
  {
    name: 'challenges',
    label: 'BOUNTY',
    icon: 'sword',
    iconFocused: 'sword-cross',
  },
];

export default function RpgTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { openDrawer, isOpen } = useRpgDrawer();
  const { theme, isLight } = useTheme();

  const currentRouteName = state.routes[state.index]?.name;
  const isDrawerActive = ['team', 'leaderboard', 'profile'].includes(currentRouteName) || isOpen;

  return (
    <View
      style={[
        styles.outerWrapper,
        {
          backgroundColor: theme?.bg?.dusk || '#171326',
          borderTopColor: theme?.border?.subtle || '#2F264C',
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {/* Top Gold Trim / Pixel Edge */}
      <View style={styles.topGoldEdge}>
        <View
          style={[
            styles.goldPipLeft,
            { backgroundColor: theme?.accent?.gold || colors.accent.gold },
          ]}
        />
        <View
          style={[styles.goldLine, { backgroundColor: theme?.accent?.gold || colors.accent.gold }]}
        />
        <View
          style={[
            styles.goldPipRight,
            { backgroundColor: theme?.accent?.gold || colors.accent.gold },
          ]}
        />
      </View>

      <View style={styles.tabContainer}>
        {/* Core 3 Adventure Tabs */}
        {CORE_TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            playSound('tap');
            triggerHaptic('light');
            if (routeIndex !== -1) {
              const route = state.routes[routeIndex];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            } else {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabSlot, isFocused && styles.tabSlotActive]}
            >
              {isFocused ? (
                <View
                  style={[
                    styles.activeTopPip,
                    { backgroundColor: theme?.accent?.gold || colors.accent.gold },
                  ]}
                />
              ) : null}

              <MaterialCommunityIcons
                name={isFocused ? tab.iconFocused : tab.icon}
                size={22}
                color={
                  isFocused
                    ? theme?.accent?.gold || colors.accent.gold
                    : theme?.text?.muted || '#7E75A0'
                }
              />

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? theme?.accent?.gold || colors.accent.gold
                      : theme?.text?.muted || '#7E75A0',
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* 4th Slot: Codex / Side-Drawer Trigger (#6) */}
        <TouchableOpacity
          onPress={() => {
            playSound('tap');
            triggerHaptic('medium');
            openDrawer();
          }}
          activeOpacity={0.7}
          style={[styles.tabSlot, isDrawerActive && styles.tabSlotActive]}
        >
          {isDrawerActive ? (
            <View
              style={[
                styles.activeTopPip,
                { backgroundColor: theme?.accent?.gold || colors.accent.gold },
              ]}
            />
          ) : null}

          <MaterialCommunityIcons
            name={isDrawerActive ? 'book-open-page-variant' : 'book-outline'}
            size={22}
            color={
              isDrawerActive
                ? theme?.accent?.gold || colors.accent.gold
                : theme?.text?.muted || '#7E75A0'
            }
          />

          <Text
            style={[
              styles.tabLabel,
              {
                color: isDrawerActive
                  ? theme?.accent?.gold || colors.accent.gold
                  : theme?.text?.muted || '#7E75A0',
              },
            ]}
            numberOfLines={1}
          >
            CODEX
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: '#171326',
    borderTopWidth: 1,
    borderTopColor: '#2F264C',
  },
  topGoldEdge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 2,
    width: '100%',
  },
  goldPipLeft: {
    width: 6,
    height: 2,
    backgroundColor: colors.accent.gold,
  },
  goldLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(242, 200, 75, 0.25)',
  },
  goldPipRight: {
    width: 6,
    height: 2,
    backgroundColor: colors.accent.gold,
  },
  tabContainer: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 3,
  },
  tabSlotActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.05)',
  },
  activeTopPip: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2.5,
    backgroundColor: colors.accent.gold,
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
  },
  tabLabel: {
    fontFamily: fonts.pixel,
    fontSize: 7.5,
    color: '#7E75A0',
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    color: colors.accent.gold,
  },
});
