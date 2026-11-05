import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { InventoryItem } from '../models/inventory';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';
import { formatDisplayDate, getExpiryStatus } from '../utils/dateUtils';

interface ItemDetailModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onToggleCheck: (id: string) => void;
  onEditPress: (item: InventoryItem) => void;
  onDeletePress: (item: InventoryItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onClose,
  onToggleCheck,
  onEditPress,
  onDeletePress,
}) => {
  if (!item) {
    return null;
  }

  const expiryStatus = getExpiryStatus(item.expiryDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}>
            {/* Item Title */}
            <Text style={styles.itemTitle}>{item.name}</Text>

            {/* Stocked / Checked Toggle Card */}
            <TouchableOpacity
              style={[
                styles.statusCard,
                item.checked ? styles.statusCardChecked : null,
              ]}
              onPress={() => onToggleCheck(item.id)}
              activeOpacity={0.8}>
              <View style={styles.statusLeft}>
                <View
                  style={[
                    styles.statusCheckbox,
                    item.checked ? styles.statusCheckboxChecked : null,
                  ]}>
                  {item.checked ? (
                    <Text style={styles.statusCheckmark}>✓</Text>
                  ) : null}
                </View>
                <View>
                  <Text style={styles.statusTitle}>
                    {item.checked ? 'Stocked & Ready' : 'Not Stocked Yet'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    Tap to mark as {item.checked ? 'unstocked' : 'stocked'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusPill,
                  item.checked ? styles.statusPillChecked : null,
                ]}>
                <Text
                  style={[
                    styles.statusPillText,
                    item.checked ? styles.statusPillTextChecked : null,
                  ]}>
                  {item.checked ? 'CHECKED' : 'PENDING'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Metadata Details Grid */}
            <View style={styles.metadataSection}>
              <View style={styles.metadataBox}>
                <Text style={styles.metadataLabel}>📍 STORAGE LOCATION</Text>
                <Text
                  style={[
                    styles.metadataValue,
                    !item.location ? styles.metadataEmpty : null,
                  ]}>
                  {item.location.trim() || 'No location specified'}
                </Text>
              </View>

              <View style={styles.metadataBox}>
                <Text style={styles.metadataLabel}>🗓 EXPIRY DATE</Text>
                <View style={styles.expiryDetailRow}>
                  <Text
                    style={[
                      styles.metadataValue,
                      !item.expiryDate ? styles.metadataEmpty : null,
                    ]}>
                    {formatDisplayDate(item.expiryDate)}
                  </Text>
                  {item.expiryDate ? (
                    <View
                      style={[
                        styles.expiryTag,
                        expiryStatus.status === 'expired'
                          ? styles.expiryTagDanger
                          : expiryStatus.status === 'expiring_soon'
                          ? styles.expiryTagWarning
                          : styles.expiryTagValid,
                      ]}>
                      <Text
                        style={[
                          styles.expiryTagText,
                          expiryStatus.status === 'expired'
                            ? styles.expiryTagTextDanger
                            : expiryStatus.status === 'expiring_soon'
                            ? styles.expiryTagTextWarning
                            : styles.expiryTagTextValid,
                        ]}>
                        {expiryStatus.label}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.metadataBox}>
                <Text style={styles.metadataLabel}>📝 NOTES</Text>
                <Text
                  style={[
                    styles.metadataValue,
                    !item.notes ? styles.metadataEmpty : null,
                  ]}>
                  {item.notes.trim() || 'No additional notes added'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeletePress(item)}
              activeOpacity={0.8}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditPress(item)}
              activeOpacity={0.85}>
              <Text style={styles.editButtonText}>Edit Metadata</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: Colors.modalOverlay,
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    maxHeight: '85%',
    ...Shadows.floating,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.navySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.navyPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollArea: {
    marginBottom: Spacing.lg,
  },
  itemTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    color: Colors.navyPrimary,
    lineHeight: 27,
    marginBottom: Spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  statusCardChecked: {
    backgroundColor: Colors.greenSoft,
    borderColor: Colors.greenMedium,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.navyLight,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statusCheckboxChecked: {
    backgroundColor: Colors.greenPrimary,
    borderColor: Colors.greenPrimary,
  },
  statusCheckmark: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 15,
  },
  statusTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.navyPrimary,
  },
  statusSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: Colors.navySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusPillChecked: {
    backgroundColor: Colors.greenPrimary,
  },
  statusPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.navyPrimary,
  },
  statusPillTextChecked: {
    color: Colors.textOnPrimary,
  },
  metadataSection: {
    gap: Spacing.md,
  },
  metadataBox: {
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metadataLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metadataValue: {
    fontFamily: Fonts.medium,
    fontSize: 14.5,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  metadataEmpty: {
    fontFamily: Fonts.italic,
    color: Colors.textMuted,
  },
  expiryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  expiryTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  expiryTagValid: {
    backgroundColor: Colors.greenLight,
  },
  expiryTagWarning: {
    backgroundColor: Colors.warningSoft,
  },
  expiryTagDanger: {
    backgroundColor: Colors.dangerSoft,
  },
  expiryTagText: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
  },
  expiryTagTextValid: {
    color: Colors.greenDark,
  },
  expiryTagTextWarning: {
    color: '#B45309',
  },
  expiryTagTextDanger: {
    color: Colors.danger,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.dangerSoft,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.danger,
  },
  editButton: {
    flex: 2,
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14.5,
    color: Colors.textOnPrimary,
  },
});
