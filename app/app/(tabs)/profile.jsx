import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUserData, clearAuth } from '../../lib/secureStore';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // System settings toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

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
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
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
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{user?.name || 'Adventurer'}</Text>
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

      {/* App Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>AUDIO & GAMEPLAY</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>SFX & Ambience</Text>
            <Text style={styles.settingSub}>Quest fanfares and coin chiming</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={soundEnabled ? colors.bg.dusk : '#7E75A0'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Reduced Motion</Text>
            <Text style={styles.settingSub}>Disable parallax & heavy particle bursts</Text>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={setReducedMotion}
            trackColor={{ false: '#3D3560', true: colors.accent.gold }}
            thumbColor={reducedMotion ? colors.bg.dusk : '#7E75A0'}
          />
        </View>
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
  },
  pixelTitle: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.5,
    marginTop: 2,
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
  heroName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
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
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
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
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  settingSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
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
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.accent.coral,
  },
});
