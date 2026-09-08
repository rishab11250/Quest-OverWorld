import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { setSetting } from '../lib/secureStore';
import { triggerHaptic } from '../lib/haptics';
import colors from '../theme/colors';

export const TOUR_PAGES_META = [
  {
    id: 'all',
    title: 'FULL OVERWORLD TOUR',
    subtitle: 'All 6 Realms in Sequence',
    icon: 'star-shooting',
    color: colors.accent.gold,
    route: '/(tabs)/home',
  },
  {
    id: 'home',
    title: 'QUEST HUB',
    subtitle: 'Party XP, Active Quest & Stations',
    icon: 'shield-sword',
    color: colors.accent.gold,
    route: '/(tabs)/home',
  },
  {
    id: 'map',
    title: 'OVERWORLD ATLAS',
    subtitle: 'GPS Radar, Station Pins & Controls',
    icon: 'map-legend',
    color: colors.accent.cyan,
    route: '/(tabs)/map',
  },
  {
    id: 'challenges',
    title: 'BOUNTY BOARD',
    subtitle: 'Daily Quests, Milestones & Rewards',
    icon: 'calendar-star',
    color: colors.accent.purple,
    route: '/(tabs)/challenges',
  },
  {
    id: 'team',
    title: 'GUILD PARTY',
    subtitle: 'Squad Code, Co-op Sync & Roster',
    icon: 'account-group',
    color: colors.accent.green,
    route: '/(tabs)/team',
  },
  {
    id: 'leaderboard',
    title: 'HALL OF FAME',
    subtitle: 'Solo Rankings, Squads & Podium',
    icon: 'trophy-award',
    color: colors.accent.gold,
    route: '/(tabs)/leaderboard',
  },
  {
    id: 'profile',
    title: 'HERO CODEX',
    subtitle: 'Adventurer Stats, Settings & Security',
    icon: 'account-cog',
    color: colors.accent.purple,
    route: '/(tabs)/profile',
  },
];

