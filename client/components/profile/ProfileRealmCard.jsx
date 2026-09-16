import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileRealmCard({ onOpenLogoutModal }) {
  const { theme, isLight } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.bg.card, borderColor: theme.border.subtle }]}>
        <Text style={[styles.cardHeader, { color: theme.accent.gold }]}>REALM INFORMATION</Text>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Client Version</Text>
          <Text style={[styles.infoVal, { color: theme.text.primary }]}>v1.5.0 (Release Build)</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border.subtle }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Server Engine</Text>
          <Text style={[styles.infoVal, { color: theme.text.primary }]}>Quest-OverWorld Node.js API</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            backgroundColor: isLight ? '#FDF2F0' : 'rgba(232, 102, 75, 0.12)',
            borderColor: theme.accent.coral,
          },
        ]}
        onPress={onOpenLogoutModal}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="logout" size={18} color={theme.accent.coral} />
        <Text style={[styles.logoutText, { color: theme.accent.coral }]}>Sign Out of Realm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#1E1933',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  infoVal: {
    ...typography.captionBold,
    color: colors.text.onDark.primary,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#2E274D',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.accent.coral,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  logoutText: {
    ...typography.captionBold,
    color: colors.accent.coral,
    fontSize: 12,
  },
});
