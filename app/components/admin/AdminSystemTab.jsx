import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function AdminSystemTab({
  adminProfile,
  healthStatus,
  pingLoading,
  onPingHealth,
  onReseedSystem,
  onLogout,
}) {
  return (
    <View style={styles.container}>
      {/* Admin Identity Card */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>ADMIN OPERATOR IDENTITY</Text>

        <View style={styles.adminCodexCard}>
          <View style={styles.codexRow}>
            <Text style={styles.codexLabel}>Full Name</Text>
            <Text style={styles.codexVal}>{adminProfile?.name || 'Guild Master Admin'}</Text>
          </View>
          <View style={styles.codexRow}>
            <Text style={styles.codexLabel}>Email Address</Text>
            <Text style={styles.codexVal}>{adminProfile?.email || 'admin@overworld.com'}</Text>
          </View>
          <View style={styles.codexRow}>
            <Text style={styles.codexLabel}>Authorization Role</Text>
            <Text style={[styles.codexVal, { color: colors.accent.gold, fontWeight: '900' }]}>
              {adminProfile?.role || 'Guild Master Admin'}
            </Text>
          </View>
          <View style={[styles.codexRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.codexLabel}>Access Level</Text>
            <Text style={styles.codexVal}>Full Event Read/Write & Score Grants</Text>
          </View>
        </View>
      </View>

      {/* System Operations & Maintenance */}
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>EVENT MAINTENANCE & OPERATIONS</Text>

        <View style={styles.opsCard}>
          {/* Server Ping Test */}
          <View style={styles.opsRow}>
            <View style={styles.opsInfo}>
              <Text style={styles.opsTitle}>Server API Health</Text>
              <Text style={styles.opsSub}>
                {healthStatus || 'Check connectivity & response latency'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.opsBtn}
              onPress={onPingHealth}
              disabled={pingLoading}
              activeOpacity={0.8}
            >
              {pingLoading ? (
                <ActivityIndicator size="small" color={colors.accent.gold} />
              ) : (
                <Text style={styles.opsBtnText}>Ping API</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Quick Re-seed Demo Data */}
          <View style={styles.opsRow}>
            <View style={styles.opsInfo}>
              <Text style={styles.opsTitle}>Reset & Seed Demo Data</Text>
              <Text style={styles.opsSub}>
                Restores 4 campus checkpoints & 4 bounty challenges
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.opsBtn, { borderColor: colors.accent.gold }]}
              onPress={onReseedSystem}
              activeOpacity={0.8}
            >
              <Text style={[styles.opsBtnText, { color: colors.accent.gold }]}>Reset Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Sign Out */}
          <View style={styles.opsRow}>
            <View style={styles.opsInfo}>
              <Text style={[styles.opsTitle, { color: colors.accent.coral }]}>
                End Admin Session
              </Text>
              <Text style={styles.opsSub}>Securely sign out of the operations console</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.opsBtn,
                {
                  borderColor: colors.accent.coral,
                  backgroundColor: 'rgba(232, 102, 75, 0.1)',
                },
              ]}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Text style={[styles.opsBtnText, { color: colors.accent.coral }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  cardSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
    letterSpacing: 1.2,
  },
  adminCodexCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  codexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#362E52',
  },
  codexLabel: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  codexVal: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  opsCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  opsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  opsInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  opsTitle: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.text.onDark.primary,
  },
  opsSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  opsBtn: {
    borderWidth: 1,
    borderColor: '#4A4170',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  opsBtnText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#362E52',
  },
});
