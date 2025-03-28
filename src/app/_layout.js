import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';

const Layout = () => {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
};

export default Layout;
