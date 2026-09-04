import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';

export default function AdminReviewsTab({ pendingSubmissions, onApprove, onOpenRejectModal }) {
  const [pointsMap, setPointsMap] = useState({});

  const getPointsForSub = (sub) => {
    const challenge = sub.challengeId;
    if (pointsMap[sub._id] !== undefined) {
      return pointsMap[sub._id];
    }
    return challenge?.points || 150;
  };

  const handleSetPoints = (subId, newPoints, min = 1, max = 9999) => {
    triggerHaptic('selection');
    const clamped = Math.max(min, Math.min(max, Number(newPoints) || min));
    setPointsMap((prev) => ({ ...prev, [subId]: clamped }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PENDING REVIEWS ({pendingSubmissions.length})</Text>
        </View>

        {pendingSubmissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="check-all" size={36} color={colors.accent.green} />
            <Text style={styles.emptyCardTitle}>Queue Cleared!</Text>
            <Text style={styles.emptyCardSub}>No pending submissions awaiting review.</Text>
          </View>
        ) : (
          pendingSubmissions.map((sub) => {
            const challenge = sub.challengeId;
            const team = sub.teamId;
            const submitter = sub.submittedBy;
            const isCreative = challenge?.category === 'creative';

            const minPts = challenge?.minPoints || 50;
            const maxPts = challenge?.maxPoints || challenge?.points || 200;
            const currentPts = getPointsForSub(sub);
            const midPts = Math.round((minPts + maxPts) / 2);

            return (
              <View key={sub._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <View style={styles.categoryBadgeRow}>
                      <Text style={styles.reviewCategory}>
                        {challenge?.category?.toUpperCase()} BOUNTY
                      </Text>
                      {isCreative ? (
                        <View style={styles.slidingScaleBadge}>
                          <MaterialCommunityIcons
                            name="tune-variant"
                            size={12}
                            color={colors.accent.gold}
                          />
                          <Text style={styles.slidingScaleBadgeText}>SLIDING XP</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.reviewTitle}>{challenge?.title}</Text>
                  </View>
                  <View style={styles.reviewPointsChip}>
                    <Text style={styles.reviewPointsText}>
                      {isCreative
                        ? `${minPts} - ${maxPts} PTS`
                        : `+${challenge?.points || 150} PTS`}
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewMetaRow}>
                  <Text style={styles.reviewMetaText}>
                    Party: <Text style={styles.metaHighlight}>{team?.name || 'Adventurers'}</Text> (
                    {team?.score || 0} PTS)
                  </Text>
                  <Text style={styles.reviewMetaText}>
                    By: <Text style={styles.metaHighlight}>{submitter?.name || 'Member'}</Text>
                  </Text>
                </View>

                {sub.photoUrl ? (
                  <View style={styles.reviewPhotoContainer}>
                    <Image
                      source={{ uri: sub.photoUrl }}
                      style={styles.reviewPhoto}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {sub.textResponse ? (
                  <View style={styles.reviewTextBox}>
                    <Text style={styles.reviewTextLabel}>Submitted Response / Proof:</Text>
                    <Text style={styles.reviewTextContent}>{sub.textResponse}</Text>
                  </View>
                ) : null}

                {/* Creative Dynamic Point Customizer */}
                {isCreative ? (
                  <View style={styles.creativeScoreContainer}>
                    <View style={styles.creativeScoreHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MaterialCommunityIcons
                          name="palette-swatch-outline"
                          size={15}
                          color={colors.accent.gold}
                        />
                        <Text style={styles.creativeScoreTitle}>CREATIVE RATING & AWARD</Text>
                      </View>
                      <Text style={styles.creativeAwardText}>+{currentPts} PTS</Text>
                    </View>

                    {/* Quick Preset Chips */}
                    <View style={styles.presetRow}>
                      <TouchableOpacity
                        style={[
                          styles.presetChip,
                          currentPts === minPts && styles.presetChipActive,
                        ]}
                        onPress={() => handleSetPoints(sub._id, minPts, minPts, maxPts)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            currentPts === minPts && styles.presetChipTextActive,
                          ]}
                        >
                          Min ({minPts})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.presetChip,
                          currentPts === midPts && styles.presetChipActive,
                        ]}
                        onPress={() => handleSetPoints(sub._id, midPts, minPts, maxPts)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            currentPts === midPts && styles.presetChipTextActive,
                          ]}
                        >
                          Mid ({midPts})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.presetChip,
                          currentPts === maxPts && styles.presetChipActive,
                        ]}
                        onPress={() => handleSetPoints(sub._id, maxPts, minPts, maxPts)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            currentPts === maxPts && styles.presetChipTextActive,
                          ]}
                        >
                          Max ({maxPts})
                        </Text>
                      </TouchableOpacity>

                      {/* Stepper Buttons */}
                      <View style={styles.stepperGroup}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleSetPoints(sub._id, currentPts - 10, minPts, maxPts)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperText}>−10</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleSetPoints(sub._id, currentPts + 10, minPts, maxPts)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperText}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : null}

                <View style={styles.reviewActionsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => onOpenRejectModal(sub._id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => onApprove(sub._id, currentPts)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={18}
                      color={colors.bg.dusk}
                    />
                    <Text style={styles.approveBtnText}>Approve (+{currentPts} PTS)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  cardSection: {
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
  emptyCard: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyCardTitle: {
    ...typography.h3,
    color: colors.text.onDark.primary,
  },
  emptyCardSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  reviewCard: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewHeaderLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  reviewCategory: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  slidingScaleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  slidingScaleBadgeText: {
    ...typography.captionBold,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.5,
  },
  reviewTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 14,
  },
  reviewPointsChip: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reviewPointsText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 11,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#151126',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2D2748',
  },
  reviewMetaText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  metaHighlight: {
    color: colors.text.onDark.primary,
    fontWeight: '700',
  },
  reviewPhotoContainer: {
    height: 180,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D3560',
    backgroundColor: '#110D20',
  },
  reviewPhoto: {
    width: '100%',
    height: '100%',
  },
  reviewTextBox: {
    backgroundColor: '#151126',
    borderWidth: 1,
    borderColor: '#3D3560',
    borderRadius: 6,
    padding: spacing.sm,
    gap: 4,
  },
  reviewTextLabel: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.accent.gold,
    letterSpacing: 0.5,
  },
  reviewTextContent: {
    ...typography.body,
    fontSize: 12,
    color: colors.text.onDark.primary,
    lineHeight: 17,
  },
  creativeScoreContainer: {
    backgroundColor: '#161226',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A3D70',
    padding: 10,
    gap: 8,
  },
  creativeScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creativeScoreTitle: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  creativeAwardText: {
    ...typography.headingLg,
    fontSize: 15,
    color: colors.accent.gold,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#201A38',
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  presetChipText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.secondary,
  },
  presetChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '800',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  stepperBtn: {
    backgroundColor: '#2A2245',
    borderWidth: 1,
    borderColor: '#4E4273',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  stepperText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.accent.gold,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4A1D24',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingVertical: 10,
    borderRadius: 6,
  },
  rejectBtnText: {
    ...typography.captionBold,
    fontSize: 12,
    color: '#FFF',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent.green,
    paddingVertical: 10,
    borderRadius: 6,
  },
  approveBtnText: {
    ...typography.captionBold,
    fontSize: 12,
    color: colors.bg.dusk,
    fontWeight: '800',
  },
});
