// src// navigation/AppNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import EmployeeTabs from './EmployeeTabs';
import ManagerTabs from './ManagerTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false // Add this line
      }}
      initialRouteName="Auth" // Explicitly set this
    >
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="EmployeeFlow" component={EmployeeTabs} />
      <Stack.Screen name="ManagerFlow" component={ManagerTabs} />
    </Stack.Navigator>
  );
}