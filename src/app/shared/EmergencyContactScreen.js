import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext'; // Adjust path if needed
import { useRouter } from 'expo-router';
const EmergencyContactScreen = () => {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  // Base URL for your API (adjust if necessary)
  const apiBaseUrl = 'http://localhost:5001/api/emergencyContacts';

  // State to store the fetched contacts
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal visibility for adding a contact
  const [addModalVisible, setAddModalVisible] = useState(false);

  // New contact form fields
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // For the success banner
  const [successMessage, setSuccessMessage] = useState('');
  const [successOpacity] = useState(new Animated.Value(0)); // for fade in/out effect

  // Relationship options
  const relationshipOptions = [
    'Brother',
    'Sister',
    'Father',
    'Mother',
    'Friend',
    'Husband',
    'Wife',
    'Other'
  ];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiBaseUrl, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setContacts(res.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone) => {
    // Simple phone validation (checks for at least 10 digits).
    const numeric = phone.replace(/\D/g, '');
    return numeric.length >= 10;
  };

  const handleAddContact = async () => {
    // Basic form validation
    if (!fullName || !relationship || !phoneNumber) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }
    if (!validatePhone(phoneNumber)) {
      Alert.alert('Validation', 'Please enter a valid phone number.');
      return;
    }

    try {
      const newContact = {
        fullName,
        relationship,
        phoneNumber,
      };
      const res = await axios.post(apiBaseUrl, newContact, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // The response is the updated array of contacts
      setContacts(res.data);
      setAddModalVisible(false);
      setFullName('');
      setRelationship('');
      setPhoneNumber('');

      // Show success banner
      setSuccessMessage('Emergency contact successfully added!');
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        // Fade out after 2 seconds
        setTimeout(() => {
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }).start(() => {
            setSuccessMessage('');
          });
        }, 2000);
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to add emergency contact.');
    }
  };

  const openAddModal = () => {
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    // Reset form
    setFullName('');
    setRelationship('');
    setPhoneNumber('');
  };

  // Example placeholders for edit / delete
  const handleEditContact = (contactId) => {
    Alert.alert('Edit', `Edit contact with ID: ${contactId}`);
    // Or open a separate modal to edit
  };

  const handleDeleteContact = async (contactId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await axios.delete(`${apiBaseUrl}/${contactId}`, {
              headers: { Authorization: `Bearer ${userToken}` },
            });
            setContacts(res.data); // updated array after deletion
          } catch (err) {
            Alert.alert('Error', 'Failed to delete contact.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.back(); }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        {/* Add Button (top-right) */}
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={28} color="#1976D2" />
        </TouchableOpacity>
      </View>

      {/* Success Banner */}
      {successMessage ? (
        <Animated.View style={[styles.successBanner, { opacity: successOpacity }]}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      ) : null}

      {/* Main content */}
      <ScrollView style={styles.scrollArea}>
        {loading ? (
          <Text>Loading contacts...</Text>
        ) : contacts.length === 0 ? (
          <Text>No emergency contacts found.</Text>
        ) : (
          contacts.map((contact) => (
            <View key={contact._id} style={styles.contactCard}>
              <View>
                <Text style={styles.contactName}>{contact.fullName}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              </View>
              {/* Ellipsis for more options: Edit or Delete */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Contact Options',
                    `What would you like to do with ${contact.fullName}?`,
                    [
                      { text: 'Edit', onPress: () => handleEditContact(contact._id) },
                      { text: 'Delete', onPress: () => handleDeleteContact(contact._id) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <MaterialIcons name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />

              <Text style={styles.label}>Relationship</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={relationship}
                  onValueChange={(value) => setRelationship(value)}
                >
                  <Picker.Item label="Select relationship" value="" />
                  {relationshipOptions.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+44"
                keyboardType="phone-pad"
              />
            </View>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
                <Text style={styles.saveButtonText}>Save Contact</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#F9FCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 6,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  scrollArea: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactRelationship: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
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
  },
  form: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden', // ensures Picker doesn't overlap
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    width: '45%',
    height: 45,
    borderColor: '#1976D2',
    borderWidth: 1,
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
});

export default EmergencyContactScreen;