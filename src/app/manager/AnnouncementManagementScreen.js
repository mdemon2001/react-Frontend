// src/app/manager/AnnouncementManagementScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Button
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const AnnouncementManagementScreen = () => {
  const navigation = useNavigation();
  const { userToken } = useContext(AuthContext);

  // List of announcements from backend
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal for creating a new announcement
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fields for creating new announcement
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('All Employees');
  const [attachments, setAttachments] = useState([]);

  // Sub-modal for adding a single attachment
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [tempAttachmentUrl, setTempAttachmentUrl] = useState('');

  const apiBaseUrl = 'http://localhost:5000/api'; // Adjust as needed

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const res = await axios.get(`${apiBaseUrl}/announcements`, { headers });
      const data = res.data || [];
      // Sort by newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  // Show the modal to create a new announcement
  const openCreateAnnouncementModal = () => {
    setTitle('');
    setMessage('');
    setAudience('All Employees');
    setAttachments([]);
    setShowCreateModal(true);
  };

  // Post the new announcement
  const postAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const payload = {
        title,
        message,
        audience,
        attachments,
      };
      await axios.post(`${apiBaseUrl}/announcements`, payload, { headers });

      Alert.alert('Success', 'Announcement created!');
      setShowCreateModal(false);
      fetchAnnouncements(); // refresh the list
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to post announcement.'
      );
    }
  };

  // For displaying a "2 hours ago" type string
  const timeSince = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days >= 1) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes >= 1) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  };

  // Sub-modal: add an attachment
  const addAttachment = () => {
    if (!tempAttachmentUrl.trim()) {
      Alert.alert('Warning', 'Attachment cannot be empty.');
      return;
    }
    setAttachments([...attachments, tempAttachmentUrl.trim()]);
    setTempAttachmentUrl('');
    setShowAttachmentModal(false);
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
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* E.g. notifications icon → go to NotificationsScreen if you have one */}
          <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          {/* Settings → SettingsScreen */}
          <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* "Create new announcement" button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={openCreateAnnouncementModal}
      >
        <Text style={styles.createButtonText}>+ Create New Announcement</Text>
      </TouchableOpacity>

      {/* List of announcements */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {announcements.length === 0 ? (
          <Text style={styles.noAnnouncements}>No announcements found.</Text>
        ) : (
          announcements.map(ann => (
            <View key={ann._id} style={styles.announcementCard}>
              {/* Title row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.announcementTitle}>{ann.title}</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Could open a context/edit menu here
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#555" />
                </TouchableOpacity>
              </View>

              {/* Announcement message */}
              <Text style={styles.announcementMessage} numberOfLines={2}>
                {ann.message}
              </Text>

              {/* Info row: time + audience */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{timeSince(ann.createdAt)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{ann.audience}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer nav (Home → ManagerDashboardScreen, Announcements → current screen, Profile → ProfileScreen) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ManagerDashboardScreen')}
        >
          <Ionicons name="home-outline" size={24} color="#555" />
          <Text>Home</Text>
        </TouchableOpacity>

        {/* Current screen is Announcements */}
        <View style={styles.footerItemActive}>
          <Ionicons name="megaphone-outline" size={24} color="#1976D2" />
          <Text style={{ color: '#1976D2' }}>Announcements</Text>
        </View>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} color="#555" />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Create Announcement Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter announcement title"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Write your announcement..."
                multiline
                value={message}
                onChangeText={setMessage}
              />

              <Text style={styles.label}>Select Audience</Text>
              <TextInput
                style={styles.input}
                value={audience}
                onChangeText={setAudience}
              />

              {/* Attachments (optional) */}
              <Text style={styles.label}>Attachments (Optional)</Text>
              {attachments.map((att, idx) => (
                <View key={idx} style={styles.attachmentRow}>
                  <Ionicons name="link" size={14} color="#1976D2" />
                  <Text style={styles.attachmentText}>{att}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addAttachmentBtn}
                onPress={() => setShowAttachmentModal(true)}
              >
                <Ionicons name="attach-outline" size={18} color="#1976D2" />
                <Text style={{ color: '#1976D2', marginLeft: 6 }}>Add Attachment</Text>
              </TouchableOpacity>

              {/* Buttons row */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#eee' }]}
                  onPress={() => {
                    Alert.alert(
                      'Preview',
                      `Title: ${title}\nMessage: ${message}\nAudience: ${audience}\nAttachments: ${attachments.join(', ')}`
                    );
                  }}
                >
                  <Text>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#1976D2' }]}
                  onPress={postAnnouncement}
                >
                  <Text style={{ color: '#fff' }}>Post</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Attachment sub-modal */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.attachmentModalContainer}>
            <Text style={styles.modalTitle}>Add Attachment</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter attachment URL or text"
              value={tempAttachmentUrl}
              onChangeText={setTempAttachmentUrl}
            />
            <View style={styles.attachmentModalButtons}>
              <Button title="Cancel" onPress={() => setShowAttachmentModal(false)} />
              <Button
                title="Add"
                onPress={() => {
                  if (!tempAttachmentUrl.trim()) {
                    Alert.alert('Warning', 'Attachment cannot be empty.');
                  } else {
                    setAttachments([...attachments, tempAttachmentUrl.trim()]);
                    setTempAttachmentUrl('');
                    setShowAttachmentModal(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AnnouncementManagementScreen;

// Example styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1, backgroundColor: '#f9fcff' },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#1976D2',
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noAnnouncements: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  announcementCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerItemActive: {
    alignItems: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 14,
    color: '#555',
  },
  addAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    flex: 0.48,
  },
  attachmentModalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 30,
    borderRadius: 8,
    padding: 16,
  },
  attachmentModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});