export const PAGE_STEPS = {
  home: [
    {
      id: 'home_xp_box',
      pageId: 'home',
      pageTitle: 'QUEST HUB',
      tabName: 'Quest',
      route: '/(tabs)/home',
      targetKey: 'home_xp_box',
      hudPosition: 'bottom',
      sectionName: 'PARTY XP & LEVEL PROGRESSION',
      sectionIcon: 'crown',
      iconColor: colors.accent.gold,
      locationHint: 'Top gold banner displaying party score & level badge',
      use: "Tracks your party's cumulative XP and current adventurer level. Every station check-in and bounty completion awards points here.",
      proTip:
        'Leveling up increases your global rank in the Hall of Fame and unlocks exclusive guild badges!',
    },
    {
      id: 'home_quest_box',
      pageId: 'home',
      pageTitle: 'QUEST HUB',
      tabName: 'Quest',
      route: '/(tabs)/home',
      targetKey: 'home_quest_box',
      hudPosition: 'bottom',
      sectionName: 'ACTIVE REALM QUEST',
      sectionIcon: 'compass-outline',
      iconColor: colors.accent.cyan,
      locationHint: 'Main event banner showing quest title, station counter & timer',
      use: 'Displays your current campus expedition, total quest points, current station counter, and remaining time before the quest event concludes.',
      proTip: 'Keep an eye on the countdown badge—it pulses amber when under 1 hour remains!',
    },
    {
      id: 'home_station_clue',
      pageId: 'home',
      pageTitle: 'QUEST HUB',
      tabName: 'Quest',
      route: '/(tabs)/home',
      targetKey: 'home_station_clue',
      hudPosition: 'top',
      sectionName: 'STATION CLUE & QR SCANNER',
      sectionIcon: 'qrcode-scan',
      iconColor: colors.accent.gold,
      locationHint: 'Station clue box with "Scan Station QR Code" button',
      use: 'Reveals cryptic campus riddles pointing to your next physical checkpoint. Tap the gold scan button to open camera radar and verify your arrival.',
      proTip:
        'Scans work 100% offline! If connectivity drops, verifications are encrypted locally and auto-sync when online.',
    },
    {
      id: 'home_waypoints_card',
      pageId: 'home',
      pageTitle: 'QUEST HUB',
      tabName: 'Quest',
      route: '/(tabs)/home',
      targetKey: 'home_waypoints_card',
      hudPosition: 'top',
      sectionName: 'EXPEDITION WAYPOINTS ROADMAP',
      sectionIcon: 'flag-checkered',
      iconColor: colors.accent.green,
      locationHint: 'Bottom card showing full list of station checkpoints',
      use: 'Complete roadmap of all waypoint stations in this quest. Displays cleared waypoints, your active target, and locked upcoming stations.',
      proTip:
        'Waypoints must be cleared sequentially. Check the Overworld Atlas to see their locations on the GPS map.',
    },
  ],

  map: [
    {
      id: 'map_view',
      pageId: 'map',
      pageTitle: 'OVERWORLD ATLAS',
      tabName: 'Atlas',
      route: '/(tabs)/map',
      targetKey: 'map_view',
      hudPosition: 'bottom',
      sectionName: 'INTERACTIVE GPS RADAR MAP',
      sectionIcon: 'crosshairs-gps',
      iconColor: colors.accent.cyan,
      locationHint: 'Main interactive radar grid in the center of the screen',
      use: 'Real-time GPS radar plotting all campus waypoint stations and your live location pin. Drag with your fingers in any direction to explore the map.',
      proTip:
        'The compass dial in the top header continuously rotates to point directly toward your active target station!',
    },
    {
      id: 'map_pins',
      pageId: 'map',
      pageTitle: 'OVERWORLD ATLAS',
      tabName: 'Atlas',
      route: '/(tabs)/map',
      targetKey: 'map_pins',
      hudPosition: 'bottom',
      sectionName: 'WAYPOINT STATION BEACONS',
      sectionIcon: 'map-marker-radius',
      iconColor: colors.accent.gold,
      locationHint: 'Pulsing circular station beacons placed across the map',
      use: 'Green markers represent cleared stations, pulsing gold pins indicate your active target, and locked pins mark upcoming stations.',
      proTip:
        'Tap any station pin on the map to preview its name, point reward, and exact distance from your current coordinates.',
    },
    {
      id: 'map_controls',
      pageId: 'map',
      pageTitle: 'OVERWORLD ATLAS',
      tabName: 'Atlas',
      route: '/(tabs)/map',
      targetKey: 'map_controls',
      hudPosition: 'top',
      sectionName: 'RADAR CONTROLS & QUICK ACTIONS',
      sectionIcon: 'gesture-tap-button',
      iconColor: colors.accent.purple,
      locationHint: 'Recenter GPS button, zoom controls, and action cards below the map',
      use: 'Tap "Recenter GPS" to instantly snap the radar view back onto your coordinates. Use "+" and "−" to zoom, or tap "Hunt Side Bounties" for extra challenges.',
      proTip: 'If GPS drift occurs, tap "Recenter GPS" to re-calibrate sub-meter precision.',
    },
  ],

  challenges: [
    {
      id: 'bounty_tabs',
      pageId: 'challenges',
      pageTitle: 'BOUNTY BOARD',
      tabName: 'Bounties',
      route: '/(tabs)/challenges',
      targetKey: 'bounty_tabs',
      hudPosition: 'bottom',
      sectionName: 'DAILY BOUNTIES VS MILESTONES',
      sectionIcon: 'calendar-today',
      iconColor: colors.accent.gold,
      locationHint: 'Top tab switcher (Daily Bounties / Milestones)',
      use: 'Switch between 24-hour speed challenges that reset daily at midnight, and long-term milestones for epic XP and unique titles.',
      proTip:
        'Daily bounties give bonus points on top of your main quest—clear them before they expire!',
    },
    {
      id: 'bounty_cards',
      pageId: 'challenges',
      pageTitle: 'BOUNTY BOARD',
      tabName: 'Bounties',
      route: '/(tabs)/challenges',
      targetKey: 'bounty_cards',
      hudPosition: 'bottom',
      sectionName: 'BOUNTY MISSION OBJECTIVES',
      sectionIcon: 'sword-cross',
      iconColor: colors.accent.cyan,
      locationHint: 'List of bounty mission cards with point badges',
      use: 'Shows challenge objectives, requirements, and cryptic hints for bonus stations hidden across campus.',
      proTip:
        'Some secret bounties only reveal their location when your squad is within 50 meters of the secret spot.',
    },
    {
      id: 'bounty_claim',
      pageId: 'challenges',
      pageTitle: 'BOUNTY BOARD',
      tabName: 'Bounties',
      route: '/(tabs)/challenges',
      targetKey: 'bounty_claim',
      hudPosition: 'top',
      sectionName: 'CLAIM REWARDS & MEDALS',
      sectionIcon: 'gift-outline',
      iconColor: colors.accent.green,
      locationHint: 'Gold "Claim Reward" buttons on completed challenges',
      use: 'Tap to collect earned XP points and unlockable medals when your party completes challenge conditions.',
      proTip:
        "Claimed bounty points contribute directly toward your team's standing on the global leaderboard.",
    },
  ],

  team: [
    {
      id: 'team_banner',
      pageId: 'team',
      pageTitle: 'GUILD PARTY',
      tabName: 'Party',
      route: '/(tabs)/team',
      targetKey: 'team_banner',
      hudPosition: 'bottom',
      sectionName: 'SQUAD CODE & GUILD STATUS',
      sectionIcon: 'shield-account',
      iconColor: colors.accent.green,
      locationHint: 'Top party card displaying squad name & join code',
      use: 'Displays your squad name, combined score, and 6-character party join code. Share this code with friends so they can join your squad.',
      proTip:
        'Tap the share button to copy your squad code directly to your clipboard or WhatsApp.',
    },
    {
      id: 'team_actions',
      pageId: 'team',
      pageTitle: 'GUILD PARTY',
      tabName: 'Party',
      route: '/(tabs)/team',
      targetKey: 'team_actions',
      hudPosition: 'top',
      sectionName: 'CREATE OR JOIN PARTY',
      sectionIcon: 'account-plus',
      iconColor: colors.accent.gold,
      locationHint: 'Action buttons for establishing or joining a party',
      use: 'Create a new adventuring squad or enter an invite code from a classmate to combine forces on quests.',
      proTip: 'Parties can have up to 4 adventurers working cooperatively in real time.',
    },
    {
      id: 'team_roster',
      pageId: 'team',
      pageTitle: 'GUILD PARTY',
      tabName: 'Party',
      route: '/(tabs)/team',
      targetKey: 'team_roster',
      hudPosition: 'top',
      sectionName: 'MEMBER ROSTER & CO-OP SYNC',
      sectionIcon: 'account-multiple-check',
      iconColor: colors.accent.purple,
      locationHint: 'Roster list showing all party members and roles',
      use: 'Inspect teammate levels, roles (Leader vs Adventurer), and contributions. When any member scans a waypoint, the entire party gets credit!',
      proTip: 'Squad leaders have authority to transfer leadership or remove inactive members.',
    },
  ],

  leaderboard: [
    {
      id: 'leaderboard_tabs',
      pageId: 'leaderboard',
      pageTitle: 'HALL OF FAME',
      tabName: 'Hall',
      route: '/(tabs)/leaderboard',
      targetKey: 'leaderboard_tabs',
      hudPosition: 'bottom',
      sectionName: 'SOLO VS GUILD RANKINGS',
      sectionIcon: 'podium',
      iconColor: colors.accent.gold,
      locationHint: 'Top tab switcher (Solo Adventurers / Guild Squads)',
      use: 'Toggle between individual player rankings across campus and cooperative squad rankings based on cumulative party points.',
      proTip:
        'Squad rankings update in real time as your party completes bounties and quest waypoints.',
    },
    {
      id: 'leaderboard_podium',
      pageId: 'leaderboard',
      pageTitle: 'HALL OF FAME',
      tabName: 'Hall',
      route: '/(tabs)/leaderboard',
      targetKey: 'leaderboard_podium',
      hudPosition: 'bottom',
      sectionName: 'TOP 3 CHAMPIONS PODIUM',
      sectionIcon: 'podium-gold',
      iconColor: colors.accent.gold,
      locationHint: 'Gold, silver, and bronze champion cards at the top',
      use: 'Honors the top 3 highest scoring adventurers on campus with custom framed avatar podium badges.',
      proTip:
        'Podium champions unlock exclusive title tags in their Hero Codex at the end of each season.',
    },
    {
      id: 'leaderboard_list',
      pageId: 'leaderboard',
      pageTitle: 'HALL OF FAME',
      tabName: 'Hall',
      route: '/(tabs)/leaderboard',
      targetKey: 'leaderboard_list',
      hudPosition: 'top',
      sectionName: 'GLOBAL STANDINGS & MY RANK',
      sectionIcon: 'format-list-numbered',
      iconColor: colors.accent.cyan,
      locationHint: 'Ranked list of players and search bar',
      use: 'Shows competitor rankings, points, and stations cleared. Quickly jump to your exact rank to see where you stand.',
      proTip: 'Standings sync every 15 seconds when Live Polling is enabled in settings.',
    },
  ],

  profile: [
    {
      id: 'profile_hero',
      pageId: 'profile',
      pageTitle: 'HERO CODEX',
      tabName: 'Hero',
      route: '/(tabs)/profile',
      targetKey: 'profile_hero',
      hudPosition: 'bottom',
      sectionName: 'HERO IDENTITY & AVATAR',
      sectionIcon: 'card-account-details-outline',
      iconColor: colors.accent.gold,
      locationHint: 'Top profile card with avatar crest and player statistics',
      use: 'Displays your username, adventurer title, level, total XP, and account created date. Tap "Edit Hero" to change your avatar and handle.',
      proTip:
        'Higher levels unlock legendary crests like Phoenix Crown, Void Skull, and Dragon Shield.',
    },
    {
      id: 'profile_settings',
      pageId: 'profile',
      pageTitle: 'HERO CODEX',
      tabName: 'Hero',
      route: '/(tabs)/profile',
      targetKey: 'profile_settings',
      hudPosition: 'top',
      sectionName: 'EXPEDITION SETTINGS & TOUR',
      sectionIcon: 'tune-vertical',
      iconColor: colors.accent.cyan,
      locationHint: 'Settings card with toggle switches and "START TOUR" button',
      use: 'Adjust High-Precision GPS, Auto-Flashlight for night scanning, and Haptic Feedback. Tap "START TOUR" to launch walkthroughs for any page.',
      proTip:
        'Use "Flush Local Cache" if you ever need to force an immediate re-sync with game servers.',
    },
    {
      id: 'profile_realm',
      pageId: 'profile',
      pageTitle: 'HERO CODEX',
      tabName: 'Hero',
      route: '/(tabs)/profile',
      targetKey: 'profile_realm',
      hudPosition: 'top',
      sectionName: 'REALM SECURITY & SIGN OUT',
      sectionIcon: 'shield-lock-outline',
      iconColor: colors.accent.purple,
      locationHint: 'Bottom card showing session status and sign out button',
      use: 'Inspects your active session security and offline synchronization state. Tap "Sign Out" to safely exit your session.',
      proTip:
        'Your progress, points, and badges are securely stored in the cloud and instantly restored when you log back in.',
    },
  ],
};

