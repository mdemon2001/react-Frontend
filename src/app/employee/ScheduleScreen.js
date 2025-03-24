// src/app/employee/ScheduleScreen.js

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
import { AuthContext } from '../../context/AuthContext';
import { Calendar } from 'react-native-calendars';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);
  const [user, setUser] = useState({});
  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const [userRes, shiftsRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/users/${userId}`, { headers }),
        axios.get(`${apiBaseUrl}/schedules/${userId}`, { headers }),
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
    acc[dateKey] = { marked: true, selected: dateKey === selectedDate };
    return acc;
  }, {});

  // Filter shifts for the currently selected date
  const upcomingShifts = shifts.filter(
    (shift) => shift.date.split('T')[0] === selectedDate
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
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
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <Ionicons name="notifications-outline" size={24} />
            <Ionicons name="settings-outline" size={24} />
          </View>
        </View>

        {/* Calendar View */}
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
            textDayHeaderFontSize: 14,
          }}
        />

        {/* Upcoming Shifts */}
        <View style={styles.shiftSection}>
          <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
          {upcomingShifts.length ? (
            upcomingShifts.map((shift) => (
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
                    onPress={() => navigation.navigate('SwapShiftScreen', { shift })}
                  >
                    <FontAwesome5 name="exchange-alt" size={16} color="#fff" />
                    <Text style={styles.actionText}>Swap Shift</Text>
                  </TouchableOpacity>

                  {/* Call Sick Button */}
                  <TouchableOpacity
                    style={styles.callSickButton}
                    // Navigate to your sick-call screen with shift info
                    onPress={() =>
                      navigation.navigate('CallSickScreen', {
                        shiftId: shift._id,
                        shiftDate: shift.date,
                        startTime: shift.startTime,
                        endTime: shift.endTime
                      })
                    }
                  >
                    <FontAwesome5 name="head-side-cough" size={16} color="#fff" />
                    <Text style={styles.actionText}>Call Sick</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => navigation.navigate('ShiftDetailScreen', { shift })}
                  >
                    <Text style={{ color: '#555' }}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text>No shifts for this date.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <Ionicons name="home-outline" size={24} />
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ScheduleScreen')}
        >
          <Ionicons name="calendar" size={24} color="#1976D2" />
          <Text style={{ color: '#1976D2' }}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    color: '#888',
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
    marginVertical: 10,
  },
  shiftSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shiftCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  shiftTitle: {
    fontWeight: 'bold',
  },
  shiftTime: {
    color: '#1976D2',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    padding: 8,
    borderRadius: 5,
    gap: 5,
  },
  callSickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 5,
    gap: 5,
  },
  detailsButton: {
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  footerItem: {
    alignItems: 'center',
  },
});

export default ScheduleScreen;