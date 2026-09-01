import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Share, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import api from '../../lib/api';
import { getUserData } from '../../lib/secureStore';
import { triggerHaptic } from '../../lib/haptics';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import ConfirmModal from '../../components/ConfirmModal';
import TeamAuthCard from '../../components/team/TeamAuthCard';
import TeamHubView from '../../components/team/TeamHubView';
import InviteContactsModal from '../../components/team/InviteContactsModal';
import RenameTeamModal from '../../components/team/RenameTeamModal';
import ManageMemberModal from '../../components/team/ManageMemberModal';
import TransferCaptainModal from '../../components/team/TransferCaptainModal';
import PendingRequestsModal from '../../components/team/PendingRequestsModal';
import PendingAdmissionCard from '../../components/team/PendingAdmissionCard';

export default function TeamScreen() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [pendingTeam, setPendingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Form states
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'create'
  const [joinCode, setJoinCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renaming, setRenaming] = useState(false);

  // Squad management modals
  const [selectedMemberToManage, setSelectedMemberToManage] = useState(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferringAndLeaving, setTransferringAndLeaving] = useState(false);

  // Admission queue modal & actions
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);

  const fetchMyTeam = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');
      const [userData, teamData] = await Promise.all([
        getUserData(),
        api.get('/teams/me').catch(() => ({ team: null, pendingTeam: null })),
      ]);

      if (userData) setUser(userData);
      setTeam(teamData?.team || null);
      setPendingTeam(teamData?.pendingTeam || null);
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
      if (data.pending) {
        setPendingTeam(data.pendingTeam || { code: joinCode.trim().toUpperCase(), name: 'Party' });
        setJoinCode('');
        triggerHaptic('selection');
        setSuccessBanner(data.message || 'Admission request dispatched to Party Captain!');
        setTimeout(() => setSuccessBanner(''), 5000);
      } else if (data.team) {
        setTeam(data.team);
        setJoinCode('');
        triggerHaptic('success');
      }
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to join party. Check code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    setCancellingRequest(true);
    try {
      triggerHaptic('medium');
      await api.post('/teams/join/cancel');
      setPendingTeam(null);
      setSuccessBanner('Admission request cancelled.');
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to cancel admission request.');
    } finally {
      setCancellingRequest(false);
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
      setPendingTeam(null);
      setTeamName('');
      triggerHaptic('success');
    } catch (err) {
      triggerHaptic('error');
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

  const handleApproveRequest = async (applicantUserId) => {
    if (!team) return;
    setActionLoadingId(applicantUserId);
    try {
      const res = await api.post(`/teams/${team._id}/requests/${applicantUserId}/approve`);
      if (res?.team) {
        setTeam(res.team);
        triggerHaptic('success');
        setSuccessBanner(res.message || 'Recruit admitted to party! ⚔️');
        setTimeout(() => setSuccessBanner(''), 4000);
      }
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to approve recruit.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (applicantUserId) => {
    if (!team) return;
    setActionLoadingId(applicantUserId);
    try {
      const res = await api.post(`/teams/${team._id}/requests/${applicantUserId}/reject`);
      if (res?.team) {
        setTeam(res.team);
        triggerHaptic('selection');
        setSuccessBanner('Recruitment request declined.');
        setTimeout(() => setSuccessBanner(''), 4000);
      }
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to decline request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleKickMember = async (member) => {
    if (!team || !member) return;
    Alert.alert(
      'Remove Adventurer',
      `Are you sure you want to remove "${member.name}" from ${team.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHaptic('warning');
              const res = await api.post(`/teams/${team._id}/kick/${member._id}`);
              if (res?.team) {
                setTeam(res.team);
                setSuccessBanner(`Removed ${member.name} from party.`);
                setTimeout(() => setSuccessBanner(''), 4000);
              }
            } catch (err) {
              triggerHaptic('error');
              setError(err.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleToggleViceCaptain = async (member, action) => {
    if (!team || !member) return;
    try {
      triggerHaptic('selection');
      const res = await api.post(`/teams/${team._id}/roles/vice-captain`, {
        memberId: member._id,
        action,
      });
      if (res?.team) {
        setTeam(res.team);
        setSuccessBanner(
          action === 'promote'
            ? `${member.name} is now Vice-Captain! 🛡️`
            : `${member.name} was demoted to Member.`
        );
        setTimeout(() => setSuccessBanner(''), 4000);
      }
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to update squad role.');
    }
  };

  const handlePromoteToCaptain = (member) => {
    if (!team || !member) return;
    Alert.alert(
      'Transfer Captaincy',
      `Appoint "${member.name}" as the new Party Captain? You will step down to Vice-Captain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Captain',
          style: 'default',
          onPress: async () => {
            try {
              triggerHaptic('medium');
              const res = await api.post(`/teams/${team._id}/transfer-leadership`, {
                newLeaderId: member._id,
              });
              if (res?.team) {
                setTeam(res.team);
                setSuccessBanner(`${member.name} is now Captain! You are Vice-Captain.`);
                setTimeout(() => setSuccessBanner(''), 4000);
              }
            } catch (err) {
              triggerHaptic('error');
              setError(err.message || 'Failed to transfer leadership.');
            }
          },
        },
      ]
    );
  };

  const leaderId = typeof team?.leader === 'object' ? team?.leader?._id : team?.leader;
  const currentUserId = user?._id || user?.id;
  const isCaptain = Boolean(
    currentUserId && leaderId && (currentUserId === leaderId || user?.isAdmin)
  );
  const isViceCaptain = Boolean(
    currentUserId &&
    team?.viceCaptains &&
    team.viceCaptains.some((vc) => (typeof vc === 'object' ? vc._id : vc) === currentUserId)
  );

  const handleRequestLeave = () => {
    if (!team) return;
    if (isCaptain && team.members && team.members.length > 1) {
      triggerHaptic('medium');
      setTransferModalVisible(true);
    } else {
      triggerHaptic('warning');
      setLeaveModalVisible(true);
    }
  };

  const handleConfirmTransferAndLeave = async (newLeaderId) => {
    if (!team) return;
    setTransferringAndLeaving(true);
    try {
      triggerHaptic('medium');
      await api.post(`/teams/${team._id}/leave`, { newLeaderId });
      setTransferModalVisible(false);
      setTeam(null);
    } catch (err) {
      triggerHaptic('error');
      setError(err.message || 'Failed to leave party.');
    } finally {
      setTransferringAndLeaving(false);
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
      {successBanner ? <StatusBanner type="success" message={successBanner} /> : null}

      {!team && pendingTeam ? (
        <PendingAdmissionCard
          pendingTeam={pendingTeam}
          onCancelRequest={handleCancelJoinRequest}
          cancelling={cancellingRequest}
        />
      ) : !team ? (
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
          onRequestLeave={handleRequestLeave}
          isCaptain={isCaptain}
          isViceCaptain={isViceCaptain}
          currentUserId={currentUserId}
          onOpenRenameModal={() => setRenameModalVisible(true)}
          onManageMember={(member) => setSelectedMemberToManage(member)}
          onOpenRequestsModal={() => setRequestsModalVisible(true)}
        />
      )}

      {team ? (
        <>
          <RenameTeamModal
            visible={renameModalVisible}
            currentName={team.name}
            onClose={() => setRenameModalVisible(false)}
            onRename={handleRenameTeam}
            loading={renaming}
          />

          <ManageMemberModal
            visible={Boolean(selectedMemberToManage)}
            member={selectedMemberToManage}
            team={team}
            isCaptain={isCaptain}
            isViceCaptain={isViceCaptain}
            onClose={() => setSelectedMemberToManage(null)}
            onKickMember={handleKickMember}
            onToggleViceCaptain={handleToggleViceCaptain}
            onPromoteToCaptain={handlePromoteToCaptain}
          />

          <TransferCaptainModal
            visible={transferModalVisible}
            team={team}
            currentUserId={currentUserId}
            onClose={() => setTransferModalVisible(false)}
            onConfirmTransferAndLeave={handleConfirmTransferAndLeave}
            loading={transferringAndLeaving}
          />

          <PendingRequestsModal
            visible={requestsModalVisible}
            team={team}
            onClose={() => setRequestsModalVisible(false)}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            actionLoadingId={actionLoadingId}
          />

          <ConfirmModal
            visible={leaveModalVisible}
            title="Leave Party?"
            message={`Are you sure you want to leave "${team.name}"? As the last member, the party will be disbanded.`}
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
