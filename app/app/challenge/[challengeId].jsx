import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import SubScreenHeader from '../../components/SubScreenHeader';
import StatusBanner from '../../components/StatusBanner';
import LoadingScreen from '../../components/LoadingScreen';
import RewardModal from '../../components/RewardModal';
import ChallengeHeader from '../../components/challenge/ChallengeHeader';
import ChallengeStatusCard from '../../components/challenge/ChallengeStatusCard';
import ChallengeSubmissionForm from '../../components/challenge/ChallengeSubmissionForm';

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
    return <LoadingScreen message="Loading Bounty Codex..." />;
  }

  if (!challenge) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorHeading}>{error || 'Challenge not found.'}</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backLinkText}>Return to Bounty Board</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const submission = challenge.submission;
  const status = submission?.status;
  const isReviewed = status === 'approved' || status === 'pending';

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
      <SubScreenHeader title="BOUNTY BOARD" fallbackRoute="/(tabs)/challenges" />

      <ChallengeHeader challenge={challenge} />

      <StatusBanner type="error" message={error} />
      <StatusBanner type="success" message={successMsg} />

      {isReviewed ? (
        <ChallengeStatusCard
          status={status}
          points={challenge.points}
          feedback={submission?.feedback}
        />
      ) : (
        <View>
          {status === 'rejected' && submission?.feedback ? (
            <ChallengeStatusCard status={status} feedback={submission.feedback} />
          ) : null}

          <ChallengeSubmissionForm
            challenge={challenge}
            isRejected={status === 'rejected'}
            textResponse={textResponse}
            setTextResponse={setTextResponse}
            photoUri={photoUri}
            setPhotoUri={setPhotoUri}
            setPhotoBase64={setPhotoBase64}
            onTakePhoto={handleTakePhoto}
            onPickPhoto={handlePickPhoto}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </View>
      )}

      <RewardModal
        visible={rewardVisible}
        points={rewardPoints}
        title="BOUNTY CLAIMED!"
        message={`Your party conquered "${challenge.title}"!`}
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
  content: {
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
  errorHeading: {
    ...typography.bodyLg,
    color: colors.accent.coral,
    textAlign: 'center',
  },
  backLink: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  backLinkText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
});
