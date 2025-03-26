// src/app/(manager)/ApprovalRequestsScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

// 1) Import socket.io-client
import { io } from 'socket.io-client';

// 2) Expo Router
import { useRouter } from 'expo-router';

export default function ApprovalRequestsScreen() {
  const router = useRouter();
  const { userToken, userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // The three categories from the backend
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [sickLeaves, setSickLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Count how many are pending in each
  const [pendingShiftSwaps, setPendingShiftSwaps] = useState(0);
  const [pendingSickLeaves, setPendingSickLeaves] = useState(0);
  const [pendingHolidays, setPendingHolidays] = useState(0);

  // Our Socket instance
  const [socket, setSocket] = useState(null);

  const apiBaseUrl = 'http://localhost:5001/api'; // or your actual base
  const socketServerUrl = 'http://localhost:5001'; // location of your Socket.io server

  // -- 1. On mount, connect to Socket.io and fetch initial requests
  useEffect(() => {
    // Connect to your backend's Socket.io endpoint
    const s = io(socketServerUrl, {
      transports: ['websocket']
      // If you need auth token in the handshake, you can do:
      // extraHeaders: { Authorization: `Bearer ${userToken}` },
    });
    setSocket(s);

    // Once connected, we can join a “manager” room or just do nothing
    s.on('connect', () => {
      console.log('Socket connected! ID =', s.id);
      // If you want each manager to join a manager-only room, you could do:
      // s.emit('joinManagerRoom', { managerId: userId });
    });

    // Setup listeners for shiftSwapUpdate, sickLeaveUpdate, holidayUpdate
    s.on('shiftSwapUpdate', (data) => {
      console.log('shiftSwapUpdate received:', data);
      fetchAllRequests(); // easiest approach is to re-fetch
    });
    s.on('sickLeaveUpdate', (data) => {
      console.log('sickLeaveUpdate received:', data);
      fetchAllRequests();
    });
    s.on('holidayUpdate', (data) => {
      console.log('holidayUpdate received:', data);
      fetchAllRequests();
    });

    // Clean up on unmount
    return () => {
      s.disconnect();
    };
  }, [socketServerUrl]);

  // Fetch requests from the server
  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const res = await axios.get(`${apiBaseUrl}/approvals/getAllRequests`, { headers });
      const data = res.data || {};

      setShiftSwaps(data.shiftSwaps || []);
      setSickLeaves(data.sickLeaves || []);
      setHolidays(data.holidays || []);

      // Count pending
      const pSwaps = (data.shiftSwaps || []).filter(r => r.status === 'Pending').length;
      const pSick = (data.sickLeaves || []).filter(r => r.status === 'Pending').length;
      const pHol  = (data.holidays || []).filter(r => r.status === 'Pending').length;

      setPendingShiftSwaps(pSwaps);
      setPendingSickLeaves(pSick);
      setPendingHolidays(pHol);

    } catch (error) {
      Alert.alert('Error', 'Unable to load requests.');
    } finally {
      setLoading(false);
    }
  };

  // Approve or Deny a request
  const handleAction = async (requestId, requestType, action) => {
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      await axios.post(
        `${apiBaseUrl}/approvals/requests/approveOrDeny`,
        { requestId, requestType, action },
        { headers }
      );
      // Re-fetch to see the updated status
      fetchAllRequests();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Action failed');
    }
  };

  // We'll unify "Pending" requests from all categories
  const combinedPendingRequests = [
    ...shiftSwaps
      .filter(r => r.status === 'Pending')
      .map(r => ({
        _id: r._id,
        requestType: 'shiftSwap',
        userName: r.requester?.name || 'Unknown',
        details: `Wants to swap shift ${r.currentShift} → ${r.requestedShift}`,
        submittedAt: r.createdAt
      })),
    ...sickLeaves
      .filter(r => r.status === 'Pending')
      .map(r => ({
        _id: r._id,
        requestType: 'sickLeave',
        userName: r.user?.name || 'Unknown',
        details: r.reason,
        submittedAt: r.reportedAt
      })),
    ...holidays
      .filter(r => r.status === 'Pending')
      .map(r => ({
        _id: r._id,
        requestType: 'holiday',
        userName: r.user?.name || 'Unknown',
        details: `Dates: ${formatDate(r.startDate)} - ${formatDate(r.endDate)}\nReason: ${r.reason}`,
        submittedAt: r.createdAt
      }))
  ];

  // Helper for request type
  const friendlyType = (type) => {
    switch (type) {
      case 'shiftSwap': return 'Shift Swap';
      case 'sickLeave': return 'Sick Leave';
      case 'holiday':   return 'Time Off';
      default:          return 'Unknown';
    }
  };

  // For date formatting in details
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  };

  // Stats
  const totalPending = pendingShiftSwaps + pendingSickLeaves + pendingHolidays;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header: "Request Management" */}
      <View style={styles.header}>
        {/* Menu icon => placeholder for drawer */}
        <TouchableOpacity onPress={() => console.log('Menu pressed (no drawer in expo-router by default)')}>
          <Ionicons name="menu" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Management</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f1f8ff' }]}>
          <Text style={styles.statTitle}>Time Off</Text>
          <Text style={styles.statNumber}>{pendingHolidays}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#eaffea' }]}>
          <Text style={styles.statTitle}>Sick Leave</Text>
          <Text style={styles.statNumber}>{pendingSickLeaves}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f9f3ff' }]}>
          <Text style={styles.statTitle}>Shift Swap</Text>
          <Text style={styles.statNumber}>{pendingShiftSwaps}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fff6e5' }]}>
          <Text style={styles.statTitle}>Pending</Text>
          <Text style={styles.statNumber}>{totalPending}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {combinedPendingRequests.length === 0 ? (
          <Text style={styles.noRequests}>No pending requests.</Text>
        ) : (
          combinedPendingRequests.map(req => (
            <View key={req._id} style={styles.requestCard}>
              {/* Header row: name + type */}
              <View style={styles.requestHeader}>
                <Text style={styles.requestName}>{req.userName}</Text>
                <Text style={styles.requestType}>{friendlyType(req.requestType)}</Text>
              </View>
              {/* Details */}
              <Text style={styles.requestDetails}>{req.details}</Text>

              {/* Approve / Deny */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleAction(req._id, req.requestType, 'approve')}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                  onPress={() => handleAction(req._id, req.requestType, 'deny')}
                >
                  <Text style={styles.actionButtonText}>Deny</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer with Home => /manager/ManagerDashboardScreen, Settings => /shared/SettingsScreen */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/manager/ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/shared/SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  container: { flex: 1, backgroundColor: '#f9fcff' },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    elevation: 2
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 2
  },
  statTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  noRequests: {
    marginTop: 20,
    textAlign: 'center',
    color: '#888'
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    elevation: 1
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  requestType: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#777'
  },
  requestDetails: {
    marginVertical: 10,
    color: '#555',
    fontSize: 14
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10
  },
  footerItem: {
    alignItems: 'center'
  }
});