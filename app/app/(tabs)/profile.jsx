import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUserData, clearAuth, setUserData, getSetting, setSetting } from '../../lib/secureStore';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

const AVATAR_ICONS = [
  'shield-crown',
  'sword',
  'shield-account',
  'compass',
  'crown',
  'fire',
  'account-star',
  'lightning-bolt',
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

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
        setUser(res.user);
        await setUserData(res.user);
      }
      setEditModalVisible(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update hero profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleSetting = async (key, val, setter) => {
    setter(val);
    await setSetting(key, val);
  };

  const handleClearCache = async () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await clearAuth();
    router.replace('/(auth)/login');
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Reading Hero Codex..." />;
  }

  const initial = (user?.name || user?.username || 'A').charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.gold}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pixelTitle}>HERO CODEX</Text>
        <Text style={styles.subtitle}>PLAYER ACCOUNT & PREFERENCES</Text>
      </View>

      {/* Hero Avatar & Identity Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarGlow}>
          {user?.avatar ? (
            <MaterialCommunityIcons name={user.avatar} size={28} color={colors.accent.gold} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{user?.name || 'Adventurer'}</Text>
            <TouchableOpacity
              style={styles.editHeroBtn}
              onPress={handleOpenEdit}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.accent.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEmail}>{user?.email || 'hero@overworld.realm'}</Text>

          {team ? (
            <View style={styles.partyBadge}>
              <Text style={styles.partyBadgeText}>
                {team.name.toUpperCase()} • LVL {Math.floor((team.score || 0) / 250) + 1}
              </Text>
            </View>
          ) : (
            <View style={[styles.partyBadge, styles.soloBadge]}>
              <Text style={[styles.partyBadgeText, styles.soloBadgeText]}>LONE ADVENTURER</Text>
            </View>
          )}
        </View>
      </View>

      {/* Admin Panel Quick Entry if authorized */}
      {user?.isAdmin || user?.role === 'admin' ? (
        <TouchableOpacity
          style={styles.adminEntryCard}
          onPress={() => router.push('/admin/dashboard')}
          activeOpacity={0.8}
        >
          <View style={styles.adminEntryLeft}>
            <MaterialCommunityIcons name="shield-crown" size={24} color={colors.accent.gold} />
            <View>
              <Text style={styles.adminEntryTitle}>Guild Master Console</Text>
              <Text style={styles.adminEntrySub}>Manage Quests, Checkpoints & Bounties</Text>
            </View>
          </View>
          <Text style={styles.adminEntryArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      {/* System Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>EXPEDITION SETTINGS</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>High-Precision Radar</Text>
            <Text style={styles.settingSub}>Sub-meter GPS accuracy for waypoints</Text>
          </View>
          <Switch
            value={highAccuracyGps}
            onValueChange={(val) => handleToggleSetting('high_accuracy_gps', val, setHighAccuracyGps)}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={highAccuracyGps ? colors.bg.dusk : '#7E75A0'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Scanner Auto-Flashlight</Text>
            <Text style={styles.settingSub}>Enable torch automatically on QR radar</Text>
          </View>
          <Switch
            value={autoTorch}
            onValueChange={(val) => handleToggleSetting('auto_torch', val, setAutoTorch)}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={autoTorch ? colors.bg.dusk : '#7E75A0'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Live Guild Polling</Text>
            <Text style={styles.settingSub}>Real-time leaderboard sync every 15s</Text>
          </View>
          <Switch
            value={livePolling}
            onValueChange={(val) => handleToggleSetting('live_polling', val, setLivePolling)}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={livePolling ? colors.bg.dusk : '#7E75A0'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Haptic Feedback</Text>
            <Text style={styles.settingSub}>Tactile pulse on scans and rewards</Text>
          </View>
          <Switch
            value={hapticFeedback}
            onValueChange={(val) => handleToggleSetting('haptic_feedback', val, setHapticFeedback)}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={hapticFeedback ? colors.bg.dusk : '#7E75A0'}
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.cacheBtn}
          onPress={handleClearCache}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={cacheCleared ? 'check-circle' : 'cached'}
            size={16}
            color={cacheCleared ? colors.accent.green : colors.accent.gold}
          />
          <Text style={[styles.cacheBtnText, cacheCleared && styles.cacheBtnTextDone]}>
            {cacheCleared ? 'Local Radar Cache Flushed!' : 'Flush Local Cache'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Realm Information */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>REALM INFORMATION</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client Version</Text>
          <Text style={styles.infoVal}>v1.0.0 (Old Campus Beta)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Server Engine</Text>
          <Text style={styles.infoVal}>Quest-OverWorld Node.js API</Text>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => setLogoutModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="logout" size={18} color={colors.accent.coral} />
        <Text style={styles.logoutText}>Sign Out of Realm</Text>
      </TouchableOpacity>

      {/* Edit Hero Identity Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EDIT HERO IDENTITY</Text>
            <Text style={styles.modalSub}>Update your character name and guild crest</Text>

            {editError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{editError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ADVENTURER NAME</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={(t) => {
                  setEditName(t);
                  if (editError) setEditError('');
                }}
                placeholder="Shadow Adventurer"
                placeholderTextColor={colors.text.onDark.secondary}
                autoCapitalize="words"
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GUILD CREST</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.avatarOption,
                      editAvatar === icon && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setEditAvatar(icon)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={22}
                      color={editAvatar === icon ? colors.bg.dusk : colors.accent.gold}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
                disabled={savingProfile}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color={colors.bg.dusk} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Hero</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={logoutModalVisible}
        title="Sign Out of Realm?"
        message="Are you sure you want to sign out? Your credentials and team link will be saved securely."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  pixelTitle: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  avatarGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#322A54',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.displayLg,
    color: colors.accent.gold,
    fontWeight: '900',
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
    fontSize: 18,
  },
  editHeroBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#322A54',
  },
  heroEmail: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  partyBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  partyBadgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 10,
  },
  soloBadge: {
    backgroundColor: '#262040',
    borderColor: '#4A4170',
  },
  soloBadgeText: {
    color: colors.text.onDark.secondary,
  },
  adminEntryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#272044',
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
  },
  adminEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  adminEntryTitle: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  adminEntrySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  adminEntryArrow: {
    ...typography.displayLg,
    color: colors.accent.gold,
  },
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  cardHeader: {
    ...typography.captionBold,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#362E52',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  infoVal: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
  },
  settingSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },
  cacheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#262040',
    borderWidth: 1,
    borderColor: '#3D3560',
    marginTop: 2,
  },
  cacheBtnText: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  cacheBtnTextDone: {
    color: colors.accent.green,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  logoutText: {
    ...typography.bodyMdBold,
    color: colors.accent.coral,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 12,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.displayPixelSm,
    fontSize: 12,
    color: colors.accent.gold,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  modalSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalErrorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    padding: spacing.xs,
    borderRadius: 4,
  },
  modalErrorText: {
    ...typography.captionBold,
    color: colors.accent.coral,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#3D3560',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.text.onDark.primary,
    ...typography.bodyMd,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#3D3560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    ...typography.bodyMdBold,
    color: colors.bg.dusk,
  },
});
