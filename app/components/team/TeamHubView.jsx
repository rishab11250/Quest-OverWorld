import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import ProgressBar from '../ProgressBar';
import PixelBadge from '../PixelBadge';
import PixelCard from '../PixelCard';
import { triggerHaptic } from '../../lib/haptics';

export default function TeamHubView({
  team,
  copied,
  onCopyCode,
  onShareCode,
  onInviteContacts,
  onRequestLeave,
}) {
  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const level = Math.floor((team.score || 0) / 250) + 1;

  return (
    <View style={styles.container}>
      {/* Team Header & XP */}
      <PixelCard variant="gold" glow style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.teamName}>{team.name}</Text>
          <PixelBadge label={`LVL ${level}`} variant="gold" icon="shield-crown" />
        </View>

        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+{team.score || 0} PTS</Text>
        </View>

        <ProgressBar
          current={team.score || 0}
          max={250}
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
            const isLeader = member._id === leaderId;
            return (
              <View key={member._id || index} style={styles.memberRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {(member.name || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {isLeader ? (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>CAPTAIN</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberRoleSub}>
                    {isLeader ? 'Party Vanguard · Lead Scout' : 'Guild Companion · Active'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </PixelCard>

      {/* Active Party Buffs & Guild Perks */}
      <PixelCard variant="dusk" style={styles.perksCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>ACTIVE GUILD PERKS</Text>
          <Text style={styles.memberCount}>3 BUFFS ACTIVE</Text>
        </View>

        <View style={styles.perksList}>
          {[
            {
              icon: 'shield-sword',
              name: 'Squad Telemetry Sync',
              desc: 'Shared map discovery and instant waypoint unlocks',
            },
            {
              icon: 'lightning-bolt-circle',
              name: 'Guild XP Multiplier',
              desc: '+10% XP bonus on all campus bounty board submissions',
            },
            {
              icon: 'compass-rose',
              name: 'High-Precision Radar',
              desc: 'Sub-meter compass bearing & waypoint beacon lock',
            },
          ].map((buff, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={styles.perkIconBox}>
                <MaterialCommunityIcons name={buff.icon} size={16} color={colors.accent.gold} />
              </View>
              <View style={styles.perkInfo}>
                <Text style={styles.perkName}>{buff.name}</Text>
                <Text style={styles.perkDesc}>{buff.desc}</Text>
              </View>
            </View>
          ))}
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
  teamName: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
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
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.bg.dusk,
  },
  actionBtnTextOutline: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.text.onDark.primary,
  },
  actionBtnTextContacts: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.accent.gold,
  },
  rosterCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterTitle: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  memberCount: {
    ...typography.displayPixelXs,
    fontSize: 8,
    color: colors.text.onDark.secondary,
  },
  membersList: {
    gap: spacing.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
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
  memberRoleSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
    marginTop: 1,
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
    backgroundColor: '#1E1A33',
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  perkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#292147',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 12,
  },
  perkDesc: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
    marginTop: 1,
  },
});
