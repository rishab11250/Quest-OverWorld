import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function StatusBanner({ type = 'error', message }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  const backgroundColor = isSuccess
    ? colors.accent.green
    : isWarning
    ? colors.accent.gold
    : colors.accent.coral;

  const textColor = isWarning ? colors.bg.dusk : '#FFFFFF';

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 6,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  text: {
    ...typography.bodyMd,
    fontWeight: '700',
    textAlign: 'center',
  },
});
