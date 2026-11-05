import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FilterCategory,
  INVENTORY_CATEGORIES,
  InventoryItem,
} from '../models/inventory';
import { BorderRadius, Colors, Fonts, Spacing } from '../theme';

interface CategoryFilterBarProps {
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  items: InventoryItem[];
}

const FILTER_OPTIONS: FilterCategory[] = ['All', ...INVENTORY_CATEGORIES];

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  items,
}) => {
  const getCountForCategory = (category: FilterCategory): number => {
    if (category === 'All') {
      return items.length;
    }
    return items.filter(item => item.category === category).length;
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {FILTER_OPTIONS.map(category => {
          const isSelected = selectedCategory === category;
          const count = getCountForCategory(category);

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterPill,
                isSelected ? styles.filterPillActive : null,
              ]}
              onPress={() => onSelectCategory(category)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.filterText,
                  isSelected ? styles.filterTextActive : null,
                ]}>
                {category}
              </Text>
              <View
                style={[
                  styles.countBubble,
                  isSelected ? styles.countBubbleActive : null,
                ]}>
                <Text
                  style={[
                    styles.countBubbleText,
                    isSelected ? styles.countBubbleTextActive : null,
                  ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  filterText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  filterTextActive: {
    color: Colors.textOnPrimary,
  },
  countBubble: {
    backgroundColor: Colors.navySoft,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
  },
  countBubbleActive: {
    backgroundColor: Colors.greenPrimary,
  },
  countBubbleText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.navyPrimary,
  },
  countBubbleTextActive: {
    color: Colors.textOnPrimary,
  },
});
