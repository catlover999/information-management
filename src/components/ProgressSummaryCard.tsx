import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, Shadows, Spacing } from '../theme';

interface ProgressSummaryCardProps {
  totalCount: number;
  checkedCount: number;
  onAddPress: () => void;
}

export const ProgressSummaryCard: React.FC<ProgressSummaryCardProps> = ({
  totalCount,
  checkedCount,
  onAddPress,
}) => {
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statsColumn}>
          <Text style={styles.label}>EMERGENCY PREPAREDNESS</Text>
          <View style={styles.countRow}>
            <Text style={styles.countPrimary}>{checkedCount}</Text>
            <Text style={styles.countTotal}> / {totalCount} stocked</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{percentage}%</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
          activeOpacity={0.85}
          testID="add-item-header-button">
          <Text style={styles.addButtonIcon}>＋</Text>
          <Text style={styles.addButtonLabel}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(0, percentage))}%` },
          ]}
        />
      </View>

      <View style={styles.hintRow}>
        <Text style={styles.hintText}>
          Tap any item for details • Hold & drag ⠿ handle to reorder
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statsColumn: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countPrimary: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: Colors.navyPrimary,
  },
  countTotal: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  percentBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  percentText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.greenDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  addButtonIcon: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    marginRight: 4,
  },
  addButtonLabel: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textOnPrimary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.navySoft,
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.greenPrimary,
    borderRadius: BorderRadius.pill,
  },
  hintRow: {
    marginTop: Spacing.sm,
  },
  hintText: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
    color: Colors.textMuted,
  },
});
