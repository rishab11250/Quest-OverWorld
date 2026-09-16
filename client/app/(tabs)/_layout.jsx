import { Tabs } from 'expo-router';
import RpgTabBar from '../../components/RpgTabBar';
import { TourProvider } from '../../context/TourContext';
import { DrawerProvider } from '../../context/DrawerContext';
import InteractiveTourHUD from '../../components/InteractiveTourHUD';
import TourSelectModal from '../../components/TourSelectModal';
import RpgDrawer from '../../components/RpgDrawer';
import RadialActionMenu from '../../components/RadialActionMenu';
import { useTheme } from '../../context/ThemeContext';
import colors from '../../theme/colors';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <TourProvider>
      <DrawerProvider>
        <Tabs
          tabBar={(props) => <RpgTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: theme?.bg?.dusk || colors.bg.dusk },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Quest',
            }}
          />
          <Tabs.Screen
            name="map"
            options={{
              title: 'Atlas',
            }}
          />
          <Tabs.Screen
            name="team"
            options={{
              title: 'Party',
            }}
          />
          <Tabs.Screen
            name="challenges"
            options={{
              title: 'Bounty',
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Hall',
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Hero',
            }}
          />
        </Tabs>

        {/* Global Floating Action Diamond (#7) */}
        <RadialActionMenu />

        {/* Global RPG Adventurer Drawer (#6) */}
        <RpgDrawer />

        {/* Interactive Tour Overlays */}
        <InteractiveTourHUD />
        <TourSelectModal />
      </DrawerProvider>
    </TourProvider>
  );
}
