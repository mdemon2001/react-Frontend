import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  const apiBaseUrl = 'http://localhost:5001/api';
  const historyUrl = `${apiBaseUrl}/history`;
  const socketServerUrl = apiBaseUrl.replace('/api', '');

  // Socket reference
  const [socket, setSocket] = useState(null);

  // Combined history
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Split groups
  const [workShiftHistory, setWorkShiftHistory] = useState([]);
  const [shiftActionsHistory, setShiftActionsHistory] = useState([]);

  // Filter ranges
  const rangeOptions = [7, 15, 30, 90];
  const [selectedRange, setSelectedRange] = useState(30);

  // NEW/MODAL CODE: State to control filter modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Socket setup
  useEffect(() => {
    const s = io(socketServerUrl, { transports: ['websocket'] });
    setSocket(s);
    s.on('connect', () => {
      s.emit('joinUserRoom', userId);
    });
    s.on('shiftMissed', (data) => {
      const newItem = {
        id: data._id,
        type: 'Attendance',
        date: data.date,
        title: `${data.shiftType} Shift`,
        subtitle: 'Missed',
        status: 'Missed',
      };
      setHistoryItems((prev) => [newItem, ...prev]);
    });
    return () => s.disconnect();
  }, [socketServerUrl, userId]);

  // Fetch on range change
  useEffect(() => {
    fetchHistory(selectedRange);
  }, [selectedRange]);

  const fetchHistory = async (days) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const response = await axios.get(`${historyUrl}?days=${days}`, { headers });
      setHistoryItems(response.data || []);
    } catch (error) {
      console.log('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Split items
  useEffect(() => {
    const workShift = [];
    const shiftActions = [];
    historyItems.forEach((item) => {
      if (item.type === 'Attendance') workShift.push(item);
      else shiftActions.push(item);
    });
    setWorkShiftHistory(workShift);
    setShiftActionsHistory(shiftActions);
  }, [historyItems]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString(undefined, opts);
  };

  // Render shift time
  const renderShiftTime = (item) => item.subtitle ?? '';

  // Render status badge
  const renderStatusBadge = (status) => {
    if (!status) return null;
    let bgColor = '#ccc', textColor = '#fff';
    switch (status.toLowerCase()) {
      case 'completed': bgColor = '#4CAF50'; break; // green
      case 'missed': bgColor = '#f44336'; break;    // red
      case 'approved': bgColor = '#2196F3'; break;  // blue
      case 'pending': bgColor = '#FFC107'; textColor = '#333'; break; // yellow
      default: bgColor = '#9E9E9E'; break; // grey
    }
    return (
      <View style={[styles.badgeContainer, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  // Instead of Alert.alert, open a modal
  const openFilterModal = () => {
    setFilterModalVisible(true);
  };

  // When user selects a range from the modal
  const handleSelectRange = (days) => {
    setSelectedRange(days);
    setFilterModalVisible(false);
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('HomeScreen')}>
        <Ionicons name="home-outline" size={24} color="#555" />
        <Text style={styles.footerText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('ScheduleScreen')}>
        <Ionicons name="calendar-outline" size={24} color="#555" />
        <Text style={styles.footerText}>Schedule</Text>
      </TouchableOpacity>

      <View style={styles.footerItemActive}>
        <Ionicons name="time-outline" size={24} color="#1976D2" />
        <Text style={[styles.footerText, { color: '#1976D2' }]}>History</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
        {renderFooter()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={openFilterModal}>
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* "Last X Days" pill */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.dateRangePill} onPress={openFilterModal}>
          <Ionicons name="calendar-outline" size={16} color="#333" style={{ marginRight: 5 }} />
          <Text>Last {selectedRange} days</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Work Shift History */}
        <Text style={styles.sectionTitle}>Work Shift History</Text>
        {workShiftHistory.length === 0 ? (
          <Text style={styles.emptyText}>No work shift history found.</Text>
        ) : (
          workShiftHistory.map((item) => (
            <View key={item.id} style={styles.shiftCard}>
              <View style={styles.shiftCardHeader}>
                <Text style={styles.shiftCardDate}>{formatDate(item.date)}</Text>
                {renderStatusBadge(item.status)}
              </View>
              <Text style={styles.shiftCardTitle}>{item.title}</Text>
              <View style={styles.shiftCardDetails}>
                <Ionicons name="time-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                <Text style={{ color: '#555', fontSize: 14 }}>
                  {renderShiftTime(item)}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                <Text style={{ color: '#555', fontSize: 14 }}>
                  (No location data)
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Shift Actions History */}
        <Text style={styles.sectionTitle}>Shift Actions History</Text>
        {shiftActionsHistory.length === 0 ? (
          <Text style={styles.emptyText}>No shift actions history found.</Text>
        ) : (
          shiftActionsHistory.map((item) => (
            <View key={item.id} style={styles.actionCard}>
              <View style={styles.actionCardHeader}>
                <Text style={styles.actionCardDate}>{formatDate(item.date)}</Text>
                {renderStatusBadge(item.status)}
              </View>
              <Text style={styles.actionCardTitle}>{item.title}</Text>
              {!!item.subtitle && (
                <Text style={styles.actionCardSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for range selection */}
      <Modal
        transparent
        animationType="fade"
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            {rangeOptions.map((days) => (
              <TouchableOpacity
                key={days}
                style={styles.rangeOption}
                onPress={() => handleSelectRange(days)}
              >
                <Text style={styles.rangeOptionText}>Last {days} days</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.rangeOption, { backgroundColor: '#e0e0e0' }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.rangeOptionText, { color: '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Footer */}
      {renderFooter()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff',
  },
  header: {
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginHorizontal: 16,
    color: '#333',
  },
  emptyText: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
  // SHIFT CARDS
  shiftCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftCardDate: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  shiftCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  shiftCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // SHIFT ACTION CARDS
  actionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCardDate: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // BADGES
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 30,
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rangeOption: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
  },
  rangeOptionText: {
    fontSize: 14,
    color: '#000',
  },
});

export default HistoryScreen;