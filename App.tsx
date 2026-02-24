import React from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import { AuthProvider } from './src/hooks/useAuth';
import { WorkoutProvider } from './src/hooks/useWorkout';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <WorkoutProvider>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
            <AppNavigator />
          </WorkoutProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
