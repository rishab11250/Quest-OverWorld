import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import AdminLocationPickerMap, { CAMPUS_LANDMARKS } from './AdminLocationPickerMap';
import { triggerHaptic } from '../../lib/haptics';

export function CreateQuestModal({ visible, onClose, onSave, form, setForm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '92%' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Create New Quest</Text>
                <Text style={styles.modalSub}>
                  Define the expedition name, lore, and point budget
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={colors.text.onDark.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>QUEST NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chronicles of the North Quad"
                placeholderTextColor="#7E75A0"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>LORE & EXPEDITION BRIEFING</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Uncover hidden relics across the ancient quad..."
                placeholderTextColor="#7E75A0"
                multiline
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            </View>

            <View style={styles.inlineInputs}>
              <View style={[styles.fieldGroup, { flex: 1.4 }]}>
                <Text style={styles.inputLabel}>CAMPUS / ZONE LABEL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Main Campus · North Block"
                  placeholderTextColor="#7E75A0"
                  value={form.campus}
                  onChangeText={(t) => setForm({ ...form, campus: t })}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 0.8 }]}>
                <Text style={styles.inputLabel}>XP BUDGET</Text>
                <TextInput
                  style={styles.input}
                  placeholder="700"
                  placeholderTextColor="#7E75A0"
                  keyboardType="numeric"
                  value={String(form.totalPoints || '')}
                  onChangeText={(t) => setForm({ ...form, totalPoints: t })}
                />
              </View>
            </View>

            <View style={styles.questInfoNote}>
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={colors.text.onDark.secondary}
              />
              <Text style={styles.questInfoNoteText}>
                GPS checkpoint locations are set per-station, not per-quest. Add stations after
                creating this quest.
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={onSave}>
                <Text style={styles.modalSaveText}>Create Quest</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function CreateCheckpointModal({
  visible,
  onClose,
  onSave,
  form,
  setForm,
  existingCheckpoints = [],
  quests = [],
  onOpenCreateQuest,
}) {
  const [modalStep, setModalStep] = useState('map'); // 'map' or 'details'

  const selectedLoc =
    form.latitude && form.longitude
      ? {
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          landmarkName: form.landmarkName || '',
        }
      : null;

  const handleLocationChange = (coords) => {
    setForm((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
      landmarkName: coords.landmarkName || prev.landmarkName,
      title: prev.title || coords.landmarkName || '',
    }));
  };

  const handleRadiusChange = (r) => {
    setForm((prev) => ({ ...prev, radius: String(r) }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '92%' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add Checkpoint Station</Text>
                <Text style={styles.modalSub}>
                  {modalStep === 'map'
                    ? 'Step 1: Tap map to drop exact physical beacon pin'
                    : 'Step 2: Configure clue prompt and secret QR code'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={colors.text.onDark.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Step Navigation Tabs */}
            <View style={styles.stepTabRow}>
              <TouchableOpacity
                style={[styles.stepTabBtn, modalStep === 'map' && styles.stepTabBtnActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setModalStep('map');
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={15}
                  color={modalStep === 'map' ? colors.accent.gold : colors.text.onDark.secondary}
                />
                <Text style={[styles.stepTabText, modalStep === 'map' && styles.stepTabTextActive]}>
                  1. MAP PIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepTabBtn, modalStep === 'details' && styles.stepTabBtnActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setModalStep('details');
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={15}
                  color={
                    modalStep === 'details' ? colors.accent.gold : colors.text.onDark.secondary
                  }
                />
                <Text
                  style={[styles.stepTabText, modalStep === 'details' && styles.stepTabTextActive]}
                >
                  2. CLUES & QR
                </Text>
              </TouchableOpacity>
            </View>

            {modalStep === 'map' ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={styles.inputLabel}>CAMPUS MAP PIN (TAP OR DRAG TARGET)</Text>
                <AdminLocationPickerMap
                  selectedLocation={selectedLoc}
                  onLocationChange={handleLocationChange}
                  existingCheckpoints={existingCheckpoints}
                  radius={Number(form.radius) || 50}
                  onRadiusChange={handleRadiusChange}
                  readOnly={false}
                />

                <TouchableOpacity
                  style={[styles.modalSave, { marginTop: 10 }]}
                  onPress={() => {
                    triggerHaptic('medium');
                    setModalStep('details');
                  }}
                >
                  <Text style={styles.modalSaveText}>Confirm Location & Continue →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {/* Active Pin Coordinates Chip */}
                <View style={styles.coordsChip}>
                  <MaterialCommunityIcons name="pin" size={14} color={colors.accent.green} />
                  <Text style={styles.coordsChipText}>
                    Location: {Number(form.latitude || 28.5458).toFixed(4)},{' '}
                    {Number(form.longitude || 77.1926).toFixed(4)} (±{form.radius || 50}m)
                  </Text>
                  <TouchableOpacity onPress={() => setModalStep('map')}>
                    <Text style={styles.changeLocLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Quest Assignment Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>ATTACH TO QUEST EXPEDITION</Text>
                  {quests && quests.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.questPickerRow}
                    >
                      {quests.map((q) => {
                        const isSelected = form.questId === q._id;
                        return (
                          <TouchableOpacity
                            key={q._id}
                            style={[
                              styles.questPickerChip,
                              isSelected && styles.questPickerChipActive,
                            ]}
                            onPress={() => {
                              triggerHaptic('selection');
                              setForm((prev) => ({ ...prev, questId: q._id }));
                            }}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons
                              name={isSelected ? 'shield-check' : 'shield-outline'}
                              size={14}
                              color={isSelected ? colors.accent.gold : colors.text.onDark.secondary}
                            />
                            <Text
                              style={[
                                styles.questPickerChipText,
                                isSelected && styles.questPickerChipTextActive,
                              ]}
                            >
                              {q.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <View style={styles.noQuestNoticeBox}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={16}
                        color={colors.accent.coral}
                      />
                      <Text style={styles.noQuestNoticeText}>
                        No quests created yet. Please create a quest first before adding stations.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>STATION TITLE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Clocktower Belfry Arch"
                    placeholderTextColor="#7E75A0"
                    value={form.title}
                    onChangeText={(t) => setForm({ ...form, title: t })}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>SECRET CLUE / RIDDLE</Text>
                  <TextInput
                    style={[styles.input, { height: 65 }]}
                    placeholder="Ascend thirty steps to where time looks down..."
                    placeholderTextColor="#7E75A0"
                    multiline
                    value={form.clue}
                    onChangeText={(t) => setForm({ ...form, clue: t })}
                  />
                </View>

                {/* Auto QR Generation Badge */}
                <View style={styles.autoQrPill}>
                  <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.accent.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.autoQrTitle}>AUTOMATIC CRYPTO QR BEACON</Text>
                    <Text style={styles.autoQrSub}>
                      A random non-sequential token & high-res QR code image will be generated
                      automatically.
                    </Text>
                  </View>
                </View>

                <View style={styles.inlineInputs}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>STATION # ORDER</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5"
                      placeholderTextColor="#7E75A0"
                      keyboardType="numeric"
                      value={String(form.order || '')}
                      onChangeText={(t) => setForm({ ...form, order: t })}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>XP POINTS</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 150"
                      placeholderTextColor="#7E75A0"
                      keyboardType="numeric"
                      value={String(form.points || '')}
                      onChangeText={(t) => setForm({ ...form, points: t })}
                    />
                  </View>
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setModalStep('map')}>
                    <Text style={styles.modalCancelText}>← Back to Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSave} onPress={onSave}>
                    <Text style={styles.modalSaveText}>Save Station</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function CheckpointQrPreviewModal({ visible, onClose, checkpoint, qrImage }) {
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

      // Strip data URI prefix if present
      const base64Data = qrImage.includes('base64,') ? qrImage.split('base64,')[1] : qrImage;

      const safeOrder = checkpoint.order || 1;
      const safeToken = checkpoint.qrCode || 'beacon';
      const fileUri = `${FileSystem.cacheDirectory}quest_beacon_station_${safeOrder}_${safeToken}.png`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      // Request media library permission and save to gallery
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert(
          '✅ Saved to Gallery',
          'QR beacon image saved to your Photos. You can also share it below.',
          [
            {
              text: 'Share',
              onPress: async () => {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/png',
                    dialogTitle: `Share QR Beacon: ${checkpoint.title}`,
                    UTI: 'public.png',
                  });
                }
              },
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      } else {
        // Fallback to share sheet if permission denied
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `Save / Print QR Beacon: ${checkpoint.title}`,
            UTI: 'public.png',
          });
        } else {
          Alert.alert('Permission Required', 'Allow storage access to save the QR image.');
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

          {/* QR Image Box */}
          {qrImage ? (
            <View style={styles.qrImageContainer}>
              <Image source={{ uri: qrImage }} style={styles.qrImage} />
            </View>
          ) : (
            <View style={[styles.qrImageContainer, { justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="qrcode" size={140} color="#3D3560" />
            </View>
          )}

          {/* Token String & Copy Button */}
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

          {/* QR Action Buttons: Download/Share & Close */}
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

const BOUNTY_CATEGORIES = [
  { id: 'photo', label: 'PHOTO', icon: 'camera', mode: 'manual_review' },
  { id: 'riddle', label: 'RIDDLE', icon: 'puzzle', mode: 'auto_verify' },
  { id: 'trivia', label: 'TRIVIA', icon: 'help-circle', mode: 'auto_verify' },
  { id: 'creative', label: 'CREATIVE', icon: 'palette', mode: 'manual_review' },
];

export function CreateChallengeModal({ visible, onClose, onSave, form, setForm }) {
  const currentCat = (form.category || 'photo').toLowerCase();

  const handleSelectCategory = (cat) => {
    triggerHaptic('selection');
    setForm((prev) => ({
      ...prev,
      category: cat.id,
      verificationType: cat.mode,
    }));
  };

  const isAutoVerify = currentCat === 'riddle' || currentCat === 'trivia';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '92%' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add Special Bounty</Text>
                <Text style={styles.modalSub}>
                  Create side quests & bounties for the live Bounty Board
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={colors.text.onDark.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>BOUNTY TITLE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Master of the Campus Library"
                placeholderTextColor="#7E75A0"
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>TASK OBJECTIVE & PROMPT</Text>
              <TextInput
                style={[styles.input, { height: 65 }]}
                placeholder="Find the copper plaque on the second floor and..."
                placeholderTextColor="#7E75A0"
                multiline
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            </View>

            {/* 1-Tap Category Selector Grid */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>BOUNTY CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {BOUNTY_CATEGORIES.map((cat) => {
                  const isSelected = currentCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      onPress={() => handleSelectCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon}
                        size={16}
                        color={isSelected ? colors.accent.gold : colors.text.onDark.secondary}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && styles.categoryPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Answer Key / Verification Mode Banner */}
            {isAutoVerify ? (
              <View style={styles.fieldGroup}>
                <View style={styles.verificationBadgeBox}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={16}
                    color={colors.accent.green}
                  />
                  <Text style={styles.verificationBadgeText}>
                    AUTO-VERIFY WITH SECRET ANSWER KEY
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Secret Solution / Passcode (Case-Insensitive)"
                  placeholderTextColor="#7E75A0"
                  value={form.answerKey}
                  onChangeText={(t) => setForm({ ...form, answerKey: t })}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.verificationBadgeBox,
                  { backgroundColor: 'rgba(242, 200, 75, 0.1)', borderColor: colors.accent.gold },
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-account"
                  size={16}
                  color={colors.accent.gold}
                />
                <Text style={[styles.verificationBadgeText, { color: colors.accent.gold }]}>
                  MANUAL REVIEW · SUBMISSIONS GO TO ADMIN REVIEW QUEUE
                </Text>
              </View>
            )}

            {currentCat === 'creative' ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={styles.inputLabel}>CREATIVE XP RANGE (LOW — HIGH)</Text>
                <View style={styles.inlineInputs}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.inputSubLabel}>MIN XP (LOW)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 50"
                      placeholderTextColor="#7E75A0"
                      keyboardType="numeric"
                      value={String(form.minPoints || '50')}
                      onChangeText={(t) => setForm({ ...form, minPoints: t })}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.inputSubLabel}>MAX XP (HIGH)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 250"
                      placeholderTextColor="#7E75A0"
                      keyboardType="numeric"
                      value={String(form.maxPoints || form.points || '200')}
                      onChangeText={(t) => setForm({ ...form, maxPoints: t, points: t })}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>XP REWARD POINTS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 150"
                  placeholderTextColor="#7E75A0"
                  keyboardType="numeric"
                  value={String(form.points || '')}
                  onChangeText={(t) => setForm({ ...form, points: t })}
                />
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={onSave}>
                <Text style={styles.modalSaveText}>Create Bounty</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function RejectFeedbackModal({ visible, onClose, onConfirm, feedback, setFeedback }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { color: colors.accent.coral }]}>Reject Submission</Text>
          <Text style={styles.modalSub}>
            Provide feedback so the party can resubmit with valid proof:
          </Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="e.g. Photo was blurry or landmark was out of frame"
            placeholderTextColor="#7E75A0"
            multiline
            value={feedback}
            onChangeText={setFeedback}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BanPlayerModal({ visible, onClose, onConfirm, player, reason, setReason }) {
  if (!player) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { color: colors.accent.coral }]}>Ban Adventurer</Text>
          <Text style={styles.modalSub}>
            Suspending <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</Text> (
            {player.email}) will immediately lock their account and revoke party rewards.
          </Text>

          <TextInput
            style={[styles.input, { height: 70, marginTop: 8 }]}
            placeholder="Reason for ban (e.g. GPS spoofing, abusive conduct)..."
            placeholderTextColor="#7E75A0"
            multiline
            value={reason}
            onChangeText={setReason}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Confirm Ban</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function DeletePlayerModal({ visible, onClose, onConfirm, player, loading = false }) {
  if (!player) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, styles.deleteModalCard]}>
          {/* Header Warning Tag */}
          <View style={styles.deleteHeaderBadge}>
            <MaterialCommunityIcons name="alert-octagon" size={15} color={colors.accent.coral} />
            <Text style={styles.deleteHeaderBadgeText}>PERMANENT DELETION</Text>
          </View>

          <Text style={[styles.modalTitle, { color: colors.accent.coral, marginTop: 4 }]}>
            Delete Adventurer
          </Text>

          <Text style={styles.modalSub}>
            You are about to permanently delete this player from the game.
          </Text>

          {/* Player Identity Details */}
          <View style={styles.deletePlayerCard}>
            <View style={styles.deleteAvatarBox}>
              <Text style={styles.deleteAvatarText}>
                {(player.name || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deletePlayerName}>{player.name}</Text>
              <Text style={styles.deletePlayerEmail}>{player.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                <View style={styles.deletePill}>
                  <Text style={styles.deletePillText}>
                    GUILD: {player.team ? player.team.name : 'None'}
                  </Text>
                </View>
                <View style={[styles.deletePill, { borderColor: 'rgba(232, 102, 75, 0.4)' }]}>
                  <Text style={[styles.deletePillText, { color: colors.accent.coral }]}>
                    BANNED
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Warning Callout Box */}
          <View style={styles.deleteWarningBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color={colors.accent.coral}
            />
            <Text style={styles.deleteWarningText}>
              This will permanently delete their account, game progress, and remove them from all
              guilds. This cannot be undone.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose} disabled={loading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FFF" />
                  <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Delete Player</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BanGuildModal({ visible, onClose, onConfirm, guild, reason, setReason }) {
  if (!guild) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={[styles.modalTitle, { color: colors.accent.coral }]}>
            🚫 Ban Guild Party
          </Text>
          <Text style={styles.modalSub}>
            Banning{' '}
            <Text style={{ color: colors.accent.gold, fontWeight: '800' }}>{guild.name}</Text> will
            lock all party members from verifying checkpoints and solving bounties.
          </Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Reason for guild penalty / ban (optional)..."
            placeholderTextColor="#7E75A0"
            multiline
            value={reason}
            onChangeText={setReason}
          />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, { backgroundColor: colors.accent.coral }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalSaveText, { color: '#FFF' }]}>Confirm Guild Ban</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  modalTitle: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  modalSub: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    fontSize: 12,
  },
  stepTabRow: {
    flexDirection: 'row',
    backgroundColor: '#171326',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3560',
    padding: 4,
    gap: 6,
    marginBottom: 6,
  },
  stepTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 5,
  },
  stepTabBtnActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  stepTabText: {
    ...typography.displayPixelXs,
    fontSize: 8.5,
    color: colors.text.onDark.secondary,
  },
  stepTabTextActive: {
    color: colors.accent.gold,
    fontWeight: '900',
  },
  coordsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(62, 207, 142, 0.12)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  coordsChipText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.green,
    flex: 1,
  },
  changeLocLink: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.gold,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  questInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(126, 117, 160, 0.12)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(61, 53, 96, 0.8)',
  },
  questInfoNoteText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.onDark.secondary,
    flex: 1,
    lineHeight: 14,
  },
  questPickerRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  questPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  questPickerChipActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.18)',
    borderColor: colors.accent.gold,
  },
  questPickerChipText: {
    ...typography.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  questPickerChipTextActive: {
    color: colors.accent.gold,
    fontWeight: '800',
  },
  noQuestNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.3)',
  },
  noQuestNoticeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.accent.coral,
    flex: 1,
  },
  fieldGroup: {
    gap: 3,
  },
  inputLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  inputSubLabel: {
    ...typography.captionBold,
    fontSize: 9.5,
    color: colors.text.onDark.secondary,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bg.dusk,
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#FFF',
    ...typography.bodyMd,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
  },
  modalCancelText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  modalSave: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalSaveText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  autoQrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 8,
  },
  autoQrTitle: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
  },
  autoQrSub: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171326',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    gap: 6,
    maxWidth: 280,
  },
  tokenLabel: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
  },
  tokenVal: {
    ...typography.displayPixelXs,
    fontSize: 8.5,
    color: colors.accent.green,
    fontWeight: '900',
    flex: 1,
  },
  copyHintText: {
    ...typography.caption,
    fontSize: 8,
    color: colors.accent.gold,
    fontWeight: '800',
  },
  qrShareBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.md,
    borderRadius: 6,
  },
  qrShareBtnText: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.bg.dusk,
  },
  qrPrintTip: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    fontSize: 11,
    marginVertical: 4,
  },
  deleteModalCard: {
    borderColor: 'rgba(232, 102, 75, 0.6)',
    backgroundColor: '#191528',
  },
  deleteHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(232, 102, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent.coral,
  },
  deleteHeaderBadgeText: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.coral,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  deletePlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#130F20',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  deleteAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(232, 102, 75, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.accent.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAvatarText: {
    ...typography.headingLg,
    color: colors.accent.coral,
    fontWeight: '900',
  },
  deletePlayerName: {
    ...typography.bodyMdBold,
    color: colors.text.onDark.primary,
    fontSize: 14,
  },
  deletePlayerEmail: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    fontSize: 11,
  },
  deletePill: {
    backgroundColor: '#1E1A33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3560',
  },
  deletePillText: {
    ...typography.displayPixelXs,
    fontSize: 7,
    color: colors.text.onDark.secondary,
  },
  deleteWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(232, 102, 75, 0.12)',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 75, 0.3)',
  },
  deleteWarningText: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.accent.coral,
    flex: 1,
    lineHeight: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C172E',
    borderWidth: 1,
    borderColor: '#3D3560',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryPillActive: {
    borderColor: colors.accent.gold,
    backgroundColor: '#2A2010',
  },
  categoryPillText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.text.onDark.secondary,
  },
  categoryPillTextActive: {
    color: colors.accent.gold,
    fontWeight: '800',
  },
  verificationBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(95, 191, 122, 0.1)',
    borderWidth: 1,
    borderColor: colors.accent.green,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    marginBottom: 4,
  },
  verificationBadgeText: {
    ...typography.captionBold,
    fontSize: 9,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
});
