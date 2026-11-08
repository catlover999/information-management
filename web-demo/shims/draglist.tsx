import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

export interface DragListRenderItemInfo<T> {
  item: T;
  index: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  isActive: boolean;
}

interface DragListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onReordered?: (fromIndex: number, toIndex: number) => Promise<void> | void;
  renderItem: (info: DragListRenderItemInfo<T>) => React.ReactElement | null;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
}

export default function DragList<T>({
  data,
  keyExtractor,
  onReordered,
  renderItem,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: DragListProps<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const startYRef = useRef<number>(0);
  const activeIdxRef = useRef<number | null>(null);
  const hoverIdxRef = useRef<number | null>(null);
  const rowHeightRef = useRef<number>(78);

  const finishDrag = () => {
    const from = activeIdxRef.current;
    const to = hoverIdxRef.current;
    activeIdxRef.current = null;
    hoverIdxRef.current = null;
    setActiveIndex(null);
    setHoverIndex(null);
    if (from !== null && to !== null && from !== to) {
      onReordered?.(from, to);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEnabled={activeIndex === null}>
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const isActive = activeIndex === index;

        return (
          <View
            key={key}
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (h > 20) {
                rowHeightRef.current = h;
              }
            }}
            // @ts-ignore web pointer events for smooth drag reorder
            onPointerDown={(e: any) => {
              startYRef.current = e.clientY ?? 0;
            }}
            onPointerMove={(e: any) => {
              if (activeIdxRef.current === null) return;
              const dy = (e.clientY ?? 0) - startYRef.current;
              const offsetRows = Math.round(dy / (rowHeightRef.current || 78));
              const target = Math.max(
                0,
                Math.min(data.length - 1, activeIdxRef.current + offsetRows),
              );
              if (target !== hoverIdxRef.current) {
                hoverIdxRef.current = target;
                setHoverIndex(target);
              }
            }}
            onPointerUp={() => {
              if (activeIdxRef.current !== null) {
                finishDrag();
              }
            }}
            style={
              hoverIndex === index && activeIndex !== null && activeIndex !== index
                ? {
                    borderTopWidth: activeIndex > index ? 2 : 0,
                    borderBottomWidth: activeIndex < index ? 2 : 0,
                    borderColor: '#10B981',
                  }
                : undefined
            }>
            {renderItem({
              item,
              index,
              isActive,
              onDragStart: () => {
                activeIdxRef.current = index;
                hoverIdxRef.current = index;
                setActiveIndex(index);
                setHoverIndex(index);
              },
              onDragEnd: () => {
                finishDrag();
              },
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}
