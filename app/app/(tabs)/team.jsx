import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import api from '../../lib/api';
import ConfirmModal from '../../components/ConfirmModal';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function TeamScreen() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'create'
  const [joinCode, setJoinCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);

  const fetchMyTeam = useCallback(async () => {
    try {
      setError('');
      const data = await api.get('/teams/me');
      setTeam(data.team);
    } catch (err) {
      setError(err.message || 'Failed to load team data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTeam();
  }, [fetchMyTeam]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTeam();
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a 6-character team join code.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const data = await api.post('/teams/join', { code: joinCode.trim() });
      setTeam(data.team);
      setJoinCode('');
    } catch (err) {
      setError(err.message || 'Failed to join team. Check code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const data = await api.post('/teams', { name: teamName.trim() });
      setTeam(data.team);
      setTeamName('');
    } catch (err) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
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
        message: `Join my Quest Overworld party "${team.name}" with invite code: ${team.code}!`,
      });
    } catch (err) {
      // Ignored
    }
  };

  const handleConfirmLeave = async () => {
    setLeaveModalVisible(false);
    if (!team) return;

    try {
      setLoading(true);
      await api.post(`/teams/${team._id}/leave`);
      setTeam(null);
    } catch (err) {
      setError(err.message || 'Failed to leave team.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  // State 1: No Team — Show Join / Create options
  if (!team) {
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
        <View style={styles.header}>
          <Text style={styles.title}>Party Headquarters</Text>
          <Text style={styles.subtitle}>
            Form or join an adventuring party to take on campus quests together
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'join' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('join');
              setError('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'join' && styles.tabButtonTextActive]}>
              Join Party
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('create');
              setError('');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}>
              Create Party
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Join Team */}
        {activeTab === 'join' ? (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Enter Party Code</Text>
            <Text style={styles.cardSubtext}>
              Ask your team captain for the 6-character party invite code.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Party Code</Text>
              <TextInput
                style={[styles.input, styles.monoInput]}
                placeholder="e.g. QST7X9"
                placeholderTextColor={colors.text.onDark.secondary}
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleJoinTeam}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.bg.dusk} />
              ) : (
                <Text style={styles.primaryButtonText}>Join Party</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Tab 2: Create Team */
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Form a New Party</Text>
            <Text style={styles.cardSubtext}>
              You will become the party leader and receive an invite code for your teammates.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Party Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dragon Slayers"
                placeholderTextColor={colors.text.onDark.secondary}
                value={teamName}
                onChangeText={setTeamName}
                maxLength={50}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleCreateTeam}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.bg.dusk} />
              ) : (
                <Text style={styles.primaryButtonText}>Form Party</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // State 2: Active Team — Show Roster, XP, Join Code
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

      {/* Invite / Join Code Card */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeLabel}>PARTY INVITE CODE</Text>
          <Text style={styles.codeSub}>Share with friends to join your party</Text>
        </View>
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

      {/* Party Roster */}
      <View style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>PARTY ROSTER</Text>
          <Text style={styles.memberCount}>
            {team.members?.length || 1} ADVENTURERS
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

      {/* Leave Team Button */}
      <TouchableOpacity
        style={styles.leaveButton}
        onPress={() => setLeaveModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.leaveButtonText}>Leave Party</Text>
      </TouchableOpacity>

      {/* Custom Themed Confirmation Modal */}
      <ConfirmModal
        visible={leaveModalVisible}
        title="Leave Party?"
        message={`Are you sure you want to leave "${team.name}"? You will forfeit your party rank until you rejoin.`}
        confirmText="Leave Party"
        cancelText="Stay in Party"
        onConfirm={handleConfirmLeave}
        onCancel={() => setLeaveModalVisible(false)}
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
  scrollContent: {
    padding: spacing.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    maxWidth: 320,
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
  errorBanner: {
    backgroundColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  tabButtonText: {
    ...typography.bodyLg,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: colors.bg.dusk,
  },
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  cardHeading: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  cardSubtext: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.text.onDark.primary,
  },
  input: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyLg,
    color: colors.text.onDark.primary,
    minHeight: spacing.minTouchTarget,
  },
  monoInput: {
    ...typography.monoSm,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.accent.gold,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.accent.goldDim,
  },
  primaryButtonText: {
    ...typography.bodyLg,
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
  codeHeader: {
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.accent.gold,
  },
  codeSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginTop: 2,
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
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.sm,
  },
  leaveButtonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.accent.coral,
  },
});
