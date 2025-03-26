// src/app/(shared)/EditProfileScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext'; // Adjust path if needed

// expo-router
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const { userToken } = useContext(AuthContext);

  // Replace with your own API base URL
  const apiBaseUrl = 'http://localhost:5001/api';

  // Local state for profile data from backend
  const [profile, setProfile] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    profileImage: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch user's profile from backend
  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setProfile(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data.');
    }
  };

  // Update local state fields
  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  // Cancel button → just go back using expo-router
  const handleCancel = () => {
    router.back();
  };

  // Save changes → PUT /profile
  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `${apiBaseUrl}/profile`,
        {
          fullName: profile.fullName,
          jobTitle: profile.jobTitle,
          email: profile.email,
          phone: profile.phone,
          profileImage: profile.profileImage
        },
        {
          headers: { Authorization: `Bearer ${userToken}` }
        }
      );
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Error updating profile.'
      );
    }
  };

  // Show a placeholder image if profileImage is empty
  const avatarSource = profile.profileImage
    ? { uri: profile.profileImage }
    : { uri: 'https://via.placeholder.com/100/808080/FFFFFF/?text=Avatar' };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F8F9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header with single arrow (left) -> go back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        {/* Empty view for spacing on the right side */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Avatar + Camera Icon */}
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatar} />
          <TouchableOpacity
            style={styles.cameraIconContainer}
            onPress={() => Alert.alert('Camera', 'Image upload not implemented.')}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Form fields (no placeholders) */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={profile.fullName}
            onChangeText={(text) => handleChange('fullName', text)}
          />

          <Text style={styles.label}>Job Title</Text>
          <TextInput
            style={styles.input}
            value={profile.jobTitle}
            onChangeText={(text) => handleChange('jobTitle', text)}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={profile.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(text) => handleChange('phone', text)}
            keyboardType="phone-pad"
          />
        </View>
      </ScrollView>

      {/* Footer with Cancel & Save Changes */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000'
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: '#1976D2',
    borderRadius: 18,
    padding: 6
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 42,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 15
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-between'
  },
  cancelButton: {
    width: '45%',
    height: 45,
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#1976D2',
    fontWeight: 'bold'
  },
  saveButton: {
    width: '45%',
    height: 45,
    borderRadius: 6,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});