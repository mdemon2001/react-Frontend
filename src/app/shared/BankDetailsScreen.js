// src/app/shared/BankDetailScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext'; // Adjust path as needed

const BankDetailScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // Replace with your actual API base URL
  const apiBaseUrl = 'http://localhost:5000/api';

  // State to hold bank detail fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Track if user already has bank details
  const [existingDetail, setExistingDetail] = useState(false);

  // Success modal visibility
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Fetch bank details on mount
  useEffect(() => {
    fetchBankDetail();
  }, []);

  const fetchBankDetail = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/bankdetail`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      // If response.data is null, user has no bank details yet
      if (response.data) {
        setExistingDetail(true);
        setBankName(response.data.bankName);
        setAccountNumber(response.data.accountNumber);
        setSortCode(response.data.sortCode);
        setAccountHolderName(response.data.accountHolderName);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bank details.');
    }
  };

  // Save bank details
  const handleSave = async () => {
    // Basic validation
    if (!bankName || !accountNumber || !sortCode || !accountHolderName) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    try {
      if (existingDetail) {
        // Update existing detail
        await axios.put(
          `${apiBaseUrl}/bankdetail`,
          { bankName, accountNumber, sortCode, accountHolderName },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
      } else {
        // Add new bank detail
        await axios.post(
          `${apiBaseUrl}/bankdetail`,
          { bankName, accountNumber, sortCode, accountHolderName },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
      }

      // Show success modal
      setSuccessModalVisible(true);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save bank details.'
      );
    }
  };

  // Hide modal and navigate away or do anything else
  const handleDone = () => {
    setSuccessModalVisible(false);
    // For instance, just go back to previous screen:
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
        <Text style={styles.headerTitle}>Update Bank Details</Text>
        <View style={{ width: 24 /* to balance the layout on right side */ }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#1976D2" />
          <Text style={styles.infoBoxText}>
            Your banking information is encrypted and securely stored. We take
            your privacy seriously.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Bank Name */}
          <Text style={styles.label}>Bank Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="business" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Enter bank name"
            />
          </View>

          {/* Account Number */}
          <Text style={styles.label}>Account Number</Text>
          <View style={styles.inputRow}>
            <Ionicons name="card" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter account number"
              keyboardType="numeric"
            />
          </View>

          {/* Sort Code */}
          <Text style={styles.label}>Sort Code</Text>
          <View style={styles.inputRow}>
            <Ionicons name="barcode" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={sortCode}
              onChangeText={setSortCode}
              placeholder="Enter sort code"
              keyboardType="numeric"
            />
          </View>

          {/* Account Holder Name */}
          <Text style={styles.label}>Account Holder Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Enter account holder name"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.checkIconContainer}>
              <Ionicons name="checkmark" size={36} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>
              Bank Details {existingDetail ? 'Updated' : 'Added'}
            </Text>
            <Text style={styles.modalMessage}>
              Your banking information has been successfully{' '}
              {existingDetail ? 'updated' : 'added'} in our system.
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBoxText: {
    marginLeft: 10,
    color: '#1976D2',
    fontSize: 14,
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
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
    borderColor: '#1976D2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  saveButton: {
    width: '45%',
    height: 45,
    borderRadius: 6,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Modal styles
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
    marginBottom: 8,
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

export default BankDetailScreen;