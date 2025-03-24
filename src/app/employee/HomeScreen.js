// src/app/employee/HomeScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location'; // For geolocation (Expo)

import { AuthContext } from '../../context/AuthContext';

// Adjust to your server’s base URL
const apiBaseUrl = 'http://localhost:5000/api';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  // Local state
  const [user, setUser] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [clockStatus, setClockStatus] = useState({}); // { isClockedIn: bool, etc. }
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Track current time (local device time)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update local current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // Parallel requests to your various endpoints
      const [userRes, annRes, statusRes, scheduleRes, summaryRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/users/${userId}`, { headers }),                  
        axios.get(`${apiBaseUrl}/announcements`, { headers }),                    
        axios.get(`${apiBaseUrl}/attendance/current-status/${userId}`, { headers }),
        axios.get(`${apiBaseUrl}/schedules/today/${userId}`, { headers }),        
        axios.get(`${apiBaseUrl}/payrolls/weekly-summary/${userId}`, { headers }) 
      ]);

      setUser(userRes.data);
      setAnnouncements(annRes.data);
      setClockStatus(statusRes.data);
      setTodaySchedule(scheduleRes.data);
      setWeeklySummary(summaryRes.data);
    } catch (error) {
      console.error('HomeScreen fetch error:', error.response?.data || error.message);
      Alert.alert('Error', 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is clocked in
  const isClockedIn = clockStatus.isClockedIn || clockStatus.type === 'Clock In';

  // Single function to handle clock in/out via geolocation
  const handleClockEvent = async () => {
    try {
      // Ask for location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to clock in/out.');
        return;
      }
      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Determine event type
      const eventType = isClockedIn ? 'clockout' : 'clockin';

      const headers = { Authorization: `Bearer ${userToken}` };
      // POST /geolocation/clock-event
      await axios.post(
        `${apiBaseUrl}/geolocation/clock-event`,
        {
          userId,
          type: eventType,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        },
        { headers }
      );

      Alert.alert('Success', `Successfully ${eventType === 'clockin' ? 'clocked in' : 'clocked out'}.`);
      fetchData(); // refresh status
    } catch (error) {
      console.error('Clock event error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to process clock event.');
    }
  };

  // Quick Action button
  const ActionButton = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <FontAwesome5 name={icon} size={20} color="#1976D2" />
      <Text style={styles.actionBtnText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          {/* Left: Name */}
          <View>
            <Text style={styles.userName}>{user.fullName || 'Employee'}</Text>
          </View>
          {/* Right: Role, Notification, Settings */}
          <View style={styles.topRightContainer}>
            <Text style={styles.userRole}>{user.role || 'Staff'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ShiftAlertScreen')}>
              <Ionicons name="notifications-outline" size={24} style={styles.iconSpacing} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
              <Ionicons name="settings-outline" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.announcement}>
          <Text style={styles.sectionTitle}>New Announcements</Text>
          {announcements.length > 0 ? (
            announcements.map(a => (
              <View key={a._id} style={styles.announcementItem}>
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementMessage}>{a.message}</Text>
              </View>
            ))
          ) : (
            <Text>No new announcements.</Text>
          )}
        </View>

        {/* Clock Status + current time */}
        <View style={styles.clockStatus}>
          <Text style={styles.statusText}>
            {isClockedIn ? 'Currently Clocked In' : 'Currently Clocked Out'}
          </Text>
          <Text style={styles.timeText}>
            {`Local Time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </Text>

          <TouchableOpacity
            style={styles.clockBtn}
            onPress={handleClockEvent}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.clockBtnText}>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.schedule}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaySchedule && todaySchedule.shiftName ? (
            <View style={styles.scheduleRow}>
              <Text style={{ fontWeight: 'bold' }}>{todaySchedule.shiftName}</Text>
              <Text>
                {todaySchedule.startTime} - {todaySchedule.endTime}
              </Text>
            </View>
          ) : (
            <Text>No shifts today.</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionButton
            title="Swap Shift"
            icon="exchange-alt"
            onPress={() => navigation.navigate('ShiftswapScreen')}
          />
          <ActionButton
            title="Availability"
            icon="calendar-check"
            onPress={() => navigation.navigate('AvailabilityScreen')}
          />
          <ActionButton
            title="Messages"
            icon="envelope"
            onPress={() => navigation.navigate('MessagesScreen')}
          />
        </View>

        {/* Weekly Summary */}
        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text>Hours Worked: {weeklySummary.hoursWorked || 0}</Text>
            <Text>Overtime: {weeklySummary.overtime || 0}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('HomeScreen')}
        >
          <Ionicons name="home" size={24} color="#1976D2" />
          <Text style={[styles.footerText, { color: '#1976D2' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ScheduleScreen')}
        >
          <Ionicons name="calendar" size={24} color="#555" />
          <Text style={styles.footerText}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person" size={24} color="#555" />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff',
    paddingHorizontal: 20
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  topRightContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userRole: {
    fontSize: 14,
    color: '#888',
    marginRight: 10
  },
  iconSpacing: {
    marginRight: 15
  },
  announcement: {
    backgroundColor: '#FFF7E5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10
  },
  announcementItem: {
    marginBottom: 10
  },
  announcementTitle: {
    fontWeight: 'bold'
  },
  announcementMessage: {
    color: '#555'
  },
  clockStatus: {
    backgroundColor: '#E6F2FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  statusText: {
    fontWeight: 'bold',
    marginBottom: 6
  },
  timeText: {
    marginBottom: 8,
    color: '#555'
  },
  clockBtn: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    gap: 5
  },
  clockBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  schedule: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20
  },
  actionBtn: {
    alignItems: 'center'
  },
  actionBtnText: {
    marginTop: 4
  },
  summary: {
    padding: 15
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  footerItem: {
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
    color: '#555'
  }
});