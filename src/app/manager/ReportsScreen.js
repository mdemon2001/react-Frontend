// src/app/(manager)/ReportScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

// If using @react-native-picker/picker, import that instead:
import { Picker } from '@react-native-picker/picker';

// expo-router
import { useRouter } from 'expo-router';

const ReportScreen = () => {
  const router = useRouter();
  const { userToken } = useContext(AuthContext);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('All'); // 'All' => all months

  // Data states
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // UI toggles
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const apiBaseUrl = 'http://localhost:5000/api'; // Adjust to your server
  const headers = { Authorization: `Bearer ${userToken}` };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let url;
      if (selectedMonth === 'All') {
        // Yearly endpoint
        url = `${apiBaseUrl}/reports/yearly/${selectedYear}`;
      } else {
        // Monthly endpoint
        url = `${apiBaseUrl}/reports/monthly/${selectedYear}/${selectedMonth}`;
      }

      const res = await axios.get(url, { headers });
      setReportData(res.data);
    } catch (err) {
      console.error('fetchReport error:', err);
      setError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  // Example of handling "Export"
  const handleExport = () => {
    // Implement your export logic here
    console.log('Export clicked. Integrate with PDF or CSV logic as needed.');
  };

  // Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Reports</Text>
      {/* Toggle filter on the right */}
      <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
        <Ionicons name="options-outline" size={24} color="#555" />
      </TouchableOpacity>
    </View>
  );

  // Filter Modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Filter Reports</Text>

          {/* Year Picker */}
          <Text style={styles.modalLabel}>Select Year</Text>
          <Picker
            selectedValue={selectedYear}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedYear(itemValue)}
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((yr) => (
              <Picker.Item key={yr} label={`${yr}`} value={yr} />
            ))}
          </Picker>

          {/* Month Picker */}
          <Text style={styles.modalLabel}>Select Month</Text>
          <Picker
            selectedValue={selectedMonth}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedMonth(itemValue)}
          >
            <Picker.Item label="All Months" value="All" />
            <Picker.Item label="January" value="1" />
            <Picker.Item label="February" value="2" />
            <Picker.Item label="March" value="3" />
            <Picker.Item label="April" value="4" />
            <Picker.Item label="May" value="5" />
            <Picker.Item label="June" value="6" />
            <Picker.Item label="July" value="7" />
            <Picker.Item label="August" value="8" />
            <Picker.Item label="September" value="9" />
            <Picker.Item label="October" value="10" />
            <Picker.Item label="November" value="11" />
            <Picker.Item label="December" value="12" />
          </Picker>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Body based on report data
  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    if (!reportData) {
      // no data yet
      return null;
    }

    // Check if it's yearly data
    const isYearly = reportData.year !== undefined;

    if (isYearly) {
      // Yearly data
      const {
        year,
        totalHours,
        totalCost,
        yearHoursChange,
        yearCostChange,
        weeklyAverages,
        months
      } = reportData;

      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Basic Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Hours</Text>
              <Text style={styles.statValue}>{totalHours}</Text>
              <Text style={styles.statChange}>
                {yearHoursChange}% vs last year
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Labor Costs</Text>
              <Text style={styles.statValue}>${totalCost}</Text>
              <Text style={styles.statChange}>
                {yearCostChange}% vs last year
              </Text>
            </View>
          </View>

          <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Reports Overview</Text>
            <TouchableOpacity onPress={handleExport}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.overviewCards}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Avg Hours/Week</Text>
              <Text style={styles.overviewValue}>{weeklyAverages.hours}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Avg Cost/Week</Text>
              <Text style={styles.overviewValue}>${weeklyAverages.cost}</Text>
            </View>
          </View>

          {/* Monthly Overview */}
          <Text style={styles.sectionTitle}>Monthly Overview {year}</Text>
          {months.map((m) => (
            <View key={m.month} style={styles.monthRow}>
              <Text style={styles.monthName}>{m.month} {year}</Text>
              <View style={styles.monthStats}>
                <Text style={styles.monthStat}>{m.totalHours} hrs</Text>
                <Text style={styles.monthStat}>${m.totalCost}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    } else {
      // Monthly data
      const {
        month,
        totalHours,
        totalCost,
        averageHours,
        averageCost,
        hoursChange,
        costChange,
        weeklyAverages,
        details
      } = reportData;

      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Basic Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Hours</Text>
              <Text style={styles.statValue}>{totalHours}</Text>
              <Text style={styles.statChange}>
                {hoursChange}% vs last month
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Labor Costs</Text>
              <Text style={styles.statValue}>${totalCost}</Text>
              <Text style={styles.statChange}>
                {costChange}% vs last month
              </Text>
            </View>
          </View>

          <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Reports Overview</Text>
            <TouchableOpacity onPress={handleExport}>
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.overviewCards}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Avg Hours/Week</Text>
              <Text style={styles.overviewValue}>{weeklyAverages.hours}</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Avg Cost/Week</Text>
              <Text style={styles.overviewValue}>${weeklyAverages.cost}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{month}</Text>
          <Text style={styles.sectionSubtitle}>
            {parseFloat(averageHours).toFixed(2)} avg hours, $
            {parseFloat(averageCost).toFixed(2)} avg cost
          </Text>

          {/* If you want to show details per employee */}
          {details && details.map((item, idx) => (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailEmployee}>{item.employeeName}</Text>
              <Text style={styles.detailStats}>
                {item.regularHours} hrs - ${item.totalPay}
              </Text>
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterModal()}
      {renderBody()}

      {/* Footer: 
          Home => /manager/ManagerDashboardScreen
          Employees => /manager/EmployeeManagementScreen
          Reports => current
          Settings => /shared/SettingsScreen
      */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/manager/ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/manager/EmployeeManagementScreen')}
        >
          <Ionicons name="people-outline" size={24} color="#555" />
          <Text>Employees</Text>
        </TouchableOpacity>

        {/* Current screen: Reports => highlight */}
        <View style={styles.footerItemActive}>
          <Ionicons name="bar-chart-outline" size={24} color="#1976D2" />
          <Text style={{ color: '#1976D2' }}>Reports</Text>
        </View>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/shared/SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  errorText: {
    color: 'red'
  },
  scrollContent: {
    paddingBottom: 80
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '45%',
    elevation: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 14,
    color: '#777'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8
  },
  statChange: {
    fontSize: 12,
    color: '#666'
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  exportText: {
    fontSize: 14,
    color: '#1976D2'
  },
  overviewCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  overviewCard: {
    backgroundColor: '#fff',
    width: '45%',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    alignItems: 'center'
  },
  overviewLabel: {
    fontSize: 14,
    color: '#777'
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4
  },
  sectionTitle: {
    marginTop: 24,
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionSubtitle: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    elevation: 1
  },
  detailEmployee: {
    fontWeight: '600'
  },
  detailStats: {
    color: '#555'
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    elevation: 1
  },
  monthName: {
    fontWeight: '600'
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  monthStat: {
    marginLeft: 10,
    color: '#555'
  },

  // Footer
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
  },

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center'
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  modalLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#555'
  },
  picker: {
    backgroundColor: '#f0f0f0',
    marginVertical: 5
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  modalButton: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});