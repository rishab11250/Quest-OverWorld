import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function RewardModal({
  visible,
  points = 100,
  checkpointTitle = 'Checkpoint Cleared',
  checkpointOrder = 1,
  nextClue = null,
  isQuestCompleted = false,
  onDismiss,
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Pixel Crest */}
          <View style={styles.crestCircle}>
            <MaterialCommunityIcons
              name={isQuestCompleted ? 'crown' : 'trophy-award'}
              size={40}
              color={colors.accent.gold}
            />
          </View>

          {/* Celebration Header */}
          <Text style={styles.celebrationText}>
            {isQuestCompleted ? 'QUEST COMPLETE!' : 'CHECKPOINT CLEARED!'}
          </Text>

          {/* Points Banner */}
          <View style={styles.pointsBanner}>
            <Text style={styles.pointsText}>+{points} PTS</Text>
          </View>

          {/* Cleared Title */}
          <Text style={styles.checkpointTitleText}>
            #{checkpointOrder}: {checkpointTitle}
          </Text>

          {/* Next Clue Teaser (if remaining) */}
          {nextClue ? (
            <View style={styles.nextClueBox}>
              <View style={styles.nextClueHeader}>
                <Text style={styles.nextClueLabel}>NEXT CLUE UNLOCKED</Text>
                <Text style={styles.nextClueOrder}>#{nextClue.order}</Text>
              </View>
              <Text style={styles.nextClueTitle}>{nextClue.title}</Text>
              <Text style={styles.nextClueText} numberOfLines={2}>
                {nextClue.clue}
              </Text>
            </View>
          ) : isQuestCompleted ? (
            <View style={styles.victoryBox}>
              <Text style={styles.victoryText}>
                🌟 Congratulations! Your party has deciphered all secrets in this quest!
              </Text>
            </View>
          ) : null}

          {/* Dismiss Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>
              {isQuestCompleted ? 'VIEW RANKINGS' : 'CONTINUE QUEST'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 16,
    padding: spacing.cardPadding,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    gap: spacing.md,
    elevation: 12,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  crestCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#322A54',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -spacing.md,
  },
  celebrationText: {
    ...typography.displayPixel,
    fontSize: 15,
    color: colors.accent.gold,
    textAlign: 'center',
  },
  pointsBanner: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  pointsText: {
    ...typography.displayPixel,
    fontSize: 20,
    color: colors.accent.gold,
  },
  checkpointTitleText: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    textAlign: 'center',
  },
  nextClueBox: {
    width: '100%',
    backgroundColor: colors.bg.parchment,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: 4,
  },
  nextClueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D8CEA8',
    paddingBottom: 2,
  },
  nextClueLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onLight.primary,
    fontSize: 10,
  },
  nextClueOrder: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onLight.secondary,
  },
  nextClueTitle: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onLight.primary,
  },
  nextClueText: {
    ...typography.caption,
    color: colors.text.onLight.secondary,
    lineHeight: 16,
  },
  victoryBox: {
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    padding: spacing.md,
    borderRadius: 8,
  },
  victoryText: {
    ...typography.bodyMd,
    color: colors.accent.green,
    textAlign: 'center',
    fontWeight: '700',
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.accent.gold,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.xs,
  },
  continueButtonText: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
});
