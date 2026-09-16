import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

export default function PixelBadge({
  label,
  icon,
  variant = 'gold', // 'gold' | 'green' | 'coral' | 'neutral' | 'dusk'
  size = 'md', // 'sm' | 'md'
}) {
  const { theme: appTheme, isLight } = useTheme();
  const isGold = variant === 'gold';
  const isGreen = variant === 'green';
  const isCoral = variant === 'coral';
  const isDusk = variant === 'dusk';

  const badgeStyles = [
    styles.badge,
    size === 'sm' && styles.badgeSm,
    {
      backgroundColor: isGold
        ? isLight
          ? '#F5E6CC'
          : 'rgba(242, 200, 75, 0.15)'
        : isGreen
          ? isLight
            ? '#E0F2E9'
            : 'rgba(95, 191, 122, 0.15)'
          : isCoral
            ? 'rgba(232, 102, 75, 0.15)'
            : isDusk
              ? appTheme?.accent?.gold || colors.accent.gold
              : appTheme?.bg?.surface || '#262040',
      borderColor: isGold
        ? appTheme?.accent?.gold || colors.accent.gold
        : isGreen
          ? appTheme?.accent?.green || colors.accent.green
          : isCoral
            ? appTheme?.accent?.coral || colors.accent.coral
            : isDusk
              ? appTheme?.accent?.gold || colors.accent.gold
              : appTheme?.border?.subtle || '#3D3560',
    },
  ];

  const textStyles = [
    styles.text,
    size === 'sm' && styles.textSm,
    {
      color: isGold
        ? appTheme?.accent?.gold || colors.accent.gold
        : isGreen
          ? appTheme?.accent?.green || colors.accent.green
          : isCoral
            ? appTheme?.accent?.coral || colors.accent.coral
            : isDusk
              ? isLight
                ? '#1E1A33'
                : appTheme?.bg?.dusk || colors.bg.dusk
              : appTheme?.text?.primary || colors.text.onDark.primary,
    },
  ];

  const iconColor = isGold
    ? appTheme?.accent?.gold || colors.accent.gold
    : isGreen
      ? appTheme?.accent?.green || colors.accent.green
      : isCoral
        ? appTheme?.accent?.coral || colors.accent.coral
        : appTheme?.text?.secondary || colors.text.onDark.secondary;

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
