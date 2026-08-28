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
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.cardHeader}>
        {isRejected ? 'RESUBMIT MISSION PROOF' : 'SUBMIT MISSION PROOF'}
      </Text>

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
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {challenge?.category === 'photo'
            ? 'Optional Note / Description'
            : challenge?.verificationType === 'auto_answer'
              ? 'Answer Key / Solution'
              : 'Adventurer Response'}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            challenge?.category === 'photo' || challenge?.category === 'creative'
              ? styles.textArea
              : null,
          ]}
          placeholder={
            challenge?.verificationType === 'auto_answer'
              ? 'Enter exact answer...'
              : 'Write your response here...'
          }
          placeholderTextColor="#7E75A0"
          value={textResponse}
          onChangeText={setTextResponse}
          multiline={challenge?.category === 'photo' || challenge?.category === 'creative'}
        />
      </View>

      {/* Submit Action */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={onSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={colors.bg.dusk} />
        ) : (
          <Text style={styles.submitBtnText}>
            {challenge?.verificationType === 'auto_answer' ? 'Verify Answer' : 'Submit for Review'}
          </Text>
        )}
      </TouchableOpacity>
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
  submitBtnText: {
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
});
