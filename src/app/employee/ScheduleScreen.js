// src/app/(employee)/ScheduleScreen.js

import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { Calendar } from 'react-native-calendars';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';


const apiBaseUrl = 'http://localhost:5001/api';

export default function ScheduleScreen() {
  const router = useRouter();
  const { userToken, userId } = useContext(AuthContext);

  const [user, setUser] = useState({});
  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  // Toggle between "month" or "week" view
  const [viewMode, setViewMode] = useState('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // fetch user + all shifts
      const [userRes, shiftsRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/users/${userId}`, { headers }),
        axios.get(`${apiBaseUrl}/schedules/${userId}`, { headers })
      ]);

      setUser(userRes.data);
      setShifts(shiftsRes.data);
    } catch (error) {
      Alert.alert('Error', 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Mark calendar dates that have shifts
  const markedDates = shifts.reduce((acc, shift) => {
    const dateKey = shift.date.split('T')[0];
    acc[dateKey] = {
      marked: true,
      selected: dateKey === selectedDate,
      selectedColor: '#1976D2'
    };
    return acc;
  }, {});

  // Filter shifts for the currently selected date
  const upcomingShifts = shifts.filter(
    (shift) => shift.date.split('T')[0] === selectedDate
  );

  // Week View: show the current week's 7 days
  const [baseWeekDate] = useState(new Date()); // you could store and let user navigate weeks
  const getCurrentWeekDates = (dateObj) => {
    // find Monday of this week (or Sunday, adjust logic as needed)
    const dayOfWeek = dateObj.getDay(); // 0=Sunday,1=Mon,...
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(dateObj.getTime() - mondayOffset * 86400000);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 86400000);
      days.push(d);
    }
    return days;
  };

  const weekDates = getCurrentWeekDates(baseWeekDate);

  // Filter shifts for the selected day in week mode
  const upcomingShiftsWeek = shifts.filter(
    (shift) => shift.date.split('T')[0] === selectedDate
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
          </View>
          <View style={styles.headerIcons}>
            {/* History Icon => employee/HistoryScreen */}
            <TouchableOpacity
              onPress={() => router.push('/employee/HistoryScreen')}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="time-outline" size={24} color="#000" />
            </TouchableOpacity>
            {/* Settings => shared/SettingsScreen */}
            <TouchableOpacity onPress={() => router.push('/shared/SettingsScreen')}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle for Month / Week */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'month' && styles.activeToggle]}
            onPress={() => setViewMode('month')}
          >
            <Text style={viewMode === 'month' && styles.activeToggleText}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'week' && styles.activeToggle]}
            onPress={() => setViewMode('week')}
          >
            <Text style={viewMode === 'week' && styles.activeToggleText}>Week</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar / Week View */}
        {viewMode === 'month' ? (
          <Calendar
            current={selectedDate}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            style={styles.calendar}
            theme={{
              calendarBackground: '#fff',
              textSectionTitleColor: '#a6a6a6',
              selectedDayBackgroundColor: '#1976D2',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#1976D2',
              dayTextColor: '#000',
              textDisabledColor: '#d9e1e8',
              dotColor: '#1976D2',
              selectedDotColor: '#ffffff',
              arrowColor: '#1976D2',
              monthTextColor: '#333',
              indicatorColor: '#1976D2',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />
        ) : (
          <View style={styles.weekContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weekDates.map((d) => {
                const dStr = d.toISOString().split('T')[0];
                const isSelected = dStr === selectedDate;
                return (
                  <TouchableOpacity
                    key={dStr}
                    style={[
                      styles.weekDay,
                      isSelected && styles.weekDaySelected
                    ]}
                    onPress={() => setSelectedDate(dStr)}
                  >
                    <Text style={styles.weekDayLabel}>
                      {d.toLocaleString('default', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.weekDayNum}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Upcoming Shifts */}
        <View style={styles.shiftSection}>
          <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
          {viewMode === 'month'
            ? renderShiftsForDate(upcomingShifts, router)
            : renderShiftsForDate(upcomingShiftsWeek, router)}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/employee/HomeScreen')}
        >
          <Ionicons name="home-outline" size={24} />
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/employee/ScheduleScreen')}
        >
          <Ionicons name="calendar" size={24} color="#1976D2" />
          <Text style={{ color: '#1976D2' }}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/shared/ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** 
 * Renders shift cards for the given date's shifts.
 */
function renderShiftsForDate(shiftsForDate, router) {
  if (!shiftsForDate.length) {
    return <Text>No shifts for this date.</Text>;
  }
  return shiftsForDate.map((shift) => (
    <View key={shift._id} style={styles.shiftCard}>
      <View>
        <Text style={styles.shiftTitle}>{shift.title}</Text>
        <Text style={styles.shiftTime}>
          {shift.startTime} - {shift.endTime}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => router.push({ 
            pathname: '/employee/ShiftswapScreen', 
            params: { shiftId: shift._id } 
          })}
        >
          <FontAwesome5 name="exchange-alt" size={16} color="#fff" />
          <Text style={styles.actionText}>Swap Shift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callSickButton}
          onPress={() => router.push({
            pathname: '/employee/SicklogScreen',
            params: {
              shiftId: shift._id,
              shiftDate: shift.date,
              startTime: shift.startTime,
              endTime: shift.endTime
            }
          })}
        >
          <FontAwesome5 name="head-side-cough" size={16} color="#fff" />
          <Text style={styles.actionText}>Call Sick</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push({
            pathname: '/employee/ShiftDetailScreen',
            params: { shiftId: shift._id }
          })}
        >
          <Text style={{ color: '#555' }}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  ));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#fff'
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  userRole: {
    fontSize: 14,
    color: '#888'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2
  },
  viewToggleBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center'
  },
  activeToggle: {
    backgroundColor: '#1976D2'
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  calendar: {
    borderRadius: 12,
    padding: 5,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 10
  },
  weekContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    marginVertical: 10
  },
  weekDay: {
    width: 50,
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 10,
    borderRadius: 8
  },
  weekDaySelected: {
    backgroundColor: '#1976D2'
  },
  weekDayLabel: {
    color: '#555'
  },
  weekDayNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  shiftSection: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  shiftCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2
  },
  shiftTitle: {
    fontWeight: 'bold'
  },
  shiftTime: {
    color: '#1976D2',
    marginTop: 5
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    padding: 8,
    borderRadius: 5,
    gap: 5
  },
  callSickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 5,
    gap: 5
  },
  detailsButton: {
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  actionText: {
    color: '#fff'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    width: '100%'
  },
  footerItem: {
    alignItems: 'center'
  }
});