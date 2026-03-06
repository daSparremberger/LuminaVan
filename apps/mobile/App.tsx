import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/auth';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PinScreen } from './src/screens/PinScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RotaScreen } from './src/screens/RotaScreen';
import { PinSetupScreen } from './src/screens/PinSetupScreen';
import { VehicleBindingScreen } from './src/screens/VehicleBindingScreen';
import { useEffect } from 'react';

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
  const { profiles, activeMotoristaId, pinVerified, loading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const activeProfile = profiles.find((item) => item.motorista.id === activeMotoristaId) || null;

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!activeProfile ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : !activeProfile.pinConfigured ? (
            <Stack.Screen name="PinSetup" component={PinSetupScreen} />
          ) : !activeProfile.vehicleBound ? (
            <Stack.Screen name="VehicleBinding" component={VehicleBindingScreen} />
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
