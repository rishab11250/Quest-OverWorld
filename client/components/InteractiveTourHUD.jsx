import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTour } from '../context/TourContext';
import { triggerHaptic } from '../lib/haptics';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function InteractiveTourHUD() {
  const insets = useSafeAreaInsets();
  const {
    isTourActive,
    tourMode,
    currentStep,
    isCollapsed,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    exitTour,
    toggleCollapse,
  } = useTour();

  // Manual flip override (allows user to temporarily swap top/bottom)
  const [overridePos, setOverridePos] = useState(null);

  // Reset override whenever the active step changes
  useEffect(() => {
    setOverridePos(null);
  }, [currentStep, currentStepData?.id]);

  if (!isTourActive || !currentStepData) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  // Determine whether this step should render at the top or bottom of the screen
  const activePosition = overridePos || currentStepData.hudPosition || 'bottom';
  const isTop = activePosition === 'top';

  const topOffset = Math.max(insets.top, 14) + 6;
  const bottomOffset = Math.max(insets.bottom, 8) + 66;
  const positionStyle = isTop ? { top: topOffset } : { bottom: bottomOffset };

  const isSingleRealm = tourMode !== 'all';
  const finishLabel = isSingleRealm
    ? `FINISH ${currentStepData.pageTitle} TOUR ⚡`
    : 'FINISH OVERWORLD TOUR ⚡';

  const togglePosition = () => {
    triggerHaptic('light');
    setOverridePos(isTop ? 'bottom' : 'top');
  };

  if (isCollapsed) {
    return (
      <View style={[styles.collapsedContainer, positionStyle]}>
        <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
        <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

        <View style={styles.collapsedLeft}>
          <View style={[styles.collapsedIconWrap, { borderColor: currentStepData.iconColor }]}>
            <MaterialCommunityIcons
              name={currentStepData.sectionIcon || 'compass-outline'}
              size={15}
              color={currentStepData.iconColor}
            />
          </View>
          <View style={styles.collapsedTextWrap}>
            <Text style={styles.collapsedBadge}>
              {currentStepData.pageTitle} • {currentStep + 1}/{totalSteps}
            </Text>
            <Text style={styles.collapsedTitle} numberOfLines={1}>
              {currentStepData.sectionName}
            </Text>
          </View>
        </View>

        <View style={styles.collapsedActions}>
          <TouchableOpacity
            style={styles.collapsedFlipBtn}
            onPress={togglePosition}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isTop ? 'arrow-down-bold' : 'arrow-up-bold'}
              size={12}
              color={colors.accent.cyan}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.collapsedExpandBtn}
            onPress={toggleCollapse}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isTop ? 'chevron-down' : 'chevron-up'}
              size={15}
              color={colors.accent.gold}
            />
            <Text style={styles.collapsedExpandText}>GUIDE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.collapsedNextBtn, isLast && styles.collapsedFinishBtn]}
            onPress={nextStep}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.collapsedNextText, isLast && styles.collapsedFinishText]}>
              {isLast ? 'DONE' : 'NEXT'}
            </Text>
            {!isLast && (
              <MaterialCommunityIcons name="chevron-right" size={13} color={colors.bg.dusk} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.collapsedExitBtn}
            onPress={exitTour}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={14} color={colors.text.onDark.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.hudContainer, positionStyle]}>
      {/* 16-Bit Corner Studs */}
      <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerBadgeContainer}>
          <View style={[styles.pulseDot, { backgroundColor: currentStepData.iconColor }]} />
          <Text style={styles.headerBadgeText}>
            {currentStepData.pageTitle} • SECTION {currentStep + 1} OF {totalSteps}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>
              {currentStep + 1}/{totalSteps}
            </Text>
          </View>

          {/* Quick Flip Position Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={togglePosition}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isTop ? 'arrow-down-bold' : 'arrow-up-bold'}
              size={14}
              color={colors.accent.cyan}
            />
          </TouchableOpacity>

          {/* Minimize / Collapse Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={toggleCollapse}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name={isTop ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.accent.gold}
            />
          </TouchableOpacity>

          {/* Close Tour Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={exitTour}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={16} color={colors.text.onDark.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature Spotlight Card */}
      <View style={styles.spotlightCard}>
        <View style={styles.spotlightTopRow}>
          <View
            style={[
              styles.buttonIconFrame,
              {
                borderColor: currentStepData.iconColor,
                shadowColor: currentStepData.iconColor,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={currentStepData.sectionIcon || 'compass-outline'}
              size={22}
              color={currentStepData.iconColor}
            />
          </View>

          <View style={styles.buttonMetaWrap}>
            <Text style={styles.buttonNameText} numberOfLines={2}>
              {currentStepData.sectionName}
            </Text>
            <View style={styles.locationHintRow}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={11}
                color={colors.accent.gold}
              />
              <Text style={styles.locationHintText} numberOfLines={2}>
                {currentStepData.locationHint}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Body */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={styles.useBox}>
            <Text style={styles.useLabel}>WHAT THIS SECTION DOES:</Text>
            <Text style={styles.useText}>{currentStepData.use}</Text>
          </View>

          {Boolean(currentStepData.proTip) && (
            <View style={styles.proTipBox}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={12}
                color={colors.accent.gold}
                style={styles.proTipIcon}
              />
              <Text style={styles.proTipText}>
                <Text style={styles.proTipBold}>ADVENTURER TIP: </Text>
                {currentStepData.proTip}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Footer Navigation Bar */}
      <View style={styles.footerRow}>
        {!isFirst ? (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={prevStep}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={15}
              color={colors.text.onDark.secondary}
            />
            <Text style={styles.prevBtnText}>PREV</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={exitTour}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.skipBtnText}>DISMISS</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, isLast && styles.finishBtn]}
          onPress={nextStep}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, isLast && styles.finishBtnText]}>
            {isLast ? finishLabel : 'NEXT SECTION ➔'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Collapsed Minimal Bar
  collapsedContainer: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    backgroundColor: '#1B162C',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99999,
    elevation: 25,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  collapsedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  collapsedIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#120F20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedTextWrap: {
    flex: 1,
  },
  collapsedBadge: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.gold,
    letterSpacing: 0.5,
  },
  collapsedTitle: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.primary,
  },
  collapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedFlipBtn: {
    backgroundColor: '#201A35',
    borderWidth: 1,
    borderColor: '#3D3460',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#261F3D',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  collapsedExpandText: {
    ...typography.captionBold,
    fontSize: 8.5,
    color: colors.accent.gold,
  },
  collapsedNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  collapsedNextText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.bg.dusk,
  },
  collapsedFinishBtn: {
    backgroundColor: colors.accent.green,
  },
  collapsedFinishText: {
    color: colors.bg.dusk,
    fontWeight: '800',
  },
  collapsedExitBtn: {
    padding: 3,
  },

  // Main Expanded Container
  hudContainer: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    backgroundColor: '#19142B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    padding: 12,
    zIndex: 99999,
    elevation: 30,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    maxHeight: 275,
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

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2347',
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 8.5,
    color: colors.accent.gold,
    letterSpacing: 0.6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepPill: {
    backgroundColor: '#272044',
    borderWidth: 1,
    borderColor: '#3D3266',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  stepPillText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.gold,
  },
  headerActionBtn: {
    padding: 2,
  },

  // Spotlight Card
  spotlightCard: {
    paddingVertical: 8,
    flexShrink: 1,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  buttonIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#120E22',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  buttonMetaWrap: {
    flex: 1,
  },
  buttonNameText: {
    ...typography.captionBold,
    fontSize: 12,
    color: colors.text.onDark.primary,
    letterSpacing: 0.3,
  },
  locationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationHintText: {
    ...typography.caption,
    fontSize: 9.5,
    color: colors.accent.gold,
    flex: 1,
  },

  // Scroll Area
  scrollArea: {
    maxHeight: 110,
  },
  scrollContent: {
    paddingBottom: 2,
    gap: 6,
  },
  useBox: {
    backgroundColor: '#120E22',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  useLabel: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.gold,
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  useText: {
    ...typography.caption,
    fontSize: 10.5,
    color: colors.text.onDark.primary,
    lineHeight: 14,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#261F12',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4D3E1A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  proTipIcon: {
    marginTop: 1,
  },
  proTipText: {
    ...typography.caption,
    fontSize: 9.5,
    color: '#F4D388',
    lineHeight: 13,
    flex: 1,
  },
  proTipBold: {
    fontWeight: '800',
    color: colors.accent.gold,
  },

  // Progress Track
  progressTrack: {
    height: 3,
    backgroundColor: '#261F3D',
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.gold,
    borderRadius: 2,
  },

  // Footer Row
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#231C38',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#3D315E',
    gap: 2,
  },
  prevBtnText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipBtnText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.muted,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.accent.gold,
    borderRadius: 5,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  nextBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.bg.dusk,
    fontWeight: '800',
  },
  finishBtn: {
    backgroundColor: colors.accent.green,
    shadowColor: colors.accent.green,
  },
  finishBtnText: {
    color: colors.bg.dusk,
  },
});
