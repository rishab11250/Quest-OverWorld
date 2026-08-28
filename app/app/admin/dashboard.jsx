import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'checkpoints' | 'challenges'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [overview, setOverview] = useState(null);
  const [quests, setQuests] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [challenges, setChallenges] = useState([]);

  // Create Modals
  const [questModal, setQuestModal] = useState(false);
  const [checkpointModal, setCheckpointModal] = useState(false);
  const [challengeModal, setChallengeModal] = useState(false);

  // Form states
  const [questForm, setQuestForm] = useState({ name: '', description: '', campus: 'Main Campus', totalPoints: '500' });
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
      const [overviewRes, questsRes, checkRes, challRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/quests'),
        api.get('/admin/checkpoints'),
        api.get('/admin/challenges'),
      ]);

      setOverview(overviewRes);
      setQuests(questsRes.quests || []);
      setCheckpoints(checkRes.checkpoints || []);
      setChallenges(challRes.challenges || []);

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
        totalPoints: parseInt(questForm.totalPoints, 10) || 500,
      });
      setQuestModal(false);
      setQuestForm({ name: '', description: '', campus: 'Main Campus', totalPoints: '500' });
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
      fetchAdminData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to delete challenge.');
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

  const stats = overview?.stats || {
    users: 0,
    teams: 0,
    quests: 0,
    checkpoints: 0,
    challenges: 0,
    pendingSubmissions: 0,
  };

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
      {/* Top Nav Back */}
      <TouchableOpacity
        style={styles.navBack}
        onPress={() => router.back()}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.7}
      >
        <Text style={styles.navBackText}>‹ BACK TO REALM</Text>
      </TouchableOpacity>

      {/* Admin Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Guild Master Console</Text>
        <Text style={styles.subtitle}>Administrative Quest & Event Operations</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Overview Stats Cards Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.users}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.teams}</Text>
          <Text style={styles.statLabel}>Parties</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.quests}</Text>
          <Text style={styles.statLabel}>Quests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.checkpoints}</Text>
          <Text style={styles.statLabel}>Checkpoints</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.challenges}</Text>
          <Text style={styles.statLabel}>Bounties</Text>
        </View>
        <View style={[styles.statCard, stats.pendingSubmissions > 0 && styles.statCardAlert]}>
          <Text style={[styles.statNum, stats.pendingSubmissions > 0 && styles.statNumAlert]}>
            {stats.pendingSubmissions}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Segmented Section Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'quests' && styles.tabBtnActive]}
          onPress={() => setActiveTab('quests')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'quests' && styles.tabBtnTextActive]}>
            Quests ({quests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'checkpoints' && styles.tabBtnActive]}
          onPress={() => setActiveTab('checkpoints')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'checkpoints' && styles.tabBtnTextActive]}>
            Checkpoints ({checkpoints.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'challenges' && styles.tabBtnActive]}
          onPress={() => setActiveTab('challenges')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'challenges' && styles.tabBtnTextActive]}>
            Bounties ({challenges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: QUESTS */}
      {activeTab === 'quests' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ACTIVE QUESTS</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setQuestModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>+ Create Quest</Text>
            </TouchableOpacity>
          </View>

          {quests.map((q) => (
            <View key={q._id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{q.name}</Text>
                <Text style={styles.itemSub}>
                  {q.campus} • {q.checkpoints?.length || 0} Checkpoints • {q.totalPoints} PTS
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteQuest(q._id)}
                style={styles.deleteIconBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.accent.coral} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* TAB 2: CHECKPOINTS */}
      {activeTab === 'checkpoints' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CHECKPOINT LOCATIONS</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setCheckpointModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>+ Add Checkpoint</Text>
            </TouchableOpacity>
          </View>

          {checkpoints.map((cp) => (
            <View key={cp._id} style={styles.itemRow}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>#{cp.order}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{cp.title}</Text>
                <Text style={styles.itemSub}>
                  QR: {cp.qrCode} • +{cp.points} PTS • Radius: {cp.radius}m
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCheckpoint(cp._id)}
                style={styles.deleteIconBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.accent.coral} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* TAB 3: CHALLENGES */}
      {activeTab === 'challenges' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SPECIAL BOUNTIES</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setChallengeModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>+ Add Bounty</Text>
            </TouchableOpacity>
          </View>

          {challenges.map((c) => (
            <View key={c._id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{c.title}</Text>
                <Text style={styles.itemSub}>
                  [{c.category.toUpperCase()}] • +{c.points} PTS • {c.verificationType}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteChallenge(c._id)}
                style={styles.deleteIconBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.accent.coral} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* CREATE QUEST MODAL */}
      <Modal visible={questModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Quest</Text>
            <TextInput
              style={styles.input}
              placeholder="Quest Name"
              placeholderTextColor="#7E75A0"
              value={questForm.name}
              onChangeText={(t) => setQuestForm({ ...questForm, name: t })}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description / Lore"
              placeholderTextColor="#7E75A0"
              multiline
              value={questForm.description}
              onChangeText={(t) => setQuestForm({ ...questForm, description: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Campus Location"
              placeholderTextColor="#7E75A0"
              value={questForm.campus}
              onChangeText={(t) => setQuestForm({ ...questForm, campus: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Points"
              placeholderTextColor="#7E75A0"
              keyboardType="numeric"
              value={questForm.totalPoints}
              onChangeText={(t) => setQuestForm({ ...questForm, totalPoints: t })}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setQuestModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateQuest}>
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE CHECKPOINT MODAL */}
      <Modal visible={checkpointModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Checkpoint</Text>
            <TextInput
              style={styles.input}
              placeholder="Checkpoint Title"
              placeholderTextColor="#7E75A0"
              value={checkpointForm.title}
              onChangeText={(t) => setCheckpointForm({ ...checkpointForm, title: t })}
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Secret Clue Text"
              placeholderTextColor="#7E75A0"
              multiline
              value={checkpointForm.clue}
              onChangeText={(t) => setCheckpointForm({ ...checkpointForm, clue: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="QR Code String (e.g. QST-CHK-01-OAK)"
              placeholderTextColor="#7E75A0"
              value={checkpointForm.qrCode}
              onChangeText={(t) => setCheckpointForm({ ...checkpointForm, qrCode: t })}
            />
            <View style={styles.inlineInputs}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Order (#)"
                placeholderTextColor="#7E75A0"
                keyboardType="numeric"
                value={checkpointForm.order}
                onChangeText={(t) => setCheckpointForm({ ...checkpointForm, order: t })}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Points"
                placeholderTextColor="#7E75A0"
                keyboardType="numeric"
                value={checkpointForm.points}
                onChangeText={(t) => setCheckpointForm({ ...checkpointForm, points: t })}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCheckpointModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateCheckpoint}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE CHALLENGE MODAL */}
      <Modal visible={challengeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Special Bounty</Text>
            <TextInput
              style={styles.input}
              placeholder="Bounty Title"
              placeholderTextColor="#7E75A0"
              value={challengeForm.title}
              onChangeText={(t) => setChallengeForm({ ...challengeForm, title: t })}
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Description"
              placeholderTextColor="#7E75A0"
              multiline
              value={challengeForm.description}
              onChangeText={(t) => setChallengeForm({ ...challengeForm, description: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (photo, riddle, trivia, creative)"
              placeholderTextColor="#7E75A0"
              value={challengeForm.category}
              onChangeText={(t) => setChallengeForm({ ...challengeForm, category: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Points"
              placeholderTextColor="#7E75A0"
              keyboardType="numeric"
              value={challengeForm.points}
              onChangeText={(t) => setChallengeForm({ ...challengeForm, points: t })}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setChallengeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateChallenge}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
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
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  errorBanner: {
    backgroundColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFF',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  statCardAlert: {
    borderColor: colors.accent.gold,
  },
  statNum: {
    ...typography.headingLg,
    fontWeight: '900',
    color: colors.text.onDark.primary,
  },
  statNumAlert: {
    color: colors.accent.gold,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  tabBtnText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  tabBtnTextActive: {
    color: colors.bg.dusk,
  },
  sectionContainer: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  actionBtn: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  itemSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  deleteIconBtn: {
    padding: 6,
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
    borderRadius: 10,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#FFF',
    ...typography.bodyMd,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
  },
  modalCancelText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  modalSave: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalSaveText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
});
