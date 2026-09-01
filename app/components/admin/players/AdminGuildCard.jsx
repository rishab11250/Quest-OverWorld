import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import PixelCard from '../../PixelCard';
import { triggerHaptic } from '../../../lib/haptics';

export default function AdminGuildCard({
  team,
  onUpdateTeamStatus,
  onOpenBanTeamModal,
  onConfirmDisband,
  onConfirmPurge,
}) {
  const isBanned = team.isBanned || team.status === 'banned';
  const isDisbanded = team.isDisbanded || team.status === 'disbanded';

  return (
    <PixelCard
      variant={isDisbanded ? 'dusk' : isBanned ? 'coral' : 'gold'}
      style={[styles.guildCard, isDisbanded && styles.guildCardDisbanded]}
    >
      {/* Top Row: Guild Name + Code + Status */}
      <View style={styles.guildTopRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons
              name={isDisbanded ? 'shield-off-outline' : 'shield-sword'}
              size={18}
              color={
                isDisbanded
                  ? colors.text.onDark.secondary
                  : isBanned
                    ? colors.accent.coral
                    : colors.accent.gold
              }
            />
            <Text style={[styles.guildTitle, isDisbanded && styles.guildTitleDisbanded]}>
              {team.name}
            </Text>
          </View>
          <Text style={styles.guildCode}>PARTY CODE: #{team.code}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isDisbanded
              ? styles.badgeDisbanded
              : isBanned
                ? styles.badgeBanned
                : styles.badgeActive,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isDisbanded
                ? styles.badgeTextDisbanded
                : isBanned
                  ? styles.badgeTextBanned
                  : styles.badgeTextActive,
            ]}
          >
            {isDisbanded ? 'DISBANDED' : isBanned ? 'BANNED' : 'ACTIVE'}
          </Text>
        </View>
      </View>

      {/* Telemetry Row */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>LEADER</Text>
          <Text style={styles.telemetryVal}>👑 {team.leader?.name || 'Unassigned'}</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>EXPEDITION XP</Text>
          <Text
            style={[
              styles.telemetryVal,
              { color: isDisbanded ? colors.text.onDark.secondary : colors.accent.green },
            ]}
          >
            {team.score || 0} PTS
          </Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>PARTY SIZE</Text>
          <Text style={styles.telemetryVal}>{team.members?.length || 0} Members</Text>
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

      {/* Ban or Disband Notice */}
      {isBanned && team.banReason ? (
        <View style={styles.banNoticeBox}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={colors.accent.coral}
          />
          <Text style={styles.banNoticeText}>Ban Reason: {team.banReason}</Text>
        </View>
      ) : null}

      {isDisbanded ? (
        <View style={styles.disbandNoticeBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={colors.text.onDark.secondary}
          />
          <Text style={styles.disbandNoticeText}>
            Disbanded: {team.disbandReason || 'Party dissolved by Guild Master Admin'}
          </Text>
        </View>
      ) : null}

      {/* Guild Actions */}
      <View style={styles.guildActionRow}>
        {isDisbanded ? (
          <>
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={() => {
                triggerHaptic('medium');
                onUpdateTeamStatus(team._id, 'active');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="backup-restore" size={14} color={colors.accent.green} />
              <Text style={styles.restoreBtnText}>Restore Guild</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.purgeBtn}
              onPress={() => onConfirmPurge(team)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="trash-can" size={14} color={colors.accent.coral} />
              <Text style={styles.purgeBtnText}>Purge Permanently</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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
              onPress={() => onConfirmDisband(team)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color={colors.accent.coral}
              />
              <Text style={styles.disbandBtnText}>Disband Party</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  guildCard: {
    padding: 12,
    gap: 8,
  },
  guildCardDisbanded: {
    opacity: 0.75,
  },
  guildTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guildTitle: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 15,
  },
  guildTitleDisbanded: {
    color: colors.text.onDark.secondary,
    textDecorationLine: 'line-through',
  },
  guildCode: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
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
  badgeDisbanded: {
    backgroundColor: 'rgba(126, 117, 160, 0.15)',
    borderColor: '#4A3E70',
  },
  statusBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7,
  },
  badgeTextActive: {
    color: colors.accent.green,
  },
  badgeTextBanned: {
    color: colors.accent.coral,
  },
  badgeTextDisbanded: {
    color: colors.text.onDark.secondary,
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: '#151126',
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2D2748',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  telemetryLabel: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.text.onDark.secondary,
  },
  telemetryVal: {
    ...typography.captionBold,
    fontSize: 10.5,
    color: colors.text.onDark.primary,
  },
  guildQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 75, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.2)',
  },
  guildQuestLabel: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.accent.gold,
  },
  guildQuestName: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.primary,
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
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  memberChipText: {
    ...typography.caption,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  banNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  banNoticeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.coral,
    flex: 1,
  },
  disbandNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(126, 117, 160, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  disbandNoticeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    flex: 1,
  },
  guildActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  banBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingVertical: 6,
    borderRadius: 4,
  },
  banBtnText: {
    ...typography.captionBold,
    fontSize: 10,
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
    ...typography.captionBold,
    fontSize: 10,
    color: colors.bg.dusk,
    fontWeight: '800',
  },
  disbandBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#4A3E70',
    paddingVertical: 6,
    borderRadius: 4,
  },
  disbandBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.secondary,
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(62, 207, 142, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingVertical: 6,
    borderRadius: 4,
  },
  restoreBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.accent.green,
  },
  purgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#35161C',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingVertical: 6,
    borderRadius: 4,
  },
  purgeBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.accent.coral,
  },
});
