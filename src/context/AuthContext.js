// src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const id = await AsyncStorage.getItem('userId');
        const role = await AsyncStorage.getItem('userRole');
        if (token && id && role) {
          setUserToken(token);
          setUserId(id);
          setUserRole(role);
        }
      } catch (e) {
        console.log('Failed to load user data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });
      // Clean token of any leading/trailing quotes
      const cleanedToken = data.token.replace(/^"|"$/g, '');
      setUserToken(cleanedToken);
      setUserId(data.user.id);
      setUserRole(data.user.role);

      await AsyncStorage.setItem('userToken', cleanedToken);
      await AsyncStorage.setItem('userId', data.user.id);
      await AsyncStorage.setItem('userRole', data.user.role);

      // Return role so the caller can decide where to navigate:
      return data.user.role;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid email or password.');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/register', {
        name,
        email,
        password,
        role,
      });
      const cleanedToken = data.token.replace(/^"|"$/g, '');
      setUserToken(cleanedToken);
      setUserId(data.user.id);
      setUserRole(data.user.role);

      await AsyncStorage.setItem('userToken', cleanedToken);
      await AsyncStorage.setItem('userId', data.user.id);
      await AsyncStorage.setItem('userRole', data.user.role);
      return data.user.role;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userRole');
    } catch (e) {
      console.log('Failed to logout:', e);
    }
    setUserToken(null);
    setUserId(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userId,
        userRole,
        login,
        logout,
        register,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};