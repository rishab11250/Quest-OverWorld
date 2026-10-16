import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getSetting, setSetting } from '../../lib/secureStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

import LoadingScreen from '../../components/LoadingScreen';
import StatusBanner from '../../components/StatusBanner';
import DialogueBox from '../../components/DialogueBox';
import ProgressBar from '../../components/ProgressBar';
import PixelBadge from '../../components/PixelBadge';
import PixelCard from '../../components/PixelCard';
import PixelButton from '../../components/PixelButton';
import { triggerHaptic } from '../../lib/haptics';
import {
  startLocationWatcher,
  startHeadingWatcher,
  getLastKnownLocation,
} from '../../lib/location';
import { subscribeUnlockedCheckpoints } from '../../lib/offlineQueue';
import { useTour } from '../../context/TourContext';
import { useFloatingXp } from '../../context/FloatingXpContext';
import { useTheme } from '../../context/ThemeContext';
import WaypointCompassHud from '../../components/WaypointCompassHud';

const getTimeRemaining = (endTime) => {
  if (!endTime) return null;
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Ending soon';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTourActive, openTourSelector, activeTourTarget, currentStepData } = useTour();
  const { showFloatingXp } = useFloatingXp();
  const { theme, isLight } = useTheme();
  const [data, setData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const sectionLayouts = useRef({});
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Active Waypoint Node Pulse Animation
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const handleSectionLayout = useCallback(
    (key) => (event) => {
      sectionLayouts.current[key] = event.nativeEvent.layout.y;
    },
    []
  );

  useEffect(() => {
    if (!activeTourTarget || !scrollRef.current) return;
    const targetY = sectionLayouts.current[activeTourTarget];
    if (targetY !== undefined) {
      const isTopHud = currentStepData?.hudPosition === 'top';
      const visibleTargetScreenY = isTopHud ? insets.top + 280 : insets.top + 16;
      const scrollY = Math.max(0, targetY - visibleTargetScreenY);
      scrollRef.current.scrollTo({ y: scrollY, animated: true });
    } else {
      if (activeTourTarget === 'home_xp_box') {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      } else if (activeTourTarget === 'home_quest_box') {
        scrollRef.current.scrollTo({ y: 60, animated: true });
      } else if (activeTourTarget === 'home_station_clue') {
        scrollRef.current.scrollTo({ y: 160, animated: true });
      } else if (activeTourTarget === 'home_waypoints_card') {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }
  }, [activeTourTarget, currentStepData?.hudPosition, insets.top]);

  const fetchActiveQuest = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setError('');
      const res = await api.get('/quests/active');
      setData(res);
    } catch (err) {
      if (!isSilent) setError(err.message || 'Failed to load active quest.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const [announcement, setAnnouncement] = useState(null);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await api.get('/announcements');
      const list = res?.announcements || [];
      if (list.length > 0) {
        const latest = list[0];
        const dismissedId = await getSetting('dismissed_announcement_id', null);
        if (dismissedId !== latest._id) {
          setAnnouncement(latest);
        } else {
          setAnnouncement(null);
        }
      } else {
        setAnnouncement(null);
      }
    } catch (_err) {
      // Non-blocking
    }
  }, []);

  const dismissAnnouncement = async () => {
    if (announcement?._id) {
      await setSetting('dismissed_announcement_id', announcement._id);
      setAnnouncement(null);
      triggerHaptic('light');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveQuest(true);
      fetchAnnouncement();

      let locSub = null;
      let headSub = null;

      getLastKnownLocation().then((cached) => {
        if (cached) setUserLocation(cached);
      });

      startLocationWatcher((loc) => {
        setUserLocation(loc);
      }).then((sub) => {
        locSub = sub;
      });

      startHeadingWatcher((heading) => {
        setDeviceHeading(heading);
      }).then((sub) => {
        headSub = sub;
      });

      return () => {
        if (locSub?.remove) locSub.remove();
        if (headSub?.remove) headSub.remove();
      };
    }, [fetchActiveQuest, fetchAnnouncement])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      fetchAnnouncement();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchAnnouncement]);

  useEffect(() => {
    const unsub = subscribeUnlockedCheckpoints((unlocked) => {
      if (unlocked && (Array.isArray(unlocked) ? unlocked.length > 0 : true)) {
        showFloatingXp({
          amount: 100,
          label: 'OFFLINE SYNC XP!',
          icon: 'cloud-check',
          variant: 'gold',
        });
      }
      fetchActiveQuest(true);
    });
    return unsub;
  }, [fetchActiveQuest, showFloatingXp]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveQuest(false);
    fetchAnnouncement();
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Unveiling Quest Realm..." />;
  }

  const quest = data?.quest;
  const team = data?.team;
  const level = Math.floor((team?.score || 0) / 250) + 1;
  const activeStation =
    quest?.currentClue?.latitude && quest?.currentClue?.longitude
      ? quest.currentClue
      : (quest?.checkpoints || []).find((c) => c.order === (quest?.currentOrder || 1));

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={[styles.container, { backgroundColor: theme?.bg?.dusk || colors.bg.dusk }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: isTourActive ? 420 : 32,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme?.accent?.gold || colors.accent.gold}
          />
        }
      >
        {/* Brand & Party XP Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.pixelTitle, { color: theme?.accent?.gold || colors.accent.gold }]}>
              QUEST OVERWORLD
            </Text>
            <TouchableOpacity
              style={[
                styles.guideBadgeBtn,
                {
                  borderColor: theme?.border?.highlight || colors.accent.gold,
                  backgroundColor: theme?.bg?.surface || 'rgba(242, 200, 75, 0.12)',
                },
              ]}
              onPress={openTourSelector}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="compass-outline"
                size={13}
                color={theme?.accent?.gold || colors.accent.gold}
              />
              <Text
                style={[
                  styles.guideBadgeBtnText,
                  { color: theme?.accent?.gold || colors.accent.gold },
                ]}
              >
                TOUR
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.pixelSubtitle,
              { color: theme?.text?.secondary || colors.text.onDark.secondary },
            ]}
          >
            {team ? `${team.name.toUpperCase()} • LVL ${level}` : 'CAMPUS EXPLORATION'}
          </Text>
        </View>

        {/* Broadcast Announcement Banner */}
        {announcement ? (
          <View
            style={[
              styles.announcementBanner,
              activeTourTarget === 'home_alerts_btn' && styles.tourTargetGlow,
            ]}
          >
            <View style={styles.announcementLeft}>
              <Text style={styles.announcementIcon}>📢</Text>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTag}>BROADCAST ANNOUNCEMENT</Text>
                <Text style={styles.announcementText}>{announcement.message}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.announcementDismiss}
              onPress={dismissAnnouncement}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Text style={styles.announcementDismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Party Score & Level Progression Banner */}
        <PixelCard
          variant="gold"
          glow
          interactive
          style={[styles.pointsCard, activeTourTarget === 'home_xp_box' && styles.tourTargetGlow]}
          onLayout={handleSectionLayout('home_xp_box')}
        >
          <Text
            style={[
              styles.pointsLabel,
              { color: theme?.text?.secondary || colors.text.onDark.secondary },
            ]}
          >
            PARTY XP
          </Text>
          <Text style={[styles.pointsValue, { color: theme?.accent?.gold || colors.accent.gold }]}>
            +{team?.score || 0} PTS
          </Text>
          <View style={styles.badgeCentered}>
            <PixelBadge label={`LVL ${level}`} variant="gold" />
          </View>

          {team ? (
            <ProgressBar
              current={team?.score || 0}
              max={250}
              label={`NEXT LEVEL PROGRESS (LVL ${level + 1})`}
            />
          ) : null}
        </PixelCard>

        <StatusBanner type="error" message={error} />

        {/* No Team State */}
        {!team ? (
          <PixelCard variant="dusk" style={styles.emptyCard}>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme?.text?.primary || colors.text.onDark.primary },
              ]}
            >
              No Active Party
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme?.text?.secondary || colors.text.onDark.secondary },
              ]}
            >
              Join or form an adventuring party to receive quest clues and compete on the
              leaderboard.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme?.accent?.gold || colors.accent.gold },
              ]}
              onPress={() => {
                triggerHaptic('light');
                router.push('/(tabs)/team');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: isLight ? '#1E1A33' : theme?.bg?.dusk || colors.bg.dusk },
                ]}
              >
                Head to Party HQ
              </Text>
            </TouchableOpacity>
          </PixelCard>
        ) : quest ? (
          /* Active Quest Content */
          <View style={styles.questContainer}>
            <PixelCard
              variant="dusk"
              style={[
                styles.questCard,
                activeTourTarget === 'home_quest_box' && styles.tourTargetGlow,
              ]}
              onLayout={handleSectionLayout('home_quest_box')}
            >
              <View style={styles.questHeaderRow}>
                <View
                  style={[
                    styles.questTag,
                    {
                      backgroundColor: theme?.bg?.surface || '#1B152E',
                      borderColor: theme?.border?.subtle || '#44376C',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.questTagText,
                      { color: theme?.text?.secondary || colors.text.onDark.secondary },
                    ]}
                  >
                    ACTIVE QUEST
                  </Text>
                </View>
                <Text
                  style={[styles.questPoints, { color: theme?.accent?.gold || colors.accent.gold }]}
                >
                  +{quest.totalPoints || 700} PTS TOTAL
                </Text>
              </View>

              <Text
                style={[
                  styles.questName,
                  { color: theme?.text?.primary || colors.text.onDark.primary },
                ]}
              >
                {quest.name}
              </Text>
              <Text
                style={[
                  styles.questDesc,
                  { color: theme?.text?.secondary || colors.text.onDark.secondary },
                ]}
              >
                {quest.description}
              </Text>

              <View style={styles.stationMetaRow}>
                <View
                  style={[
                    styles.stationCounterBox,
                    {
                      backgroundColor: theme?.bg?.surface || '#1A142D',
                      borderColor: theme?.border?.subtle || '#362E52',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stationCounterText,
                      { color: theme?.text?.secondary || colors.text.onDark.secondary },
                    ]}
                  >
                    📍 Station {quest?.currentOrder || 1} of{' '}
                    {quest?.totalCheckpoints || quest?.checkpoints?.length || 4}
                  </Text>
                </View>
                {quest?.endAt ? (
                  <View
                    style={[
                      styles.timerBadge,
                      {
                        backgroundColor: theme?.bg?.surface || '#1A142D',
                        borderColor: theme?.border?.subtle || '#362E52',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timerBadgeText,
                        { color: theme?.accent?.gold || colors.accent.gold },
                      ]}
                    >
                      ⏳ {getTimeRemaining(quest.endAt)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </PixelCard>

            {/* Current Clue / Objective */}
            {quest?.currentClue ? (
              <PixelCard
                variant="gold"
                glow
                interactive
                style={[
                  styles.clueCard,
                  activeTourTarget === 'home_station_clue' && styles.tourTargetGlow,
                ]}
                onLayout={handleSectionLayout('home_station_clue')}
              >
                <View style={styles.clueHeaderRow}>
                  <View
                    style={[
                      styles.questTag,
                      {
                        backgroundColor: theme?.bg?.surface || '#1B152E',
                        borderColor: theme?.border?.subtle || '#44376C',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.questTagText,
                        { color: theme?.text?.secondary || colors.text.onDark.secondary },
                      ]}
                    >
                      STATION #{quest.currentClue.order}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.questPoints,
                      { color: theme?.accent?.gold || colors.accent.gold },
                    ]}
                  >
                    +{quest.currentClue.points || 100} PTS
                  </Text>
                </View>
                <Text
                  style={[
                    styles.clueTitle,
                    { color: theme?.text?.primary || colors.text.onDark.primary },
                  ]}
                >
                  {quest.currentClue.title}
                </Text>
                <Text
                  style={[
                    styles.clueBody,
                    { color: theme?.text?.secondary || colors.text.onDark.secondary },
                  ]}
                >
                  {quest.currentClue.clue}
                </Text>

                {activeStation?.latitude && activeStation?.longitude ? (
                  <WaypointCompassHud
                    userLocation={userLocation}
                    deviceHeading={deviceHeading}
                    targetLat={activeStation.latitude}
                    targetLng={activeStation.longitude}
                    targetTitle={activeStation.title}
                    onPress={() => router.push('/(tabs)/map')}
                  />
                ) : null}

                <PixelButton
                  variant="gold"
                  icon="qrcode-scan"
                  iconSize={18}
                  title="SCAN STATION QR CODE"
                  onPress={() => {
                    triggerHaptic('medium');
                    router.push('/camera/scanner');
                  }}
                  style={[
                    styles.scanButton,
                    activeTourTarget === 'home_station_clue' && styles.tourTargetGlow,
                  ]}
                />
              </PixelCard>
            ) : (
              <DialogueBox
                speaker="ARCH-MAGE"
                text="You have conquered all stations in this realm quest! Check the Bounty Board for special missions or view the Hall of Fame."
              />
            )}

            {/* Expedition Waypoint Roadmap */}
            <PixelCard
              variant="dusk"
              style={[
                styles.roadmapCard,
                activeTourTarget === 'home_waypoints_card' && styles.tourTargetGlow,
              ]}
              onLayout={handleSectionLayout('home_waypoints_card')}
            >
              <View
                style={[
                  styles.roadmapHeader,
                  { borderBottomColor: theme?.border?.subtle || '#362E52' },
                ]}
              >
                <View style={styles.roadmapHeaderLeft}>
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={14}
                    color={theme?.accent?.gold || colors.accent.gold}
                  />
                  <Text
                    style={[
                      styles.roadmapTitle,
                      { color: theme?.accent?.gold || colors.accent.gold },
                    ]}
                  >
                    EXPEDITION TRAIL
                  </Text>
                </View>
                <View
                  style={[
                    styles.roadmapProgressPill,
                    {
                      backgroundColor: theme?.bg?.surface || '#161326',
                      borderColor: theme?.border?.subtle || '#352D50',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roadmapSub,
                      { color: theme?.text?.secondary || colors.text.onDark.secondary },
                    ]}
                  >
                    {Math.max(
                      0,
                      Math.min((quest?.currentOrder || 1) - 1, quest?.totalCheckpoints || 0)
                    )}{' '}
                    / {quest?.totalCheckpoints || 0} CLEARED
                  </Text>
                </View>
              </View>

              <View style={styles.dungeonTrailList}>
                {(quest?.checkpoints && quest.checkpoints.length > 0
                  ? quest.checkpoints
                  : quest?.currentClue
                    ? [quest.currentClue]
                    : []
                ).map((wp, index, arr) => {
                  const isCleared = wp.order < (quest?.currentOrder || 1);
                  const isActive = wp.order === (quest?.currentOrder || 1);
                  const isLocked = wp.order > (quest?.currentOrder || 1);
                  const isFirst = index === 0;
                  const isLast = index === arr.length - 1;
                  const prevWp = index > 0 ? arr[index - 1] : null;
                  const prevCleared = prevWp ? prevWp.order < (quest?.currentOrder || 1) : false;
                  const waypointTitle = wp.title || wp.name || `Station #${wp.order}`;

                  return (
                    <View key={wp._id || wp.order} style={styles.trailRow}>
                      {/* Left Dungeon Spine (Connector -> Node -> Connector) */}
                      <View style={styles.spineColumn}>
                        {/* Top Line Segment */}
                        <View
                          style={[
                            styles.spineLine,
                            isFirst && styles.spineLineHidden,
                            prevCleared ? styles.spineLineCleared : styles.spineLineInactive,
                          ]}
                        />

                        {/* 8-bit Dungeon Node with Active Pulse */}
                        {isActive ? (
                          <Animated.View
                            style={[
                              styles.dungeonNode,
                              styles.nodeActive,
                              {
                                backgroundColor: isLight ? '#F2E4C2' : '#2A200B',
                                borderColor: theme?.accent?.gold || colors.accent.gold,
                                shadowColor: theme?.accent?.gold || colors.accent.gold,
                                transform: [{ scale: pulseAnim }],
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="crosshairs-gps"
                              size={15}
                              color={theme?.accent?.gold || colors.accent.gold}
                            />
                          </Animated.View>
                        ) : (
                          <View
                            style={[
                              styles.dungeonNode,
                              isCleared ? styles.nodeCleared : styles.nodeLocked,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={isCleared ? 'check-bold' : 'lock'}
                              size={13}
                              color={isCleared ? colors.accent.green : '#5A527A'}
                            />
                          </View>
                        )}

                        {/* Bottom Line Segment (Cleared=Solid Green, Active=Gold Dotted Trail, Locked=Dim Dashed) */}
                        <View
                          style={[
                            styles.spineLine,
                            isLast && styles.spineLineHidden,
                            isCleared
                              ? styles.spineLineCleared
                              : isActive
                                ? styles.spineLineActiveTrail
                                : styles.spineLineInactive,
                          ]}
                        />
                      </View>

                      {/* Right Dungeon Waypoint Card */}
                      <TouchableOpacity
                        activeOpacity={isActive ? 0.75 : 1}
                        onPress={() => {
                          if (isActive) {
                            triggerHaptic('medium');
                            router.push('/camera/scanner');
                          } else {
                            triggerHaptic('light');
                          }
                        }}
                        style={[
                          styles.trailCard,
                          {
                            backgroundColor: isActive
                              ? isLight
                                ? '#F7F0E1'
                                : 'rgba(242, 200, 75, 0.08)'
                              : isCleared
                                ? isLight
                                  ? '#EDF7EE'
                                  : 'rgba(95, 191, 122, 0.06)'
                                : theme?.bg?.surface || '#161226',
                            borderColor: isActive
                              ? theme?.accent?.gold || colors.accent.gold
                              : isCleared
                                ? theme?.accent?.green || colors.accent.green
                                : theme?.border?.subtle || '#2C2548',
                          },
                          isActive && styles.trailCardActive,
                          isCleared && styles.trailCardCleared,
                          isLocked && styles.trailCardLocked,
                        ]}
                      >
                        <View style={styles.trailCardHeader}>
                          <View
                            style={[
                              styles.trailOrderBadge,
                              {
                                backgroundColor: theme?.bg?.surface || '#1A152E',
                                borderColor: theme?.border?.subtle || '#362E52',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.trailOrderText,
                                { color: theme?.text?.muted || '#7E75A0' },
                              ]}
                            >
                              STAGE {String(wp.order).padStart(2, '0')}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.trailStatusPill,
                              isCleared && styles.statusPillCleared,
                              isActive && styles.statusPillActive,
                              isLocked && styles.statusPillLocked,
                            ]}
                          >
                            <Text
                              style={[
                                styles.trailStatusPillText,
                                isCleared && styles.statusTextCleared,
                                isActive && styles.statusTextActive,
                                isLocked && styles.statusTextLocked,
                              ]}
                            >
                              {isCleared ? 'CLEARED' : isActive ? 'ACTIVE TARGET' : 'LOCKED'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.trailCardTitle,
                            {
                              color: isActive
                                ? theme?.accent?.gold || colors.accent.gold
                                : isCleared
                                  ? theme?.accent?.green || colors.accent.green
                                  : theme?.text?.muted || '#6C648A',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {waypointTitle}
                        </Text>

                        {isActive && (wp.clue || quest?.currentClue?.clue) ? (
                          <Text
                            style={[
                              styles.trailClueText,
                              { color: theme?.text?.secondary || colors.text.onDark.secondary },
                            ]}
                            numberOfLines={2}
                          >
                            💬 &ldquo;{wp.clue || quest.currentClue.clue}&rdquo;
                          </Text>
                        ) : null}

                        <View style={styles.trailCardFooter}>
                          <Text
                            style={[styles.trailPointsText, isActive && styles.trailPointsActive]}
                          >
                            +{wp.points || 0} XP
                          </Text>

                          {isActive ? (
                            <View
                              style={[
                                styles.trailActionBtn,
                                {
                                  backgroundColor: theme?.bg?.surface || '#272044',
                                  borderColor: theme?.accent?.gold || colors.accent.gold,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.trailActionBtnText,
                                  { color: theme?.accent?.gold || colors.accent.gold },
                                ]}
                              >
                                SCAN QR
                              </Text>
                              <MaterialCommunityIcons
                                name="arrow-right"
                                size={12}
                                color={theme?.accent?.gold || colors.accent.gold}
                              />
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </PixelCard>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Active Quest</Text>
            <Text style={styles.emptySubtitle}>
              The realm is currently peaceful. Check back soon for new campus events!
            </Text>
          </View>
        )}
      </ScrollView>
    </>
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
  header: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guideBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#272044',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  guideBadgeBtnText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.gold,
    letterSpacing: 0.5,
  },
  pixelTitle: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  pixelSubtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  announcementBanner: {
    backgroundColor: '#272044',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    borderRadius: 8,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  announcementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  announcementIcon: {
    fontSize: 16,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTag: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 2,
  },
  announcementText: {
    ...typography.bodyMd,
    color: colors.text.onDark.primary,
    fontSize: 12,
  },
  announcementDismiss: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  announcementDismissText: {
    color: colors.text.onDark.secondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  pointsCard: {
    borderRadius: 8,
    padding: spacing.cardPadding,
    gap: spacing.xs,
    alignItems: 'center',
  },
  pointsLabel: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  pointsValue: {
    ...typography.displayPixelLg,
    fontSize: 22,
    lineHeight: 30,
    color: colors.accent.gold,
    textAlign: 'center',
    marginVertical: 2,
  },
  badgeCentered: {
    alignItems: 'center',
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    ...typography.displayPixelSm,
    color: colors.bg.dusk,
  },
  questContainer: {
    gap: spacing.md,
  },
  questCard: {
    borderRadius: 8,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  questHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTag: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  questTagText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  questPoints: {
    ...typography.displayPixelXs,
    color: colors.text.onDark.secondary,
    fontSize: 8,
  },
  questName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  questDesc: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 20,
  },
  stationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: spacing.xs,
  },
  stationCounterBox: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stationCounterText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  timerBadge: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.4)',
  },
  timerBadgeText: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  clueCard: {
    borderRadius: 8,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  clueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  clueHeading: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    letterSpacing: 1.2,
    fontSize: 9,
  },
  clueStationBadge: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    fontSize: 8,
  },
  clueTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  clueBody: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    lineHeight: 22,
  },
  scanButton: {
    marginTop: spacing.xs,
  },
  roadmapCard: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#362E52',
    paddingBottom: 8,
    marginBottom: 4,
  },
  roadmapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roadmapTitle: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  roadmapProgressPill: {
    backgroundColor: '#161326',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#352D50',
  },
  roadmapSub: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.text.onDark.secondary,
  },
  dungeonTrailList: {
    paddingVertical: 4,
  },
  trailRow: {
    flexDirection: 'row',
    minHeight: 74,
    marginBottom: 6,
  },
  spineColumn: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  spineLine: {
    width: 2,
    flex: 1,
  },
  spineLineHidden: {
    opacity: 0,
  },
  spineLineCleared: {
    backgroundColor: colors.accent.green,
    width: 2,
  },
  spineLineActiveTrail: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.gold,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  spineLineInactive: {
    borderLeftWidth: 2,
    borderLeftColor: '#362E52',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  dungeonNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeActive: {
    backgroundColor: '#2A200B',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  nodeCleared: {
    backgroundColor: 'rgba(75, 181, 67, 0.2)',
    borderWidth: 1.5,
    borderColor: colors.accent.green,
  },
  nodeLocked: {
    backgroundColor: '#151224',
    borderWidth: 1,
    borderColor: '#352D50',
  },
  trailCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    borderWidth: 1,
  },
  trailCardActive: {
    borderWidth: 1.5,
  },
  trailCardCleared: {
    borderWidth: 1,
  },
  trailCardLocked: {
    opacity: 0.65,
  },
  trailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trailOrderBadge: {
    backgroundColor: '#120F22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trailOrderText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  trailStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
  },
  statusPillCleared: {
    borderColor: colors.accent.green,
    backgroundColor: 'rgba(75, 181, 67, 0.15)',
  },
  statusPillLocked: {
    borderColor: '#352D50',
    backgroundColor: '#131024',
  },
  trailStatusPillText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    letterSpacing: 0.8,
  },
  trailCardTitle: {
    ...typography.bodyMdBold,
    fontSize: 13,
    color: colors.text.onDark.primary,
  },
  cardTitleActive: {
    color: colors.accent.gold,
  },
  cardTitleCleared: {
    color: colors.text.onDark.secondary,
  },
  trailClueText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    fontStyle: 'italic',
    marginTop: 3,
  },
  trailCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  trailPointsText: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.text.onDark.secondary,
  },
  trailPointsActive: {
    color: colors.accent.gold,
  },
  trailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  trailActionBtnText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.gold,
  },
  statusTextActive: {
    color: colors.accent.gold,
  },
  statusTextCleared: {
    color: colors.accent.green,
  },
  statusTextLocked: {
    color: '#6A628B',
  },
  tourTargetGlow: {
    borderColor: colors.accent.gold,
    borderWidth: 2,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
});
