// src/app/manager/PayrollManagementScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import axios from 'axios';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../context/AuthContext';

// Adjust to your server's base URL
const apiBaseUrl = 'http://localhost:5000/api';

const PayrollManagementScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // Pay period (default values)
  const [startDate, setStartDate] = useState('2025-03-01');
  const [endDate, setEndDate] = useState('2025-03-15');

  // Show/hide the pay period editor modal
  const [showPeriodEditor, setShowPeriodEditor] = useState(false);

  // Temporary fields for editing the period
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Employees loaded from the backend
  const [employees, setEmployees] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Is the "Save Payroll" process running?
  const [savingPayroll, setSavingPayroll] = useState(false);

  // Fetch the list of employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setFetchingEmployees(true);
      setFetchError(null);

      try {
        const headers = { Authorization: `Bearer ${userToken}` };
        // Example: GET /users/search?role=employee
        const response = await axios.get(`${apiBaseUrl}/users/search?role=employee`, { headers });
        // Suppose the backend returns an array of employees:
        // [ { _id, fullName, employeeId, avatarUrl, rate }, ... ]
        const loaded = response.data.map((emp) => ({
          ...emp,
          rate: emp.rate || 25, // default rate if not specified
          hours: 0,            // to be updated after payroll creation
          total: 0             // to be updated after payroll creation
        }));
        setEmployees(loaded);
      } catch (error) {
        console.error('Error fetching employees:', error.response?.data || error.message);
        setFetchError('Failed to load employees. Please try again later.');
      } finally {
        setFetchingEmployees(false);
      }
    };

    fetchEmployees();
  }, [userToken]);

  // Handler to create payroll for each employee
  const handleSavePayroll = async () => {
    if (employees.length === 0) {
      Alert.alert('No Employees', 'There are no employees to process.');
      return;
    }
    setSavingPayroll(true);

    try {
      const headers = { Authorization: `Bearer ${userToken}` };

      // Loop through each employee and call createPayroll
      const updatedList = await Promise.all(
        employees.map(async (emp) => {
          try {
            // POST /payroll with { employeeId, start, end, rate }
            const res = await axios.post(
              `${apiBaseUrl}/payroll`,
              {
                employeeId: emp._id,   // or emp.employeeId if your backend expects that
                start: startDate,
                end: endDate,
                rate: emp.rate
              },
              { headers }
            );
            // The response includes: payroll: { hours, total, rate, period, ... }
            const { payroll } = res.data;
            return {
              ...emp,
              hours: payroll.hours,
              total: payroll.total
            };
          } catch (error) {
            console.error(`Failed to create payroll for ${emp._id}`, error.response?.data || error);
            return emp; // fallback: return unchanged
          }
        })
      );

      setEmployees(updatedList);
      Alert.alert('Success', 'Payroll has been saved for all employees!');
    } catch (error) {
      console.error('Payroll saving error:', error);
      Alert.alert('Error', 'Failed to save payroll.');
    } finally {
      setSavingPayroll(false);
    }
  };

  // Calculate the total hours and total pay across all employees
  const totalHours = employees.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalPayroll = employees.reduce((sum, e) => sum + (e.total || 0), 0);

  // Confirm changes to the pay period
  const confirmPayPeriod = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowPeriodEditor(false);
  };

  // If still fetching, show a spinner
  if (fetchingEmployees) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Top header area */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Payroll Management</Text>

        {/* Display the pay period label + edit icon */}
        <TouchableOpacity
          style={styles.periodWrapper}
          onPress={() => {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
            setShowPeriodEditor(true);
          }}
        >
          <Text style={styles.periodLabel}>{`${startDate} - ${endDate}`}</Text>
          <Ionicons name="pencil-outline" size={18} color="#1976D2" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* If fetch error, show message */}
      {fetchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollArea}>
        {/* If no employees found */}
        {employees.length === 0 && !fetchError && (
          <View style={styles.noEmployeesContainer}>
            <Text style={styles.noEmployeesText}>No employees found.</Text>
          </View>
        )}

        {/* List of employees */}
        {employees.map((emp) => (
          <View key={emp._id} style={styles.card}>
            {/* Top row: avatar + name + ID */}
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: emp.avatarUrl || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.employeeName}>{emp.fullName || 'Employee'}</Text>
                <Text style={styles.employeeId}>ID #{emp.employeeId || emp._id}</Text>
              </View>
            </View>

            {/* Regular Hours */}
            <View style={styles.row}>
              <Text style={styles.label}>Regular Hours</Text>
              <Text style={styles.value}>{emp.hours}</Text>
            </View>

            {/* Rate */}
            <View style={styles.row}>
              <Text style={styles.label}>Rate ($/hr)</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={String(emp.rate)}
                onChangeText={(val) => {
                  const newRate = parseFloat(val) || 0;
                  setEmployees((prev) =>
                    prev.map((item) =>
                      item._id === emp._id ? { ...item, rate: newRate } : item
                    )
                  );
                }}
              />
            </View>

            {/* Total Pay */}
            <View style={styles.row}>
              <Text style={styles.label}>Total Pay</Text>
              <Text style={styles.totalPay}>
                ${emp.total.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {/* Payroll Summary */}
        {employees.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payroll Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Regular Hours</Text>
              <Text style={styles.summaryValue}>{totalHours}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payroll</Text>
              <Text style={styles.summaryValue}>${totalPayroll.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Save Payroll Button */}
        {employees.length > 0 && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePayroll}
            disabled={savingPayroll}
          >
            {savingPayroll ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Payroll</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer with two tabs: Home (ManagerDashboardScreen) and Payroll (current) */}
      <View style={styles.footer}>
        {/* Home tab */}
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        {/* Payroll tab (highlighted) */}
        <View style={styles.footerItem}>
          <FontAwesome5 name="money-check-alt" size={24} color="#1976D2" />
          <Text style={[styles.footerText, { color: '#1976D2' }]}>Payroll</Text>
        </View>
      </View>

      {/* Modal for editing pay period */}
      <Modal
        visible={showPeriodEditor}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Pay Period</Text>

            <Text style={styles.modalLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempStartDate}
              onChangeText={setTempStartDate}
            />

            <Text style={styles.modalLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempEndDate}
              onChangeText={setTempEndDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowPeriodEditor(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1976D2' }]}
                onPress={confirmPayPeriod}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PayrollManagementScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  periodWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  periodLabel: {
    fontSize: 14,
    color: '#555'
  },
  errorContainer: {
    backgroundColor: '#ffdddd',
    padding: 10,
    margin: 16,
    borderRadius: 6
  },
  errorText: {
    color: '#900'
  },
  scrollArea: {
    flex: 1,
    padding: 16,
    marginBottom: 60 // space for the footer
  },
  noEmployeesContainer: {
    alignItems: 'center',
    marginTop: 50
  },
  noEmployeesText: {
    fontSize: 16,
    color: '#777'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  employeeId: {
    fontSize: 12,
    color: '#777'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    color: '#666'
  },
  value: {
    color: '#333',
    fontWeight: '500'
  },
  rateInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#333'
  },
  totalPay: {
    fontWeight: 'bold',
    color: '#1976D2'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  footerItem: {
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
    color: '#555'
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  modalLabel: {
    fontSize: 14,
    marginTop: 10
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 4
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  modalButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10
  },
  modalButtonText: {
    fontSize: 14
  }
});