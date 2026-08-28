import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Share } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import api from '../../lib/api';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import ConfirmModal from '../../components/ConfirmModal';
import TeamAuthCard from '../../components/team/TeamAuthCard';
import TeamHubView from '../../components/team/TeamHubView';
import InviteContactsModal from '../../components/team/InviteContactsModal';

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
  const [contactsModalVisible, setContactsModalVisible] = useState(false);

  const fetchMyTeam = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');
      const data = await api.get('/teams/me');
      setTeam(data.team);
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load team data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyTeam(true);
    }, [fetchMyTeam])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTeam(false);
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
    return <LoadingScreen message="Assembling Party Guild..." />;
  }

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
      <StatusBanner type="error" message={error} />

      {!team ? (
        <TeamAuthCard
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setError('');
          }}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          teamName={teamName}
          setTeamName={setTeamName}
          onJoin={handleJoinTeam}
          onCreate={handleCreateTeam}
          submitting={submitting}
        />
      ) : (
        <TeamHubView
          team={team}
          copied={copied}
          onCopyCode={handleCopyCode}
          onShareCode={handleShareCode}
          onInviteContacts={() => setContactsModalVisible(true)}
          onRequestLeave={() => setLeaveModalVisible(false) || setLeaveModalVisible(true)}
        />
      )}

      {team ? (
        <>
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

          <InviteContactsModal
            visible={contactsModalVisible}
            team={team}
            onClose={() => setContactsModalVisible(false)}
          />
        </>
      ) : null}
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
});
