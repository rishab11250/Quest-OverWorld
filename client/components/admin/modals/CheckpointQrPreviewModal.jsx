import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import colors from '../../../theme/colors';
import { triggerHaptic } from '../../../lib/haptics';
import styles from './adminModalStyles';

export default function CheckpointQrPreviewModal({ visible, onClose, checkpoint, qrImage }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!checkpoint) return null;

  const handleShareQrImage = async () => {
    if (!qrImage) {
      Alert.alert('QR Not Ready', 'QR image is still loading. Please try again.');
      return;
    }
    try {
      setSharing(true);
      triggerHaptic('light');

      const base64Data = qrImage.includes('base64,') ? qrImage.split('base64,')[1] : qrImage;
      const safeOrder = checkpoint.order || 1;
      const safeToken = checkpoint.qrCode || 'beacon';
      const fileUri = `${FileSystem.cacheDirectory}quest_beacon_station_${safeOrder}_${safeToken}.png`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert(
          '✅ Saved to Gallery',
          'QR beacon image saved to your Photos. You can also share it below.',
          [
            { text: 'Done', style: 'cancel' },
            {
              text: 'Open System Share',
              onPress: async () => {
                try {
                  const Sharing = require('expo-sharing');
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                      mimeType: 'image/png',
                      dialogTitle: `Station #${safeOrder} QR Beacon Code`,
                      UTI: 'public.png',
                    });
                  }
                } catch (shareErr) {
                  console.error('System share error:', shareErr);
                }
              },
            },
          ]
        );
      } else {
        const Sharing = require('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `Station #${safeOrder} QR Beacon Code`,
            UTI: 'public.png',
          });
        }
      }
    } catch (err) {
      Alert.alert('Export Failed', err.message || 'Could not export QR beacon image.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToken = async () => {
    if (!checkpoint.qrCode) return;
    try {
      triggerHaptic('selection');
      await Clipboard.setStringAsync(checkpoint.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center' }]}>
          <Text style={styles.modalTitle}>BEACON QR CODE</Text>
          <Text style={[styles.modalSub, { textAlign: 'center' }]}>
            Station #{checkpoint.order} · {checkpoint.title}
          </Text>

          {qrImage ? (
            <View style={styles.qrImageContainer}>
              <Image source={{ uri: qrImage }} style={styles.qrImage} />
            </View>
          ) : (
            <View style={[styles.qrImageContainer, { justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="qrcode" size={140} color="#3D3560" />
            </View>
          )}

          <TouchableOpacity style={styles.tokenPill} onPress={handleCopyToken} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={copied ? 'check-bold' : 'content-copy'}
              size={14}
              color={copied ? colors.accent.green : colors.accent.gold}
            />
            <Text style={styles.tokenLabel}>TOKEN:</Text>
            <Text style={styles.tokenVal} numberOfLines={1}>
              {checkpoint.qrCode || 'AUTO-GENERATED'}
            </Text>
            <Text style={[styles.copyHintText, copied && { color: colors.accent.green }]}>
              {copied ? 'COPIED!' : 'TAP TO COPY'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.qrPrintTip}>
            Save, print, or post this QR beacon at the physical GPS station.
          </Text>

          <View style={[styles.modalBtnRow, { width: '100%', gap: 8 }]}>
            <TouchableOpacity
              style={styles.qrShareBtn}
              onPress={handleShareQrImage}
              disabled={sharing}
              activeOpacity={0.8}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="download" size={16} color="#000" />
                  <Text style={styles.qrShareBtnText}>Save / Share QR</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
