import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { setToken, setUserData } from '../../lib/secureStore';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live password strength calculation
  const strength = useMemo(() => {
    if (!password) {
      return { score: 0, label: '', color: colors.text.onDark.secondary, checks: [] };
    }

    const checks = [
      { id: 'length', label: '8+ characters', met: password.length >= 8 },
      {
        id: 'mixed',
        label: 'Uppercase & lowercase',
        met: /[a-z]/.test(password) && /[A-Z]/.test(password),
      },
      { id: 'number', label: 'At least 1 number', met: /\d/.test(password) },
      { id: 'special', label: 'Special symbol (!@#$%)', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const score = checks.filter((c) => c.met).length;
    let label = 'WEAK';
    let color = colors.accent.coral;

    if (score >= 2 && score <= 3) {
      label = 'MEDIUM';
      color = colors.accent.gold;
    } else if (score === 4) {
      label = 'STRONG';
      color = colors.accent.green;
    }

    return { score, label, color, checks };
  }, [password]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      await setToken(response.token);
      await setUserData(response.user);

      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 24) + 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Join the Quest</Text>
          <Text style={styles.subtitle}>Create your profile to start campus exploration</Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Player Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex Hunter"
              placeholderTextColor={colors.text.onDark.secondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="player@campus.edu"
              placeholderTextColor={colors.text.onDark.secondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.text.onDark.secondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.onDark.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthTitle}>SECURITY LEVEL</Text>
                  <Text style={[styles.strengthBadge, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>

                {/* 4-segment strength bar */}
                <View style={styles.meterTrack}>
                  {[1, 2, 3, 4].map((step) => (
                    <View
                      key={step}
                      style={[
                        styles.meterSegment,
                        {
                          backgroundColor: step <= strength.score ? strength.color : '#3D3560',
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Password requirement checklist */}
                <View style={styles.checklist}>
                  {strength.checks.map((check) => (
                    <View key={check.id} style={styles.checkItem}>
                      <MaterialCommunityIcons
                        name={check.met ? 'check-circle' : 'circle-outline'}
                        size={14}
                        color={check.met ? colors.accent.green : colors.text.onDark.secondary}
                      />
                      <Text style={[styles.checkText, check.met && styles.checkTextMet]}>
                        {check.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-enter password"
                placeholderTextColor={colors.text.onDark.secondary}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.onDark.secondary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.matchErrorText}>Passwords do not match</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg.dusk} />
            ) : (
              <Text style={styles.buttonText}>Register Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.screenPadding,
    paddingVertical: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    ...typography.displayPixelLg,
    fontSize: 16,
    color: colors.accent.gold,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.captionBold,
    color: colors.text.onDark.secondary,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: colors.accent.coral,
    borderRadius: 6,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.text.onDark.primary,
  },
  input: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyLg,
    color: colors.text.onDark.primary,
    minHeight: spacing.minTouchTarget,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    minHeight: spacing.minTouchTarget,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyLg,
    color: colors.text.onDark.primary,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthContainer: {
    backgroundColor: 'rgba(30, 26, 51, 0.6)',
    borderRadius: 6,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: spacing.xs,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthTitle: {
    ...typography.captionBold,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  strengthBadge: {
    ...typography.captionBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  meterTrack: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 2,
  },
  meterSegment: {
    flex: 1,
    borderRadius: 2,
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
  },
  checkText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.onDark.secondary,
  },
  checkTextMet: {
    color: colors.accent.green,
  },
  matchErrorText: {
    ...typography.captionBold,
    color: colors.accent.coral,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.accent.goldDim,
  },
  buttonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  linkText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.accent.gold,
  },
});
