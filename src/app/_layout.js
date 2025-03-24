import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

const Layout = () => {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
};

export default Layout;