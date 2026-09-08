import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTour, TOUR_PAGES_META } from '../context/TourContext';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function TourSelectModal() {
  const { selectorVisible, closeTourSelector, startTour } = useTour();

  if (!selectorVisible) return null;

  return (
    <Modal
      visible={selectorVisible}
      transparent
      animationType="fade"
      onRequestClose={closeTourSelector}
    >
      <TouchableWithoutFeedback onPress={closeTourSelector}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Corner Pixel Studs */}
              <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
              <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
              <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
              <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <MaterialCommunityIcons
                    name="compass-rose"
                    size={20}
                    color={colors.accent.gold}
                  />
                  <View>
                    <Text style={styles.headerTitle}>APP WALKTHROUGH</Text>
                    <Text style={styles.headerSub}>Select a realm guide or start full tour</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={closeTourSelector}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={colors.text.onDark.secondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Realms List */}
              <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {TOUR_PAGES_META.map((item) => {
                  const isAll = item.id === 'all';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.realmItem, isAll && styles.realmItemAll]}
                      onPress={() => startTour(item.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.realmIconWrap,
                          { borderColor: item.color, backgroundColor: '#141022' },
                        ]}
                      >
                        <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                      </View>

                      <View style={styles.realmMeta}>
                        <View style={styles.realmTitleRow}>
                          <Text style={[styles.realmTitle, isAll && styles.realmTitleAll]}>
                            {item.title}
                          </Text>
                          {isAll && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedText}>COMPLETE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.realmSub}>{item.subtitle}</Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={isAll ? colors.accent.gold : colors.text.onDark.muted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={closeTourSelector}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 7, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1B162C',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    padding: spacing.md,
    maxHeight: '85%',
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 35,
  },

  // Pixel Corners
  corner: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: colors.accent.gold,
  },
  cornerTL: { top: -2, left: -2 },
  cornerTR: { top: -2, right: -2 },
  cornerBL: { bottom: -2, left: -2 },
  cornerBR: { bottom: -2, right: -2 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2F264C',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    ...typography.displayPixelXs,
    fontSize: 10.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  headerSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },

  // List
  listScroll: {
    marginTop: spacing.sm,
    maxHeight: 360,
  },
  listContent: {
    gap: 8,
    paddingVertical: 4,
  },
  realmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141022',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2F264C',
    padding: 10,
    gap: 10,
  },
  realmItemAll: {
    borderColor: colors.accent.gold,
    backgroundColor: '#231B3A',
  },
  realmIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realmMeta: {
    flex: 1,
  },
  realmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  realmTitle: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.text.onDark.primary,
    letterSpacing: 0.3,
  },
  realmTitleAll: {
    color: colors.accent.gold,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  recommendedText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.accent.gold,
  },
  realmSub: {
    ...typography.caption,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },

  // Footer
  footerRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2F264C',
    alignItems: 'center',
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.muted,
    letterSpacing: 0.5,
  },
});
