// src/app/employee/AvailabilityScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Modal,
  Button,
  TextInput
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { AuthContext } from '../../context/AuthContext';

const AvailabilityScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  const apiBaseUrl = 'http://localhost:5000/api';

  // Current view: 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState('week');

  // Day mode date
  const [dayModeDate, setDayModeDate] = useState(new Date());

  // Week mode: store Monday of current week
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  // The main map of availability
  // { "YYYY-MM-DD": { type: "unavailable"|"allDay"|"custom", startTime?: "HH:MM", endTime?: "HH:MM" } }
  const [availabilityMap, setAvailabilityMap] = useState({});

  // For month mode's markedDates
  const [markedDates, setMarkedDates] = useState({});

  // UI
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // "Day Options" modal for tapping a day (in either week or month)
  const [dayOptionsModalVisible, setDayOptionsModalVisible] = useState(false);
  const [selectedDateForOptions, setSelectedDateForOptions] = useState(null); // dateStr

  // "Custom Hours" modal (text inputs)
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customDate, setCustomDate] = useState(null);
  const [tempStartTimeStr, setTempStartTimeStr] = useState('09:00'); // typed
  const [tempEndTimeStr, setTempEndTimeStr] = useState('17:00');     // typed

  useEffect(() => {
    fetchAvailability();
  }, []);

  // Fetch from backend
  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // Suppose GET /availability/:userId => array of { date, type, startTime, endTime }
      const res = await axios.get(`${apiBaseUrl}/availability/${userId}`, { headers });
      const data = res.data || [];
      const map = {};
      data.forEach((item) => {
        map[item.date] = {
          type: item.type,
          startTime: item.startTime || null,
          endTime: item.endTime || null
        };
      });
      setAvailabilityMap(map);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch availability.');
    } finally {
      setLoading(false);
    }
  };

  // Rebuild markedDates for month
  useEffect(() => {
    setMarkedDates(buildMarkedDates(availabilityMap));
  }, [availabilityMap]);

  function buildMarkedDates(avMap) {
    // color by type
    const result = {};
    Object.keys(avMap).forEach((ds) => {
      const info = avMap[ds];
      let color = '#ccc';
      if (info.type === 'unavailable') color = 'red';
      else if (info.type === 'allDay') color = 'green';
      else if (info.type === 'custom') color = 'blue';
      result[ds] = { selected: true, selectedColor: color };
    });
    return result;
  }

  // Submit to backend
  const submitAvailability = async () => {
    setLoading(true);
    try {
      const payload = Object.keys(availabilityMap).map((ds) => ({
        date: ds,
        ...availabilityMap[ds]
      }));
      const headers = { Authorization: `Bearer ${userToken}` };
      await axios.put(`${apiBaseUrl}/availability/${userId}`, { availability: payload }, { headers });
      Alert.alert('Success', 'Availability saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability.');
    } finally {
      setLoading(false);
    }
  };

  // ********** DAY MODE **********
  const handlePrevDay = () => {
    const d = new Date(dayModeDate);
    d.setDate(d.getDate() - 1);
    setDayModeDate(d);
  };
  const handleNextDay = () => {
    const d = new Date(dayModeDate);
    d.setDate(d.getDate() + 1);
    setDayModeDate(d);
  };
  function setDayModeType(type) {
    const ds = toISODate(dayModeDate);
    setAvailabilityMap((prev) => {
      const updated = { ...prev };
      if (updated[ds]?.type === type) {
        // Toggling same type => clear
        delete updated[ds];
      } else {
        updated[ds] = { type };
      }
      return updated;
    });
  }
  function openDayModeCustom() {
    const ds = toISODate(dayModeDate);
    openCustomHoursModal(ds);
  }

  // ********** WEEK MODE **********
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };
  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };
  function handleWeekDayPress(dateStr) {
    setSelectedDateForOptions(dateStr);
    setDayOptionsModalVisible(true);
  }

  // ********** MONTH MODE **********
  // Tapping a day now also opens the "Day Options" modal, not toggling unavailable
  function handleMonthDayPress(dayObj) {
    const ds = dayObj.dateString;
    setSelectedDateForOptions(ds);
    setDayOptionsModalVisible(true);
  }

  // Day Options modal logic
  function setDateType(dateStr, newType) {
    setAvailabilityMap((prev) => {
      const updated = { ...prev };
      const old = updated[dateStr]?.type;
      if (old === newType) {
        // If user picks same type again => clear
        delete updated[dateStr];
      } else {
        updated[dateStr] = { type: newType };
      }
      return updated;
    });
    setDayOptionsModalVisible(false);
  }
  function clearDay(dateStr) {
    setAvailabilityMap((prev) => {
      const updated = { ...prev };
      delete updated[dateStr];
      return updated;
    });
    setDayOptionsModalVisible(false);
  }
  function openDayCustomHours(dateStr) {
    setDayOptionsModalVisible(false);
    openCustomHoursModal(dateStr);
  }

  // ********** Quick Select **********
  function handleAvailableAllDay() {
    if (viewMode === 'day') {
      setDayModeType('allDay');
    } else if (viewMode === 'week') {
      const arr = buildWeekDates(currentWeekStart);
      setAvailabilityMap((prev) => {
        const updated = { ...prev };
        arr.forEach((d) => {
          updated[toISODate(d)] = { type: 'allDay' };
        });
        return updated;
      });
    } else {
      // month
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      setAvailabilityMap((prev) => {
        const updated = { ...prev };
        for (let day = 1; day <= daysInMonth; day++) {
          const dt = new Date(y, m, day);
          updated[toISODate(dt)] = { type: 'allDay' };
        }
        return updated;
      });
    }
  }

  function handleUnavailable() {
    if (viewMode === 'day') {
      setDayModeType('unavailable');
    } else if (viewMode === 'week') {
      const arr = buildWeekDates(currentWeekStart);
      setAvailabilityMap((prev) => {
        const updated = { ...prev };
        arr.forEach((d) => {
          updated[toISODate(d)] = { type: 'unavailable' };
        });
        return updated;
      });
    } else {
      // month
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      setAvailabilityMap((prev) => {
        const updated = { ...prev };
        for (let day = 1; day <= daysInMonth; day++) {
          const dd = new Date(y, m, day);
          updated[toISODate(dd)] = { type: 'unavailable' };
        }
        return updated;
      });
    }
  }

  // "Recurring pattern" => resets everything
  function handleRecurringPattern() {
    setAvailabilityMap({});
    Alert.alert('Recurring Pattern', 'All availability cleared (demo).');
  }

  function handleCustomHours() {
    if (viewMode === 'day') {
      openDayModeCustom();
    } else if (viewMode === 'week') {
      Alert.alert('Custom Hours', 'Tap a day in the week row to set custom hours.');
    } else {
      Alert.alert('Custom Hours', 'Tap a day in the month to open Day Options → Custom Hours.');
    }
  }

  // ********** Custom Hours Modal (text inputs) **********
  function openCustomHoursModal(dateStr) {
    setCustomDate(dateStr);
    const existing = availabilityMap[dateStr];
    if (existing?.startTime) setTempStartTimeStr(existing.startTime);
    else setTempStartTimeStr('09:00');

    if (existing?.endTime) setTempEndTimeStr(existing.endTime);
    else setTempEndTimeStr('17:00');

    setCustomModalVisible(true);
  }

  function saveCustomHours() {
    if (!customDate) return;
    // Validate typed times (HH:MM)
    if (!isValidHHMM(tempStartTimeStr) || !isValidHHMM(tempEndTimeStr)) {
      Alert.alert('Invalid time format', 'Use HH:MM (24-hr). E.g. 09:00 or 13:30');
      return;
    }
    setAvailabilityMap((prev) => ({
      ...prev,
      [customDate]: { type: 'custom', startTime: tempStartTimeStr, endTime: tempEndTimeStr }
    }));
    setCustomModalVisible(false);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Set Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Guidelines */}
      <View style={styles.guidelines}>
        <Text style={styles.guidelineTitle}>Guidelines</Text>
        <Text><Ionicons name="information-circle-outline" size={16} /> Minimum 20 hours per week required</Text>
        <Text><Ionicons name="information-circle-outline" size={16} /> Set availability at least 2 weeks in advance</Text>
      </View>

      {/* Mode Switch */}
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'day' && styles.modeButtonActive]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.modeText, viewMode === 'day' && styles.modeTextActive]}>Day</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'week' && styles.modeButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.modeText, viewMode === 'week' && styles.modeTextActive]}>Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, viewMode === 'month' && styles.modeButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.modeText, viewMode === 'month' && styles.modeTextActive]}>Month</Text>
        </TouchableOpacity>
      </View>

      {/* Day mode */}
      {viewMode === 'day' && (
        <DayModeView
          date={dayModeDate}
          availabilityMap={availabilityMap}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          setType={setDayModeType}
          openCustomHours={openDayModeCustom}
        />
      )}

      {/* Week mode */}
      {viewMode === 'week' && (
        <WeekModeView
          currentWeekStart={currentWeekStart}
          availabilityMap={availabilityMap}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onDayPress={handleWeekDayPress}
        />
      )}

      {/* Month mode */}
      {viewMode === 'month' && (
        <Calendar
          markedDates={markedDates}
          onDayPress={handleMonthDayPress}
          style={styles.calendar}
          theme={{
            selectedDayBackgroundColor: '#1976D2',
            todayTextColor: '#1976D2'
          }}
        />
      )}

      {/* Quick Select */}
      <View style={styles.quickSelect}>
        <Text style={styles.sectionTitle}>Quick Select</Text>
        <View style={styles.quickSelectRow}>
          <TouchableOpacity style={styles.quickButton} onPress={handleAvailableAllDay}>
            <FontAwesome5 name="clock" size={16} color="#1976D2" />
            <Text style={{ marginLeft: 5 }}>Available All Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickButton} onPress={handleUnavailable}>
            <FontAwesome5 name="ban" size={16} color="#1976D2" />
            <Text style={{ marginLeft: 5 }}>Unavailable</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickSelectRow}>
          <TouchableOpacity style={styles.quickButton} onPress={handleRecurringPattern}>
            <FontAwesome5 name="sync" size={16} color="#1976D2" />
            <Text style={{ marginLeft: 5 }}>Recurring Pattern</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickButton} onPress={handleCustomHours}>
            <FontAwesome5 name="calendar-alt" size={16} color="#1976D2" />
            <Text style={{ marginLeft: 5 }}>Custom Hours</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.notifications}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.switchContainer}>
          <Ionicons name="notifications-outline" size={20} />
          <Text style={{ flex: 1, marginLeft: 10 }}>Approval Status</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton} onPress={submitAvailability}>
        <Text style={styles.submitText}>Save & Submit Availability</Text>
      </TouchableOpacity>

      {/* Day Options Modal (for both week & month) */}
      <Modal
        visible={!!selectedDateForOptions && dayOptionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDayOptionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionModalContainer}>
            <Text style={styles.optionModalTitle}>Availability for {selectedDateForOptions}</Text>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setDateType(selectedDateForOptions, 'allDay')}>
              <Text>All Day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setDateType(selectedDateForOptions, 'unavailable')}>
              <Text>Unavailable</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => openDayCustomHours(selectedDateForOptions)}>
              <Text>Custom Hours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { clearDay(selectedDateForOptions); }}>
              <Text>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, { backgroundColor: '#ddd' }]}
              onPress={() => setDayOptionsModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Hours Modal (text inputs) */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Custom Hours</Text>
            <Text style={{ marginBottom: 10 }}>{customDate}</Text>

            <Text>Start Time (HH:MM)</Text>
            <TextInput
              style={styles.timeInput}
              value={tempStartTimeStr}
              onChangeText={setTempStartTimeStr}
              placeholder="e.g. 09:00"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={{ marginTop: 8 }}>End Time (HH:MM)</Text>
            <TextInput
              style={styles.timeInput}
              value={tempEndTimeStr}
              onChangeText={setTempEndTimeStr}
              placeholder="e.g. 17:00"
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalButtons}>
              <Button title="CANCEL" onPress={() => setCustomModalVisible(false)} />
              <Button title="SAVE" onPress={saveCustomHours} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

