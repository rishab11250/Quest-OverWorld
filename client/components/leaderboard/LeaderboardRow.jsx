import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import PixelBadge from '../PixelBadge';
import { useTheme } from '../../context/ThemeContext';

export default function LeaderboardRow({ item, rank, isMyTeam }) {
  const { theme, isLight } = useTheme();

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
      <View style={[styles.rankNumCircle, { backgroundColor: theme.bg.surface, borderColor: theme.border.subtle }]}>
        <Text style={[styles.rankNumText, { color: theme.text.secondary }]}>#{r}</Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isMyTeam
            ? isLight
              ? '#FFF8E7'
              : '#272044'
            : theme.bg.card,
          borderColor: isMyTeam ? theme.accent.gold : theme.border.subtle,
        },
      ]}
    >
      {renderMedal(rank)}

      <View style={styles.partyDetails}>
        <View style={styles.partyNameRow}>
          <Text style={[styles.partyName, { color: theme.text.primary }]}>{item.name}</Text>
          {isMyTeam ? <PixelBadge label="YOU" variant="gold" size="sm" /> : null}
        </View>
        <Text style={[styles.statsSubtitle, { color: theme.text.secondary }]}>
          📍 {item.checkpointsCount || 0} Stations • ⚡ {item.challengesCount || 0} Bounties
        </Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={[styles.scoreText, { color: theme.accent.gold }]}>+{item.score || 0}</Text>
        <Text style={[styles.scoreLabel, { color: theme.accent.goldDim || theme.text.secondary }]}>PTS</Text>
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
    ...typography.displayPixelSm,
    color: colors.text.onDark.secondary,
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
    ...typography.bodyLgBold,
    color: colors.text.onDark.primary,
  },
  youBadge: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  youBadgeText: {
    ...typography.captionBold,
    fontSize: 9,
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
    ...typography.displayPixelMd,
    color: colors.accent.gold,
  },
  scoreLabel: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.text.onDark.secondary,
  },
});
