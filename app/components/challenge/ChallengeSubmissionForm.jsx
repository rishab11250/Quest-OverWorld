import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ChallengeSubmissionForm({
  challenge,
  isRejected,
  textResponse,
  setTextResponse,
  photoUri,
  setPhotoUri,
  setPhotoBase64,
  onTakePhoto,
  onPickPhoto,
  onSubmit,
  submitting,
  attemptStatus,
  cooldownSeconds,
}) {
  const isAutoTrivia =
    challenge?.verificationType === 'auto_answer' ||
    challenge?.category === 'trivia' ||
    challenge?.category === 'riddle';

  const isLocked = attemptStatus?.status === 'locked';
  const inCooldown = cooldownSeconds > 0;

  // Format mm:ss
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.cardHeader}>
        {isRejected
          ? 'RESUBMIT MISSION PROOF'
          : isAutoTrivia
            ? 'SOLVE PUZZLE BOUNTY'
            : 'SUBMIT MISSION PROOF'}
      </Text>

      {/* Trivia / Riddle Attempt & XP Decay HUD */}
      {isAutoTrivia && attemptStatus ? (
        <View style={styles.attemptHUD}>
          {/* Top Row: Current Attempt Badge & XP Payout */}
          <View style={styles.attemptRow}>
            <View style={styles.attemptBadge}>
              <MaterialCommunityIcons
                name={attemptStatus.attempts >= 3 ? 'lightning-bolt' : 'shield-half-full'}
                size={14}
                color={colors.accent.gold}
              />
              <Text style={styles.attemptBadgeText}>
                {attemptStatus.attempts >= 3
                  ? 'FINAL SECOND CHANCE'
                  : `ATTEMPT ${attemptStatus.attempts + 1} OF 3`}
              </Text>
            </View>

            <View style={styles.payoutBadge}>
              <Text style={styles.payoutLabel}>REWARD:</Text>
              <Text style={styles.payoutVal}>
                +{attemptStatus.currentPointsPreview || challenge?.points || 150} XP
              </Text>
            </View>
          </View>

          {/* Cooldown Active Banner */}
          {inCooldown ? (
            <View style={styles.cooldownBanner}>
              <MaterialCommunityIcons name="timer-sand" size={16} color={colors.accent.coral} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cooldownTitle}>GUILD PARTY COOLDOWN</Text>
                <Text style={styles.cooldownTimer}>Unlock in {formatTimer(cooldownSeconds)}</Text>
              </View>
            </View>
          ) : null}

          {/* Locked Permanently Banner */}
          {isLocked ? (
            <View style={styles.lockedBanner}>
              <MaterialCommunityIcons name="lock" size={16} color={colors.accent.coral} />
              <Text style={styles.lockedText}>
                All 4 party attempts exhausted. This bounty is permanently sealed.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Photo Input for Photo Challenges */}
      {challenge?.category === 'photo' ? (
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
              onPress={onTakePhoto}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="camera" size={20} color={colors.accent.gold} />
              <Text style={styles.photoActionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoActionBtn, styles.photoActionBtnAlt]}
              onPress={onPickPhoto}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="image" size={20} color={colors.text.onDark.primary} />
              <Text style={styles.photoActionTextAlt}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Text / Answer Input */}
      {!isLocked ? (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {challenge?.category === 'photo'
              ? 'Optional Note / Description'
              : isAutoTrivia
                ? 'Answer Key / Solution'
                : 'Adventurer Response'}
          </Text>
          <TextInput
            style={[
              styles.textInput,
              challenge?.category === 'photo' || challenge?.category === 'creative'
                ? styles.textArea
                : null,
              inCooldown && styles.textInputDisabled,
            ]}
            placeholder={
              isAutoTrivia
                ? inCooldown
                  ? 'Cooldown in progress...'
                  : 'Enter exact answer...'
                : 'Write your response here...'
            }
            placeholderTextColor="#7E75A0"
            value={textResponse}
            onChangeText={setTextResponse}
            editable={!inCooldown && !submitting}
            multiline={challenge?.category === 'photo' || challenge?.category === 'creative'}
          />
        </View>
      ) : null}

      {/* Submit Action */}
      {!isLocked ? (
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || inCooldown) && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={submitting || inCooldown}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.bg.dusk} />
          ) : (
            <Text
              style={[styles.submitBtnText, inCooldown && { color: colors.text.onDark.secondary }]}
            >
              {inCooldown
                ? `Locked (${formatTimer(cooldownSeconds)})`
                : isAutoTrivia
                  ? 'Verify Answer'
                  : 'Submit for Review'}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  cardHeader: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  photoSection: {
    gap: spacing.sm,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 6,
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
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
  },
  photoActionBtnAlt: {
    backgroundColor: '#262040',
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
    gap: 4,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  textInput: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#FFF',
    ...typography.bodyMd,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnDisabled: {
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  submitBtnText: {
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  textInputDisabled: {
    opacity: 0.5,
    backgroundColor: '#1E1A33',
  },
  attemptHUD: {
    backgroundColor: '#1E1A33',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 6,
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  attemptBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
  },
  payoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payoutLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
  },
  payoutVal: {
    ...typography.bodyMdBold,
    fontSize: 12,
    color: colors.accent.green,
  },
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderRadius: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.accent.coral,
    gap: 6,
  },
  cooldownTitle: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.coral,
  },
  cooldownTimer: {
    ...typography.bodyMdBold,
    fontSize: 11,
    color: '#FFF',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderRadius: 4,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.accent.coral,
    gap: 6,
  },
  lockedText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.coral,
    flex: 1,
  },
});
