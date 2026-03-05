import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/auth';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PinScreen } from './src/screens/PinScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RotaScreen } from './src/screens/RotaScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0a',
    card: '#1a1a1a',
    primary: '#3B82F6',
  },
};

export default function App() {
  const { motorista, pinVerified } = useAuthStore();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!motorista ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : !pinVerified ? (
            <Stack.Screen name="Pin" component={PinScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Rota" component={RotaScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
