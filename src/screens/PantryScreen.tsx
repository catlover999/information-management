import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EmptyState } from '../components/EmptyState';
import { HeaderLogo } from '../components/HeaderLogo';
import { InventoryItemCard } from '../components/InventoryItemCard';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { ItemFormModal } from '../components/ItemFormModal';
import { ProgressSummaryCard } from '../components/ProgressSummaryCard';
import { useInventory } from '../context/InventoryContext';
import {
  FilterCategory,
  InventoryItem,
  InventoryItemFormValues,
} from '../models/inventory';
import { Colors, Fonts, Shadows, Spacing } from '../theme';

export const PantryScreen: React.FC = () => {
  const {
    items,
    isLoading,
    addItem,
    updateItem,
    toggleItemChecked,
    deleteItem,
    reorderItems,
    resetToDefault,
  } = useInventory();

  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('All');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] =
    useState<boolean>(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') {
      return items;
    }
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const checkedCount = useMemo(
    () => items.filter(item => item.checked).length,
    [items],
  );

  const selectedItem = useMemo(
    () => items.find(item => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsFormModalVisible(true);
  };

  const handlePressItem = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setIsDetailModalVisible(true);
  };

  const handleOpenEditFromDetail = (item: InventoryItem) => {
    setIsDetailModalVisible(false);
    setEditingItem(item);
    setIsFormModalVisible(true);
  };

  const handleOpenDeleteModal = (item: InventoryItem) => {
    setIsDetailModalVisible(false);
    setItemToDelete(item);
  };

  const handlePerformDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
      setItemToDelete(null);
      setSelectedItemId(null);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
  };

  const handleFormSubmit = (values: InventoryItemFormValues) => {
    if (editingItem) {
      updateItem(editingItem.id, values);
      setSelectedItemId(editingItem.id);
    } else {
      addItem(values);
    }
    setEditingItem(null);
  };

  const handleReordered = async (fromIndex: number, toIndex: number) => {
    reorderItems(fromIndex, toIndex, filteredItems);
  };

  const renderDraggableItem = (info: DragListRenderItemInfo<InventoryItem>) => {
    const { item, onDragStart, onDragEnd, isActive } = info;
    return (
      <InventoryItemCard
        item={item}
        isActive={isActive}
        onToggleCheck={toggleItemChecked}
        onPressItem={handlePressItem}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screenContainer}>
        <HeaderLogo />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
          <Text style={styles.loadingText}>
            Loading your pantry inventory...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <HeaderLogo />

      <ProgressSummaryCard
        totalCount={items.length}
        checkedCount={checkedCount}
        onAddPress={handleOpenAddModal}
      />

      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        items={items}
      />

      <View style={styles.listWrapper}>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={
              items.length === 0
                ? 'Your Pantry Checklist is Empty'
                : `No Items in "${selectedCategory}"`
            }
            description={
              items.length === 0
                ? 'Start adding emergency supplies or restore the recommended Swiss Emergency Plan checklist.'
                : 'Add a new item to this category or switch back to "All" to see your complete inventory.'
            }
            actionLabel="＋ Add Supply Item"
            onActionPress={handleOpenAddModal}
            secondaryActionLabel={
              items.length === 0
                ? 'Restore Swiss Emergency Checklist'
                : 'Show All Categories'
            }
            onSecondaryActionPress={() => {
              if (items.length === 0) {
                resetToDefault();
              } else {
                setSelectedCategory('All');
              }
            }}
          />
        ) : (
          <DragList
            data={filteredItems}
            keyExtractor={item => item.id}
            onReordered={handleReordered}
            renderItem={renderDraggableItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button for Quick Add */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenAddModal}
        activeOpacity={0.85}
        accessibilityLabel="Add new inventory item"
        testID="fab-add-item"
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Item Details Bottom Sheet / Modal */}
      <ItemDetailModal
        visible={isDetailModalVisible}
        item={selectedItem}
        onClose={() => setIsDetailModalVisible(false)}
        onToggleCheck={toggleItemChecked}
        onEditPress={handleOpenEditFromDetail}
        onDeletePress={handleOpenDeleteModal}
      />

      {/* App-Themed Confirm Delete Modal */}
      <ConfirmDeleteModal
        visible={itemToDelete !== null}
        itemName={itemToDelete?.name}
        onConfirm={handlePerformDelete}
        onCancel={handleCancelDelete}
      />

      {/* Add / Edit Item Form Modal */}
      <ItemFormModal
        visible={isFormModalVisible}
        editingItem={editingItem}
        defaultCategory={selectedCategory === 'All' ? 'Food' : selectedCategory}
        onClose={() => {
          setIsFormModalVisible(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    fontFamily: Fonts.semiBold,
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 96,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.navyPrimary,
    borderWidth: 2,
    borderColor: Colors.greenPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  fabIcon: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Colors.textOnPrimary,
    marginTop: 4,
  },
});
