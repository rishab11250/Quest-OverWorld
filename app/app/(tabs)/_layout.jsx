import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#2A2447',
          borderTopColor: '#3D3560',
        },
        tabBarActiveTintColor: '#F2C84B',
        tabBarInactiveTintColor: '#C9C3DD',
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
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rank',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
