// src/app/manager/EmployeeManagementScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';

const EmployeeManagementScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId } = useContext(AuthContext);

  // Searching
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  // Socket reference
  const [socket, setSocket] = useState(null);

  // Adjust as needed
  const apiBaseUrl = 'http://localhost:5000/api';
  const socketServerUrl = 'http://localhost:5000';

  useEffect(() => {
    // 1) Connect to socket server
    const s = io(socketServerUrl, {
      transports: ['websocket'],
      // If needed: extraHeaders: { Authorization: `Bearer ${userToken}` },
    });
    setSocket(s);

    // 2) On connect, optionally join a manager room
    s.on('connect', () => {
      console.log('Socket connected, ID:', s.id);
      // e.g. s.emit('joinManagerRoom', userId);
    });

    // 3) Listen for an 'employeeUpdate' event (if your backend emits it)
    s.on('newEmployeeAdded', (data) => {
      console.log('employeeUpdate event received:', data);
      // Re-fetch employees to stay in sync
      fetchEmployees(searchText);
    });

    // Cleanup on unmount
    return () => {
      s.disconnect();
    };
  }, [socketServerUrl, searchText]);

  // Fetch employees initially (no query)
  useEffect(() => {
    fetchEmployees('');
  }, []);

  // Helper function to fetch employees from server
  const fetchEmployees = async (query) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const url = query
        ? `${apiBaseUrl}/users/search?q=${encodeURIComponent(query)}`
        : `${apiBaseUrl}/users/search`; // If empty, returns all
      const res = await axios.get(url, { headers });
      setEmployees(res.data || []);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  // For real-time searching, you could do fetch on every keystroke
  // but a typical approach is to fetch on "submit search"
  const handleSearchSubmit = () => {
    fetchEmployees(searchText.trim());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer?.()}>
          <Ionicons name="menu" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
        {/* No +Add button */}
        <View style={{ width: 28 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={{ marginHorizontal: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
      </View>

      {/* "All Departments" etc. removed per instructions. Now we just show a list. */}

      <Text style={styles.countText}>Showing {employees.length} employees</Text>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {employees.map((emp) => (
          <TouchableOpacity
            key={emp._id || emp.employeeId}
            style={styles.employeeCard}
            onPress={() => {
              // Possibly navigate to an EmployeeDetailScreen, e.g.:
              // navigation.navigate('EmployeeDetailScreen', { userId: emp._id });
            }}
          >
            {/* If you have an avatar or profileImage, you could show here */}
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{emp.fullName}</Text>
              {/* Excluding jobTitle */}
              <Text style={styles.employeeEmail}>{emp.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer: Home => ManagerDashboardScreen, Employees => current (highlight), Reports => ReportsScreen, Settings => SettingsScreen */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text>Home</Text>
        </TouchableOpacity>

        {/* Current screen: Employees => highlight or color */}
        <View style={styles.footerItemActive}>
          <Ionicons name="people-outline" size={24} color="#1976D2" />
          <Text style={{ color: '#1976D2' }}>Employees</Text>
        </View>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ReportsScreen')}
        >
          <Ionicons name="bar-chart-outline" size={24} color="#555" />
          <Text>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmployeeManagementScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    elevation: 2
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  countText: {
    marginHorizontal: 16,
    marginBottom: 10,
    color: '#666'
  },
  listContainer: {
    paddingBottom: 80
  },
  employeeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
    padding: 14,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  employeeInfo: {
    flexDirection: 'column'
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  employeeEmail: {
    fontSize: 14,
    color: '#555',
    marginTop: 2
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    width: '100%'
  },
  footerItem: {
    alignItems: 'center'
  },
  footerItemActive: {
    alignItems: 'center'
  }
});