// src/app/manager/CreateRotaScreen.js

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
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';

import { AuthContext } from '../../context/AuthContext';

// Adjust this to your server’s base URL
const apiBaseUrl = 'http://localhost:5001/api';

const CreateRotaScreen = () => {
  const router = useRouter();
  const { userToken } = useContext(AuthContext);

  // --------------------------
  // State for schedules & employees
  // --------------------------
  const [allSchedules, setAllSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // For the simple monthly calendar
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // For selecting a schedule to modify/publish/delete
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // For showing a list of schedules on a given day
  const [daySchedules, setDaySchedules] = useState([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [clickedDay, setClickedDay] = useState(null);

  // --------------------------
  // Modals
  // --------------------------
  // Add Rota
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addStartTime, setAddStartTime] = useState('');
  const [addEndTime, setAddEndTime] = useState('');
  const [addSelectedEmployees, setAddSelectedEmployees] = useState([]);
  const [addTasks, setAddTasks] = useState([]);
  const [creatingRota, setCreatingRota] = useState(false);

  // Modify Rota
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyDate, setModifyDate] = useState('');
  const [modifyStartTime, setModifyStartTime] = useState('');
  const [modifyEndTime, setModifyEndTime] = useState('');
  const [modifyEmployees, setModifyEmployees] = useState([]);
  const [modifyTasks, setModifyTasks] = useState([]);
  const [updatingRota, setUpdatingRota] = useState(false);

  // Add Task (used by both add & modify modals)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskForAdd, setTaskForAdd] = useState(true); // true => adding to addTasks, false => adding to modifyTasks

  // --------------------------
  // Effects: load schedules & employees
  // --------------------------
  useEffect(() => {
    fetchAllSchedules();
    fetchAllEmployees();
  }, []);

  const fetchAllSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const res = await axios.get(`${apiBaseUrl}/schedules`, { headers });
      setAllSchedules(res.data);
    } catch (error) {
      console.error('Error fetching schedules:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load schedules.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // e.g. GET /users/search?role=employee
      const res = await axios.get(`${apiBaseUrl}/users/search?role=employee`, { headers });
      // Suppose each employee has:
      // {
      //   _id: "...",
      //   fullName: "...",
      //   unavailableDates: ["2025-03-25", ...],
      //   holidayDates: ["2025-12-25", ...]  // or any approach your backend uses
      // }
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load employees.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // --------------------------
  // Calendar Helpers
  // --------------------------
  const getDaysInMonth = (year, month) => {
    // month is 0-based
    const date = new Date(year, month + 1, 0);
    return date.getDate(); // last day => # of days
  };

  const daysInThisMonth = getDaysInMonth(currentYear, currentMonth);
  // We can generate an array of [1..daysInThisMonth]
  const monthDays = Array.from({ length: daysInThisMonth }, (_, i) => i + 1);

  // Group schedules by date (YYYY-MM-DD) for quick lookup
  const schedulesByDate = {};
  allSchedules.forEach((sch) => {
    const dayStr = new Date(sch.date).toDateString(); // e.g. "Wed Mar 05 2025"
    if (!schedulesByDate[dayStr]) schedulesByDate[dayStr] = [];
    schedulesByDate[dayStr].push(sch);
  });

  // Helper to get schedules for a given day
  const getSchedulesForDay = (day) => {
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayStr = dateObj.toDateString();
    return schedulesByDate[dayStr] || [];
  };

  // --------------------------
  // Add Rota Flow
  // --------------------------
  const openAddModal = (day = null) => {
    // If user tapped a specific day, prefill the date
    if (day) {
      const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
      setAddDate(dateStr);
    } else {
      setAddDate('');
    }
    setAddStartTime('');
    setAddEndTime('');
    setAddSelectedEmployees([]);
    setAddTasks([]);
    setShowAddModal(true);
  };

  const handleCreateRota = async () => {
    if (!addDate || !addStartTime || !addEndTime) {
      Alert.alert('Validation', 'Date, Start Time, and End Time are required.');
      return;
    }
    if (addTasks.length === 0) {
      Alert.alert('Validation', 'At least one task is required.');
      return;
    }
    if (addSelectedEmployees.length === 0) {
      Alert.alert('Validation', 'Please assign at least one employee.');
      return;
    }

    setCreatingRota(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const body = {
        date: addDate,
        startTime: addStartTime,
        endTime: addEndTime,
        employees: addSelectedEmployees,
        tasks: addTasks.map((t) => ({
          description: t.description,
          assignedTo: t.assignedTo
        })),
        // You must pass workplaceId as required by your schema:
        workplaceId: '64a0b35f2b28ad1234567890', // Replace with real workplaceId
        status: 'Draft'
      };
      await axios.post(`${apiBaseUrl}/schedules`, body, { headers });
      fetchAllSchedules();
      setShowAddModal(false);
    } catch (error) {
      console.error('Create schedule error:', error.response?.data || error.message);
      const msg =
        error.response?.data?.message || 'Failed to create schedule. Check for holiday or overlap.';
      Alert.alert('Error', msg);
    } finally {
      setCreatingRota(false);
    }
  };

  // --------------------------
  // Modify Rota Flow
  // --------------------------
  const openModifyModal = () => {
    if (!selectedSchedule) return;
    setModifyDate(selectedSchedule.date.split('T')[0]); // "YYYY-MM-DD"
    setModifyStartTime(selectedSchedule.startTime);
    setModifyEndTime(selectedSchedule.endTime);
    setModifyEmployees(selectedSchedule.employees.map((e) => e._id));
    setModifyTasks(
      selectedSchedule.tasks.map((t) => ({
        description: t.description,
        assignedTo: t.assignedTo?._id || t.assignedTo
      }))
    );
    setShowModifyModal(true);
  };

  const handleUpdateRota = async () => {
    if (!modifyDate || !modifyStartTime || !modifyEndTime) {
      Alert.alert('Validation', 'Date, Start Time, and End Time are required.');
      return;
    }
    if (modifyTasks.length === 0) {
      Alert.alert('Validation', 'At least one task is required.');
      return;
    }
    if (modifyEmployees.length === 0) {
      Alert.alert('Validation', 'Please assign at least one employee.');
      return;
    }
    setUpdatingRota(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const body = {
        date: modifyDate,
        startTime: modifyStartTime,
        endTime: modifyEndTime,
        employees: modifyEmployees,
        tasks: modifyTasks
      };
      await axios.put(`${apiBaseUrl}/schedules/${selectedSchedule._id}`, body, { headers });
      fetchAllSchedules();
      setShowModifyModal(false);
      Alert.alert('Success', 'Rota updated!');
    } catch (error) {
      console.error('Update schedule error:', error.response?.data || error.message);
      const msg =
        error.response?.data?.message || 'Failed to update schedule. Check for holiday or overlap.';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingRota(false);
    }
  };

  // --------------------------
  // Publish Rota
  // --------------------------
  const handlePublishRota = async () => {
    if (!selectedSchedule) return;
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      await axios.put(
        `${apiBaseUrl}/schedules/${selectedSchedule._id}/publish`,
        {},
        { headers }
      );
      fetchAllSchedules();
      Alert.alert('Success', 'Schedule published!');
    } catch (error) {
      console.error('Publish error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to publish schedule.');
    }
  };

  // --------------------------
  // Delete Rota
  // --------------------------
  const handleDeleteRota = async (scheduleId) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = { Authorization: `Bearer ${userToken}` };
            await axios.delete(`${apiBaseUrl}/schedules/${scheduleId}`, { headers });
            fetchAllSchedules();
            Alert.alert('Success', 'Schedule deleted!');
            setSelectedSchedule(null);
          } catch (error) {
            console.error('Delete error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to delete schedule.');
          }
        }
      }
    ]);
  };

  // --------------------------
  // Day Modal (list schedules on a chosen day)
  // --------------------------
  const openDayModal = (day) => {
    setClickedDay(day);
    const daySch = getSchedulesForDay(day);
    setDaySchedules(daySch);
    setShowDayModal(true);
  };

  // When user taps on a schedule from the day modal, select it
  const selectScheduleFromDay = (sch) => {
    setSelectedSchedule(sch);
    setShowDayModal(false);
  };

  // --------------------------
  // Add Task Modal
  // --------------------------
  const openTaskModal = (forAdd) => {
    setTaskForAdd(forAdd);
    setTaskDescription('');
    setTaskAssignedTo('');
    setShowTaskModal(true);
  };

  const handleAddTask = () => {
    if (!taskDescription || !taskAssignedTo) {
      Alert.alert('Validation', 'Task description and assignedTo are required.');
      return;
    }
    const newTask = { description: taskDescription, assignedTo: taskAssignedTo };
    if (taskForAdd) {
      setAddTasks((prev) => [...prev, newTask]);
    } else {
      setModifyTasks((prev) => [...prev, newTask]);
    }
    setShowTaskModal(false);
  };

  // Remove a task
  const removeTask = (index, forAdd) => {
    if (forAdd) {
      setAddTasks((prev) => prev.filter((_, i) => i !== index));
    } else {
      setModifyTasks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // --------------------------
  // Check if an employee is unavailable or on holiday
  // --------------------------
  const checkEmployeeAvailability = (emp, dateStr) => {
    // Convert dateStr to a standard 'YYYY-MM-DD'
    // We assume emp.unavailableDates or emp.holidayDates are also strings like '2025-03-25'
    // If your data is in a different format, parse accordingly
    const isUnavailable = emp.unavailableDates?.includes(dateStr);
    const isOnHoliday = emp.holidayDates?.includes(dateStr);

    if (isOnHoliday) return { blocked: true, label: 'On Holiday' };
    if (isUnavailable) return { blocked: true, label: 'Unavailable' };
    return { blocked: false, label: 'Available' };
  };

  // --------------------------
  // Rendering
  // --------------------------
  if (loadingSchedules || loadingEmployees) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Manager</Text>

        <View style={styles.headerButtons}>
          {/* Add Rota */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => openAddModal()}>
            <Text style={styles.headerBtnText}>Add Rota</Text>
          </TouchableOpacity>

          {/* Modify Rota (disabled if no selected schedule) */}
          <TouchableOpacity
            style={[styles.headerBtn, !selectedSchedule && { opacity: 0.5 }]}
            onPress={openModifyModal}
            disabled={!selectedSchedule}
          >
            <Text style={styles.headerBtnText}>Modify</Text>
          </TouchableOpacity>

          {/* Publish (disabled if no selected schedule) */}
          <TouchableOpacity
            style={[styles.headerBtn, !selectedSchedule && { opacity: 0.5 }]}
            onPress={handlePublishRota}
            disabled={!selectedSchedule}
          >
            <Text style={styles.headerBtnText}>Publish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month navigation (basic) */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear((prev) => prev - 1);
            } else {
              setCurrentMonth((prev) => prev - 1);
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.monthNavLabel}>
          {new Date(currentYear, currentMonth).toLocaleString('default', {
            month: 'long',
            year: 'numeric'
          })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear((prev) => prev + 1);
            } else {
              setCurrentMonth((prev) => prev + 1);
            }
          }}
        >
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Simple grid for the days of the month */}
      <ScrollView style={styles.calendarScroll}>
        <View style={styles.calendarGrid}>
          {/* Days of week header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Text key={d} style={[styles.dayHeader, styles.dayCell]}>
              {d}
            </Text>
          ))}

          {/* We need to find the first day of the month (weekday) to offset */}
          {renderCalendarDays(
            currentYear,
            currentMonth,
            monthDays,
            openDayModal,
            getSchedulesForDay
          )}
        </View>
      </ScrollView>

      {/* Day Modal: show schedules for the chosen day */}
      <Modal visible={showDayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.dayModalContainer}>
            <Text style={styles.dayModalTitle}>
              {clickedDay
                ? `Shifts on ${new Date(currentYear, currentMonth, clickedDay).toDateString()}`
                : 'Shifts'}
            </Text>

            {daySchedules.length === 0 ? (
              <View style={styles.noShiftsContainer}>
                <Text style={styles.noShiftsText}>No shifts. Create one?</Text>
                <TouchableOpacity
                  style={styles.addShiftBtn}
                  onPress={() => {
                    setShowDayModal(false);
                    openAddModal(clickedDay);
                  }}
                >
                  <Text style={styles.addShiftBtnText}>Add Rota</Text>
                </TouchableOpacity>
              </View>
            ) : (
              daySchedules.map((sch) => (
                <View key={sch._id} style={styles.shiftItem}>
                  <Text style={styles.shiftTime}>
                    {sch.startTime} - {sch.endTime}
                  </Text>
                  <Text style={styles.shiftEmployees}>
                    {sch.employees.map((e) => e.fullName).join(', ')}
                  </Text>
                  <View style={styles.shiftActions}>
                    <TouchableOpacity
                      onPress={() => {
                        selectScheduleFromDay(sch);
                      }}
                    >
                      <Text style={styles.shiftActionLink}>Select</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteRota(sch._id)}
                      style={{ marginLeft: 15 }}
                    >
                      <Text style={[styles.shiftActionLink, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.closeDayModalBtn}
              onPress={() => setShowDayModal(false)}
            >
              <Text style={styles.closeDayModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Rota Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContainer}>
            <Text style={styles.modalTitle}>Add New Rota</Text>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={addDate}
              onChangeText={setAddDate}
              placeholder="2025-03-15"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={addStartTime}
                  onChangeText={setAddStartTime}
                  placeholder="08:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={addEndTime}
                  onChangeText={setAddEndTime}
                  placeholder="17:00"
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Assign Employees</Text>
            <ScrollView style={[styles.assignList, { maxHeight: 100 }]}>
              {employees.map((emp) => {
                const { blocked, label } = checkEmployeeAvailability(emp, addDate);
                const isSelected = addSelectedEmployees.includes(emp._id);

                // If employee is blocked, we gray them out and disable selection
                const textStyle = blocked ? { color: '#999' } : {};
                const iconColor = blocked ? '#999' : isSelected ? '#1976D2' : '#666';

                return (
                  <TouchableOpacity
                    key={emp._id}
                    style={styles.assignItem}
                    disabled={blocked} // cannot select if blocked
                    onPress={() => {
                      if (isSelected) {
                        setAddSelectedEmployees((prev) => prev.filter((id) => id !== emp._id));
                      } else {
                        setAddSelectedEmployees((prev) => [...prev, emp._id]);
                      }
                    }}
                  >
                    <Ionicons
                      name={isSelected && !blocked ? 'checkbox' : 'checkbox-outline'}
                      size={20}
                      color={iconColor}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={textStyle}>{emp.fullName}</Text>
                      {/* Show a small label for holiday/unavailable/available */}
                      <Text style={[styles.availabilityLabel, blocked && { color: 'red' }]}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 10 }]}>Tasks</Text>
            {addTasks.map((t, idx) => (
              <View key={idx} style={styles.taskItem}>
                <Text style={{ flex: 1 }}>
                  {t.description} (Assigned: 
                  {employees.find((e) => e._id === t.assignedTo)?.fullName || t.assignedTo})
                </Text>
                <TouchableOpacity onPress={() => removeTask(idx, true)}>
                  <MaterialIcons name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addTaskButton} onPress={() => openTaskModal(true)}>
              <Ionicons name="add-circle-outline" size={20} color="#1976D2" />
              <Text style={{ color: '#1976D2', marginLeft: 6 }}>Add Task</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowAddModal(false)}
                disabled={creatingRota}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1976D2' }]}
                onPress={handleCreateRota}
                disabled={creatingRota}
              >
                {creatingRota ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modify Rota Modal */}
      <Modal visible={showModifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContainer}>
            <Text style={styles.modalTitle}>Modify Rota</Text>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={modifyDate} onChangeText={setModifyDate} />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={modifyStartTime}
                  onChangeText={setModifyStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={modifyEndTime}
                  onChangeText={setModifyEndTime}
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Assign Employees</Text>
            <ScrollView style={[styles.assignList, { maxHeight: 100 }]}>
              {employees.map((emp) => {
                const { blocked, label } = checkEmployeeAvailability(emp, modifyDate);
                const isSelected = modifyEmployees.includes(emp._id);

                const textStyle = blocked ? { color: '#999' } : {};
                const iconColor = blocked ? '#999' : isSelected ? '#1976D2' : '#666';

                return (
                  <TouchableOpacity
                    key={emp._id}
                    style={styles.assignItem}
                    disabled={blocked}
                    onPress={() => {
                      if (isSelected) {
                        setModifyEmployees((prev) => prev.filter((id) => id !== emp._id));
                      } else {
                        setModifyEmployees((prev) => [...prev, emp._id]);
                      }
                    }}
                  >
                    <Ionicons
                      name={isSelected && !blocked ? 'checkbox' : 'checkbox-outline'}
                      size={20}
                      color={iconColor}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={textStyle}>{emp.fullName}</Text>
                      <Text style={[styles.availabilityLabel, blocked && { color: 'red' }]}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 10 }]}>Tasks</Text>
            {modifyTasks.map((t, idx) => (
              <View key={idx} style={styles.taskItem}>
                <Text style={{ flex: 1 }}>
                  {t.description} (Assigned: 
                  {employees.find((e) => e._id === t.assignedTo)?.fullName || t.assignedTo})
                </Text>
                <TouchableOpacity onPress={() => removeTask(idx, false)}>
                  <MaterialIcons name="delete" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addTaskButton} onPress={() => openTaskModal(false)}>
              <Ionicons name="add-circle-outline" size={20} color="#1976D2" />
              <Text style={{ color: '#1976D2', marginLeft: 6 }}>Add Task</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowModifyModal(false)}
                disabled={updatingRota}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1976D2' }]}
                onPress={handleUpdateRota}
                disabled={updatingRota}
              >
                {updatingRota ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.taskModalContainer}>
            <Text style={styles.modalTitle}>Add Task</Text>

            <Text style={styles.label}>Task Description</Text>
            <TextInput
              style={styles.input}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="e.g. Check-in guests"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Assign To</Text>
            <ScrollView style={[styles.assignList, { maxHeight: 120 }]}>
              {employees.map((emp) => {
                const isSelected = taskAssignedTo === emp._id;
                return (
                  <TouchableOpacity
                    key={emp._id}
                    style={styles.assignItem}
                    onPress={() => setTaskAssignedTo(emp._id)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? '#1976D2' : '#666'}
                    />
                    <Text style={{ marginLeft: 8 }}>{emp.fullName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowTaskModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1976D2' }]}
                onPress={handleAddTask}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer with 3 tabs: Home, Schedule (highlighted), Settings */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/manager/ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={24} color="#1976D2" />
          <Text style={[styles.footerText, { color: '#1976D2' }]}>Schedule</Text>
        </View>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => router.replace('/shared/SettingsScreen')}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text style={styles.footerText}>Settings</Text>
          
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Helper function to render the days in a grid with minimal logic
 */
function renderCalendarDays(
  year,
  month,
  monthDays,
  openDayModal,
  getSchedulesForDay
) {
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sunday, 1=Monday, ...
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i); // offset

  // We'll create rows of 7 columns each
  const dayCells = [];
  // Add blank cells for offset
  blanks.forEach((_, idx) => {
    dayCells.push(
      <View key={`blank-${idx}`} style={styles.dayCell} />
    );
  });

  // Add actual days
  monthDays.forEach((day) => {
    const schedulesToday = getSchedulesForDay(day);
    dayCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={styles.dayCell}
        onPress={() => openDayModal(day)}
      >
        <Text style={styles.dayNumber}>{day}</Text>
        {schedulesToday.length > 0 && (
          <View style={styles.shiftCountBadge}>
            <Text style={styles.shiftCountText}>{schedulesToday.length} shift{schedulesToday.length>1?'s':''}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  });

  return dayCells;
}

export default CreateRotaScreen;

// STYLES
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
    paddingVertical: 10,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10
  },
  headerBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  headerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 8,
    backgroundColor: '#fff'
  },
  monthNavLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  calendarScroll: {
    flex: 1
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayHeader: {
    fontWeight: 'bold',
    textAlign: 'center'
  },
  dayCell: {
    width: '14.2857%', // 100/7
    height: 80,
    borderWidth: 0.5,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayNumber: {
    fontSize: 14,
    marginBottom: 4
  },
  shiftCountBadge: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  shiftCountText: {
    fontSize: 10,
    color: '#fff'
  },

  // Day Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center'
  },
  dayModalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 16
  },
  dayModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  noShiftsContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  noShiftsText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10
  },
  addShiftBtn: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  addShiftBtnText: {
    color: '#fff'
  },
  shiftItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  shiftEmployees: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2
  },
  shiftActions: {
    flexDirection: 'row',
    marginTop: 4
  },
  shiftActionLink: {
    color: '#1976D2'
  },
  closeDayModalBtn: {
    backgroundColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginTop: 20,
    alignSelf: 'flex-end'
  },
  closeDayModalText: {
    color: '#333'
  },

  // Add/Modify Modal
  addModalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8
  },
  assignList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 6
  },
  assignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4
  },
  availabilityLabel: {
    fontSize: 11,
    color: '#777'
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16
  },
  modalButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 10
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600'
  },

  // Add Task Modal
  taskModalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 16
  },

  // Footer
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
  }
});