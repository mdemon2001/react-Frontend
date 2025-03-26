// navigation/AuthStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../app/auth/LoginScreen';
import RegisterScreen from '../app/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}