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
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Party Headquarters</Text>
        <Text style={styles.subtitle}>
          Form or join an adventuring party to take on campus quests together
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'join' && styles.tabButtonActive]}
          onPress={() => setActiveTab('join')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'join' && styles.tabButtonTextActive]}>
            Join Party
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
          onPress={() => setActiveTab('create')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}
          >
            Create Party
          </Text>
        </TouchableOpacity>
      </View>

      {/* Join Card */}
      {activeTab === 'join' ? (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Enter Party Code</Text>
          <Text style={styles.cardSubtext}>
            Ask your team captain for the 6-character party invite code.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="e.g. AB12CD"
            placeholderTextColor="#7E75A0"
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onJoin}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.bg.dusk} />
            ) : (
              <Text style={styles.primaryBtnText}>Join Party</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* Create Card */
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Form a New Party</Text>
          <Text style={styles.cardSubtext}>
            Choose a guild party name. You'll get an invite code for your friends.
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="e.g. Aegis Explorers"
            placeholderTextColor="#7E75A0"
            value={teamName}
            onChangeText={setTeamName}
            maxLength={30}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onCreate}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.bg.dusk} />
            ) : (
              <Text style={styles.primaryBtnText}>Create Party</Text>
            )}
          </TouchableOpacity>
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
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  tabButtonTextActive: {
    color: colors.bg.dusk,
    fontWeight: '800',
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
    ...typography.monoSm,
    fontSize: 22,
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
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
});
