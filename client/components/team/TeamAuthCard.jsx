import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import PixelButton from '../PixelButton';
import { triggerHaptic } from '../../lib/haptics';
import { useTheme } from '../../context/ThemeContext';

export default function TeamAuthCard({
  activeTab,
  setActiveTab,
  joinCode,
  setJoinCode,
  teamName,
  setTeamName,
  onJoin,
  onCreate,
  submitting,
}) {
  const { theme, isLight } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.accent.gold }]}>Party Headquarters</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Form or join an adventuring party to take on campus quests together
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.bg.surface, borderColor: theme.border.subtle }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'join' && { backgroundColor: theme.accent.gold }]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('join');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'join' ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.secondary },
            ]}
          >
            Join Party
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && { backgroundColor: theme.accent.gold }]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('create');
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'create' ? (isLight ? '#1E1A33' : theme.bg.dusk) : theme.text.secondary },
            ]}
          >
            Create Party
          </Text>
        </TouchableOpacity>
      </View>

      {/* Join Card */}
      {activeTab === 'join' ? (
        <View style={[styles.card, { backgroundColor: theme.bg.card, borderColor: theme.border.subtle }]}>
          <Text style={[styles.cardHeading, { color: theme.text.primary }]}>Enter Party Code</Text>
          <Text style={[styles.cardSubtext, { color: theme.text.secondary }]}>
            Ask your team captain for the 6-character party invite code.
          </Text>

          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.bg.surface,
                borderColor: theme.accent.gold,
                color: theme.accent.gold,
              },
            ]}
            placeholder="e.g. AB12CD"
            placeholderTextColor={theme.text.muted || '#7E75A0'}
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />

          <PixelButton
            variant="gold"
            icon="account-plus"
            title={submitting ? 'JOINING...' : 'JOIN PARTY'}
            onPress={onJoin}
            disabled={submitting}
          />
        </View>
      ) : (
        /* Create Card */
        <View style={[styles.card, { backgroundColor: theme.bg.card, borderColor: theme.border.subtle }]}>
          <Text style={[styles.cardHeading, { color: theme.text.primary }]}>Form a New Party</Text>
          <Text style={[styles.cardSubtext, { color: theme.text.secondary }]}>
            Choose a guild party name. You'll get an invite code for your friends.
          </Text>

          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.bg.surface,
                borderColor: theme.border.subtle,
                color: theme.text.primary,
              },
            ]}
            placeholder="e.g. Aegis Explorers"
            placeholderTextColor={theme.text.muted || '#7E75A0'}
            value={teamName}
            onChangeText={setTeamName}
            maxLength={30}
          />

          <PixelButton
            variant="gold"
            icon="shield-plus"
            title={submitting ? 'CREATING...' : 'CREATE PARTY'}
            onPress={onCreate}
            disabled={submitting}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  title: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  tabButtonText: {
    ...typography.displayPixelXs,
    fontSize: 9,
    color: colors.text.onDark.secondary,
  },
  tabButtonTextActive: {
    color: colors.bg.dusk,
  },
  card: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.md,
  },
  cardHeading: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
  },
  cardSubtext: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  codeInput: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: colors.accent.gold,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.accent.gold,
    ...typography.displayPixelLg,
    fontSize: 18,
    letterSpacing: 6,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: '#FFF',
    ...typography.bodyMd,
  },
  primaryBtn: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.displayPixelSm,
    fontSize: 11,
    color: colors.bg.dusk,
  },
});
