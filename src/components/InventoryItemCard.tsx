import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { InventoryCategory, InventoryItem } from '../models/inventory';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';
import { getExpiryStatus } from '../utils/dateUtils';

interface InventoryItemCardProps {
  item: InventoryItem;
  isActive: boolean;
  onToggleCheck: (id: string) => void;
  onPressItem: (item: InventoryItem) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function getCategoryStyle(category: InventoryCategory): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (category) {
    case 'Beverages':
      return { bg: '#E0F2FE', text: '#0369A1', icon: '💧' };
    case 'Food':
      return { bg: Colors.greenLight, text: Colors.greenDark, icon: '🥫' };
    case 'Additional supplies':
      return { bg: Colors.navySoft, text: Colors.navyPrimary, icon: '🔦' };
  }
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  isActive,
  onToggleCheck,
  onPressItem,
  onDragStart,
  onDragEnd,
}) => {
  const categoryTheme = getCategoryStyle(item.category);
  const expiryInfo = getExpiryStatus(item.expiryDate);

  const hasLocation = item.location.trim().length > 0;
  const hasNotes = item.notes.trim().length > 0;
  const hasExpiry = item.expiryDate !== null;

  return (
    <View
      style={[
        styles.card,
        item.checked ? styles.cardChecked : null,
        isActive ? styles.cardDragging : null,
      ]}>
      {/* Checkbox Button */}
      <TouchableOpacity
        style={styles.checkboxHitArea}
        onPress={() => onToggleCheck(item.id)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        testID={`checkbox-${item.id}`}>
        <View
          style={[
            styles.checkboxBox,
            item.checked ? styles.checkboxBoxChecked : null,
          ]}>
          {item.checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </TouchableOpacity>

      {/* Main Item Content (Tap to view details) */}
      <TouchableOpacity
        style={styles.contentArea}
        onPress={() => onPressItem(item)}
        activeOpacity={0.75}
        testID={`item-card-${item.id}`}>
        <Text
          style={[
            styles.itemName,
            item.checked ? styles.itemNameChecked : null,
          ]}
          numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.metaRow}>
          {/* Category Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: categoryTheme.bg },
            ]}>
            <Text style={[styles.badgeText, { color: categoryTheme.text }]}>
              {categoryTheme.icon} {item.category}
            </Text>
          </View>

          {/* Location Pill */}
          {hasLocation ? (
            <View style={styles.locationBadge}>
              <Text style={styles.locationBadgeText} numberOfLines={1}>
                📍 {item.location}
              </Text>
            </View>
          ) : null}

          {/* Expiry Date Pill */}
          {hasExpiry ? (
            <View
              style={[
                styles.expiryBadge,
                expiryInfo.status === 'expired'
                  ? styles.expiryExpired
                  : expiryInfo.status === 'expiring_soon'
                  ? styles.expirySoon
                  : styles.expiryValid,
              ]}>
              <Text
                style={[
                  styles.expiryText,
                  expiryInfo.status === 'expired'
                    ? styles.expiryTextExpired
                    : expiryInfo.status === 'expiring_soon'
                    ? styles.expiryTextSoon
                    : styles.expiryTextValid,
                ]}>
                🗓 {expiryInfo.label}
              </Text>
            </View>
          ) : null}

          {/* Notes Indicator */}
          {hasNotes ? (
            <View style={styles.noteBadge}>
              <Text style={styles.noteBadgeText}>📝 Note</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Dedicated Drag Handle */}
      <TouchableOpacity
        style={styles.dragHandle}
        onPressIn={onDragStart}
        onPressOut={onDragEnd}
        activeOpacity={0.6}
        accessibilityLabel="Drag to reorder item"
        testID={`drag-handle-${item.id}`}>
        <View style={styles.dragDotsColumn}>
          <Text style={styles.dragIcon}>⠿</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    ...Shadows.card,
  },
  cardChecked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardDragging: {
    backgroundColor: Colors.surface,
    borderColor: Colors.greenPrimary,
    borderWidth: 1.5,
    transform: [{ scale: 1.02 }],
    ...Shadows.floating,
  },
  checkboxHitArea: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.navyLight,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.greenPrimary,
    borderColor: Colors.greenPrimary,
  },
  checkmark: {
    fontFamily: Fonts.bold,
    color: Colors.textOnPrimary,
    fontSize: 14,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  itemName: {
    fontFamily: Fonts.semiBold,
    fontSize: 14.5,
    color: Colors.textPrimary,
    lineHeight: 21,
    marginBottom: 5,
  },
  itemNameChecked: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  locationBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 140,
  },
  locationBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  expiryValid: {
    backgroundColor: Colors.greenSoft,
  },
  expirySoon: {
    backgroundColor: Colors.warningSoft,
  },
  expiryExpired: {
    backgroundColor: Colors.dangerSoft,
  },
  expiryText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  expiryTextValid: {
    color: Colors.greenDark,
  },
  expiryTextSoon: {
    color: '#B45309',
  },
  expiryTextExpired: {
    color: Colors.danger,
  },
  noteBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  noteBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dragHandle: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragDotsColumn: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIcon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
});
