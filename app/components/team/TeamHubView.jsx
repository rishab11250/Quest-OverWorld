import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import ProgressBar from '../ProgressBar';
import PixelBadge from '../PixelBadge';
import PixelCard from '../PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export const GUILD_PERKS = [
  {
    id: 'perk-telemetry',
    minLevel: 1,
    icon: 'shield-sword',
    name: 'Squad Telemetry Sync',
    desc: 'Shared map discovery and instant waypoint unlocks with party',
  },
  {
    id: 'perk-xp-boost',
    minLevel: 2,
    icon: 'lightning-bolt-circle',
    name: 'Guild XP Multiplier (+10%)',
    desc: '+10% XP bonus on all campus bounty board submissions',
  },
  {
    id: 'perk-radar',
    minLevel: 3,
    icon: 'compass-rose',
    name: 'High-Precision Radar',
    desc: 'Sub-meter compass bearing & waypoint beacon lock',
  },
  {
    id: 'perk-sonar',
    minLevel: 4,
    icon: 'radar',
    name: 'Expedition Proximity Sonar',
    desc: 'Extended 100m checkpoint proximity alert radius',
  },
  {
    id: 'perk-master-crest',
    minLevel: 5,
    icon: 'crown-outline',
    name: 'Grandmaster Guild Crest',
    desc: 'Golden avatar frame and realm leaderboard insignia',
  },
];

