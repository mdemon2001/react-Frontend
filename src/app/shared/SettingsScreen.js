// src/app/employee/SettingsScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // Replace with your actual API base URL:
  const apiBaseUrl = 'http://localhost:5000/api';

  // State to store user profile info from backend
  const [userProfile, setUserProfile] = useState({
    name: '',
    role: '',
    avatar: '',
  });

  // State to store settings from backend
  const [settings, setSettings] = useState({
    pushNotifications: false,
    shiftAlerts: false,
    darkMode: false,
    dataPrivacy: false,
    privacyPolicyAccepted: false,
  });

  // On mount, fetch both user profile and settings
  useEffect(() => {
    fetchUserProfile();
    fetchUserSettings();
  }, []);

  // Fetch the user's profile (name, role, avatar) from your API
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/user/profile`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setUserProfile(res.data);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch user profile.');
    }
  };

  // Fetch the user's settings from your existing settings endpoint
  const fetchUserSettings = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/settings`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setSettings(res.data);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch settings.');
    }
  };

  // Update a specific setting (key) with a new value (value)
  const updateSettings = async (key, value) => {
    // Update local state first for immediate UI feedback
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    // Send updated setting to backend
    try {
      await axios.put(`${apiBaseUrl}/settings`, updatedSettings, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to update settings.');
    }
  };

  // Accept the privacy policy (sets `privacyPolicyAccepted` to true)
  const acceptPrivacyPolicy = async () => {
    try {
      await axios.patch(
        `${apiBaseUrl}/settings/privacy`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setSettings((prev) => ({ ...prev, privacyPolicyAccepted: true }));
      Alert.alert('Policy Accepted', 'You have accepted the privacy policy.');
    } catch (error) {
      Alert.alert('Error', 'Could not update policy acceptance.');
    }
  };

  // Display a placeholder avatar if userProfile.avatar is empty
  const avatarSource = userProfile.avatar
    ? { uri: userProfile.avatar }
    : {
        uri: 'https://via.placeholder.com/150/808080/FFFFFF/?text=Avatar',
      };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile.name || 'Your Name'}
            </Text>
            <Text style={styles.profileRole}>
              {userProfile.role || 'Role'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

          {/* Push Notifications */}
          <View style={styles.row}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => updateSettings('pushNotifications', value)}
            />
          </View>

          {/* Shift Alerts */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              // Toggle shiftAlerts and maybe navigate if desired
              updateSettings('shiftAlerts', !settings.shiftAlerts);
            }}
          >
            <View>
              <Text style={styles.label}>Shift Alerts</Text>
              {settings.shiftAlerts && (
                <Text style={styles.subtitle}>1 hour before</Text>
              )}
            </View>
            <Switch
              value={settings.shiftAlerts}
              onValueChange={(value) => updateSettings('shiftAlerts', value)}
            />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSettings('darkMode', value)}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('FaqScreen')}
          >
            <Text style={styles.label}>FAQs</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('SupportScreen')}
          >
            <Text style={styles.label}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('PrivacyPolicyScreen')}
          >
            <Text style={styles.label}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('SecuritySettingsScreen')}
          >
            <Text style={styles.label}>Security Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.label}>Data Privacy</Text>
            <Switch
              value={settings.dataPrivacy}
              onValueChange={(value) => updateSettings('dataPrivacy', value)}
            />
          </View>
        </View>

        {/* Accept Privacy Policy (if not accepted) */}
        {!settings.privacyPolicyAccepted && (
          <TouchableOpacity
            style={styles.acceptPolicy}
            onPress={acceptPrivacyPolicy}
          >
            <Text style={styles.acceptPolicyText}>Accept Privacy Policy</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  acceptPolicy: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 8,
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  acceptPolicyText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;