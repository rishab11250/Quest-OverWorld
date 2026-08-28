import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      setError('');
      const data = await api.get(`/teams/${teamId}`);
      setTeam(data.team);
    } catch (err) {
      setError(err.message || 'Failed to load team details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };

  const handleCopyCode = async () => {
    if (!team?.code) return;
    await Clipboard.setStringAsync(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!team?.code) return;
    try {
      await Share.share({
        message: `Join our Quest Overworld team "${team.name}" using code: ${team.code}!`,
      });
    } catch (err) {
      // Ignored
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.screenPadding }]}>
        <Text style={styles.errorText}>{error || 'Team not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const level = Math.floor((team.score || 0) / 250) + 1;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/team');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent.gold}
        />
      }
    >
      {/* Top Bar Back Button */}
      <TouchableOpacity
        style={styles.navBack}
        onPress={handleBack}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.7}
      >
        <Text style={styles.navBackText}>‹ BACK</Text>
      </TouchableOpacity>

      {/* Team Header */}
      <View style={styles.header}>
        <Text style={styles.teamName}>{team.name}</Text>
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{team.score || 0} PTS</Text>
          <View style={styles.lvlBadge}>
            <Text style={styles.lvlBadgeText}>LVL {level}</Text>
          </View>
        </View>
      </View>

      {/* Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>TEAM CODE</Text>
        <Text style={styles.codeValue}>{team.code}</Text>

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>{copied ? 'COPIED!' : 'COPY CODE'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={handleShareCode}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTextOutline}>SHARE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Roster Card */}
      <View style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>PARTY MEMBERS</Text>
          <Text style={styles.memberCount}>
            {team.members?.length || 1} PLAYERS
          </Text>
        </View>

        <View style={styles.membersList}>
          {team.members?.map((member, index) => {
            const isLeader = member._id === leaderId;
            return (
              <View key={member._id || index} style={styles.memberRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {(member.name || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {isLeader ? (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>LEADER</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
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
  scrollContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  navBack: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  navBackText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  teamName: {
    ...typography.displayXl,
    color: colors.accent.gold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpText: {
    ...typography.displayPixel,
    color: colors.accent.gold,
  },
  lvlBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lvlBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.accent.coral,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 6,
  },
  backButtonText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  codeCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.accent.goldDim,
    alignItems: 'center',
    gap: spacing.md,
  },
  codeLabel: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.accent.gold,
  },
  codeValue: {
    ...typography.monoSm,
    fontSize: 32,
    letterSpacing: 8,
    fontWeight: '700',
    color: colors.text.onDark.primary,
    marginVertical: spacing.xs,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  actionBtnText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  actionBtnTextOutline: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.accent.gold,
  },
  rosterCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    paddingBottom: spacing.sm,
  },
  rosterTitle: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.text.onDark.primary,
  },
  memberCount: {
    ...typography.caption,
    color: colors.accent.gold,
    fontWeight: '700',
  },
  membersList: {
    gap: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D3560',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  avatarLetter: {
    ...typography.headingMd,
    color: colors.accent.gold,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  leaderBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  memberEmail: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
});
