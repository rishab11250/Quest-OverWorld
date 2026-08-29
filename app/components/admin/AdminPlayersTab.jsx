import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import PixelCard from '../PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export default function AdminPlayersTab({
  players = [],
  onUpdateStatus,
  onToggleRole,
  onKickPlayer,
  onOpenBanModal,
  loading = false,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, BANNED, ADMINS

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.team?.name && p.team.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return p.status === 'active' && !p.isBanned;
    if (filter === 'BANNED') return p.isBanned || p.status === 'banned';
    if (filter === 'ADMINS') return p.isAdmin;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ADVENTURER ROSTER</Text>
        <Text style={styles.subtitle}>Manage campus player privileges, teams, and penalties</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color="#7E75A0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or party..."
          placeholderTextColor="#7E75A0"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#7E75A0" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['ALL', 'ACTIVE', 'BANNED', 'ADMINS'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => {
              triggerHaptic('light');
              setFilter(f);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f} ({players.filter((p) => {
                if (f === 'ACTIVE') return p.status === 'active' && !p.isBanned;
                if (f === 'BANNED') return p.isBanned || p.status === 'banned';
                if (f === 'ADMINS') return p.isAdmin;
                return true;
              }).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Player List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Reading Realm Scrolls...</Text>
        </View>
      ) : filteredPlayers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Adventurers Found</Text>
          <Text style={styles.emptySub}>No players match your search filter criteria.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredPlayers.map((player) => {
            const isBanned = player.isBanned || player.status === 'banned';

            return (
              <PixelCard
                key={player._id}
                variant={isBanned ? 'coral' : player.isAdmin ? 'gold' : 'dusk'}
                style={styles.playerCard}
              >
                {/* Top Row: Avatar + Name + Status */}
                <View style={styles.playerTop}>
                  <View style={[styles.avatarBox, isBanned && styles.avatarBanned]}>
                    <Text style={styles.avatarLetter}>
                      {(player.name || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      {player.isAdmin ? (
                        <View style={styles.adminTag}>
                          <Text style={styles.adminTagText}>ADMIN</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.playerEmail}>{player.email}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isBanned ? styles.badgeBanned : styles.badgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isBanned ? styles.badgeTextBanned : styles.badgeTextActive,
                      ]}
                    >
                      {isBanned ? 'BANNED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                {/* Team & Points telemetry */}
                <View style={styles.telemetryRow}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>GUILD PARTY</Text>
                    <Text style={styles.telemetryVal}>
                      {player.team ? `${player.team.name} ${player.team.isLeader ? '👑' : ''}` : 'No Party'}
                    </Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>PARTY SCORE</Text>
                    <Text style={styles.telemetryVal}>
                      +{player.team?.score || 0} PTS
                    </Text>
                  </View>
                </View>

                {/* Ban Reason Banner if Banned */}
                {isBanned && player.banReason ? (
                  <View style={styles.banReasonBox}>
                    <MaterialCommunityIcons name="alert-octagon" size={14} color={colors.accent.coral} />
                    <Text style={styles.banReasonText}>Reason: {player.banReason}</Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {isBanned ? (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnUnban]}
                      onPress={() => {
                        triggerHaptic('success');
                        onUpdateStatus(player._id, 'active');
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="lock-open-outline" size={13} color={colors.accent.green} />
                      <Text style={styles.btnUnbanText}>UNBAN PLAYER</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnBan]}
                      onPress={() => {
                        triggerHaptic('warning');
                        onOpenBanModal(player);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="gavel" size={13} color={colors.accent.coral} />
                      <Text style={styles.btnBanText}>BAN PLAYER</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.btn, styles.btnRole]}
                    onPress={() => {
                      triggerHaptic('medium');
                      onToggleRole(player._id, !player.isAdmin);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={player.isAdmin ? 'shield-remove-outline' : 'shield-crown-outline'}
                      size={13}
                      color={colors.accent.gold}
                    />
                    <Text style={styles.btnRoleText}>
                      {player.isAdmin ? 'REVOKE ADMIN' : 'MAKE ADMIN'}
                    </Text>
                  </TouchableOpacity>

                  {player.team ? (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnKick]}
                      onPress={() => {
                        triggerHaptic('warning');
                        Alert.alert(
                          'Kick from Party',
                          `Remove ${player.name} from party "${player.team.name}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Kick',
                              style: 'destructive',
                              onPress: () => onKickPlayer(player._id),
                            },
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="account-remove" size={13} color="#9E94B8" />
                      <Text style={styles.btnKickText}>KICK</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </PixelCard>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    ...typography.displayPixelXs,
    fontSize: 10,
    color: colors.accent.gold,
    letterSpacing: 1.5,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.text.onDark.primary,
    ...typography.bodyMd,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#362E52',
  },
  filterChipActive: {
    borderColor: colors.accent.gold,
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
  },
  filterChipText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.text.onDark.secondary,
  },
  filterChipTextActive: {
    color: colors.accent.gold,
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    padding: spacing.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    ...typography.headingMd,
    color: colors.text.onDark.primary,
  },
  emptySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  playerCard: {
    backgroundColor: colors.bg.duskRaised,
    gap: spacing.sm,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#272044',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBanned: {
    borderColor: colors.accent.coral,
    backgroundColor: 'rgba(232, 102, 75, 0.2)',
  },
  avatarLetter: {
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13,
  },
  adminTag: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  adminTagText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.accent.gold,
  },
  playerEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(62, 207, 142, 0.15)',
    borderColor: colors.accent.green,
  },
  badgeBanned: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderColor: colors.accent.coral,
  },
  statusBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
  },
  badgeTextActive: {
    color: colors.accent.green,
  },
  badgeTextBanned: {
    color: colors.accent.coral,
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1A33',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryLabel: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
    letterSpacing: 0.8,
  },
  telemetryVal: {
    ...typography.bodyMdBold,
    color: colors.accent.gold,
    fontSize: 11,
    marginTop: 2,
  },
  banReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.4)',
    gap: 6,
  },
  banReasonText: {
    ...typography.caption,
    color: colors.accent.coral,
    fontSize: 10,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#362E52',
    paddingTop: 8,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  btnBan: {
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    borderColor: colors.accent.coral,
    flex: 1.2,
  },
  btnBanText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.coral,
  },
  btnUnban: {
    backgroundColor: 'rgba(62, 207, 142, 0.12)',
    borderColor: colors.accent.green,
    flex: 1.2,
  },
  btnUnbanText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.green,
  },
  btnRole: {
    backgroundColor: 'rgba(242, 200, 75, 0.1)',
    borderColor: colors.accent.gold,
    flex: 1.4,
  },
  btnRoleText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
  },
  btnKick: {
    backgroundColor: '#1E1A33',
    borderColor: '#4E456B',
    paddingHorizontal: 8,
  },
  btnKickText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: '#9E94B8',
  },
});
