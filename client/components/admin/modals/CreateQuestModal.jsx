import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import spacing from '../../../theme/spacing';
import styles from './adminModalStyles';

export default function CreateQuestModal({ visible, onClose, onSave, form, setForm }) {
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
