import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAuth } from '../../lib/secureStore';
import api from '../../lib/api';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import AdminHeader from '../../components/admin/AdminHeader';
import AdminBottomNav from '../../components/admin/AdminBottomNav';
import AdminOverviewTab from '../../components/admin/AdminOverviewTab';
import AdminQuestsTab from '../../components/admin/AdminQuestsTab';
import AdminBountiesTab from '../../components/admin/AdminBountiesTab';
import AdminReviewsTab from '../../components/admin/AdminReviewsTab';
import AdminSystemTab from '../../components/admin/AdminSystemTab';
import {
  CreateQuestModal,
  CreateCheckpointModal,
  CreateChallengeModal,
  RejectFeedbackModal,
} from '../../components/admin/AdminModals';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Data states
  const [overview, setOverview] = useState(null);
  const [quests, setQuests] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

  // Server health state
  const [healthStatus, setHealthStatus] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);

  // Modal visibilities
  const [questModal, setQuestModal] = useState(false);
  const [checkpointModal, setCheckpointModal] = useState(false);
  const [challengeModal, setChallengeModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // Form states
  const [questForm, setQuestForm] = useState({
    name: '',
    description: '',
    campus: 'Main Campus',
    totalPoints: '700',
  });
  const [checkpointForm, setCheckpointForm] = useState({
    questId: '',
    title: '',
    clue: '',
    latitude: '28.5458',
    longitude: '77.1926',
    radius: '50',
    qrCode: '',
    points: '100',
    order: '1',
  });
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    category: 'photo',
    points: '150',
    verificationType: 'manual_review',
    answerKey: '',
  });

  const fetchAdminData = useCallback(async () => {
    try {
      setError('');
      const [overviewRes, questsRes, checkRes, challRes, subRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/quests'),
        api.get('/admin/checkpoints'),
        api.get('/admin/challenges'),
        api.get('/admin/submissions/pending'),
      ]);

      setOverview(overviewRes);
      setQuests(questsRes.quests || []);
      setCheckpoints(checkRes.checkpoints || []);
      setChallenges(challRes.challenges || []);
      setPendingSubmissions(subRes.submissions || []);

      if (questsRes.quests?.length > 0 && !checkpointForm.questId) {
        setCheckpointForm((prev) => ({ ...prev, questId: questsRes.quests[0]._id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkpointForm.questId]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  const handlePingHealth = async () => {
    try {
      setPingLoading(true);
      const start = Date.now();
      const res = await api.get('/health');
      const latency = Date.now() - start;
      setHealthStatus(`🟢 Online (${latency}ms) — ${res.message}`);
    } catch (err) {
      setHealthStatus(`🔴 Server Offline — ${err.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const handleReseedSystem = async () => {
    Alert.alert(
      'Reset & Reseed Demo Data?',
      'This will reset the active quest with 4 checkpoints and 4 bounties for demo testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset System',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/admin/system/reseed');
              setActionSuccess(res.message || 'System reseeded successfully!');
              fetchAdminData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to reseed system.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateQuest = async () => {
    if (!questForm.name.trim() || !questForm.description.trim()) {
      Alert.alert('Error', 'Name and description are required.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/admin/quests', {
        name: questForm.name.trim(),
        description: questForm.description.trim(),
        campus: questForm.campus.trim(),
        totalPoints: parseInt(questForm.totalPoints, 10) || 700,
      });
      setQuestModal(false);
      setQuestForm({ name: '', description: '', campus: 'Main Campus', totalPoints: '700' });
      setActionSuccess('Quest created successfully!');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create quest.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuest = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/quests/${id}`);
      setActionSuccess('Quest and stations deleted.');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete quest.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!checkpointForm.questId || !checkpointForm.title.trim() || !checkpointForm.qrCode.trim()) {
      Alert.alert('Error', 'Quest, title, and QR code are required.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/admin/checkpoints', {
        questId: checkpointForm.questId,
        title: checkpointForm.title.trim(),
        clue: checkpointForm.clue.trim(),
        latitude: parseFloat(checkpointForm.latitude),
        longitude: parseFloat(checkpointForm.longitude),
        radius: parseInt(checkpointForm.radius, 10) || 50,
        qrCode: checkpointForm.qrCode.trim(),
        points: parseInt(checkpointForm.points, 10) || 100,
        order: parseInt(checkpointForm.order, 10) || 1,
      });
      setCheckpointModal(false);
      setActionSuccess('Checkpoint added!');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create checkpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCheckpoint = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/checkpoints/${id}`);
      setActionSuccess('Checkpoint deleted.');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete checkpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!challengeForm.title.trim() || !challengeForm.description.trim()) {
      Alert.alert('Error', 'Title and description are required.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/admin/challenges', {
        title: challengeForm.title.trim(),
        description: challengeForm.description.trim(),
        category: challengeForm.category,
        points: parseInt(challengeForm.points, 10) || 150,
        verificationType: challengeForm.verificationType,
        answerKey: challengeForm.answerKey.trim(),
      });
      setChallengeModal(false);
      setActionSuccess('Bounty created!');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/admin/challenges/${id}`);
      setActionSuccess('Bounty deleted.');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete challenge.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (subId) => {
    try {
      setLoading(true);
      const res = await api.post(`/admin/submissions/${subId}/approve`);
      setActionSuccess(res.message || 'Submission approved!');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to approve submission.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectModal = (subId) => {
    setSelectedSubId(subId);
    setRejectFeedback('Photo proof did not clearly show the objective.');
    setRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedSubId) return;
    try {
      setLoading(true);
      await api.post(`/admin/submissions/${selectedSubId}/reject`, {
        feedback: rejectFeedback.trim(),
      });
      setRejectModal(false);
      setActionSuccess('Submission rejected with feedback.');
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject submission.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading Admin Operations Console..." />;
  }

  const adminProfile = overview?.admin || {
    name: 'Guild Master Admin',
    email: 'admin@overworld.com',
    role: 'Guild Master Admin',
  };

  const stats = overview?.stats || {
    users: 0,
    teams: 0,
    quests: 0,
    checkpoints: 0,
    challenges: 0,
    pendingSubmissions: pendingSubmissions.length,
    approvedSubmissions: 0,
    totalXpAwarded: 0,
  };

  return (
    <View style={styles.rootContainer}>
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
        <AdminHeader adminProfile={adminProfile} onLogout={handleLogout} />

        <StatusBanner type="error" message={error} />
        <StatusBanner type="success" message={actionSuccess} />

        {activeTab === 'overview' && (
          <AdminOverviewTab
            stats={stats}
            teams={overview?.teams}
            onNavigateReviews={() => setActiveTab('reviews')}
          />
        )}

        {activeTab === 'quests' && (
          <AdminQuestsTab
            quests={quests}
            checkpoints={checkpoints}
            onOpenCreateQuest={() => setQuestModal(true)}
            onOpenCreateCheckpoint={() => setCheckpointModal(true)}
            onDeleteQuest={handleDeleteQuest}
            onDeleteCheckpoint={handleDeleteCheckpoint}
          />
        )}

        {activeTab === 'bounties' && (
          <AdminBountiesTab
            challenges={challenges}
            onOpenCreateChallenge={() => setChallengeModal(true)}
            onDeleteChallenge={handleDeleteChallenge}
          />
        )}

        {activeTab === 'reviews' && (
          <AdminReviewsTab
            pendingSubmissions={pendingSubmissions}
            onApprove={handleApproveSubmission}
            onOpenRejectModal={handleOpenRejectModal}
          />
        )}

        {activeTab === 'profile' && (
          <AdminSystemTab
            adminProfile={adminProfile}
            healthStatus={healthStatus}
            pingLoading={pingLoading}
            onPingHealth={handlePingHealth}
            onReseedSystem={handleReseedSystem}
            onLogout={handleLogout}
          />
        )}
      </ScrollView>

      <AdminBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingSubmissions.length}
      />

      <CreateQuestModal
        visible={questModal}
        onClose={() => setQuestModal(false)}
        onSave={handleCreateQuest}
        form={questForm}
        setForm={setQuestForm}
      />

      <CreateCheckpointModal
        visible={checkpointModal}
        onClose={() => setCheckpointModal(false)}
        onSave={handleCreateCheckpoint}
        form={checkpointForm}
        setForm={setCheckpointForm}
      />

      <CreateChallengeModal
        visible={challengeModal}
        onClose={() => setChallengeModal(false)}
        onSave={handleCreateChallenge}
        form={challengeForm}
        setForm={setChallengeForm}
      />

      <RejectFeedbackModal
        visible={rejectModal}
        onClose={() => setRejectModal(false)}
        onConfirm={handleConfirmReject}
        feedback={rejectFeedback}
        setFeedback={setRejectFeedback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
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
});
