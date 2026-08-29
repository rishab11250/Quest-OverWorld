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
  teams = [],
  onUpdateStatus,
  onToggleRole,
  onKickPlayer,
  onOpenBanModal,
  onUpdateTeamStatus,
  onOpenBanTeamModal,
  onDeleteTeam,
  loading = false,
}) {
  const [sectionMode, setSectionMode] = useState('GUILDS'); // 'GUILDS' or 'PLAYERS'
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, BANNED

  // Filtered Players
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

  // Filtered Guilds / Teams
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.code && t.code.toLowerCase().includes(search.toLowerCase())) ||
      (t.leader?.name && t.leader.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return t.status === 'active' && !t.isBanned;
    if (filter === 'BANNED') return t.isBanned || t.status === 'banned';
    return true;
  });

  const handleConfirmDisband = (team) => {
    Alert.alert(
      'Disband Guild Party',
      `Are you sure you want to completely disband "${team.name}"? All ${team.members?.length || 0} members will be unlinked from this party.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disband Guild',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            onDeleteTeam(team._id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>GUILD & ROSTER CONTROLLER</Text>
        <Text style={styles.subtitle}>Manage campus parties, player privileges, and penalty bans</Text>
      </View>

      {/* Section Mode Switcher: GUILDS vs ADVENTURERS */}
      <View style={styles.sectionModeRow}>
        <TouchableOpacity
          style={[styles.sectionModeBtn, sectionMode === 'GUILDS' && styles.sectionModeBtnActive]}
          onPress={() => {
            triggerHaptic('selection');
            setSectionMode('GUILDS');
            setFilter('ALL');
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="shield-account"
            size={16}
            color={sectionMode === 'GUILDS' ? colors.bg.dusk : colors.accent.gold}
          />
          <Text
            style={[
              styles.sectionModeText,
              sectionMode === 'GUILDS' && styles.sectionModeTextActive,
            ]}
          >
            GUILDS ({teams.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionModeBtn, sectionMode === 'PLAYERS' && styles.sectionModeBtnActive]}
          onPress={() => {
            triggerHaptic('selection');
            setSectionMode('PLAYERS');
            setFilter('ALL');
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-multiple"
            size={16}
            color={sectionMode === 'PLAYERS' ? colors.bg.dusk : colors.accent.gold}
          />
          <Text
            style={[
              styles.sectionModeText,
              sectionMode === 'PLAYERS' && styles.sectionModeTextActive,
            ]}
          >
            ADVENTURERS ({players.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color="#7E75A0" />
        <TextInput
          style={styles.searchInput}
          placeholder={
            sectionMode === 'GUILDS'
              ? 'Search by guild name, party code, or leader...'
              : 'Search by player name, email, or party...'
          }
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
        {(sectionMode === 'GUILDS' ? ['ALL', 'ACTIVE', 'BANNED'] : ['ALL', 'ACTIVE', 'BANNED', 'ADMINS']).map(
          (f) => (
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
                {f} (
                {sectionMode === 'GUILDS'
                  ? teams.filter((t) => {
                      if (f === 'ACTIVE') return t.status === 'active' && !t.isBanned;
                      if (f === 'BANNED') return t.isBanned || t.status === 'banned';
                      return true;
                    }).length
                  : players.filter((p) => {
                      if (f === 'ACTIVE') return p.status === 'active' && !p.isBanned;
                      if (f === 'BANNED') return p.isBanned || p.status === 'banned';
                      if (f === 'ADMINS') return p.isAdmin;
                      return true;
                    }).length}
                )
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Reading Realm Scrolls...</Text>
        </View>
      ) : sectionMode === 'GUILDS' ? (
        /* ================= GUILDS / TEAMS LIST ================= */
        filteredTeams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Guild Parties Found</Text>
            <Text style={styles.emptySub}>No active or registered guilds match your filter.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredTeams.map((team) => {
              const isBanned = team.isBanned || team.status === 'banned';

              return (
                <PixelCard
                  key={team._id}
                  variant={isBanned ? 'coral' : 'gold'}
                  style={styles.guildCard}
                >
                  {/* Top Row: Guild Name + Code + Status */}
                  <View style={styles.guildTopRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons
                          name="shield-sword"
                          size={18}
                          color={isBanned ? colors.accent.coral : colors.accent.gold}
                        />
                        <Text style={styles.guildTitle}>{team.name}</Text>
                      </View>
                      <Text style={styles.guildCode}>PARTY CODE: #{team.code}</Text>
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

                  {/* Telemetry Row */}
                  <View style={styles.telemetryRow}>
                    <View style={styles.telemetryItem}>
                      <Text style={styles.telemetryLabel}>LEADER</Text>
                      <Text style={styles.telemetryVal}>
                        👑 {team.leader?.name || 'Unassigned'}
                      </Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={styles.telemetryLabel}>EXPEDITION XP</Text>
                      <Text style={[styles.telemetryVal, { color: colors.accent.green }]}>
                        {team.score || 0} PTS
                      </Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={styles.telemetryLabel}>PARTY SIZE</Text>
                      <Text style={styles.telemetryVal}>
                        {team.members?.length || 0} Members
                      </Text>
                    </View>
                  </View>

                  {/* Active Quest */}
                  {team.questId ? (
                    <View style={styles.guildQuestRow}>
                      <Text style={styles.guildQuestLabel}>ACTIVE EXPEDITION:</Text>
                      <Text style={styles.guildQuestName} numberOfLines={1}>
                        🗺️ {team.questId.name || 'Campus Realm Quest'}
                      </Text>
                    </View>
                  ) : null}

                  {/* Member Chips */}
                  {team.members && team.members.length > 0 ? (
                    <View style={styles.memberChipsRow}>
                      {team.members.map((m) => (
                        <View key={m._id} style={styles.memberChip}>
                          <Text style={styles.memberChipText}>
                            {m._id === team.leader?._id ? '👑 ' : ''}
                            {m.name || m.email}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Ban Notice */}
                  {isBanned && team.banReason ? (
                    <View style={styles.banNoticeBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.accent.coral} />
                      <Text style={styles.banNoticeText}>Reason: {team.banReason}</Text>
                    </View>
                  ) : null}

                  {/* Guild Actions: Ban / Unban & Disband */}
                  <View style={styles.guildActionRow}>
                    {isBanned ? (
                      <TouchableOpacity
                        style={styles.unbanBtn}
                        onPress={() => {
                          triggerHaptic('medium');
                          onUpdateTeamStatus(team._id, 'active');
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="lock-open-outline" size={14} color="#FFF" />
                        <Text style={styles.unbanBtnText}>Unban Guild</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.banBtn}
                        onPress={() => {
                          triggerHaptic('light');
                          onOpenBanTeamModal(team);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="cancel" size={14} color={colors.accent.coral} />
                        <Text style={styles.banBtnText}>Ban Guild</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.disbandBtn}
                      onPress={() => handleConfirmDisband(team)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color={colors.accent.coral} />
                      <Text style={styles.disbandBtnText}>Disband Party</Text>
                    </TouchableOpacity>
                  </View>
                </PixelCard>
              );
            })}
          </View>
        )
      ) : (
        /* ================= ADVENTURERS / PLAYERS LIST ================= */
        filteredPlayers.length === 0 ? (
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
                      <Text style={styles.telemetryLabel}>TOTAL XP</Text>
                      <Text style={[styles.telemetryVal, { color: colors.accent.green }]}>
                        {player.score || 0} PTS
                      </Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={styles.telemetryLabel}>ACCOUNT ROLE</Text>
                      <Text style={styles.telemetryVal}>
                        {player.isAdmin ? 'Guild Master' : 'Adventurer'}
                      </Text>
                    </View>
                  </View>

                  {/* Ban Notice */}
                  {isBanned && player.banReason ? (
                    <View style={styles.banNoticeBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.accent.coral} />
                      <Text style={styles.banNoticeText}>Reason: {player.banReason}</Text>
                    </View>
                  ) : null}

                  {/* Actions Row */}
                  <View style={styles.actionRow}>
                    {isBanned ? (
                      <TouchableOpacity
                        style={styles.unbanBtn}
                        onPress={() => {
                          triggerHaptic('medium');
                          onUpdateStatus(player._id, 'active');
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="lock-open-outline" size={14} color="#FFF" />
                        <Text style={styles.unbanBtnText}>Unban Player</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.banBtn}
                        onPress={() => {
                          triggerHaptic('light');
                          onOpenBanModal(player);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="cancel" size={14} color={colors.accent.coral} />
                        <Text style={styles.banBtnText}>Ban Player</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.roleBtn}
                      onPress={() => {
                        triggerHaptic('selection');
                        onToggleRole(player._id, !player.isAdmin);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={player.isAdmin ? 'shield-remove-outline' : 'shield-crown-outline'}
                        size={14}
                        color={colors.accent.gold}
                      />
                      <Text style={styles.roleBtnText}>
                        {player.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </Text>
                    </TouchableOpacity>

                    {player.team ? (
                      <TouchableOpacity
                        style={styles.kickBtn}
                        onPress={() => {
                          triggerHaptic('medium');
                          onKickPlayer(player._id);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="account-minus-outline" size={14} color={colors.accent.coral} />
                        <Text style={styles.kickBtnText}>Kick Party</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </PixelCard>
              );
            })}
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    ...typography.displayPixelSm,
    color: colors.accent.gold,
    fontSize: 14,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.onDark.secondary,
  },
  sectionModeRow: {
    flexDirection: 'row',
    backgroundColor: '#1E1A33',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    padding: 3,
    gap: 4,
  },
  sectionModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sectionModeBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  sectionModeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
  sectionModeTextActive: {
    color: colors.bg.dusk,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 8,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: colors.text.onDark.primary,
    ...typography.bodyMd,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  filterChipActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  filterChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '900',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  emptyCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  emptyTitle: {
    ...typography.headingMd,
    color: colors.accent.gold,
    marginBottom: 4,
  },
  emptySub: {
    ...typography.bodySm,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  guildCard: {
    gap: spacing.xs,
    padding: spacing.cardPadding,
  },
  guildTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guildTitle: {
    ...typography.headingMd,
    color: colors.text.onDark.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  guildCode: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.accent.gold,
    marginTop: 2,
  },
  guildQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#171326',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  guildQuestLabel: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
  },
  guildQuestName: {
    ...typography.bodySmBold,
    fontSize: 11,
    color: colors.accent.gold,
    flex: 1,
  },
  memberChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  memberChip: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  memberChipText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.onDark.primary,
  },
  guildActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  disbandBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  disbandBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent.coral,
  },
  playerCard: {
    gap: spacing.xs,
    padding: spacing.cardPadding,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#2D274A',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBanned: {
    borderColor: colors.accent.coral,
    backgroundColor: 'rgba(232, 102, 75, 0.2)',
  },
  avatarLetter: {
    ...typography.headingMd,
    color: colors.accent.gold,
    fontSize: 16,
    fontWeight: '900',
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
  },
  adminTag: {
    backgroundColor: 'rgba(242, 200, 75, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  adminTagText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.accent.gold,
    fontWeight: '900',
  },
  playerEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: colors.accent.green,
  },
  badgeBanned: {
    backgroundColor: 'rgba(232, 102, 75, 0.2)',
    borderColor: colors.accent.coral,
  },
  statusBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '900',
  },
  badgeTextActive: {
    color: colors.accent.green,
  },
  badgeTextBanned: {
    color: colors.accent.coral,
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: '#171326',
    borderRadius: 6,
    padding: 8,
    gap: 6,
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryLabel: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
    marginBottom: 2,
  },
  telemetryVal: {
    ...typography.bodySmBold,
    fontSize: 11,
    color: colors.text.onDark.primary,
  },
  banNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.3)',
  },
  banNoticeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.coral,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  banBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  banBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent.coral,
  },
  unbanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.accent.green,
    paddingVertical: 6,
    borderRadius: 4,
  },
  unbanBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  roleBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E1A33',
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  roleBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  kickBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E1A33',
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  kickBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
});