// Build flat array of all steps for the full tour
export const ALL_STEPS = [
  ...PAGE_STEPS.home,
  ...PAGE_STEPS.map,
  ...PAGE_STEPS.challenges,
  ...PAGE_STEPS.team,
  ...PAGE_STEPS.leaderboard,
  ...PAGE_STEPS.profile,
];

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const router = useRouter();
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourMode, setTourMode] = useState('all'); // 'all' | pageId
  const [currentStep, setCurrentStep] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Active steps based on mode
  const activeSteps = tourMode === 'all' ? ALL_STEPS : PAGE_STEPS[tourMode] || PAGE_STEPS.home;
  const currentStepData = activeSteps[currentStep] || activeSteps[0];
  const activeTourTarget = isTourActive ? currentStepData?.targetKey : null;

  const openTourSelector = useCallback(() => {
    triggerHaptic('selection');
    setSelectorVisible(true);
  }, []);

  const closeTourSelector = useCallback(() => {
    setSelectorVisible(false);
  }, []);

  const startTour = useCallback(
    (mode = 'all') => {
      triggerHaptic('medium');
      setSelectorVisible(false);
      setTourMode(mode);
      setCurrentStep(0);
      setIsCollapsed(false);
      setIsTourActive(true);

      const steps = mode === 'all' ? ALL_STEPS : PAGE_STEPS[mode] || PAGE_STEPS.home;
      if (steps[0]?.route) {
        router.replace(steps[0].route);
      }
    },
    [router]
  );

  const goToStep = useCallback(
    (stepIndex) => {
      if (stepIndex >= 0 && stepIndex < activeSteps.length) {
        triggerHaptic('selection');
        setCurrentStep(stepIndex);
        const targetRoute = activeSteps[stepIndex].route;
        if (targetRoute) router.replace(targetRoute);
      }
    },
    [activeSteps, router]
  );

  const nextStep = useCallback(() => {
    if (currentStep < activeSteps.length - 1) {
      triggerHaptic('selection');
      const next = currentStep + 1;
      setCurrentStep(next);
      const targetRoute = activeSteps[next].route;
      const currentRoute = activeSteps[currentStep].route;
      if (targetRoute && targetRoute !== currentRoute) {
        router.replace(targetRoute);
      }
    } else {
      triggerHaptic('success');
      setIsTourActive(false);
      setSetting('has_seen_guide', true);
    }
  }, [currentStep, activeSteps, router]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      triggerHaptic('selection');
      const prev = currentStep - 1;
      setCurrentStep(prev);
      const targetRoute = activeSteps[prev].route;
      const currentRoute = activeSteps[currentStep].route;
      if (targetRoute && targetRoute !== currentRoute) {
        router.replace(targetRoute);
      }
    }
  }, [currentStep, activeSteps, router]);

  const exitTour = useCallback(() => {
    triggerHaptic('light');
    setIsTourActive(false);
    setSetting('has_seen_guide', true);
  }, []);

  const toggleCollapse = useCallback(() => {
    triggerHaptic('light');
    setIsCollapsed((prev) => !prev);
  }, []);

  const value = {
    isTourActive,
    tourMode,
    currentStep,
    isCollapsed,
    selectorVisible,
    currentStepData,
    activeTourTarget,
    totalSteps: activeSteps.length,
    openTourSelector,
    closeTourSelector,
    startTour,
    nextStep,
    prevStep,
    goToStep,
    exitTour,
    toggleCollapse,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}
