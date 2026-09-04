import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import AdminLocationPickerMap from './AdminLocationPickerMap';
import PixelCard from '../PixelCard';

export default function AdminQuestsTab({
  quests = [],
  checkpoints = [],
  onOpenCreateQuest,
  onOpenCreateCheckpoint,
  onDeleteQuest,
  onDeleteCheckpoint,
  onViewQr,
}) {
  const [selectedMapPoint, setSelectedMapPoint] = useState(null);

  return (
    <View style={styles.container}>
      {/* Interactive Realm Topo Map Header */}
      <PixelCard variant="gold" style={styles.mapSectionCard}>
        <View style={styles.mapSectionHeader}>
          <View>
            <Text style={styles.mapSectionTitle}>CAMPUS REALM TOPO MAP</Text>
            <Text style={styles.mapSectionSub}>
              {checkpoints.length} Stations & {quests.length} Active Expeditions Placed
            </Text>
          </View>
          <View style={styles.mapBadge}>
            <MaterialCommunityIcons name="map-check" size={14} color={colors.accent.gold} />
            <Text style={styles.mapBadgeText}>LIVE GPS</Text>
          </View>
        </View>

        <AdminLocationPickerMap
          selectedLocation={selectedMapPoint}
          onLocationChange={setSelectedMapPoint}
          existingCheckpoints={checkpoints}
          existingQuests={quests}
          readOnly={true}
        />
      </PixelCard>
      {/* Quests Manager */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>CAMPUS QUESTS ({quests.length})</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenCreateQuest}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>+ Create Quest</Text>
          </TouchableOpacity>
        </View>

        {quests.map((q) => (
          <View key={q._id} style={styles.questCardItem}>
            <View style={styles.questCardTop}>
              <View style={styles.questBadge}>
                <Text style={styles.questBadgeText}>
                  {(q.campus || 'Main Campus').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.questPointsLabel}>+{q.totalPoints || 700} PTS BUDGET</Text>
            </View>
            <Text style={styles.questCardTitle}>{q.name}</Text>
            <Text style={styles.questCardDesc}>{q.description}</Text>

            <View style={styles.questCardFooter}>
              <Text style={styles.questStationsCount}>
                📍 {q.checkpoints?.length || 0} Checkpoints Attached
              </Text>
              <TouchableOpacity onPress={() => onDeleteQuest(q._id)} style={styles.deleteIconBtn}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={colors.accent.coral}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Checkpoints Stations Manager */}
      <View style={styles.cardSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>CHECKPOINT STATIONS ({checkpoints.length})</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenCreateCheckpoint}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>+ Add Station</Text>
          </TouchableOpacity>
        </View>

        {checkpoints.map((cp) => (
          <View key={cp._id} style={styles.checkpointCard}>
            <View style={styles.checkpointTop}>
              <View style={styles.orderCircle}>
                <Text style={styles.orderText}>#{cp.order}</Text>
              </View>
              <View style={styles.checkpointHeaderInfo}>
                <Text style={styles.checkpointTitle}>{cp.title}</Text>
                <Text style={styles.checkpointCoords}>
                  GPS: {cp.latitude?.toFixed(4)}, {cp.longitude?.toFixed(4)} (±{cp.radius || 50}m)
                </Text>
              </View>
              <View style={styles.pointsBadgeMini}>
                <Text style={styles.pointsBadgeMiniText}>+{cp.points} PTS</Text>
              </View>
            </View>

            <View style={styles.clueSnippetBox}>
              <Text style={styles.clueSnippetLabel}>Clue Prompt:</Text>
              <Text style={styles.clueSnippetText}>{cp.clue}</Text>
            </View>

            <View style={styles.checkpointFooter}>
              <TouchableOpacity
                style={styles.qrPill}
                onPress={() => onViewQr && onViewQr(cp)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode" size={14} color={colors.accent.gold} />
                <Text style={styles.qrPillText}>View / Print QR Code</Text>
                <MaterialCommunityIcons name="open-in-new" size={12} color={colors.accent.gold} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onDeleteCheckpoint(cp._id)}
                style={styles.deleteIconBtn}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={colors.accent.coral}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  mapSectionCard: {
    backgroundColor: colors.bg.duskRaised,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mapSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapSectionTitle: {
    ...typography.displayPixelXs,
    fontSize: 9.5,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  mapSectionSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    gap: 4,
  },
  mapBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
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
  questCardItem: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  questCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questBadgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    fontSize: 10,
  },
  questPointsLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontWeight: '700',
  },
  questCardTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  questCardDesc: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  questCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#362E52',
    paddingTop: spacing.xs,
    marginTop: 4,
  },
  questStationsCount: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontWeight: '600',
  },
  checkpointCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  checkpointTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  checkpointHeaderInfo: {
    flex: 1,
  },
  checkpointTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  checkpointCoords: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  pointsBadgeMini: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsBadgeMiniText: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 11,
  },
  clueSnippetBox: {
    backgroundColor: '#1E1A33',
    borderRadius: 6,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#362E52',
  },
  clueSnippetLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    fontSize: 10,
  },
  clueSnippetText: {
    ...typography.bodyMd,
    color: '#FFF',
  },
  checkpointFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  qrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A162B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qrPillText: {
    ...typography.monoSm,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  deleteIconBtn: {
    padding: 6,
  },
});
