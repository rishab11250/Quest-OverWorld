import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

import SubScreenHeader from '../../components/SubScreenHeader';
import StatusBanner from '../../components/StatusBanner';
import LoadingScreen from '../../components/LoadingScreen';

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
        message: `Join our Quest Overworld party "${team.name}" using code: ${team.code}!`,
      });
    } catch (err) {
      // Ignored
    }
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Inspecting Party Codex..." />;
  }

  if (error || !team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Team not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Return to Guild</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const level = Math.floor((team.score || 0) / 250) + 1;

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
      <SubScreenHeader title="PARTY GUILD" fallbackRoute="/(tabs)/team" />

      {/* Team Header & XP */}
      <View style={styles.header}>
        <Text style={styles.teamName}>{team.name}</Text>
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{team.score || 0} PTS</Text>
          <View style={styles.lvlBadge}>
            <Text style={styles.lvlBadgeText}>LVL {level}</Text>
          </View>
        </View>
      </View>

      <StatusBanner type="error" message={error} />

      {/* Invite / Join Code Card */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeLabel}>PARTY INVITE CODE</Text>
          <Text style={styles.codeSub}>Share with adventurers to recruit into party</Text>
        </View>
        <Text style={styles.codeValue}>{team.code}</Text>

        <View style={styles.codeActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopyCode} activeOpacity={0.8}>
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

      {/* Party Roster */}
      <View style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>PARTY ROSTER</Text>
          <Text style={styles.memberCount}>{team.members?.length || 1} ADVENTURERS</Text>
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
                        <Text style={styles.leaderBadgeText}>CAPTAIN</Text>
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
  scrollContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.accent.coral,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  backButtonText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  header: {
    marginBottom: spacing.xs,
  },
  teamName: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  xpText: {
    ...typography.monoSm,
    color: colors.accent.gold,
    fontWeight: '800',
    fontSize: 16,
  },
  lvlBadge: {
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lvlBadgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 10,
  },
  codeCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeHeader: {
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  codeSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  codeValue: {
    ...typography.monoSm,
    fontSize: 32,
    fontWeight: '900',
    color: colors.text.onDark.primary,
    letterSpacing: 8,
    marginVertical: spacing.xs,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  actionBtnTextOutline: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  rosterCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  memberCount: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  membersList: {
    gap: spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberName: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  leaderBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  leaderBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
});
