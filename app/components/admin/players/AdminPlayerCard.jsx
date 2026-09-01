import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import typography from '../../../theme/typography';
import PixelCard from '../../PixelCard';
import { triggerHaptic } from '../../../lib/haptics';

export default function AdminPlayerCard({
  player,
  onUpdateStatus,
  onToggleRole,
  onKickPlayer,
  onOpenBanModal,
  onOpenDeletePlayerModal,
}) {
  const isBanned = player.isBanned || player.status === 'banned';

  return (
    <PixelCard
      variant={isBanned ? 'coral' : player.isAdmin ? 'gold' : 'dusk'}
      style={styles.playerCard}
    >
      {/* Top Row: Avatar + Name + Status */}
      <View style={styles.playerTop}>
        <View style={[styles.avatarBox, isBanned && styles.avatarBanned]}>
          <Text style={styles.avatarLetter}>{(player.name || 'A').charAt(0).toUpperCase()}</Text>
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

        <View style={[styles.statusBadge, isBanned ? styles.badgeBanned : styles.badgeActive]}>
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
          <Text style={styles.telemetryVal}>{player.isAdmin ? 'Guild Master' : 'Adventurer'}</Text>
        </View>
      </View>

      {/* Ban Notice */}
      {isBanned && player.banReason ? (
        <View style={styles.banNoticeBox}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={14}
            color={colors.accent.coral}
          />
          <Text style={styles.banNoticeText}>Reason: {player.banReason}</Text>
        </View>
      ) : null}

      {/* Actions Row */}
      <View style={styles.actionRow}>
        {isBanned ? (
          <>
            <TouchableOpacity
              style={styles.unbanBtn}
              onPress={() => {
                triggerHaptic('medium');
                onUpdateStatus(player._id, 'active');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="lock-open-outline" size={14} color="#000" />
              <Text style={styles.unbanBtnText}>Unban Player</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.purgePlayerBtn}
              onPress={() => {
                triggerHaptic('warning');
                if (onOpenDeletePlayerModal) {
                  onOpenDeletePlayerModal(player);
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color={colors.accent.coral}
              />
              <Text style={styles.purgePlayerBtnText}>Delete Player</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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

            {player.team ? (
              <TouchableOpacity
                style={styles.kickBtn}
                onPress={() => {
                  triggerHaptic('light');
                  onKickPlayer(player._id);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="account-remove-outline"
                  size={14}
                  color={colors.text.onDark.secondary}
                />
                <Text style={styles.kickBtnText}>Kick from Party</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.roleBtn, player.isAdmin && styles.roleBtnRevoke]}
              onPress={() => {
                triggerHaptic('medium');
                onToggleRole(player._id, !player.isAdmin);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={player.isAdmin ? 'shield-remove-outline' : 'shield-crown-outline'}
                size={14}
                color={player.isAdmin ? colors.accent.coral : colors.accent.gold}
              />
              <Text style={[styles.roleBtnText, player.isAdmin && styles.roleBtnTextRevoke]}>
                {player.isAdmin ? 'Revoke Admin' : 'Make Admin'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                triggerHaptic('warning');
                if (onOpenDeletePlayerModal) {
                  onOpenDeletePlayerModal(player);
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color={colors.accent.coral}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </PixelCard>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    padding: 12,
    gap: 8,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2247',
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBanned: {
    borderColor: colors.accent.coral,
    backgroundColor: '#35161C',
  },
  avatarLetter: {
    ...typography.captionBold,
    fontSize: 14,
    color: colors.accent.gold,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 13.5,
  },
  adminTag: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  adminTagText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.bg.dusk,
    fontWeight: '900',
  },
  playerEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10.5,
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
  actionRow: {
    flexDirection: 'row',
    gap: 5,
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
    fontSize: 9.5,
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
  kickBtn: {
    flex: 1.2,
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
  kickBtnText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
  },
  roleBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 75, 0.12)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingVertical: 6,
    borderRadius: 4,
  },
  roleBtnRevoke: {
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    borderColor: colors.accent.coral,
  },
  roleBtnText: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.accent.gold,
  },
  roleBtnTextRevoke: {
    color: colors.accent.coral,
  },
  deleteBtn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35161C',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    borderRadius: 4,
  },
  purgePlayerBtn: {
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
  purgePlayerBtnText: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.accent.coral,
  },
});
