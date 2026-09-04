import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function StatusBanner({ type = 'error', message, onDismiss }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const backgroundColor = isSuccess
    ? colors.accent.green
    : isWarning
      ? colors.accent.gold
      : colors.accent.coral;

  const textColor = isWarning ? colors.bg.dusk : '#FFFFFF';
  const iconName = isSuccess
    ? 'check-circle-outline'
    : isWarning
      ? 'alert-outline'
      : 'alert-circle-outline';

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor }]}
      onPress={onDismiss}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name={iconName} size={18} color={textColor} />
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={16} color={textColor} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  text: {
    ...typography.bodyMd,
    fontWeight: '700',
    flex: 1,
  },
});
