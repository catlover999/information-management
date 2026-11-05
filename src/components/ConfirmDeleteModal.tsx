import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';

interface ConfirmDeleteModalProps {
  visible: boolean;
  itemName?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  itemName,
  title = 'Delete Supply Item',
  description = 'Are you sure you want to remove this item from your pantry checklist? This action cannot be undone.',
  confirmLabel = 'Delete Item',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.card}>
          {/* Danger / Trash Icon Circle */}
          <View style={styles.iconCircle}>
            <View style={styles.trashIconWrapper}>
              <Text style={styles.trashIcon}>🗑️</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Item Highlight Box (if item name provided) */}
          {itemName ? (
            <View style={styles.itemBox}>
              <Text style={styles.itemBoxLabel}>ITEM TO REMOVE</Text>
              <Text style={styles.itemName} numberOfLines={2}>
                "{itemName}"
              </Text>
            </View>
          ) : null}

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
              testID="confirm-delete-cancel">
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.85}
              testID="confirm-delete-confirm">
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.modalOverlay,
    paddingHorizontal: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.floating,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
    marginBottom: Spacing.md,
  },
  trashIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: {
    fontSize: 28,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.navyPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  itemBox: {
    width: '100%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  itemBoxLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  itemName: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.navyPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1.25,
    backgroundColor: Colors.danger,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  confirmButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textOnPrimary,
  },
});
