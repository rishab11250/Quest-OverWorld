import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import spacing from '../../../theme/spacing';
import { triggerHaptic } from '../../../lib/haptics';
import styles from './adminModalStyles';

const BOUNTY_CATEGORIES = [
  { id: 'photo', label: 'PHOTO', icon: 'camera', mode: 'manual_review' },
  { id: 'riddle', label: 'RIDDLE', icon: 'puzzle', mode: 'auto_verify' },
  { id: 'trivia', label: 'TRIVIA', icon: 'help-circle', mode: 'auto_verify' },
  { id: 'creative', label: 'CREATIVE', icon: 'palette', mode: 'manual_review' },
];

export default function CreateChallengeModal({ visible, onClose, onSave, form, setForm }) {
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
