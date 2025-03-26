// navigation/ManagerTabs.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../app/manager/ManagerDashboardScreen';
import EmployeesScreen from '../app/manager/EmployeeManagementScreen';
import SharedStack from './SharedStack';

const Tab = createBottomTabNavigator();

export default function ManagerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#197602',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="ManagerDashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerEmployees"
        component={EmployeesScreen}
        options={{
          tabBarLabel: 'Employees',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ManagerProfile"
        component={SharedStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}