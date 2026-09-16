import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRpgDrawer } from '../context/DrawerContext';
import { useTour } from '../context/TourContext';
import { useTheme } from '../context/ThemeContext';
import { getUserData } from '../lib/secureStore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import { triggerHaptic } from '../lib/haptics';
import PixelButton from './PixelButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

export default function RpgDrawer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, closeDrawer } = useRpgDrawer();
  const { openTourSelector } = useTour();
  const { themeId, setThemeId, palettes, theme, isLight } = useTheme();
  const [user, setUser] = useState(null);

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getUserData().then((u) => {
      if (u) setUser(u);
    });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, backdropAnim]);

  const handleNavigate = (route) => {
    triggerHaptic('light');
    closeDrawer();
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  const navItems = [
    {
      id: 'home',
      label: 'QUEST HUB',
      sub: 'Active expedition & clue',
      icon: 'compass-rose',
      route: '/(tabs)/home',
    },
    {
      id: 'map',
      label: 'ATLAS RADAR',
      sub: 'Campus map & station pins',
      icon: 'map-legend',
      route: '/(tabs)/map',
    },
    {
      id: 'challenges',
      label: 'BOUNTY BOARD',
      sub: 'Special trivia & photo missions',
      icon: 'sword-cross',
      route: '/(tabs)/challenges',
    },
    {
      id: 'team',
      label: 'GUILD & PARTY',
      sub: 'Team hub, members & code',
      icon: 'shield-account',
      route: '/(tabs)/team',
    },
    {
      id: 'leaderboard',
      label: 'HALL OF FAME',
      sub: 'Global rankings & points',
      icon: 'trophy-award',
      route: '/(tabs)/leaderboard',
    },
    {
      id: 'profile',
      label: 'HERO CODEX',
      sub: 'Profile stats & preferences',
      icon: 'account-star',
      route: '/(tabs)/profile',
    },
  ];

  return (
    <View
      style={[StyleSheet.absoluteFillObject, styles.container]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
      </Animated.View>

      {/* Slide-out Drawer Menu */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, 24) + 10,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            backgroundColor: theme?.bg?.dusk || '#18142A',
            borderLeftColor: theme?.border?.highlight || colors.accent.gold,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Corner Rivets */}
        <View
          style={[
            styles.corner,
            styles.cornerTL,
            { backgroundColor: theme?.accent?.gold || colors.accent.gold },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBL,
            { backgroundColor: theme?.accent?.gold || colors.accent.gold },
          ]}
        />

        {/* Header Ribbon */}
        <View style={styles.drawerHeader}>
          <View
            style={[
              styles.userAvatarWrap,
              {
                backgroundColor: theme?.bg?.surface || '#241B3B',
                borderColor: theme?.border?.highlight || colors.accent.gold,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-tie"
              size={24}
              color={theme?.accent?.gold || colors.accent.gold}
            />
          </View>
          <View style={styles.userInfo}>
            <Text
              style={[styles.userName, { color: theme?.text?.primary || '#EFEBF8' }]}
              numberOfLines={1}
            >
              {user?.name || 'ADVENTURER'}
            </Text>
            <View
              style={[
                styles.userRoleBadge,
                {
                  backgroundColor: isLight ? '#F0E6D8' : 'rgba(242, 200, 75, 0.12)',
                  borderColor: theme?.accent?.gold || colors.accent.gold,
                },
              ]}
            >
              <Text
                style={[styles.userRoleText, { color: theme?.accent?.gold || colors.accent.gold }]}
              >
                {user?.role === 'admin' ? 'REALM MASTER' : 'GUILD HERO'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: theme?.bg?.surface || '#221A3B',
                borderColor: theme?.border?.subtle || '#44366A',
              },
            ]}
            onPress={closeDrawer}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme?.accent?.gold || colors.accent.gold}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme?.border?.subtle || '#2E244E' }]} />

        {/* Menu Navigation Items */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: theme?.accent?.gold || colors.accent.gold }]}>
            REALM CODEX
          </Text>

          <View style={styles.navGroup}>
            {navItems.map((item) => {
              const isActive = pathname === item.route || pathname.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.navItem,
                    {
                      backgroundColor: isActive
                        ? isLight
                          ? '#F2E8D5'
                          : '#2C234D'
                        : theme?.bg?.card || '#1E1935',
                      borderColor: isActive
                        ? theme?.border?.highlight || colors.accent.gold
                        : theme?.border?.subtle || '#3A3258',
                    },
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.navIconBox,
                      {
                        backgroundColor: theme?.bg?.surface || '#151128',
                        borderColor: isActive
                          ? theme?.accent?.gold || colors.accent.gold
                          : theme?.border?.subtle || '#352C54',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={
                        isActive
                          ? theme?.accent?.gold || colors.accent.gold
                          : theme?.text?.muted || '#7E75A0'
                      }
                    />
                  </View>
                  <View style={styles.navTextWrap}>
                    <Text
                      style={[
                        styles.navLabel,
                        {
                          color: isActive
                            ? theme?.accent?.gold || colors.accent.gold
                            : theme?.text?.primary || '#EFEBF8',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[styles.navSub, { color: theme?.text?.secondary || '#8D84AE' }]}>
                      {item.sub}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={16}
                    color={
                      isActive
                        ? theme?.accent?.gold || colors.accent.gold
                        : theme?.border?.active || '#4E436E'
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {user?.role === 'admin' ? (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { marginTop: 14, color: theme?.accent?.gold || colors.accent.gold },
                ]}
              >
                OVERSEER CONSOLE
              </Text>
              <TouchableOpacity
                style={[
                  styles.adminNavItem,
                  {
                    backgroundColor: isLight ? '#FDECEC' : 'rgba(232, 102, 75, 0.08)',
                    borderColor: 'rgba(232, 102, 75, 0.4)',
                  },
                ]}
                onPress={() => handleNavigate('/admin/dashboard')}
                activeOpacity={0.8}
              >
                <View style={styles.adminIconBox}>
                  <MaterialCommunityIcons name="shield-crown" size={18} color="#FF6B6B" />
                </View>
                <View style={styles.navTextWrap}>
                  <Text style={styles.adminNavLabel}>MASTER DASHBOARD</Text>
                  <Text style={[styles.navSub, { color: theme?.text?.secondary || '#8D84AE' }]}>
                    Quests, Checkpoints & QR
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </>
          ) : null}

          {/* Theme Palette Switcher (#9) */}
          <Text
            style={[
              styles.sectionLabel,
              { marginTop: 16, color: theme?.accent?.gold || colors.accent.gold },
            ]}
          >
            8-BIT PALETTE
          </Text>
          <View style={styles.paletteGrid}>
            {Object.values(palettes).map((p) => {
              const isSelected = themeId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.paletteChip,
                    {
                      backgroundColor: isSelected
                        ? isLight
                          ? '#F5EBDA'
                          : '#261F42'
                        : theme?.bg?.card || '#161226',
                      borderColor: isSelected
                        ? theme?.border?.highlight || colors.accent.gold
                        : theme?.border?.subtle || '#362E52',
                    },
                  ]}
                  onPress={() => setThemeId(p.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.paletteColorDot, { backgroundColor: p.accent.gold }]} />
                  <Text
                    style={[
                      styles.paletteChipText,
                      {
                        color: isSelected
                          ? theme?.accent?.gold || colors.accent.gold
                          : theme?.text?.secondary || '#B8B2D1',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {p.isLight ? '☀️ Light' : p.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Guide Shortcut */}
          <Text
            style={[
              styles.sectionLabel,
              { marginTop: 16, color: theme?.accent?.gold || colors.accent.gold },
            ]}
          >
            ASSISTANCE
          </Text>
          <TouchableOpacity
            style={[
              styles.tourLauncherBtn,
              {
                backgroundColor: isLight ? '#F5EBDA' : '#1C1635',
                borderColor: theme?.accent?.gold || colors.accent.gold,
              },
            ]}
            onPress={() => {
              closeDrawer();
              setTimeout(() => openTourSelector(), 200);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="compass-outline"
              size={18}
              color={theme?.accent?.gold || colors.accent.gold}
            />
            <Text
              style={[
                styles.tourLauncherText,
                { color: theme?.accent?.gold || colors.accent.gold },
              ]}
            >
              START INTERACTIVE TOUR
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.drawerFooter, { borderTopColor: theme?.border?.subtle || '#292147' }]}>
          <Text style={[styles.versionText, { color: theme?.text?.muted || '#6F6494' }]}>
            QUEST OVERWORLD V1.5.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#181429',
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.gold,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 30,
  },
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: colors.accent.gold,
    left: -3,
  },
  cornerTL: { top: 0 },
  cornerBL: { bottom: 0 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
  },
  userAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#271F42',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.displayPixelSm,
    fontSize: 12,
    color: colors.text.onDark.primary,
    letterSpacing: 0.5,
  },
  userRoleBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.3)',
  },
  userRoleText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#241D3B',
    borderWidth: 1,
    borderColor: '#3D3560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#2E2648',
    marginBottom: 10,
  },
  scrollContent: {
    flex: 1,
  },
  sectionLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  navGroup: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E1933',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#352D50',
  },
  navItemActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
  },
  navIconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#141124',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#31284D',
  },
  navIconBoxActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
  },
  navTextWrap: {
    flex: 1,
  },
  navLabel: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.text.onDark.primary,
    letterSpacing: 0.6,
  },
  navLabelActive: {
    color: colors.accent.gold,
  },
  navSub: {
    ...typography.caption,
    fontSize: 9,
    color: '#8D84AE',
    marginTop: 1,
  },
  adminNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(232, 102, 75, 0.08)',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.4)',
  },
  adminIconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1E121E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8664B',
  },
  adminNavLabel: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: '#FF6B6B',
    letterSpacing: 0.6,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paletteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161226',
    borderWidth: 1,
    borderColor: '#362E52',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: '47%',
  },
  paletteChipActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
  },
  paletteColorDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  paletteChipText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.text.onDark.secondary,
  },
  paletteChipTextActive: {
    color: colors.accent.gold,
  },
  tourLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 75, 0.1)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
  },
  tourLauncherText: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#282142',
    paddingTop: 8,
    alignItems: 'center',
  },
  versionText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: '#655B85',
    letterSpacing: 1,
  },
});
