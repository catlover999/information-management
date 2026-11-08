import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface DateTimePickerEvent {
  type: 'set' | 'dismissed';
  nativeEvent: {
    timestamp: number;
    utcOffset: number;
  };
}

interface DateTimePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: string;
  onChange?: (event: DateTimePickerEvent, date?: Date) => void;
}

function toYyyyMmDd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
  const [dateStr, setDateStr] = useState<string>(() => toYyyyMmDd(value || new Date()));

  const handleConfirm = (nextStr: string) => {
    const parts = nextStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const chosen = new Date(parts[0], parts[1] - 1, parts[2]);
      onChange?.(
        {
          type: 'set',
          nativeEvent: { timestamp: chosen.getTime(), utcOffset: 0 },
        },
        chosen,
      );
    }
  };

  return (
    <View style={styles.pickerBox}>
      <input
        type="date"
        value={dateStr}
        onChange={e => {
          const val = e.target.value;
          setDateStr(val);
          if (val) {
            handleConfirm(val);
          }
        }}
        style={{
          flex: 1,
          padding: '9px 12px',
          fontSize: '14px',
          fontFamily: 'Poppins-Medium, sans-serif',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          color: '#0F2942',
          backgroundColor: '#FFFFFF',
        }}
      />
      <TouchableOpacity
        style={styles.applyBtn}
        onPress={() => handleConfirm(dateStr)}
        activeOpacity={0.85}>
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  applyBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  applyText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});

export default DateTimePicker;
