import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getUserData, clearAuth } from '../../lib/secureStore';
import ConfirmModal from '../../components/ConfirmModal';
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
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.heroName}>{user?.name || user?.username || 'Adventurer'}</Text>
        <Text style={styles.heroEmail}>{user?.email || 'adventurer@overworld.realm'}</Text>

        <View style={styles.statusPill}>
          <MaterialCommunityIcons
            name={team ? 'shield-account' : 'account-alert-outline'}
            size={16}
            color={colors.accent.gold}
          />
          <Text style={styles.statusPillText}>
            {team ? `PARTY: ${team.name}` : 'NO ACTIVE PARTY'}
          </Text>
        </View>
      </View>

      {/* Account Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>ACCOUNT OVERVIEW</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <Text style={styles.infoValueGold}>Active Adventurer</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{user?.role || 'Player'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Campus Realm</Text>
          <Text style={styles.infoValue}>Main Campus</Text>
        </View>
      </View>

      {/* Game Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>GAME CONFIGURATION</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialCommunityIcons name="volume-high" size={20} color={colors.accent.gold} />
            <View>
              <Text style={styles.settingTitle}>Audio Chimes</Text>
              <Text style={styles.settingSub}>Scan confirmation sound effects</Text>
            </View>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            thumbColor={soundEnabled ? colors.accent.gold : '#7E75A0'}
            trackColor={{ false: '#3D3560', true: 'rgba(242, 200, 75, 0.4)' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialCommunityIcons name="motion-pause-outline" size={20} color={colors.accent.gold} />
            <View>
              <Text style={styles.settingTitle}>Reduced Motion</Text>
              <Text style={styles.settingSub}>Disable celebration animations</Text>
            </View>
          </View>
          <Switch
            value={reducedMotion}
            onValueChange={setReducedMotion}
            thumbColor={reducedMotion ? colors.accent.gold : '#7E75A0'}
            trackColor={{ false: '#3D3560', true: 'rgba(242, 200, 75, 0.4)' }}
          />
        </View>
      </View>

      {/* Admin Console Shortcut (for Admin role) */}
      {user?.isAdmin || user?.role === 'admin' ? (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push('/admin/dashboard')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="shield-crown" size={20} color={colors.accent.gold} />
          <Text style={styles.adminButtonText}>Guild Master Admin Console</Text>
        </TouchableOpacity>
      ) : null}

      {/* Log Out Action */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setLogoutModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="logout" size={20} color={colors.accent.coral} />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={logoutModalVisible}
        title="Log Out?"
        message="Are you sure you want to log out? You will need your email and password to log back in."
        confirmText="Log Out"
        cancelText="Cancel"
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pixelTitle: {
    ...typography.displayPixel,
    fontSize: 16,
    color: colors.accent.gold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
    letterSpacing: 2,
  },
  heroCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.goldDim,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#322A54',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    ...typography.displayXl,
    color: colors.accent.gold,
  },
  heroName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '700',
  },
  heroEmail: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  statusPillText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  cardHeader: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    paddingBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  infoValue: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  infoValueGold: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.accent.gold,
  },
  divider: {
    height: 1,
    backgroundColor: '#3D3560',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...typography.bodyLg,
    color: colors.text.onDark.primary,
    fontWeight: '700',
  },
  settingSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(242, 200, 75, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.xs,
  },
  adminButtonText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent.coral,
    borderRadius: 8,
    paddingVertical: spacing.md,
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.xs,
  },
  logoutButtonText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.accent.coral,
  },
});
