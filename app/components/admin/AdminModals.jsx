import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export function CreateQuestModal({ visible, onClose, onSave, form, setForm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Create New Quest</Text>
          <TextInput
            style={styles.input}
            placeholder="Quest Name"
            placeholderTextColor="#7E75A0"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Description / Lore"
            placeholderTextColor="#7E75A0"
            multiline
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Campus Location"
            placeholderTextColor="#7E75A0"
            value={form.campus}
            onChangeText={(t) => setForm({ ...form, campus: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Total Points Budget"
            placeholderTextColor="#7E75A0"
            keyboardType="numeric"
            value={form.totalPoints}
            onChangeText={(t) => setForm({ ...form, totalPoints: t })}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSave} onPress={onSave}>
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function CreateCheckpointModal({ visible, onClose, onSave, form, setForm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Checkpoint Station</Text>
          <TextInput
            style={styles.input}
            placeholder="Station Title (e.g. Clocktower Belfry)"
            placeholderTextColor="#7E75A0"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
          <TextInput
            style={[styles.input, { height: 70 }]}
            placeholder="Secret Clue Text"
            placeholderTextColor="#7E75A0"
            multiline
            value={form.clue}
            onChangeText={(t) => setForm({ ...form, clue: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="QR Code String (e.g. QST-CHK-01-OAK)"
            placeholderTextColor="#7E75A0"
            value={form.qrCode}
            onChangeText={(t) => setForm({ ...form, qrCode: t })}
          />
          <View style={styles.inlineInputs}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Order (#)"
              placeholderTextColor="#7E75A0"
              keyboardType="numeric"
              value={form.order}
              onChangeText={(t) => setForm({ ...form, order: t })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Points"
              placeholderTextColor="#7E75A0"
              keyboardType="numeric"
              value={form.points}
              onChangeText={(t) => setForm({ ...form, points: t })}
            />
          </View>

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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 10,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    borderColor: '#3D3560',
    gap: spacing.sm,
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
});
