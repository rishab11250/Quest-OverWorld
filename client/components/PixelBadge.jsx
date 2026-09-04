import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';

export default function PixelBadge({
  label,
  icon,
  variant = 'gold', // 'gold' | 'green' | 'coral' | 'neutral' | 'dusk'
  size = 'md', // 'sm' | 'md'
}) {
  const isGold = variant === 'gold';
  const isGreen = variant === 'green';
  const isCoral = variant === 'coral';
  const isDusk = variant === 'dusk';

  const badgeStyles = [
    styles.badge,
    size === 'sm' && styles.badgeSm,
    isGold && styles.badgeGold,
    isGreen && styles.badgeGreen,
    isCoral && styles.badgeCoral,
    isDusk && styles.badgeDusk,
  ];

  const textStyles = [
    styles.text,
    size === 'sm' && styles.textSm,
    isGold && styles.textGold,
    isGreen && styles.textGreen,
    isCoral && styles.textCoral,
    isDusk && styles.textDusk,
  ];

  const iconColor = isGold
    ? colors.accent.gold
    : isGreen
      ? colors.accent.green
      : isCoral
        ? colors.accent.coral
        : colors.text.onDark.secondary;

  return (
    <View style={badgeStyles}>
      {icon ? (
        <MaterialCommunityIcons name={icon} size={size === 'sm' ? 9 : 11} color={iconColor} />
      ) : null}
      <Text style={textStyles}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
    backgroundColor: '#262040',
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 3,
  },
  badgeGold: {
    backgroundColor: 'rgba(242, 200, 75, 0.15)',
    borderColor: colors.accent.gold,
  },
  badgeGreen: {
    backgroundColor: 'rgba(95, 191, 122, 0.15)',
    borderColor: colors.accent.green,
  },
  badgeCoral: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderColor: colors.accent.coral,
  },
  badgeDusk: {
    backgroundColor: colors.accent.gold,
    borderColor: colors.accent.gold,
  },
  text: {
    fontFamily: fonts.pixel,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 7.5,
  },
  textGold: {
    color: colors.accent.gold,
  },
  textGreen: {
    color: colors.accent.green,
  },
  textCoral: {
    color: colors.accent.coral,
  },
  textDusk: {
    color: colors.bg.dusk,
  },
});
