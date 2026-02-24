import React from 'react';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export const AppNavigator: React.FC = () => {
    const { session, loading } = useAuth();
    const theme = useTheme();

    const navTheme = {
        ...NavDefaultTheme,
        dark: true,
        colors: {
            ...NavDefaultTheme.colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.outline,
            notification: theme.colors.primary,
        },
    };

    if (loading) {
        return (
            <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={navTheme}>
            {session ? <MainTabs /> : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
