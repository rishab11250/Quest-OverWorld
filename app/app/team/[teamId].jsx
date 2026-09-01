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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../../lib/api';
import { getUserData } from '../../lib/secureStore';
import { triggerHaptic } from '../../lib/haptics';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import SubScreenHeader from '../../components/SubScreenHeader';
import StatusBanner from '../../components/StatusBanner';
import LoadingScreen from '../../components/LoadingScreen';
import RenameTeamModal from '../../components/team/RenameTeamModal';

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [copied, setCopied] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      setError('');
      const [userData, data] = await Promise.all([getUserData(), api.get(`/teams/${teamId}`)]);
      if (userData) setUser(userData);
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

  const handleRenameTeam = async (newName) => {
    if (!team) return;
    setRenaming(true);
    try {
      const res = await api.put(`/teams/${team._id}`, { name: newName });
      if (res?.team) {
        setTeam(res.team);
        triggerHaptic('success');
        setSuccessBanner(`Guild party renamed to "${res.team.name}"!`);
        setTimeout(() => setSuccessBanner(''), 4000);
      }
      setRenameModalVisible(false);
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to rename party.');
    } finally {
      setRenaming(false);
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
  const isLeader = Boolean(
    user && leaderId && (user._id === leaderId || user.id === leaderId || user.isAdmin)
  );
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
        <View style={styles.nameRow}>
          <Text style={styles.teamName}>{team.name}</Text>
          {isLeader ? (
            <TouchableOpacity
              style={styles.renameBtn}
              onPress={() => {
                triggerHaptic('light');
                setRenameModalVisible(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.accent.gold} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{team.score || 0} PTS</Text>
          <View style={styles.lvlBadge}>
            <Text style={styles.lvlBadgeText}>LVL {level}</Text>
          </View>
        </View>
      </View>

      <StatusBanner type="error" message={error} />
      {successBanner ? <StatusBanner type="success" message={successBanner} /> : null}

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
            const memberIsLeader = member._id === leaderId;
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
                    {memberIsLeader ? (
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

      <RenameTeamModal
        visible={renameModalVisible}
        currentName={team.name}
        onClose={() => setRenameModalVisible(false)}
        onRename={handleRenameTeam}
        loading={renaming}
      />
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
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
    letterSpacing: 1.5,
  },
  renameBtn: {
    padding: 4,
    backgroundColor: '#2A2247',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpText: {
    ...typography.captionBold,
    color: colors.accent.green,
    fontSize: 14,
  },
  lvlBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lvlBadgeText: {
    ...typography.captionBold,
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
    ...typography.captionBold,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  codeSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  codeValue: {
    ...typography.displayPixelLg,
    fontSize: 24,
    color: colors.accent.gold,
    letterSpacing: 6,
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
  actionBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  actionBtnTextOutline: {
    ...typography.captionBold,
    color: colors.text.onDark.primary,
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
  },
  rosterTitle: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  memberCount: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  membersList: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1E1933',
    padding: spacing.sm,
    borderRadius: 6,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2247',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  avatarLetter: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 14,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
  },
  leaderBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  leaderBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
  memberEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
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
    ...typography.captionBold,
    color: colors.bg.dusk,
  },
});
