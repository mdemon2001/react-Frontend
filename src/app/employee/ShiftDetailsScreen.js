// src/app/employee/ShiftDetailsScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const ShiftDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { shiftId } = route.params || {}; // Shift ID passed from ScheduleScreen
  const { userToken } = useContext(AuthContext);

  // Example base URL for your API
  const apiBaseUrl = 'http://localhost:5000/api';

  // Control modal visibility (in case you want to show/hide it in various ways)
  const [modalVisible, setModalVisible] = useState(true);

  // Data from backend
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShiftDetails();
  }, [shiftId]);

  const fetchShiftDetails = async () => {
    if (!shiftId) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // GET /shifts/:shiftId
      const response = await axios.get(`${apiBaseUrl}/shifts/${shiftId}`, { headers });
      setShiftData(response.data);
    } catch (error) {
      console.error('Error fetching shift details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // If you want to unmount the screen (go back)
    navigation.goBack();
    // Or if you prefer to hide the modal but keep on the same screen:
    // setModalVisible(false);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const options = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return d.toLocaleDateString(undefined, options);
  };

  // Example check icon for tasks
  const renderCheckIcon = () => (
    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
  );

  if (loading) {
    return (
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text>Loading shift details...</Text>
            <ActivityIndicator size="large" style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>
    );
  }

  if (!shiftData) {
    // If shift not found or error, show something
    return (
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shift Details</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <Text>Shift not found.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // shiftData keys: { date, time, location, role, duties, colleagues[] }
  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Shift Details</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            {/* Date */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#1976D2" style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>{formatDate(shiftData.date)}</Text>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#1976D2" style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>{shiftData.time}</Text>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#1976D2" style={{ marginRight: 8 }} />
              <Text style={styles.infoText}>{shiftData.location}</Text>
            </View>

            {/* Role & Duties */}
            <Text style={styles.sectionHeader}>ROLE & DUTIES</Text>
            {shiftData.duties && shiftData.duties.length ? (
              shiftData.duties.map((duty, idx) => (
                <View key={idx} style={styles.dutyRow}>
                  {renderCheckIcon()}
                  <Text style={styles.dutyText}>{duty}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#555' }}>No tasks assigned.</Text>
            )}

            {/* Colleagues */}
            <Text style={styles.sectionHeader}>COLLEAGUES ON SHIFT</Text>
            {shiftData.colleagues && shiftData.colleagues.length ? (
              shiftData.colleagues.map((col, idx) => (
                <View key={idx} style={styles.colleagueRow}>
                  {/* If you have an avatar: 
                      <Image source={{ uri: col.avatarUrl }} style={styles.avatar} /> 
                      or a placeholder
                  */}
                  <View style={styles.colleagueInfo}>
                    <Text style={styles.colleagueName}>{col.name}</Text>
                    <Text style={styles.colleagueRole}>{col.role}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: '#555' }}>No colleagues found.</Text>
            )}
          </ScrollView>

          {/* Close Button at bottom */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Example styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',  // dimmed overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#F9FBFF',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollArea: {
    marginTop: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
  },
  sectionHeader: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dutyText: {
    color: '#333',
    fontSize: 14,
  },
  colleagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colleagueInfo: {
    marginLeft: 8,
  },
  colleagueName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  colleagueRole: {
    fontSize: 13,
    color: '#666',
  },
  closeButton: {
    width: '100%',
    height: 45,
    backgroundColor: '#1976D2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ShiftDetailsScreen;