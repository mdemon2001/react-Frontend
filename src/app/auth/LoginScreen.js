// app/(auth)/LoginScreen.js
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Typewriter effect
  const fullHeaderText = "Employee Scheduling & Shift Management App";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + fullHeaderText[index]);
      index++;
      if (index >= fullHeaderText.length) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Neon glow animation
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 10,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Email and Password are required');
      return;
    }
    setSubmitting(true);
    try {
      // 1) This calls the AuthContext login, which returns the user’s role
      const role = await login(email, password);
      
      // 2) Depending on role, route accordingly
      if (role === 'Manager') {
        router.replace('/manager/ManagerDashboardScreen');
      } else {
        router.replace('/employee/HomeScreen');
      }

    } catch (err) {
      Alert.alert('Login Error', err.message || 'An error occurred during login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Animated, neon, typewriter-style header */}
      <Animated.Text style={[styles.glowHeader, { textShadowRadius: glowAnim }]}>
        {displayedText}
      </Animated.Text>

      <View style={styles.formContainer}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subHeader}>Please sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff"/>
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
          <Text style={styles.linkText}>New Here? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F4F7FA',
    justifyContent: 'center',
    padding: 20,
  },
  glowHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#3366FF',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#3366FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
    color: '#3366FF',
    marginBottom: 20,
  },
});