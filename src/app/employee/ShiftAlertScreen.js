// src/app/employee/ShiftAlertScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';  // or 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../context/AuthContext';

// Adjust this to your server’s base URL
const apiBaseUrl = 'http://localhost:5000/api';

// For convenience, define possible alert times in minutes with labels
const ALERT_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 }
];

const ShiftAlertScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // Local state
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState(30); // default 30
  const [fetchError, setFetchError] = useState(null);

  // We'll store the entire userSettings if needed, but focusing on shiftAlerts
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const response = await axios.get(`${apiBaseUrl}/settings`, { headers });
      const settings = response.data;

      // If shiftAlerts is present, use its alertTime
      if (settings.shiftAlerts && typeof settings.shiftAlerts.alertTime === 'number') {
        setSelectedTime(settings.shiftAlerts.alertTime);
      }
      setUserSettings(settings);
    } catch (error) {
      console.error('Error fetching user settings:', error.response?.data || error.message);
      setFetchError('Failed to load your settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    // If we haven't loaded userSettings yet, do nothing
    if (!userSettings) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const updatedSettings = {
        ...userSettings,
        shiftAlerts: {
          // If your schema also has 'enabled', you can keep or set it here
          enabled: true, 
          alertTime: selectedTime
        }
      };

      // PUT /settings with updated shiftAlerts
      const response = await axios.put(`${apiBaseUrl}/settings`, updatedSettings, { headers });
      setUserSettings(response.data);  // new settings from server

      Alert.alert('Success', 'Your shift alert settings have been updated.');
    } catch (error) {
      console.error('Error updating settings:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update settings. Please try again later.');
    }
  };

  // Helper to convert minutes to a human-friendly string for "Current Alert Time"
  const formatAlertTime = (minutes) => {
    if (minutes === 60) return '1 hour before shift';
    if (minutes === 120) return '2 hours before shift';
    return `${minutes} minutes before shift`;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header with back arrow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shift Alert Settings</Text>
        {/* Placeholder for alignment; or use a flex spacer */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {fetchError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        ) : (
          <>
            {/* Current Alert Time */}
            <View style={styles.currentAlertTimeContainer}>
              <Text style={styles.currentAlertTimeLabel}>Current Alert Time</Text>
              <Text style={styles.currentAlertTimeValue}>
                {formatAlertTime(selectedTime)}
              </Text>
            </View>

            {/* Explanation */}
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationText}>
                Choose how far in advance you'd like to receive notifications before your shift
                starts. We recommend setting this to at least 30 minutes to ensure you have enough
                time to prepare.
              </Text>
            </View>

            {/* Alert Timing (radio group) */}
            <Text style={styles.radioGroupLabel}>Alert Timing</Text>
            {ALERT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => setSelectedTime(option.value)}
              >
                <Ionicons
                  name={selectedTime === option.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedTime === option.value ? '#1976D2' : '#999'}
                />
                <Text style={styles.radioOptionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Save Changes Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ShiftAlertScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16
  },
  errorContainer: {
    backgroundColor: '#ffdddd',
    borderRadius: 6,
    padding: 12
  },
  errorText: {
    color: '#900'
  },
  currentAlertTimeContainer: {
    marginBottom: 20
  },
  currentAlertTimeLabel: {
    fontSize: 14,
    color: '#666'
  },
  currentAlertTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4
  },
  explanationContainer: {
    marginBottom: 20
  },
  explanationText: {
    fontSize: 14,
    color: '#333'
  },
  radioGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  radioOptionLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  saveButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});