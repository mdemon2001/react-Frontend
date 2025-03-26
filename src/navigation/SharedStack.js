// navigation/SharedStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../app/shared/ProfileScreen';
import SettingsScreen from '../app/shared/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function SharedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#197602',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'User Profile' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Account Settings' }}
      />
    </Stack.Navigator>
  );
}