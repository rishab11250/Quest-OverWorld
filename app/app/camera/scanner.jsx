import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

        <Text style={styles.hudTitle}>QR VIEW categorizer</Text>

        <TouchableOpacity
          style={styles.hudButton}
          onPress={() => setTorch((t) => !t)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={torch ? 'flash' : 'flash-off'}
            size={20}
            color={torch ? colors.accent.gold : '#FFF'}
          />
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
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
            <View style={styles.reticleBox}>
              {/* Corner Pixel Accents */}
              <View style={[styles.reticleCorner, styles.cornerTL]} />
              <View style={[styles.reticleCorner, styles.cornerTR]} />
              <View style={[styles.reticleCorner, styles.cornerBL]} />
              <View style={[styles.reticleCorner, styles.cornerBR]} />

              {/* Scanning Laser Line */}
              {!verifying && !scanned ? (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      transform: [{ translateY: laserAnim }],
                    },
                  ]}
                />
              ) : null}

              {verifying ? (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color={colors.accent.gold} />
                  <Text style={styles.verifyingText}>VERIFYING GPS & QR...</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.maskSide} />
          </View>

          <View style={styles.maskBottom}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setError('');
                    setScanned(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>SCAN AGAIN</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.hintText}>Align checkpoint QR code inside target reticle</Text>
            )}

            {/* Manual Code Entry Toggle */}
            <TouchableOpacity
              style={styles.manualToggle}
              onPress={() => setManualMode((m) => !m)}
              activeOpacity={0.8}
            >
              <Text style={styles.manualToggleText}>
                {manualMode ? '‹ Close Manual Input' : '⌨️ Enter Code Manually'}
              </Text>
            </TouchableOpacity>

            {manualMode ? (
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
                  <Text style={styles.manualSubmitText}>VERIFY</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </CameraView>

      {/* Celebration Reward Modal */}
      <RewardModal
        visible={rewardVisible}
        points={rewardData?.pointsAwarded || 100}
        checkpointTitle={rewardData?.clearedCheckpoint?.title || 'Checkpoint Cleared'}
        checkpointOrder={rewardData?.clearedCheckpoint?.order || 1}
        nextClue={rewardData?.nextClue}
        isQuestCompleted={rewardData?.isQuestCompleted}
        onDismiss={handleRewardDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHud: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    zIndex: 20,
  },
  hudButton: {
    backgroundColor: 'rgba(23, 19, 38, 0.75)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  hudButtonText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.accent.gold,
  },
  hudTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  maskContainer: {
    flex: 1,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.7)',
  },
  maskCenterRow: {
    flexDirection: 'row',
    height: SCAN_BOX_SIZE,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.7)',
  },
  reticleBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 75, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  reticleCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.accent.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserLine: {
    height: 2,
    backgroundColor: colors.accent.gold,
    shadowColor: colors.accent.gold,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 19, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifyingText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.accent.gold,
    letterSpacing: 1,
  },
  maskBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(15, 12, 28, 0.7)',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.md,
  },
  hintText: {
    ...typography.bodyMd,
    color: colors.text.onDark.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(232, 102, 75, 0.95)',
    borderRadius: 8,
    padding: spacing.md,
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    ...typography.bodyMd,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 4,
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
