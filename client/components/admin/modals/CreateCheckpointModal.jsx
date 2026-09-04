import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import spacing from '../../../theme/spacing';
import AdminLocationPickerMap from '../AdminLocationPickerMap';
import { triggerHaptic } from '../../../lib/haptics';
import styles from './adminModalStyles';

export default function CreateCheckpointModal({
  visible,
  onClose,
  onSave,
  form,
  setForm,
  existingCheckpoints = [],
  quests = [],
  onOpenCreateQuest,
}) {
  const [modalStep, setModalStep] = useState('map');

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
                {/* Coordinates preview chip */}
                <View style={styles.coordsChip}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14}
                    color={colors.accent.green}
                  />
                  <Text style={styles.coordsChipText}>
                    {form.latitude && form.longitude
                      ? `GPS SET: ${Number(form.latitude).toFixed(4)}°, ${Number(form.longitude).toFixed(4)}° (±${form.radius || 50}m)`
                      : 'No GPS pin selected yet.'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalStep('map')}>
                    <Text style={styles.changeLocLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Quest Selector */}
                <View style={styles.fieldGroup}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={styles.inputLabel}>ASSIGN TO QUEST</Text>
                    {onOpenCreateQuest ? (
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic('light');
                          onClose();
                          onOpenCreateQuest();
                        }}
                      >
                        <Text
                          style={[
                            styles.inputLabel,
                            { color: colors.accent.gold, textDecorationLine: 'underline' },
                          ]}
                        >
                          + New Quest
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

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
                              setForm({ ...form, questId: q._id });
                            }}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons
                              name={isSelected ? 'compass' : 'compass-outline'}
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
