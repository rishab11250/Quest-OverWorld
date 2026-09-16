import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';
import PixelButton from './PixelButton';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.dialog, isDestructive ? styles.destructiveBorder : styles.goldBorder]}
            >
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              <View style={styles.buttonRow}>
                <PixelButton
                  variant="dusk"
                  title={cancelText.toUpperCase()}
                  onPress={onCancel}
                  style={{ flex: 1 }}
                />

                <PixelButton
                  variant={isDestructive ? 'coral' : 'gold'}
                  title={confirmText.toUpperCase()}
                  onPress={onConfirm}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 28, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 12,
    padding: spacing.cardPadding,
    borderWidth: 1.5,
    gap: spacing.md,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  destructiveBorder: {
    borderColor: 'rgba(232, 102, 75, 0.4)',
  },
  goldBorder: {
    borderColor: 'rgba(242, 200, 75, 0.4)',
  },
  title: {
    ...typography.headingLg,
    color: colors.text.onDark.primary,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A4170',
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
  },
  cancelButtonText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.text.onDark.secondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.minTouchTarget,
  },
  destructiveButton: {
    backgroundColor: colors.accent.coral,
  },
  goldButton: {
    backgroundColor: colors.accent.gold,
  },
  confirmButtonText: {
    ...typography.bodyMd,
    fontWeight: '700',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  goldButtonText: {
    color: colors.bg.dusk,
  },
});
