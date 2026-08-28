import { Tabs } from 'expo-router';
import RpgTabBar from '../../components/RpgTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <RpgTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
        name="profile"
        options={{
          title: 'Hero',
        }}
      />
    </Tabs>
  );
}
