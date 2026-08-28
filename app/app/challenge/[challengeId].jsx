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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import RewardModal from '../../components/RewardModal';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ChallengeDetailScreen() {
  const { challengeId } = useLocalSearchParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [textResponse, setTextResponse] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  // Reward Modal state
  const [rewardVisible, setRewardVisible] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(150);

  const fetchChallenge = useCallback(async () => {
    if (!challengeId) return;
    try {
      setError('');
      const data = await api.get(`/challenges/${challengeId}`);
      setChallenge(data.challenge);
      if (data.challenge?.submission) {
        setTextResponse(data.challenge.submission.textResponse || '');
        if (data.challenge.submission.photoUrl) {
          setPhotoUri(data.challenge.submission.photoUrl);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load challenge.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenge();
  };

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (err) {
      setError('Failed to select photo.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take photo proof.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (err) {
      setError('Failed to capture photo.');
    }
  };

  const handleSubmit = async () => {
    if (!challenge) return;

    setError('');
    setSuccessMsg('');

    if (challenge.category === 'photo' && !photoBase64 && !photoUri) {
      setError('Please provide a photo submission.');
      return;
    }

    if (challenge.verificationType === 'auto_answer' && !textResponse.trim()) {
      setError('Please enter your answer.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        textResponse: textResponse.trim(),
        photoUrl: photoBase64 || photoUri || '',
      };

      const res = await api.post(`/challenges/${challenge._id}/submit`, payload);

      if (res.approved) {
        setRewardPoints(res.pointsAwarded || challenge.points);
        setRewardVisible(true);
      } else {
        setSuccessMsg(res.message || 'Submission sent for Guild review!');
        fetchChallenge();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRewardDismiss = () => {
    setRewardVisible(false);
    router.replace('/(tabs)/challenges');
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.screenPadding }]}>
        <Text style={styles.errorText}>{error || 'Challenge not found.'}</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const submission = challenge.submission;
  const status = submission?.status;
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/challenges');
    }
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
        onPress={handleBack}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.7}
      >
        <Text style={styles.navBackText}>‹ BOUNTY BOARD</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>{challenge.category.toUpperCase()} CHALLENGE</Text>
          <View style={styles.pointsChip}>
            <Text style={styles.pointsChipText}>+{challenge.points} PTS</Text>
          </View>
        </View>
        <Text style={styles.title}>{challenge.title}</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {successMsg ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Objective Card */}
      <View style={styles.objectiveCard}>
        <Text style={styles.cardHeader}>MISSION OBJECTIVE</Text>
        <Text style={styles.objectiveText}>{challenge.description}</Text>
      </View>

      {/* Submission Status Banner */}
      {isApproved ? (
        <View style={styles.approvedCard}>
          <MaterialCommunityIcons name="check-decagram" size={32} color={colors.accent.green} />
          <Text style={styles.approvedTitle}>BOUNTY CLAIMED!</Text>
          <Text style={styles.approvedSub}>
            Your party earned +{challenge.points} XP for completing this mission.
          </Text>
        </View>
      ) : isPending ? (
        <View style={styles.pendingCard}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={colors.accent.gold} />
          <Text style={styles.pendingTitle}>UNDER GUILD REVIEW</Text>
          <Text style={styles.pendingSub}>
            Your party’s submission is in the review queue. Points will be awarded upon approval.
          </Text>
        </View>
      ) : (
        /* Active Submission Form */
        <View style={styles.formCard}>
          <Text style={styles.cardHeader}>
            {isRejected ? 'RESUBMIT MISSION PROOF' : 'SUBMIT MISSION PROOF'}
          </Text>

          {isRejected && submission?.feedback ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackLabel}>ADMIN FEEDBACK:</Text>
              <Text style={styles.feedbackText}>{submission.feedback}</Text>
            </View>
          ) : null}

          {/* Photo Input (for Photo Challenges) */}
          {challenge.category === 'photo' ? (
            <View style={styles.photoSection}>
              {photoUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => {
                      setPhotoUri(null);
                      setPhotoBase64(null);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="camera" size={20} color={colors.accent.gold} />
                  <Text style={styles.photoActionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoActionBtn, styles.photoActionBtnAlt]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="image" size={20} color={colors.text.onDark.primary} />
                  <Text style={styles.photoActionTextAlt}>Upload from Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Text Input (Trivia / Riddle / Creative) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {challenge.category === 'trivia'
                ? 'Your Answer'
                : challenge.category === 'creative'
                ? 'Your Rallying Cry'
                : 'Solution / Description'}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                challenge.category !== 'trivia' && styles.textAreaInput,
              ]}
              placeholder={
                challenge.category === 'trivia'
                  ? 'e.g. 1892'
                  : 'Enter your response here...'
              }
              placeholderTextColor="#7E75A0"
              value={textResponse}
              onChangeText={setTextResponse}
              multiline={challenge.category !== 'trivia'}
              numberOfLines={challenge.category !== 'trivia' ? 4 : 1}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bg.dusk} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRejected ? 'RESUBMIT FOR BOUNTY' : 'SUBMIT FOR BOUNTY'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Celebration Reward Modal */}
      <RewardModal
        visible={rewardVisible}
        points={rewardPoints}
        checkpointTitle={challenge.title}
        checkpointOrder={1}
        onDismiss={handleRewardDismiss}
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
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  pointsChip: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pointsChipText: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  title: {
    ...typography.displayXl,
    color: colors.text.onDark.primary,
  },
  errorBanner: {
    backgroundColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: colors.accent.green,
    borderRadius: 6,
    padding: spacing.md,
  },
  successText: {
    ...typography.bodyMd,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  objectiveCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
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
  objectiveText: {
    ...typography.bodyLg,
    color: colors.text.onDark.primary,
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  feedbackBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
    gap: 2,
  },
  feedbackLabel: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.coral,
  },
  feedbackText: {
    ...typography.bodyMd,
    color: '#FFF',
  },
  photoSection: {
    gap: spacing.sm,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
  },
  photoActionBtnAlt: {
    borderColor: '#4A4170',
  },
  photoActionText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  photoActionTextAlt: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  textInput: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: '#FFF',
    ...typography.bodyLg,
  },
  textAreaInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitButton: {
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
  submitButtonText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  approvedCard: {
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.accent.green,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  approvedTitle: {
    ...typography.headingLg,
    color: colors.accent.green,
    fontWeight: '800',
  },
  approvedSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pendingTitle: {
    ...typography.headingLg,
    color: colors.accent.gold,
    fontWeight: '800',
  },
  pendingSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  backLink: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 6,
  },
  backLinkText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
});
