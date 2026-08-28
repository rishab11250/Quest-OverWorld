import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

const TAB_CONFIG = {
  home: {
    label: 'QUEST',
    icon: 'compass-rose',
    iconFocused: 'compass',
  },
  map: {
    label: 'ATLAS',
    icon: 'map-legend',
    iconFocused: 'map-marker-radius',
  },
  team: {
    label: 'PARTY',
    icon: 'shield-account-outline',
    iconFocused: 'shield-account',
  },
  challenges: {
    label: 'BOUNTY',
    icon: 'sword',
    iconFocused: 'sword-cross',
  },
  leaderboard: {
    label: 'HALL',
    icon: 'trophy-outline',
    iconFocused: 'trophy-award',
  },
  profile: {
    label: 'HERO',
    icon: 'account-outline',
    iconFocused: 'account-star',
  },
};

export default function RpgTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerWrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* Top Gold Trim / Pixel Edge */}
      <View style={styles.topGoldEdge}>
        <View style={styles.goldPipLeft} />
        <View style={styles.goldLine} />
        <View style={styles.goldPipRight} />
      </View>

      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: options.title || route.name.toUpperCase(),
            icon: 'circle-outline',
            iconFocused: 'circle',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabSlot, isFocused && styles.tabSlotActive]}
            >
              {/* Active Hotbar Top Marker */}
              {isFocused ? <View style={styles.activeTopPip} /> : null}

              {/* RPG Icon */}
              <MaterialCommunityIcons
                name={isFocused ? config.iconFocused : config.icon}
                size={22}
                color={isFocused ? colors.accent.gold : '#7E75A0'}
              />

              {/* Slot RPG Label */}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    paddingHorizontal: 4,
  },
  tabSlot: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 1,
    paddingVertical: 4,
    position: 'relative',
  },
  tabSlotActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.35)',
  },
  activeTopPip: {
    position: 'absolute',
    top: 2,
    width: 12,
    height: 2,
    backgroundColor: colors.accent.gold,
    borderRadius: 1,
  },
  tabLabel: {
    fontFamily: fonts.pixel,
    fontSize: 7.5,
    letterSpacing: 0.5,
    color: '#7E75A0',
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.accent.gold,
  },
});
