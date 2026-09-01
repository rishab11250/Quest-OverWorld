import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ProfileHeroCard({ user, team, onOpenEdit }) {
  const router = useRouter();
  const initial = (user?.name || user?.username || 'A').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Hero Avatar & Identity Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarGlow}>
          {user?.avatar ? (
            <MaterialCommunityIcons name={user.avatar} size={28} color={colors.accent.gold} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{user?.name || 'Adventurer'}</Text>
            <TouchableOpacity
              style={styles.editHeroBtn}
              onPress={onOpenEdit}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.accent.gold} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEmail}>{user?.email || 'hero@overworld.realm'}</Text>

          {team ? (
            <View style={styles.partyBadge}>
              <Text style={styles.partyBadgeText}>
                {team.name.toUpperCase()} • LVL {Math.floor((team.score || 0) / 250) + 1}
              </Text>
            </View>
          ) : (
            <View style={[styles.partyBadge, styles.soloBadge]}>
              <Text style={[styles.partyBadgeText, styles.soloBadgeText]}>LONE ADVENTURER</Text>
            </View>
          )}
        </View>
      </View>

      {/* Admin Panel Quick Entry if authorized */}
      {user?.isAdmin || user?.role === 'admin' ? (
        <TouchableOpacity
          style={styles.adminEntryCard}
          onPress={() => router.push('/admin/dashboard')}
          activeOpacity={0.8}
        >
          <View style={styles.adminEntryLeft}>
            <MaterialCommunityIcons name="shield-crown" size={24} color={colors.accent.gold} />
            <View>
              <Text style={styles.adminEntryTitle}>Guild Master Console</Text>
              <Text style={styles.adminEntrySub}>Manage Quests, Checkpoints & Bounties</Text>
            </View>
          </View>
          <Text style={styles.adminEntryArrow}>›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.md,
  },
  avatarGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2247',
    borderWidth: 2,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
    fontSize: 22,
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  editHeroBtn: {
    padding: 4,
    backgroundColor: '#2A2247',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  heroEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  partyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  partyBadgeText: {
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 9,
  },
  soloBadge: {
    backgroundColor: 'rgba(126, 117, 160, 0.15)',
    borderColor: '#4A3E70',
  },
  soloBadgeText: {
    color: colors.text.onDark.secondary,
  },
  adminEntryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#281E10',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    padding: 12,
  },
  adminEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminEntryTitle: {
    ...typography.bodyMdBold,
    color: colors.accent.gold,
    fontSize: 13,
  },
  adminEntrySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
  },
  adminEntryArrow: {
    fontSize: 20,
    color: colors.accent.gold,
    fontWeight: '800',
  },
});