export default function TeamHubView({
  team,
  copied,
  onCopyCode,
  onShareCode,
  onInviteContacts,
  onRequestLeave,
  isCaptain = false,
  isViceCaptain = false,
  currentUserId,
  onOpenRenameModal,
  onManageMember,
}) {
  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const level = Math.floor((team.score || 0) / 250) + 1;
  const activeBuffsCount = GUILD_PERKS.filter((p) => level >= p.minLevel).length;

  return (
    <View style={styles.container}>
      {/* Team Header & XP */}
      <PixelCard variant="gold" glow style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.nameGroup}>
            <Text style={styles.teamName}>{team.name}</Text>
            {isCaptain ? (
              <TouchableOpacity
                style={styles.renameBtn}
                onPress={() => {
                  triggerHaptic('light');
                  if (onOpenRenameModal) onOpenRenameModal();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={15}
                  color={colors.accent.gold}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <PixelBadge label={`LVL ${level}`} variant="gold" icon="shield-crown" />
        </View>

        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{team.score || 0} PTS</Text>
        </View>

        <ProgressBar
          current={team.score || 0}
          max={level * 250}
          label={`NEXT GUILD RANK (LVL ${level + 1})`}
        />
      </PixelCard>

      {/* Invite / Join Code Card */}
      <PixelCard variant="dusk" style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeLabel}>PARTY INVITE CODE</Text>
          <Text style={styles.codeSub}>Share with friends to join your party</Text>
        </View>
        <Text style={styles.codeValue}>{team.code}</Text>

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              triggerHaptic('success');
              onCopyCode();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>{copied ? 'COPIED!' : 'COPY CODE'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={() => {
              triggerHaptic('light');
              onShareCode();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTextOutline}>SHARE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnContacts]}
            onPress={() => {
              triggerHaptic('light');
              onInviteContacts();
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="contacts" size={14} color={colors.accent.gold} />
            <Text style={styles.actionBtnTextContacts}>CONTACTS</Text>
          </TouchableOpacity>
        </View>
      </PixelCard>

      {/* Party Roster */}
      <PixelCard variant="dusk" style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>PARTY ROSTER</Text>
          <Text style={styles.memberCount}>{team.members?.length || 1} ADVENTURERS</Text>
        </View>

        <View style={styles.membersList}>
          {team.members?.map((member, index) => {
            const memberId = typeof member === 'object' ? member._id : member;
            const isMemberLeader = memberId === leaderId;
            const isMemberViceCaptain =
              team.viceCaptains &&
              team.viceCaptains.some((vc) => (typeof vc === 'object' ? vc._id : vc) === memberId);
            const isSelf = memberId === currentUserId;
            const canManage =
              (isCaptain && !isMemberLeader && !isSelf) ||
              (isViceCaptain && !isMemberLeader && !isMemberViceCaptain && !isSelf);

            return (
              <View key={memberId || index} style={styles.memberRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {(member.name || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {isMemberLeader ? (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>CAPTAIN</Text>
                      </View>
                    ) : isMemberViceCaptain ? (
                      <View style={styles.vcBadge}>
                        <Text style={styles.vcBadgeText}>VICE-CAPTAIN</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberRoleSub}>
                    {isMemberLeader
                      ? 'Party Vanguard · Lead Scout'
                      : isMemberViceCaptain
                        ? 'Party Officer · Vice-Captain'
                        : 'Guild Companion · Active'}
                  </Text>
                </View>

                {canManage ? (
                  <TouchableOpacity
                    style={styles.manageMemberBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      if (onManageMember) onManageMember(member);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={18}
                      color={colors.accent.gold}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      </PixelCard>

      {/* Active Party Buffs & Dynamic Guild Perks */}
      <PixelCard variant="dusk" style={styles.perksCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>GUILD PERKS & BUFFS</Text>
          <Text style={styles.memberCount}>
            {activeBuffsCount} / {GUILD_PERKS.length} UNLOCKED
          </Text>
        </View>

        <View style={styles.perksList}>
          {GUILD_PERKS.map((buff) => {
            const isUnlocked = level >= buff.minLevel;
            return (
              <View key={buff.id} style={[styles.perkRow, !isUnlocked && styles.perkRowLocked]}>
                <View style={[styles.perkIconBox, !isUnlocked && styles.perkIconBoxLocked]}>
                  <MaterialCommunityIcons
                    name={isUnlocked ? buff.icon : 'lock-outline'}
                    size={16}
                    color={isUnlocked ? colors.accent.gold : colors.text.onDark.secondary}
                  />
                </View>
                <View style={styles.perkInfo}>
                  <View style={styles.perkHeaderRow}>
                    <Text style={[styles.perkName, !isUnlocked && styles.perkNameLocked]}>
                      {buff.name}
                    </Text>
                    <View
                      style={[
                        styles.perkBadge,
                        isUnlocked ? styles.perkBadgeActive : styles.perkBadgeLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.perkBadgeText,
                          isUnlocked ? styles.perkBadgeTextActive : styles.perkBadgeTextLocked,
                        ]}
                      >
                        {isUnlocked ? 'ACTIVE' : `LVL ${buff.minLevel}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.perkDesc}>{buff.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </PixelCard>

      {/* Leave Team Button */}
      <TouchableOpacity style={styles.leaveButton} onPress={onRequestLeave} activeOpacity={0.8}>
        <Text style={styles.leaveButtonText}>Leave Party</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  teamName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
  },
  renameBtn: {
    padding: 4,
    backgroundColor: '#2A2247',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  xpText: {
    ...typography.displayPixelLg,
    color: colors.accent.gold,
    fontSize: 18,
  },
  codeCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeHeader: {
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.captionBold,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  codeSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  codeValue: {
    ...typography.displayPixelLg,
    fontSize: 24,
    color: colors.accent.gold,
    letterSpacing: 6,
    marginVertical: spacing.xs,
  },
  codeActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A4170',
  },
  actionBtnContacts: {
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    flexDirection: 'row',
    gap: 4,
  },
  actionBtnText: {
    ...typography.captionBold,
    color: colors.bg.dusk,
  },
  actionBtnTextOutline: {
    ...typography.captionBold,
    color: colors.text.onDark.primary,
  },
  actionBtnTextContacts: {
    ...typography.captionBold,
    color: colors.accent.gold,
  },
  rosterCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterTitle: {
    ...typography.displayPixelXs,
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  memberCount: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  membersList: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1E1933',
    padding: spacing.sm,
    borderRadius: 6,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#322A54',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  avatarLetter: {
    ...typography.bodyLgBold,
    color: colors.accent.gold,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberName: {
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
  },
  leaderBadge: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  leaderBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.accent.gold,
  },
  vcBadge: {
    backgroundColor: 'rgba(62, 207, 142, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  vcBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
    color: colors.accent.green,
  },
  memberRoleSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
    marginTop: 1,
  },
  manageMemberBtn: {
    padding: 6,
    backgroundColor: '#2A2247',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A3E70',
  },
  leaveButton: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  leaveButtonText: {
    ...typography.displayPixelSm,
    fontSize: 10,
    color: colors.accent.coral,
  },
  perksCard: {
    backgroundColor: colors.bg.duskRaised,
    gap: spacing.sm,
  },
  perksList: {
    gap: spacing.xs,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1933',
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  perkRowLocked: {
    opacity: 0.5,
    backgroundColor: '#161226',
    borderColor: '#2A2342',
  },
  perkIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#292147',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkIconBoxLocked: {
    backgroundColor: '#1E1833',
    borderColor: '#3D3560',
  },
  perkInfo: {
    flex: 1,
    gap: 2,
  },
  perkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perkName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 12,
  },
  perkNameLocked: {
    color: colors.text.onDark.secondary,
  },
  perkBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  perkBadgeActive: {
    backgroundColor: 'rgba(62, 207, 142, 0.15)',
    borderColor: colors.accent.green,
  },
  perkBadgeLocked: {
    backgroundColor: 'rgba(126, 117, 160, 0.15)',
    borderColor: '#4A3E70',
  },
  perkBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 6.5,
  },
  perkBadgeTextActive: {
    color: colors.accent.green,
  },
  perkBadgeTextLocked: {
    color: colors.text.onDark.secondary,
  },
  perkDesc: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
  },
});
