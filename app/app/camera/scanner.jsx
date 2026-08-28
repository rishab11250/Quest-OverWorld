import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { getCurrentLocation } from '../../lib/location';
import RewardModal from '../../components/RewardModal';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(SCREEN_WIDTH * 0.75, 280);

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState('back'); // 'back' | 'front'
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Reward Modal state
  const [rewardData, setRewardData] = useState(null);
  const [rewardVisible, setRewardVisible] = useState(false);

  // Laser scanner animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const laserLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: SCAN_BOX_SIZE - 4,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    laserLoop.start();
    return () => laserLoop.stop();
  }, [laserAnim]);

  const handleVerifyPayload = async (qrString) => {
    if (!qrString || verifying) return;

    setVerifying(true);
    setError('');

    try {
      // 1. Get real GPS coordinates
      const loc = await getCurrentLocation();

      // 2. Call backend verification endpoint
      const res = await api.post('/checkpoints/verify', {
        qrCode: qrString.trim(),
        latitude: loc?.latitude,
        longitude: loc?.longitude,
      });

      // 3. Trigger Reward Celebration!
      setRewardData(res);
      setRewardVisible(true);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setScanned(false);
    } finally {
      setVerifying(false);
    }
  };

  const onBarcodeScanned = ({ data }) => {
    if (scanned || verifying) return;
    setScanned(true);
    handleVerifyPayload(data);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setError('Please enter a valid QR string code.');
      return;
    }
    handleVerifyPayload(manualCode.trim());
  };

  const handleRewardDismiss = () => {
    setRewardVisible(false);
    router.replace('/(tabs)/home');
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.screenPadding }]}>
        <MaterialCommunityIcons name="camera-off" size={48} color={colors.accent.coral} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Quest Overworld needs camera access to scan physical checkpoint QR markers on campus.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top HUD Nav */}
      <View style={styles.topHud}>
        <TouchableOpacity
          style={styles.hudButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.hudButtonText}>‹ BACK</Text>
        </TouchableOpacity>

        <Text style={styles.hudTitle}>QR RADAR SCANNER</Text>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.hudIconBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="camera-flip" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hudIconBtn}
            onPress={() => setTorch((t) => !t)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={torch ? 'flash' : 'flash-off'}
              size={18}
              color={torch ? colors.accent.gold : '#FFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      >
        {/* Darkened Mask Overlays */}
        <View style={styles.maskContainer}>
          <View style={styles.maskTop} />

          <View style={styles.maskCenterRow}>
            <View style={styles.maskSide} />

            {/* Target Reticle Box */}
            <View style={styles.scanBox}>
              {/* Corner Accents */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Animated Laser Line */}
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: laserAnim }],
                  },
                ]}
              />

              {verifying ? (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color={colors.accent.gold} />
                  <Text style={styles.verifyingText}>Verifying GPS & Key...</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.maskSide} />
          </View>

          <View style={styles.maskBottom}>
            <Text style={styles.instructionText}>
              Align campus checkpoint QR marker within the target frame
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={colors.accent.coral} />
                <Text style={styles.errorMsg}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError('');
                    setScanned(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>TAP TO RETRY</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Manual Entry Fallback */}
            {!manualMode ? (
              <Pressable style={styles.manualToggle} onPress={() => setManualMode(true)}>
                <Text style={styles.manualToggleText}>Keyboard Entry Fallback ›</Text>
              </Pressable>
            ) : (
              <View style={styles.manualContainer}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. QST-CHK-01-OAK"
                  placeholderTextColor="#7E75A0"
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.manualSubmit}
                  onPress={handleManualSubmit}
                  disabled={verifying}
                  activeOpacity={0.8}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color={colors.bg.dusk} />
                  ) : (
                    <Text style={styles.manualSubmitText}>VERIFY</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </CameraView>

      {/* Level-Up Reward Fanfare Modal */}
      {rewardData ? (
        <RewardModal
          visible={rewardVisible}
          points={rewardData.pointsAwarded || 100}
          title="CHECKPOINT CONQUERED!"
          message={rewardData.message}
          nextClue={rewardData.nextClue}
          isQuestCompleted={rewardData.isQuestCompleted}
          onDismiss={handleRewardDismiss}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHud: {
    position: 'absolute',
    top: 50,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 26, 51, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  hudButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#322A54',
  },
  hudButtonText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  hudTitle: {
    ...typography.caption,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.2,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 6,
  },
  hudIconBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#322A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskContainer: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
  },
  maskCenterRow: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.accent.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 2.5,
    backgroundColor: colors.accent.gold,
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 26, 51, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifyingText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  instructionText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent.coral,
    padding: spacing.md,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  errorMsg: {
    ...typography.caption,
    color: colors.accent.coral,
    textAlign: 'center',
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 2,
  },
  retryButtonText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.coral,
  },
  manualToggle: {
    paddingVertical: spacing.xs,
  },
  manualToggleText: {
    ...typography.bodyMd,
    color: colors.accent.gold,
    fontWeight: '700',
  },
  manualContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#FFF',
    ...typography.monoSm,
    fontSize: 14,
  },
  manualSubmit: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  permissionTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  permissionText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent.gold,
    borderRadius: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
    width: '100%',
  },
  primaryButtonText: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: colors.bg.dusk,
  },
  backLink: {
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  backLinkText: {
    ...typography.bodyMd,
    color: colors.accent.gold,
    fontWeight: '700',
  },
});
