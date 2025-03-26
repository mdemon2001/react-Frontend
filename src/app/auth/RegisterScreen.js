// src/app/auth/RegisterScreen.js
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5001/api/auth/register`,
        { name, email, password, role }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Account created successfully!");
        router.push('/auth/LoginScreen');
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.msg || "Something went wrong."
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Fill in the details to get started</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email Address"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity onPress={() => setRole('Employee')} style={styles.radio}>
          <Text style={role === 'Employee' ? styles.selected : null}>
            {role === 'Employee' ? '●' : '○'} Employee
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('Manager')} style={styles.radio}>
          <Text style={role === 'Manager' ? styles.selected : null}>
            {role === 'Manager' ? '●' : '○'} Manager
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/LoginScreen')}>
        <Text style={styles.loginLink}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  radio: {
    padding: 10
  },
  selected: {
    fontWeight: 'bold',
    color: '#007bff'
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  loginLink: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 15
  }
});