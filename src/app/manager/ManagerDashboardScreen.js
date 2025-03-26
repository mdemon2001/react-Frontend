// src/app/(manager)/ManagerDashboardScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import axios from 'axios';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'expo-router'; // <-- expo-router instead of useNavigation

export default function ManagerDashboardScreen() {
  const router = useRouter(); // <-- expo-router
  const { userToken, userId, isLoading } = useContext(AuthContext);
  const apiBaseUrl = 'http://localhost:5001/api';

  // Clock / time display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Is manager currently clocked in for the day?
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Attendance stats: { present, total }
  const [presentEmployees, setPresentEmployees] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Today’s shifts from /schedules/date?date=YYYY-MM-DD
  const [todaysShiftsCount, setTodaysShiftsCount] = useState(0);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);

  // Recent Activity (from /history?days=1)
  const [recentActivity, setRecentActivity] = useState([]);

  // Loading
  const [loading, setLoading] = useState(true);
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text>Loading Auth...</Text>
      </View>
    );
  }

  // 2) If we have no token => route to login (or do something)
  if (!userToken) {
    // If not logged in, send user back to login
    router.replace('/auth/LoginScreen'); // <-- Adjust your path if needed
    return null; // Or a loading indicator
  }
  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchDashboardData();

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };

      // 1) Are we clocked in? We'll see if there's an attendance doc with clockOut == null
      const attendanceRes = await axios.get(`${apiBaseUrl}/attendance/history`, { headers });
      const records = attendanceRes.data || [];
      const todayDateStr = new Date().toISOString().split('T')[0];
      const openRecord = records.find(r => {
        const recordDate = r.date.split('T')[0];
        return recordDate === todayDateStr && !r.clockOut;
      });
      setIsClockedIn(!!openRecord);

      // 2) Employees stats
      const statsRes = await axios.get(`${apiBaseUrl}/attendance/today-stats`, { headers });
      setPresentEmployees(statsRes.data.present || 0);
      setTotalEmployees(statsRes.data.total || 0);

      // 3) Today’s shifts
      const scheduleRes = await axios.get(`${apiBaseUrl}/schedules/date?date=${todayDateStr}`, { headers });
      setTodaysShiftsCount(scheduleRes.data?.length || 0);

      // 4) Announcements
      const annRes = await axios.get(`${apiBaseUrl}/announcements`, { headers });
      const allAnnouncements = annRes.data || [];
      const sortedAnn = allAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(sortedAnn.slice(0, 2));

      // 5) Recent Activity
      const activityRes = await axios.get(`${apiBaseUrl}/history?days=1`, { headers });
      const acts = activityRes.data || [];
      setRecentActivity(acts.slice(0, 2));
    } catch (error) {
      Alert.alert('Error', 'Failed to load manager dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Clock in / out handler
  const handleClockAction = async () => {
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      if (!isClockedIn) {
        // clock in
        await axios.post(
          `${apiBaseUrl}/attendance/clockin`,
          { shiftType: 'Morning' },
          { headers }
        );
        setIsClockedIn(true);
      } else {
        // clock out
        await axios.post(
          `${apiBaseUrl}/attendance/clockout`,
          {},
          { headers }
        );
        setIsClockedIn(false);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Clock action failed');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        {/* Header - Avatar, "Manager View," icons */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Image
              source={{ uri: 'https://via.placeholder.com/60' }}
              style={styles.avatar}
            />
            <Text style={styles.headerTitle}>Manager View</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 20 }}>
      {/* Make this icon clickable */}
      <TouchableOpacity onPress={() => router.push('/shared/SettingsScreen')}>
        <Ionicons name="settings-outline" size={24} color="#000" />
      </TouchableOpacity>
          </View>
        </View>

        {/* Clock area */}
        <View style={styles.clockArea}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity
            style={[
              styles.clockButton,
              { backgroundColor: isClockedIn ? '#f44336' : '#4CAF50' }
            ]}
            onPress={handleClockAction}
          >
            <Text style={styles.clockButtonText}>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {presentEmployees}/{totalEmployees}
            </Text>
            <Text style={styles.statLabel}>Employees In</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todaysShiftsCount}</Text>
            <Text style={styles.statLabel}>Today's Shifts</Text>
          </View>
        </View>

        {/* 4 big Buttons row: Employees, Schedule, Payroll, Request */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('/manager/EmployeeManagementScreen')}
          >
            <FontAwesome5 name="users" size={24} color="#1976D2" />
            <Text style={styles.featureText}>Employees</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('/manager/CreateRotaScreen')}
          >
            <Ionicons name="briefcase-outline" size={24} color="#1976D2" />
            <Text style={styles.featureText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('/manager/PayrollManagementScreen')}
          >
            <FontAwesome5 name="money-check-alt" size={24} color="#1976D2" />
            <Text style={styles.featureText}>Payroll</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('/manager/ApprovalRequestsScreen')}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#1976D2" />
            <Text style={styles.featureText}>Request</Text>
          </TouchableOpacity>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity onPress={() => router.push('/manager/AnnouncementManagementScreen')}>
              <Ionicons name="add-circle-outline" size={24} color="#1976D2" />
            </TouchableOpacity>
          </View>

          {announcements.length === 0 ? (
            <Text style={styles.noneText}>No announcements.</Text>
          ) : (
            announcements.map((ann) => (
              <View key={ann._id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{ann.title}</Text>
                <Text style={styles.announcementTime}>
                  {new Date(ann.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.announcementMessage}>{ann.message}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <Text style={styles.noneText}>No recent activity.</Text>
          ) : (
            recentActivity.map((item, idx) => (
              <View key={idx} style={styles.activityItem}>
                <View style={styles.activityAvatarWrapper}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/40' }}
                    style={styles.activityAvatar}
                  />
                </View>
                <View style={styles.activityTextWrapper}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtitle}>
                    {item.subtitle || 'A few minutes ago'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer navigation => Home, Messages, Reports, Profile */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/manager/ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#1976D2" />
          <Text style={[styles.footerText, { color: '#1976D2' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/shared/MessagesScreen')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/manager/ReportsScreen')}
        >
          <Ionicons name="bar-chart-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.push('/shared/ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Example styles
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fcff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 60, // space for the footer
  },
  header: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clockArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clockButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  clockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    marginTop: 4,
    color: '#666',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  featureButton: {
    alignItems: 'center',
  },
  featureText: {
    marginTop: 6,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noneText: {
    color: '#999',
    marginTop: 10,
  },
  announcementCard: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
    marginTop: 10,
  },
  announcementTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  announcementTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  announcementMessage: {
    fontSize: 14,
    color: '#555',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 10,
    marginTop: 10,
  },
  activityAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activityTextWrapper: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  activitySubtitle: {
    color: '#999',
    fontSize: 12,
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
    alignItems: 'center',
    paddingVertical: 5,
  },
  footerItem: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
    color: '#555',
  },
});