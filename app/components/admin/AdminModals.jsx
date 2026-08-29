import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';
import AdminLocationPickerMap, { CAMPUS_LANDMARKS } from './AdminLocationPickerMap';
import { triggerHaptic } from '../../lib/haptics';

export function CreateQuestModal({
  visible,
  onClose,
  onSave,
  form,
  setForm,
  existingCheckpoints = [],
  existingQuests = [],
}) {
  const selectedLoc = {
    latitude: Number(form.latitude) || 28.5458,
    longitude: Number(form.longitude) || 77.1926,
    landmarkName: form.campus || 'Main Quad Territory',
  };

  const handleLocationChange = (coords) => {
    setForm((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
      campus: coords.landmarkName || prev.campus,
    }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '92%' }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Create New Campus Quest</Text>
                <Text style={styles.modalSub}>Configure quest realm, territory, and objectives</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
              </TouchableOpacity>
            </View>

            {/* Interactive Territory Map */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PRIMARY REALM TERRITORY & EXISTING CHECKPOINTS</Text>
              <AdminLocationPickerMap
                selectedLocation={selectedLoc}
                onLocationChange={handleLocationChange}
                existingCheckpoints={existingCheckpoints}
                existingQuests={existingQuests}
                readOnly={false}
              />
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
                style={[styles.input, { height: 65 }]}
                placeholder="Uncover hidden relics across the ancient quad..."
                placeholderTextColor="#7E75A0"
                multiline
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            </View>

            <View style={styles.inlineInputs}>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>CAMPUS ZONE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Main Quad Campus"
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
}) {
  const [modalStep, setModalStep] = useState('map'); // 'map' or 'details'

  const selectedLoc = {
    latitude: Number(form.latitude) || 28.5458,
    longitude: Number(form.longitude) || 77.1926,
    landmarkName: form.landmarkName || '',
  };

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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
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
                <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
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
              >
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={14}
                  color={modalStep === 'map' ? colors.accent.gold : colors.text.onDark.secondary}
                />
                <Text style={[styles.stepTabText, modalStep === 'map' && styles.stepTabTextActive]}>
                  1. MAP LOCATION
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepTabBtn, modalStep === 'details' && styles.stepTabBtnActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setModalStep('details');
                }}
              >
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={14}
                  color={modalStep === 'details' ? colors.accent.gold : colors.text.onDark.secondary}
                />
                <Text style={[styles.stepTabText, modalStep === 'details' && styles.stepTabTextActive]}>
                  2. DETAILS & CLUES
                </Text>
              </TouchableOpacity>
            </View>

            {modalStep === 'map' ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={styles.inputLabel}>INTERACTIVE CAMPUS PIN DROP (TAP ANYWHERE)</Text>
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
                    Location: {Number(form.latitude || 28.5458).toFixed(4)}, {Number(form.longitude || 77.1926).toFixed(4)} (±{form.radius || 50}m)
                  </Text>
                  <TouchableOpacity onPress={() => setModalStep('map')}>
                    <Text style={styles.changeLocLink}>Change</Text>
                  </TouchableOpacity>
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
                      A random non-sequential token & high-res QR code image will be generated automatically.
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
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setModalStep('map')}
                  >
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
  if (!checkpoint) return null;

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

          {/* Token String */}
          <View style={styles.tokenPill}>
            <Text style={styles.tokenLabel}>PAYLOAD TOKEN:</Text>
            <Text style={styles.tokenVal} numberOfLines={1}>
              {checkpoint.qrCode || 'AUTO-GENERATED'}
            </Text>
          </View>

          <Text style={styles.qrPrintTip}>
            Print or display this beacon physically at the checkpoint GPS location.
          </Text>

          <View style={[styles.modalBtnRow, { width: '100%' }]}>
            <TouchableOpacity style={styles.modalSave} onPress={onClose}>
              <Text style={styles.modalSaveText}>Done / Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function CreateChallengeModal({ visible, onClose, onSave, form, setForm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Special Bounty</Text>
          <TextInput
            style={styles.input}
            placeholder="Bounty Title"
            placeholderTextColor="#7E75A0"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
          <TextInput
            style={[styles.input, { height: 70 }]}
            placeholder="Description & Task Objective"
            placeholderTextColor="#7E75A0"
            multiline
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Category (photo, riddle, trivia, creative)"
            placeholderTextColor="#7E75A0"
            value={form.category}
            onChangeText={(t) => setForm({ ...form, category: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Points Awarded"
            placeholderTextColor="#7E75A0"
            keyboardType="numeric"
            value={form.points}
            onChangeText={(t) => setForm({ ...form, points: t })}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={onSave}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
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
            Suspending <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</Text> ({player.email}) will immediately lock their account and revoke party rewards.
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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3560',
    padding: 3,
    gap: 4,
    marginBottom: 6,
  },
  stepTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 4,
  },
  stepTabBtnActive: {
    backgroundColor: 'rgba(242, 200, 75, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent.gold,
  },
  stepTabText: {
    ...typography.displayPixelXs,
    fontSize: 8,
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
  fieldGroup: {
    gap: 3,
  },
  inputLabel: {
    ...typography.displayPixelXs,
    fontSize: 7.5,
    color: colors.accent.gold,
    letterSpacing: 0.8,
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
  },
  qrPrintTip: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    fontSize: 11,
    marginVertical: 4,
  },
});
