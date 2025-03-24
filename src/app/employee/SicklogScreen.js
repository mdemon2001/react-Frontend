// src/app/employee/SickLogScreen.js (or src/app/shared/SickLogScreen.js)

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext'; // Adjust path if needed

const SickLogScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  // Suppose these were passed from ScheduleScreen:
  const { shiftId, shiftDate, startTime, endTime } = route.params || {};

  // We'll track the selected date as a string (dd/mm/yyyy) just for UI
  // If you need advanced date picking, consider 'react-native-date-picker' or DateTimePicker
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');

  // For success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Base URL for your API
  const apiBaseUrl = 'http://localhost:5000/api';

  useEffect(() => {
    // Convert the shift date from e.g. "2025-03-20T00:00:00.000Z" to "DD/MM/YYYY"
    if (shiftDate) {
      const dateObj = new Date(shiftDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      setSelectedDate(`${day}/${month}/${year}`);
    }
  }, [shiftDate]);

  const handleSubmitSickCall = async () => {
    try {
      // Perform the POST call
      // The backend checks the 3-hour rule, so if it's too late, it returns 400
      const response = await axios.post(
        `${apiBaseUrl}/callInSick`,
        {
          userId,
          shiftId,
          reason
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );

      // If successful:
      setSuccessModalVisible(true);
    } catch (error) {
      // If the backend returns 400 or 500, show the error message
      const errMsg = error.response?.data?.message || 'Error submitting sick call.';
      Alert.alert('Error', errMsg);
    }
  };

  const handleCloseModal = () => {
    setSuccessModalVisible(false);
    // Go back to the schedule or wherever appropriate
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F8F9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call in Sick</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons name="time" size={24} color="#FF9800" style={{ marginRight: 8 }} />
          <Text style={styles.warningText}>
            Please submit your sick call at least 3 hours before your shift starts
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Select Date */}
          <Text style={styles.label}>Select Date(s)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="calendar" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="dd/mm/yyyy"
              keyboardType="numeric"
            />
          </View>

          {/* Reason (Optional) */}
          <Text style={styles.label}>Reason (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Briefly describe your condition..."
            multiline
            numberOfLines={4}
          />

          {/* Current Shift */}
          <Text style={styles.label}>Your Current Shift</Text>
          <View style={styles.shiftBox}>
            <Ionicons name="time-outline" size={18} color="#555" style={{ marginRight: 6 }} />
            <Text style={styles.shiftText}>
              {startTime} - {endTime} {'  '}
              {shiftDate ? 'Today' : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitSickCall}
        >
          <Text style={styles.submitButtonText}>Submit Sick Call</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.checkIconContainer}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Sick Call Submitted</Text>
            <Text style={styles.modalMessage}>
              Your sick call has been successfully recorded.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleCloseModal}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Example Styles
const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    color: '#FF9800',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  shiftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  shiftText: {
    fontSize: 14,
    color: '#555',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-between',
  },
  cancelButton: {
    width: '45%',
    height: 45,
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '45%',
    height: 45,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  checkIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  doneButton: {
    width: '50%',
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SickLogScreen;