/** Day mode component */
function DayModeView({ date, availabilityMap, onPrevDay, onNextDay, setType, openCustomHours }) {
  const ds = toISODate(date);
  const info = availabilityMap[ds];
  let color = '#eee';
  if (info?.type === 'unavailable') color = 'red';
  else if (info?.type === 'allDay') color = 'green';
  else if (info?.type === 'custom') color = 'blue';

  return (
    <View style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <TouchableOpacity onPress={onPrevDay}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.dayTitle}>{date.toDateString()}</Text>
        <TouchableOpacity onPress={onNextDay}>
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={[styles.dayBox, { backgroundColor: color, padding: 16, alignItems: 'center' }]}>
        <Text style={{ color: '#000', fontSize: 14 }}>{info?.type || 'No setting'}</Text>
        {info?.type === 'custom' && (
          <Text style={{ color: '#fff', marginTop: 6 }}>
            {info.startTime} - {info.endTime}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.dayActions}>
        <TouchableOpacity style={styles.dayActionBtn} onPress={() => setType('unavailable')}>
          <Text>Unavailable</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dayActionBtn} onPress={() => setType('allDay')}>
          <Text>All Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dayActionBtn} onPress={openCustomHours}>
          <Text>Custom Hours</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Week mode component */
function WeekModeView({ currentWeekStart, availabilityMap, onPrevWeek, onNextWeek, onDayPress }) {
  const weekDates = buildWeekDates(currentWeekStart);
  const rangeLabel = formatWeekRange(currentWeekStart);

  return (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={onPrevWeek}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{rangeLabel}</Text>
        <TouchableOpacity onPress={onNextWeek}>
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {weekDates.map((d) => {
          const ds = toISODate(d);
          const dayNum = d.getDate();
          const info = availabilityMap[ds];
          let color = '#eee';
          if (info?.type === 'unavailable') color = 'red';
          else if (info?.type === 'allDay') color = 'green';
          else if (info?.type === 'custom') color = 'blue';

          return (
            <TouchableOpacity
              key={ds}
              style={[styles.dayBox, { backgroundColor: color, width: 45, height: 60 }]}
              onPress={() => onDayPress(ds)}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>{dayNum}</Text>
              <Text style={styles.dayBoxLabel}>{info?.type || 'Set'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Utility functions */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // Sunday=0, Monday=1
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.setDate(diff));
}

function buildWeekDates(monday) {
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(dd.getDate() + i);
    arr.push(dd);
  }
  return arr;
}
function formatWeekRange(monday) {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  const startStr = monday.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, opts);
  return `${startStr} - ${endStr}`;
}
function toISODate(dateObj) {
  return dateObj.toISOString().split('T')[0];
}
function isValidHHMM(str) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; 
  return regex.test(str);
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbfc', padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  guidelines: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 20,
    elevation: 3
  },
  guidelineTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  modeSwitch: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden'
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10
  },
  modeButtonActive: { backgroundColor: '#1976D2' },
  modeText: { color: '#333', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  calendar: {
    borderRadius: 10,
    marginBottom: 20
  },
  quickSelect: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  quickSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    flex: 0.48,
    elevation: 3,
    padding: 10
  },
  notifications: { marginBottom: 20 },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3
  },
  submitButton: {
    padding: 15,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // Day mode
  dayContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    padding: 10,
    marginBottom: 20
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  dayBox: {
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 60
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  dayActionBtn: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6
  },

  // Week mode
  weekContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 20
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  dayBox: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayBoxLabel: {
    fontSize: 10,
    color: '#fff'
  },

  // Day Options & Custom Hours modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center'
  },
  optionModalContainer: {
    marginHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16
  },
  optionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  optionBtn: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginVertical: 6,
    alignItems: 'center'
  },
  modalContainer: {
    marginHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 5,
    paddingHorizontal: 8,
    height: 40
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  }
});

export default AvailabilityScreen;