import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminBottomNav({ activeTab, onSelectTab, pendingCount }) {
  const tabs = [
    { key: 'overview', label: 'Metrics', icon: 'chart-box-outline' },
    { key: 'quests', label: 'Quests', icon: 'map-marker-path' },
    { key: 'bounties', label: 'Bounties', icon: 'trophy-outline' },
    { key: 'reviews', label: 'Queue', icon: 'clock-check-outline', badge: pendingCount },
    { key: 'profile', label: 'System', icon: 'tune-vertical' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.dockItem, isActive && styles.dockItemActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? colors.accent.gold : colors.text.onDark.secondary}
              />
              {tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.dockLabel, isActive && styles.dockLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1E1A33',
    borderTopWidth: 1.5,
    borderTopColor: '#3D3560',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 34,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  dockItemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.accent.gold,
    marginTop: -2,
  },
  iconContainer: {
    position: 'relative',
  },
  dockLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  dockLabelActive: {
    color: colors.accent.gold,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.accent.coral,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
