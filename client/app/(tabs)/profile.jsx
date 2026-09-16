import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { getUserData, clearAuth, setUserData, getSetting, setSetting } from '../../lib/secureStore';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';
import { triggerHaptic, setHapticGlobalState } from '../../lib/haptics';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import ProfileHeroCard from '../../components/profile/ProfileHeroCard';
import ProfileSettingsCard from '../../components/profile/ProfileSettingsCard';
import ProfileRealmCard from '../../components/profile/ProfileRealmCard';
import EditHeroModal from '../../components/profile/EditHeroModal';
import { useTour } from '../../context/TourContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isLight } = useTheme();
  const { isTourActive, openTourSelector, activeTourTarget } = useTour() || {};
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activeTourTarget || !scrollRef.current) return;
    if (activeTourTarget === 'profile_hero') {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    } else if (activeTourTarget === 'profile_settings') {
      scrollRef.current.scrollTo({ y: 140, animated: true });
    } else if (activeTourTarget === 'profile_realm') {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [activeTourTarget]);

  // Edit Profile state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('shield-crown');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  // Functional Preferences
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [autoTorch, setAutoTorch] = useState(false);
  const [livePolling, setLivePolling] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const cached = await getUserData();
      if (cached) setUser(cached);

      const meRes = await api.get('/auth/me');
      if (meRes?.user) setUser(meRes.user);

      try {
        const teamRes = await api.get('/teams/me');
        if (teamRes?.team) setTeam(teamRes.team);
        else setTeam(null);
      } catch (err) {
        setTeam(null);
      }

      // Load settings
      const [gpsVal, torchVal, pollVal, hapticVal] = await Promise.all([
        getSetting('high_accuracy_gps', true),
        getSetting('auto_torch', false),
        getSetting('live_polling', true),
        getSetting('haptic_feedback', true),
      ]);
      setHighAccuracyGps(gpsVal);
      setAutoTorch(torchVal);
      setLivePolling(pollVal);
      setHapticFeedback(hapticVal);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || 'shield-crown');
    setEditError('');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Adventurer name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    setEditError('');

    try {
      const res = await api.put('/auth/me', {
        name: editName.trim(),
        avatar: editAvatar,
      });

      if (res?.user) {
        triggerHaptic('success');
        setUser(res.user);
        await setUserData(res.user);
      }
      setEditModalVisible(false);
    } catch (err) {
      triggerHaptic('error');
      setEditError(err.message || 'Failed to update hero profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleSetting = async (key, val, setter) => {
    if (key === 'haptic_feedback') setHapticGlobalState(val);
    triggerHaptic('light');
    setter(val);
    await setSetting(key, val);
  };

  const handleClearCache = async () => {
    triggerHaptic('medium');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleLogout = async () => {
    triggerHaptic('warning');
    setLogoutModalVisible(false);
    await clearAuth();
    router.replace('/(auth)/login');
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Reading Hero Codex..." />;
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: theme.bg.dusk }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: isTourActive ? 380 : spacing.xxxl,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent.gold}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.pixelTitle, { color: theme.accent.gold }]}>HERO CODEX</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>PLAYER ACCOUNT & PREFERENCES</Text>
      </View>

      <View style={[activeTourTarget === 'profile_hero' && styles.tourTargetGlow]}>
        <ProfileHeroCard user={user} team={team} onOpenEdit={handleOpenEdit} />
      </View>

      <View style={[activeTourTarget === 'profile_settings' && styles.tourTargetGlow]}>
        <ProfileSettingsCard
          highAccuracyGps={highAccuracyGps}
          onToggleGps={(val) => handleToggleSetting('high_accuracy_gps', val, setHighAccuracyGps)}
          autoTorch={autoTorch}
          onToggleTorch={(val) => handleToggleSetting('auto_torch', val, setAutoTorch)}
          livePolling={livePolling}
          onTogglePolling={(val) => handleToggleSetting('live_polling', val, setLivePolling)}
          hapticFeedback={hapticFeedback}
          onToggleHaptic={(val) => handleToggleSetting('haptic_feedback', val, setHapticFeedback)}
          cacheCleared={cacheCleared}
          onClearCache={handleClearCache}
          onOpenGuide={openTourSelector}
        />
      </View>

      <View style={[activeTourTarget === 'profile_realm' && styles.tourTargetGlow]}>
        <ProfileRealmCard onOpenLogoutModal={() => setLogoutModalVisible(true)} />
      </View>

      <EditHeroModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        name={editName}
        setName={(t) => {
          setEditName(t);
          if (editError) setEditError('');
        }}
        avatar={editAvatar}
        setAvatar={setEditAvatar}
        loading={savingProfile}
        error={editError}
      />

      <ConfirmModal
        visible={logoutModalVisible}
        title="Leave the Realm?"
        message="Are you sure you want to sign out? You will need your passkey to log back in."
        confirmText="Sign Out"
        cancelText="Stay"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        isDestructive={true}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  content: {
    padding: spacing.screenPadding,
    gap: spacing.md,
    paddingBottom: 40,
  },
  header: {
    gap: 2,
    marginBottom: 4,
  },
  pixelTitle: {
    ...typography.displayPixelSm,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 1.5,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  tourTargetGlow: {
    borderColor: colors.accent.gold,
    borderWidth: 2,
    borderRadius: 8,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
});
