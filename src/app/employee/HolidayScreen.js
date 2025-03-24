// src/app/employee/HolidayScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const HolidayScreen = () => {
  const { userToken } = useContext(AuthContext);
  const apiBaseUrl = 'http://localhost:5000/api';

  // We enforce future-only. If you want to allow “today,” set minDate to new Date().
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // State
  const [type, setType] = useState('Paid'); // "Paid" or "Unpaid"
  const [reason, setReason] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [notification, setNotification] = useState(true);

  // Manual date fields, typed as "YYYY-MM-DD"
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  // Called once on mount
  useEffect(() => {
    fetchHolidayStatus();
  }, []);

  // Load existing leaves
  const fetchHolidayStatus = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/holidays/status`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setLeaveHistory(response.data);
    } catch (error) {
      Alert.alert('Error', "Couldn't fetch leave history.");
    }
  };

  // Helper to parse "YYYY-MM-DD" => Date
  function parseDateString(str) {
    // Basic pattern check
    const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = str.match(regex);
    if (!match) return null; // invalid format

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // zero-based
    const day = parseInt(match[3], 10);

    const d = new Date(year, month, day);
    // If the date is invalid (like 2025-13-40), 
    // or if the year is < 2023 or something, check:
    if (isNaN(d.getTime())) return null;
    return d;
  }

  // Check date is future, i.e. >= tomorrow
  function isFutureDate(d) {
    return d && d >= tomorrow;
  }

  // Submit request
  const submitRequest = async () => {
    try {
      // Parse user typed strings
      const startDate = parseDateString(startDateStr);
      const endDate = parseDateString(endDateStr);

      if (!startDate) throw new Error('Invalid start date format (use YYYY-MM-DD)');
      if (!endDate) throw new Error('Invalid end date format (use YYYY-MM-DD)');

      if (!isFutureDate(startDate)) {
        throw new Error('Start date must be in the future');
      }
      if (!isFutureDate(endDate)) {
        throw new Error('End date must be in the future');
      }
      if (startDate > endDate) {
        throw new Error('End date cannot be before start date');
      }

      // POST to your backend
      await axios.post(
        `${apiBaseUrl}/holidays/book`,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      Alert.alert('Success', 'Request submitted!');
      // Reload history
      fetchHolidayStatus();

      // Reset fields
      setStartDateStr('');
      setEndDateStr('');
      setReason('');
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Submission failed'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* If any request is pending */}
      {leaveHistory.some((h) => h.status === 'Pending') && (
        <View style={styles.pendingApproval}>
          <Ionicons name="time-outline" size={18} color="#4B6FDB" />
          <Text style={{ color: '#4B6FDB' }}> Pending Approval</Text>
        </View>
      )}

      {/* Leave Type */}
      <Text style={styles.sectionTitle}>Leave Type</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity onPress={() => setType('Paid')} style={styles.radioItem}>
          <Ionicons name={type === 'Paid' ? 'radio-button-on' : 'radio-button-off'} size={20} />
          <Text> Paid Leave</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setType('Unpaid')} style={styles.radioItem}>
          <Ionicons name={type === 'Unpaid' ? 'radio-button-on' : 'radio-button-off'} size={20} />
          <Text> Unpaid Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selection (Manual typed) */}
      <View style={styles.dates}>
        <Text style={styles.label}>Select Dates</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.manualDateInput}
            placeholder="YYYY-MM-DD"
            value={startDateStr}
            onChangeText={setStartDateStr}
          />
          <Text>to</Text>
          <TextInput
            style={styles.manualDateInput}
            placeholder="YYYY-MM-DD"
            value={endDateStr}
            onChangeText={setEndDateStr}
          />
        </View>
      </View>

      {/* Reason Input */}
      <Text style={styles.sectionTitle}>Reason (Optional)</Text>
      <TextInput
        style={styles.textInput}
        multiline
        value={reason}
        onChangeText={setReason}
        placeholder="Enter reason..."
        maxLength={500}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={submitRequest}>
        <Text style={styles.submitText}>Submit Request</Text>
      </TouchableOpacity>

      {/* Leave History */}
      <Text style={styles.sectionTitle}>Leave History</Text>
      {leaveHistory.length > 0 ? (
        leaveHistory.map((item, idx) => (
          <View key={idx} style={styles.leaveCard}>
            <Text style={styles.datesText}>
              {new Date(item.startDate).toLocaleDateString()} -{' '}
              {new Date(item.endDate).toLocaleDateString()}
            </Text>
            <Text style={styles.reasonText}>
              {item.reason || 'No reason provided'}
            </Text>
            <Text
              style={[
                styles.status,
                {
                  backgroundColor:
                    item.status === 'Approved'
                      ? '#D4EDDA'
                      : item.status === 'Denied'
                      ? '#F8D7DA'
                      : '#FFF3CD',
                  color:
                    item.status === 'Approved'
                      ? '#155724'
                      : item.status === 'Denied'
                      ? '#721c24'
                      : '#856404',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noHistory}>No leave history found.</Text>
      )}

      {/* Notifications */}
      <View style={styles.notificationToggle}>
        <Text style={styles.sectionTitle}>Status Updates</Text>
        <Switch
          value={notification}
          onValueChange={setNotification}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={notification ? '#1976D2' : '#f4f3f4'}
        />
      </View>
    </ScrollView>
  );
};

// -- STYLES & HELPERS --

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  pendingApproval: {
    flexDirection: 'row',
    backgroundColor: '#E6F0FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dates: {
    marginVertical: 15,
  },
  label: {
    marginBottom: 5,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  manualDateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    height: 100,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#1976D2',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaveCard: {
    backgroundColor: '#f7f7f7',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    gap: 5,
  },
  noHistory: {
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 10,
  },
  status: {
    padding: 6,
    borderRadius: 4,
    marginTop: 5,
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HolidayScreen;