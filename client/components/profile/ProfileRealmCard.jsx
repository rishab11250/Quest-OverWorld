import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function ProfileRealmCard({ onOpenLogoutModal }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardHeader}>REALM INFORMATION</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client Version</Text>
          <Text style={styles.infoVal}>v1.0.0 (Release Build)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Server Engine</Text>
          <Text style={styles.infoVal}>Quest-OverWorld Node.js API</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onOpenLogoutModal} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={18} color={colors.accent.coral} />
        <Text style={styles.logoutText}>Sign Out of Realm</Text>
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
