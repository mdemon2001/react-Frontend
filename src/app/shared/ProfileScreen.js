// src/app/shared/ProfileScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { userToken, logout } = useContext(AuthContext);

  // Adjust your base URLs/routes as necessary
  const apiBaseUrl = 'http://localhost:5000/api';
  const profileUrl = `${apiBaseUrl}/profile`;           
  const bankUrl = `${apiBaseUrl}/bankdetail`;           
  const contactsUrl = `${apiBaseUrl}/emergencyContacts`; 
  const workHistoryUrl = `${apiBaseUrl}/attendance/history`; 

  // Local state
  const [profile, setProfile] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    profileImage: '',
  });
  const [bankDetail, setBankDetail] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };

      // Fetch in parallel
      const [profileRes, bankRes, contactsRes, historyRes] = await Promise.all([
        axios.get(profileUrl, { headers }),     
        axios.get(bankUrl, { headers }),       
        axios.get(contactsUrl, { headers }),   
        axios.get(workHistoryUrl, { headers }), 
      ]);

      // Profile
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      // Bank detail (may be null if not set)
      setBankDetail(bankRes.data || null);

      // Emergency contacts array
      setEmergencyContacts(contactsRes.data || []);

      // Work history (only show partial: top 2)
      const allHistory = historyRes.data || [];
      setWorkHistory(allHistory.slice(0, 2)); // show only the 2 most recent

    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  // Return masked version of the account number, e.g., **** 4567
  const maskAccountNumber = (accountNumber = '') => {
    if (accountNumber.length < 4) return '****';
    const last4 = accountNumber.slice(-4);
    return `**** ${last4}`;
  };

  // Show a confirmation before logging out
  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Do nothing, stay on ProfileScreen
          },
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Call the actual logout function from context
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Construct a default avatar if none
  const avatarSource = profile.profileImage
    ? { uri: profile.profileImage }
    : { uri: 'https://via.placeholder.com/100/808080/FFFFFF?text=Avatar' };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  // Show only the first emergency contact to match the UI's partial display
  const primaryContact = emergencyContacts[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {/* Logout triggers confirmation */}
        <TouchableOpacity onPress={confirmLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Top User Info */}
        <View style={styles.userInfoSection}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{profile.fullName}</Text>
            <Text style={styles.userRole}>{profile.jobTitle}</Text>

            <TouchableOpacity onPress={() => navigation.navigate('EditProfileScreen')}>
              <Text style={styles.editProfileLink}>
                <Ionicons name="create-outline" size={14} color="#1976D2" /> Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact info (email / phone) */}
        <View style={styles.contactInfo}>
          {!!profile.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color="#666" style={styles.iconSpacing} />
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
          )}
          {!!profile.phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#666" style={styles.iconSpacing} />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
          )}
        </View>

        {/* Emergency Contact (partial) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmergencyContactScreen')}>
              <Ionicons name="add-circle-outline" size={24} color="#1976D2" />
            </TouchableOpacity>
          </View>
          {primaryContact ? (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardName}>{primaryContact.fullName}</Text>
                <Text style={styles.cardSub}>{primaryContact.relationship}</Text>
                <Text style={styles.cardSub}>{primaryContact.phoneNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => {/* e.g. open menu to edit/delete */}}>
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noneText}>No emergency contacts added.</Text>
          )}
        </View>

        {/* Recent Work History (partial: 2 records) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Work History</Text>
          {workHistory.length === 0 ? (
            <Text style={styles.noneText}>No recent work history.</Text>
          ) : (
            workHistory.map((item, index) => {
              const dateObj = new Date(item.date);
              const dateString = dateObj.toDateString(); // e.g. "Mon Jan 15 2025"
              const hours = item.workHours?.toFixed(1) || 0;

              return (
                <View key={index} style={styles.historyRow}>
                  <Text style={styles.historyShift}>{item.shiftType} Shift</Text>
                  <Text style={styles.historyHours}>{hours} hours</Text>
                  <Text style={styles.historyDate}>{dateString}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Bank Details (partial info) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          {bankDetail ? (
            <View style={styles.card}>
              <Ionicons name="card-outline" size={24} color="#555" style={{ marginRight: 10 }} />
              <View>
                {/* Mask the account number and only show bank name */}
                <Text style={styles.cardName}>{maskAccountNumber(bankDetail.accountNumber)}</Text>
                <Text style={styles.cardSub}>
                  {bankDetail.bankName?.length > 15
                    ? `${bankDetail.bankName.slice(0, 15)}...`
                    : bankDetail.bankName}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noneText}>No bank details found.</Text>
          )}
          <TouchableOpacity
            style={styles.updateBankButton}
            onPress={() => navigation.navigate('BankDetailScreen')}
          >
            <Ionicons name="create-outline" size={14} color="#1976D2" />
            <Text style={styles.updateBankText}> Update Bank Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Example styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F9',
  },
  header: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  userInfoSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userDetails: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  editProfileLink: {
    fontSize: 14,
    color: '#1976D2',
  },
  contactInfo: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconSpacing: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 15,
    color: '#333',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noneText: {
    fontSize: 14,
    color: '#999',
  },
  card: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardSub: {
    fontSize: 14,
    color: '#666',
  },
  historyRow: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  historyShift: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  historyHours: {
    fontSize: 14,
    color: '#1976D2',
    marginVertical: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  updateBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976D2',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  updateBankText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProfileScreen;