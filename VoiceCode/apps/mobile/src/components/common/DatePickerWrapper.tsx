/**
 * DatePickerWrapper Component
 * A wrapper around @react-native-community/datetimepicker that provides
 * a fallback for Expo Go where native modules aren't available.
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  NativeModules,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';
import Constants from 'expo-constants';

interface DatePickerWrapperProps {
  value: Date;
  onChange: (event: any, date?: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  testID?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

// Check if we're running in Expo Go (managed workflow without custom native code)
const isExpoGo = Constants.appOwnership === 'expo';

// Check if the native DateTimePicker module is available
const hasNativeModule = Platform.OS === 'android'
  ? !!(NativeModules.RNCDateTimePicker || NativeModules.RNCMaterialDatePicker)
  : !!NativeModules.RNCDateTimePicker;

/**
 * Fallback date picker using scroll pickers
 */
const FallbackDatePicker: React.FC<DatePickerWrapperProps> = ({
  value,
  onChange,
  testID,
  minimumDate,
  maximumDate,
}) => {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(true);
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  // Generate years array
  const startYear = minimumDate?.getFullYear() || 2020;
  const endYear = maximumDate?.getFullYear() || new Date().getFullYear() + 5;
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  // Adjust day if it exceeds the new month's days
  React.useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth, selectedDay]);

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onChange({ type: 'set' }, newDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    onChange({ type: 'dismissed' }, undefined);
    setShowModal(false);
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <Text variant="h6" style={styles.modalTitle}>
            Select Date
          </Text>

          <View style={styles.pickerContainer}>
            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text variant="label" style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                Month
              </Text>
              <ScrollView
                style={[styles.pickerScroll, { backgroundColor: theme.colors.surface }]}
                showsVerticalScrollIndicator={false}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => setSelectedMonth(index)}
                    style={[
                      styles.pickerItem,
                      selectedMonth === index && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={[
                        styles.pickerItemText,
                        { color: selectedMonth === index ? '#fff' : theme.colors.textPrimary },
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text variant="label" style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                Day
              </Text>
              <ScrollView
                style={[styles.pickerScroll, { backgroundColor: theme.colors.surface }]}
                showsVerticalScrollIndicator={false}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={[
                        styles.pickerItemText,
                        { color: selectedDay === day ? '#fff' : theme.colors.textPrimary },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text variant="label" style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>
                Year
              </Text>
              <ScrollView
                style={[styles.pickerScroll, { backgroundColor: theme.colors.surface }]}
                showsVerticalScrollIndicator={false}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={[
                        styles.pickerItemText,
                        { color: selectedYear === year ? '#fff' : theme.colors.textPrimary },
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[styles.previewContainer, { borderColor: theme.colors.border }]}>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              Selected: {months[selectedMonth]} {selectedDay}, {selectedYear}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Button variant="secondary" onPress={handleCancel} style={styles.button}>
              Cancel
            </Button>
            <Button onPress={handleConfirm} style={styles.button}>
              Confirm
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * DatePickerWrapper - Uses fallback picker for Expo Go compatibility
 *
 * Note: The native @react-native-community/datetimepicker is not compatible
 * with Expo Go. For production apps with custom dev client, you can
 * uncomment the native picker code below.
 */
export const DatePickerWrapper: React.FC<DatePickerWrapperProps> = (props) => {
  // Always use fallback for Expo Go compatibility
  // For development builds with native modules, the native picker can be enabled
  return <FallbackDatePicker {...props} />;

  // UNCOMMENT BELOW FOR DEVELOPMENT BUILDS WITH NATIVE MODULES:
  /*
  if (isExpoGo || !hasNativeModule) {
    return <FallbackDatePicker {...props} />;
  }
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  return <DateTimePicker {...props} />;
  */
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 200,
    gap: 8,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerScroll: {
    flex: 1,
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 2,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default DatePickerWrapper;
