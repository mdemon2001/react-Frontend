import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext'; // Adjust as needed

const ShiftSwapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  // The shift the user tapped from the schedule
  const { shift } = route.params || {};

  // Local state
  const [myShifts, setMyShifts] = useState([]);      // All of the user's upcoming shifts
  const [selectedMyShiftId, setSelectedMyShiftId] = useState(shift?._id); // Default to the shift user tapped
  const [otherShifts, setOtherShifts] = useState([]); // Other employees' upcoming shifts
  const [selectedOtherShiftId, setSelectedOtherShiftId] = useState('');
  const [reason, setReason] = useState(''); // Optional reason

  // Loading & success states
  const [loading, setLoading] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Base URL
  const apiBaseUrl = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  // 1) Fetch user's upcoming shifts.
  // 2) Fetch other employees' upcoming shifts.
  // (In practice, you might have a specialized endpoint that returns both sets of data in one go.)
  const fetchData = async () => {
    try {
      setLoading(true);

      const headers = { Authorization: `Bearer ${userToken}` };

      // 1) Fetch all shifts for this user, e.g. /schedules/:userId
      const myShiftsRes = await axios.get(`${apiBaseUrl}/schedules/${userId}`, {
        headers,
      });

      // 2) Fetch all shifts for ALL employees (or a specialized endpoint for "other employees' shifts")
      // For example, an endpoint like /schedules?excludeUser={userId}
      // If you only have a single /schedules endpoint, you can fetch all and then filter out the user's shifts below:
      const allShiftsRes = await axios.get(`${apiBaseUrl}/schedules`, { headers });

      // Filter myShifts for upcoming only
      const now = new Date();
      const myUpcoming = myShiftsRes.data.filter((s) => {
        const shiftDate = new Date(s.date);
        return shiftDate > now;
      });

      // Filter out my shifts to get "others" for upcoming only
      const othersUpcoming = allShiftsRes.data.filter((s) => {
        const shiftDate = new Date(s.date);
        // Exclude shifts belonging to the logged-in user
        // or add a condition to only keep shifts for the same week, etc.
        return shiftDate > now && !s.employees.includes(userId);
      });

      setMyShifts(myUpcoming);
      setOtherShifts(othersUpcoming);
    } catch (error) {
      Alert.alert('Error', 'Unable to load shift data for swapping.');
    } finally {
      setLoading(false);
    }
  };

  // Send the swap request
  const handleSwapRequest = async () => {
    if (!selectedMyShiftId || !selectedOtherShiftId) {
      Alert.alert('Validation', 'Please select both your shift and the target shift.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${userToken}` };

      // Post to /requestSwap
      const response = await axios.post(
        `${apiBaseUrl}/requestSwap`,
        {
          userId,
          currentShiftId: selectedMyShiftId,
          targetShiftId: selectedOtherShiftId,
          // If you want to add reason to the DB, you'd also add it to your backend model
          // reason
        },
        { headers }
      );

      // If successful, show success modal
      setSuccessModalVisible(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Error submitting swap request.'
      );
    }
  };

  const handleCloseModal = () => {
    setSuccessModalVisible(false);
    // Optionally go back to schedule
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap Shift</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* My upcoming shifts list */}
        <Text style={styles.subtitle}>My Upcoming Shifts</Text>
        <View style={styles.dropdown}>
          {myShifts.length ? (
            myShifts.map((shiftItem) => (
              <TouchableOpacity
                key={shiftItem._id}
                style={[
                  styles.shiftOption,
                  shiftItem._id === selectedMyShiftId ? styles.selectedOption : null,
                ]}
                onPress={() => setSelectedMyShiftId(shiftItem._id)}
              >
                <Text style={styles.shiftOptionText}>
                  {shiftItem.title} | {shiftItem.date.split('T')[0]} |{' '}
                  {shiftItem.startTime} - {shiftItem.endTime}
                </Text>
                {shiftItem._id === selectedMyShiftId && (
                  <Ionicons name="checkmark" size={20} color="#1976D2" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: '#999' }}>No upcoming shifts.</Text>
          )}
        </View>

        {/* Other employees' upcoming shifts */}
        <Text style={styles.subtitle}>Available Shifts to Swap With</Text>
        <View style={styles.dropdown}>
          {otherShifts.length ? (
            otherShifts.map((shiftItem) => (
              <TouchableOpacity
                key={shiftItem._id}
                style={[
                  styles.shiftOption,
                  shiftItem._id === selectedOtherShiftId ? styles.selectedOption : null,
                ]}
                onPress={() => setSelectedOtherShiftId(shiftItem._id)}
              >
                <Text style={styles.shiftOptionText}>
                  {shiftItem.title} | {shiftItem.date.split('T')[0]} |{' '}
                  {shiftItem.startTime} - {shiftItem.endTime}
                </Text>
                {shiftItem._id === selectedOtherShiftId && (
                  <Ionicons name="checkmark" size={20} color="#1976D2" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: '#999' }}>No upcoming shifts from colleagues.</Text>
          )}
        </View>

        {/* Optional Reason */}
        <Text style={styles.subtitle}>Reason for Swap (Optional)</Text>
        <TextInput
          style={styles.reasonInput}
          multiline
          numberOfLines={3}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter your reason here..."
        />
      </ScrollView>

      {/* Footer: Cancel & Submit */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSwapRequest}>
          <Text style={styles.submitButtonText}>Submit Swap Request</Text>
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
            <Text style={styles.modalTitle}>Swap Request Sent!</Text>
            <Text style={styles.modalMessage}>
              Your request has been sent to your manager for approval. You’ll be notified once it’s approved.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleCloseModal}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F9',
  },
  header: {
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  shiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  shiftOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
  },
  reasonInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 60,
    borderRadius: 6,
    padding: 8,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'space-between',
  },
  cancelButton: {
    width: '45%',
    height: 45,
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '45%',
    height: 45,
    borderRadius: 6,
    backgroundColor: '#1976D2',
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

export default ShiftSwapScreen;