// app/Auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
//import { API_URL } from '../../constants/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleRegister = async () => {
    if (!termsAccepted || !privacyAccepted) {
      Alert.alert("Error", "Please accept Terms and Conditions and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/auth/register`, {
        name,
        email,
        password,
        role
      });

      if (response.status === 201) {
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.msg || "Something went wrong.");
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

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity onPress={() => setRole('Employee')} style={styles.radio}>
          <Text style={role === 'Employee' && styles.selected}>○ Employee</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('Manager')} style={styles.radio}>
          <Text style={role === 'Manager' && styles.selected}>○ Manager</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
          <Text>{termsAccepted ? '[✓]' : '[ ]'} I agree to the Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPrivacyAccepted(!privacyAccepted)}>
          <Text>{privacyAccepted ? '[✓]' : '[ ]'} I agree to the Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={styles.loginLink}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

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
  checkboxContainer: {
    marginVertical: 10
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

export default RegisterScreen;