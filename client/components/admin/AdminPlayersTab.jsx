import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { triggerHaptic } from '../../lib/haptics';

import AdminGuildCard from './players/AdminGuildCard';
import AdminPlayerCard from './players/AdminPlayerCard';

export default function AdminPlayersTab({
  players = [],
  teams = [],
  onUpdateStatus,
  onToggleRole,
  onKickPlayer,
  onOpenBanModal,
  onOpenDeletePlayerModal,
  onUpdateTeamStatus,
  onOpenBanTeamModal,
  onDeleteTeam,
  loading = false,
}) {
  const [sectionMode, setSectionMode] = useState('GUILDS');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.team?.name && p.team.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ALL') return !p.isBanned && p.status !== 'banned';
    if (filter === 'PLAYERS') return !p.isAdmin && !p.isBanned && p.status !== 'banned';
    if (filter === 'BANNED') return p.isBanned || p.status === 'banned';
    if (filter === 'ADMIN' || filter === 'ADMINS')
      return p.isAdmin && !p.isBanned && p.status !== 'banned';
    return true;
  });

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      (t.name && t.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.code && t.code.toLowerCase().includes(search.toLowerCase())) ||
      (t.leader?.name && t.leader.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return t.status === 'active' && !t.isBanned && !t.isDisbanded;
    if (filter === 'BANNED') return t.isBanned || t.status === 'banned';
    if (filter === 'DISBANDED') return t.isDisbanded || t.status === 'disbanded';
    return true;
  });

  const handleConfirmDisband = (team) => {
    Alert.alert(
      'Disband Guild Party',
      `Are you sure you want to disband "${team.name}"? All ${team.members?.length || 0} members will be unlinked and this party will be moved to Disbanded records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disband Guild',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            onDeleteTeam(team._id, false);
          },
        },
      ]
    );
  };

  const handleConfirmPurge = (team) => {
    Alert.alert(
      'Permanently Purge Guild',
      `Are you sure you want to permanently delete "${team.name}" from database records? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge Permanently',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('heavy');
            onDeleteTeam(team._id, true);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GUILD & ROSTER CONTROLLER</Text>
        <Text style={styles.subtitle}>
          Manage campus parties, player privileges, and penalty bans
        </Text>
      </View>

      {/* Mode Switcher */}
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

      {/* Search Box */}
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

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {(sectionMode === 'GUILDS'
          ? ['ALL', 'ACTIVE', 'BANNED', 'DISBANDED']
          : ['ALL', 'PLAYERS', 'BANNED', 'ADMIN']
        ).map((f) => (
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
                    if (f === 'ACTIVE')
                      return t.status === 'active' && !t.isBanned && !t.isDisbanded;
                    if (f === 'BANNED') return t.isBanned || t.status === 'banned';
                    if (f === 'DISBANDED') return t.isDisbanded || t.status === 'disbanded';
                    return true;
                  }).length
                : players.filter((p) => {
                    if (f === 'ALL') return !p.isBanned && p.status !== 'banned';
                    if (f === 'PLAYERS') return !p.isAdmin && !p.isBanned && p.status !== 'banned';
                    if (f === 'BANNED') return p.isBanned || p.status === 'banned';
                    if (f === 'ADMIN') return p.isAdmin && !p.isBanned && p.status !== 'banned';
                    return true;
                  }).length}
              )
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.accent.gold} />
          <Text style={styles.loadingText}>Reading Realm Scrolls...</Text>
        </View>
      ) : sectionMode === 'GUILDS' ? (
        filteredTeams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Guild Parties Found</Text>
            <Text style={styles.emptySub}>
              No active, banned, or disbanded guilds match your filter.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredTeams.map((team) => (
              <AdminGuildCard
                key={team._id}
                team={team}
                onUpdateTeamStatus={onUpdateTeamStatus}
                onOpenBanTeamModal={onOpenBanTeamModal}
                onConfirmDisband={handleConfirmDisband}
                onConfirmPurge={handleConfirmPurge}
              />
            ))}
          </View>
        )
      ) : filteredPlayers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Adventurers Found</Text>
          <Text style={styles.emptySub}>No players match your search filter criteria.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredPlayers.map((player) => (
            <AdminPlayerCard
              key={player._id}
              player={player}
              onUpdateStatus={onUpdateStatus}
              onToggleRole={onToggleRole}
              onKickPlayer={onKickPlayer}
              onOpenBanModal={onOpenBanModal}
              onOpenDeletePlayerModal={onOpenDeletePlayerModal}
            />
          ))}
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
    gap: 2,
    marginBottom: 4,
  },
  title: {
    ...typography.displayPixelSm,
    fontSize: 13,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  sectionModeRow: {
    flexDirection: 'row',
    backgroundColor: '#171329',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#3D3560',
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
    ...typography.captionBold,
    color: colors.accent.gold,
    fontSize: 11,
  },
  sectionModeTextActive: {
    color: colors.bg.dusk,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1933',
    borderWidth: 1,
    borderColor: '#3D3560',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.text.onDark.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flex: 1,
    backgroundColor: '#1E1933',
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  filterChipText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.text.onDark.secondary,
  },
  filterChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '800',
  },
  list: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.onDark.primary,
    fontSize: 15,
  },
  emptySub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    fontSize: 11,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...typography.caption,
    color: colors.accent.gold,
    fontSize: 11,
  },
});
