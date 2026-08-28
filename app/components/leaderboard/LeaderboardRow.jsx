import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function LeaderboardRow({ item, rank, isMyTeam }) {
  const renderMedal = (r) => {
    if (r === 1) {
      return (
        <View style={[styles.medalCircle, styles.medalGold]}>
          <Text style={styles.medalEmoji}>🥇</Text>
        </View>
      );
    }
    if (r === 2) {
      return (
        <View style={[styles.medalCircle, styles.medalSilver]}>
          <Text style={styles.medalEmoji}>🥈</Text>
        </View>
      );
    }
    if (r === 3) {
      return (
        <View style={[styles.medalCircle, styles.medalBronze]}>
          <Text style={styles.medalEmoji}>🥉</Text>
        </View>
      );
    }
    return (
      <View style={styles.rankNumCircle}>
        <Text style={styles.rankNumText}>#{r}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.row, isMyTeam && styles.myTeamRow]}>
      {renderMedal(rank)}

      <View style={styles.partyDetails}>
        <View style={styles.partyNameRow}>
          <Text style={styles.partyName}>{item.name}</Text>
          {isMyTeam ? (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.statsSubtitle}>
          📍 {item.checkpointsCount || 0} Stations • ⚡ {item.challengesCount || 0} Bounties
        </Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreText}>+{item.score || 0}</Text>
        <Text style={styles.scoreLabel}>PTS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  myTeamRow: {
    borderColor: colors.accent.gold,
    backgroundColor: '#272044',
  },
  medalCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  medalGold: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderColor: colors.accent.gold,
  },
  medalSilver: {
    backgroundColor: 'rgba(180, 190, 205, 0.2)',
    borderColor: '#B4BECD',
  },
  medalBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderColor: '#CD7F32',
  },
  medalEmoji: {
    fontSize: 18,
  },
  rankNumCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  rankNumText: {
    ...typography.monoSm,
    fontWeight: '900',
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  partyDetails: {
    flex: 1,
  },
  partyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  partyName: {
    ...typography.bodyLg,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  youBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  youBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  statsSubtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  scoreText: {
    ...typography.monoSm,
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  scoreLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
  },
});
