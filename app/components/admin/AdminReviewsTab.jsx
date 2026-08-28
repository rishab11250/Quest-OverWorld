import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminReviewsTab({ pendingSubmissions, onApprove, onOpenRejectModal }) {
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

            return (
              <View key={sub._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <Text style={styles.reviewCategory}>
                      {challenge?.category?.toUpperCase()} BOUNTY
                    </Text>
                    <Text style={styles.reviewTitle}>{challenge?.title}</Text>
                  </View>
                  <View style={styles.reviewPointsChip}>
                    <Text style={styles.reviewPointsText}>+{challenge?.points || 150} PTS</Text>
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
                    <Text style={styles.reviewTextLabel}>Submitted Response:</Text>
                    <Text style={styles.reviewTextContent}>{sub.textResponse}</Text>
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
                    onPress={() => onApprove(sub._id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={18}
                      color={colors.bg.dusk}
                    />
                    <Text style={styles.approveBtnText}>
                      Approve (+{challenge?.points || 150} PTS)
                    </Text>
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
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  emptyCardTitle: {
    ...typography.headingLg,
    color: colors.accent.green,
    fontWeight: '800',
  },
  emptyCardSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  reviewCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewHeaderLeft: {
    flex: 1,
  },
  reviewCategory: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1,
    fontSize: 10,
  },
  reviewTitle: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  reviewPointsChip: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewPointsText: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3560',
    paddingBottom: 6,
  },
  reviewMetaText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  metaHighlight: {
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  reviewPhotoContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A4170',
    marginTop: 4,
  },
  reviewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 6,
  },
  reviewTextBox: {
    backgroundColor: '#1E1A33',
    borderRadius: 6,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  reviewTextLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  reviewTextContent: {
    ...typography.bodyMd,
    color: '#FFF',
    marginTop: 2,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent.coral,
    paddingVertical: 10,
    borderRadius: 6,
    minHeight: 44,
  },
  rejectBtnText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: '#FFF',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    minHeight: 44,
  },
  approveBtnText: {
    ...typography.bodyMd,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
});
