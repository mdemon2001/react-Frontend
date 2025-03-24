// src/shared/MessagesScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../context/AuthContext';

// Adjust to your server’s base URL
const apiBaseUrl = 'http://localhost:5000/api';

// Helper: group users into "MANAGEMENT" vs. "EMPLOYEES"
function groupUsersByRole(users) {
  // Tweak this array to include roles that belong under 'Management'
  const managementRoles = ['Manager', 'CEO', 'Head of Sales'];

  const management = [];
  const employees = [];

  users.forEach(u => {
    if (managementRoles.includes(u.role)) {
      management.push(u);
    } else {
      employees.push(u);
    }
  });

  return { management, employees };
}

const MessagesScreen = () => {
  const navigation = useNavigation();
  const { userToken, userId, userRole } = useContext(AuthContext);

  // All users (employees & managers)
  const [allUsers, setAllUsers] = useState([]);
  // For searching contacts
  const [searchQuery, setSearchQuery] = useState('');
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Chat modal state
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Fetch all employees & managers from backend
  const fetchAllUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // Example: GET /api/users?all=true (adjust as needed)
      const response = await axios.get(`${apiBaseUrl}/users?all=true`, { headers });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      setFetchError('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Open the chat modal with a particular user
  const openChatWithUser = async (user) => {
    setSelectedUser(user);
    setChatVisible(true);
    setMessages([]);       // Clear old messages
    setMessageText('');    // Clear input
    await fetchConversation(user._id);
  };

  // Fetch the conversation with selected user
  const fetchConversation = async (recipientId) => {
    setLoadingMessages(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // GET /api/messages/:recipientId
      const res = await axios.get(`${apiBaseUrl}/messages/${recipientId}`, { headers });
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching conversation:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send a new message to the selected user
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    if (!selectedUser) return;

    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      // POST /api/messages/:recipientId with { text }
      await axios.post(`${apiBaseUrl}/messages/${selectedUser._id}`, { text: messageText }, { headers });

      // Optimistically update local state
      const newMsg = {
        userId,
        text: messageText,
        timestamp: new Date().toISOString(), // local time for display
        senderDetails: { name: 'You', role: userRole } // optional
      };
      setMessages((prev) => [...prev, newMsg]);

      // Clear input
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // Format timestamp for display (HH:MM AM/PM)
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Return to HomeScreen or ManagerDashboardScreen
  const handleGoBack = () => {
    if (userRole === 'Manager') {
      navigation.navigate('ManagerDashboardScreen');
    } else {
      navigation.navigate('HomeScreen');
    }
  };

  // Filter users by search query (assuming user.name is the field)
  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group them by role
  const { management, employees } = groupUsersByRole(filteredUsers);

  return (
    <View style={styles.container}>
      {/* Top bar: arrow on left + search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Error state */}
      {fetchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {/* Contact list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" />
      ) : (
        <ScrollView style={styles.listContainer}>
          {/* MANAGEMENT SECTION */}
          <Text style={styles.sectionHeader}>MANAGEMENT</Text>
          {management.length === 0 ? (
            <Text style={styles.emptySection}>No managers found.</Text>
          ) : (
            management.map((u) => (
              <TouchableOpacity
                key={u._id}
                style={styles.userItem}
                onPress={() => openChatWithUser(u)}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userRole}>{u.role}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* EMPLOYEES SECTION */}
          <Text style={styles.sectionHeader}>EMPLOYEES</Text>
          {employees.length === 0 ? (
            <Text style={styles.emptySection}>No employees found.</Text>
          ) : (
            employees.map((u) => (
              <TouchableOpacity
                key={u._id}
                style={styles.userItem}
                onPress={() => openChatWithUser(u)}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userRole}>{u.role}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>
              {selectedUser?.name} {selectedUser?.role ? `- ${selectedUser.role}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setChatVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          {loadingMessages ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" />
          ) : (
            <ScrollView style={styles.chatMessages}>
              {messages.map((msg, index) => {
                const isSender = msg.userId === userId; // our own message
                return (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      isSender ? styles.senderBubble : styles.receiverBubble
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.text}</Text>
                    <Text style={styles.timestamp}>{formatTimestamp(msg.timestamp)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Send Message Input */}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#1976D2" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    marginLeft: 10
  },
  errorContainer: {
    backgroundColor: '#ffdddd',
    borderRadius: 6,
    padding: 10,
    margin: 12
  },
  errorText: {
    color: '#900'
  },
  listContainer: {
    paddingHorizontal: 12
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  emptySection: {
    marginLeft: 8,
    fontSize: 13,
    color: '#999',
    marginBottom: 10
  },
  userItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1
  },
  userInfo: {},
  userName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  userRole: {
    fontSize: 13,
    color: '#777'
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f9fcff'
  },
  chatHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chatMessages: {
    flex: 1,
    padding: 12
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 10
  },
  senderBubble: {
    backgroundColor: '#d1ecf1',
    alignSelf: 'flex-end'
  },
  receiverBubble: {
    backgroundColor: '#e2e3e5',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4
  },
  timestamp: {
    fontSize: 10,
    color: '#555',
    textAlign: 'right'
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40
  },
  sendButton: {
    marginLeft: 8
  }
});