import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminHeader({ adminProfile, onLogout }) {
  return (
    <View style={styles.headerContainer}>
      {/* Top Operations App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBrand}>
          <View style={styles.avatarBadge}>
            <MaterialCommunityIcons name="shield-crown" size={24} color={colors.accent.gold} />
          </View>
          <View>
            <Text style={styles.topAppTitle}>OVERWORLD OPS</Text>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlinePillText}>LIVE EVENT CONTROLLER</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.adminLogoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={16} color={colors.accent.coral} />
          <Text style={styles.adminLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Profile Identity Strip */}
      <View style={styles.profileStrip}>
        <View style={styles.profileInfo}>
          <Text style={styles.adminName}>{adminProfile?.name || 'Guild Master Admin'}</Text>
          <Text style={styles.adminEmail}>{adminProfile?.email || 'admin@overworld.com'}</Text>
        </View>
        <View style={styles.roleChip}>
          <MaterialCommunityIcons name="crown" size={14} color={colors.accent.gold} />
          <Text style={styles.roleChipText}>
            {(adminProfile?.role || 'Guild Master Admin').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    gap: spacing.sm,
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  topAppBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAppTitle: {
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.text.onDark.primary,
    letterSpacing: 1,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },
  onlinePillText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.green,
    fontSize: 9,
    letterSpacing: 1,
  },
  adminLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adminLogoutText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.coral,
  },
  profileStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  profileInfo: {
    gap: 2,
  },
  adminName: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  adminEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleChipText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    fontSize: 10,
  },
});
