import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import {
    Home,
    ClipboardList,
    Dumbbell,
    Menu,
    Play
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DashboardScreen } from '../screens/Dashboard';
import { ExercisesScreen } from '../screens/Exercises';
import { TemplateListScreen } from '../screens/TemplateList';
import { TemplateBuilderScreen } from '../screens/TemplateBuilder';
import { SelectTemplateScreen } from '../screens/SelectTemplate';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkout';
import { ProgressScreen } from '../screens/Progress';
import { ExerciseDetailScreen } from '../screens/ExerciseDetail';
import { WorkoutSummaryScreen } from '../screens/WorkoutSummary';
import { BodyTrackingScreen } from '../screens/BodyTracking';
import { WorkoutHistoryScreen } from '../screens/WorkoutHistory';
import { SideDrawer } from '../components/SideDrawer';
import { appColors, appTypography } from '../theme';

const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();
const TemplateStack = createNativeStackNavigator();
const ProgressStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

const DashboardStackScreen = () => (
    <DashStack.Navigator screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
    }}>
        <DashStack.Screen name="DashboardHome" component={DashboardScreen} />
        <DashStack.Screen name="SelectTemplate" component={SelectTemplateScreen} />
        <DashStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <DashStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <DashStack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
    </DashStack.Navigator>
);

const TemplateStackScreen = () => (
    <TemplateStack.Navigator screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
    }}>
        <TemplateStack.Screen name="TemplateListHome" component={TemplateListScreen} />
        <TemplateStack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
    </TemplateStack.Navigator>
);

const ProgressStackScreen = () => (
    <ProgressStack.Navigator screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
    }}>
        <ProgressStack.Screen name="ProgressHome" component={ProgressScreen} />
        <ProgressStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </ProgressStack.Navigator>
);

const HistoryStackScreen = () => (
    <HistoryStack.Navigator screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
    }}>
        <HistoryStack.Screen name="HistoryHome" component={WorkoutHistoryScreen} />
    </HistoryStack.Navigator>
);

/* ─── Placeholder screen for the center tab (never actually shown) ─── */
const DummyStart = () => <View style={{ flex: 1, backgroundColor: appColors.bg }} />;

/* ─── Custom Tab Bar ─── */
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const [drawerVisible, setDrawerVisible] = useState(false);

    // Hide tab bar on ActiveWorkout / WorkoutSummary
    const focusedRoute = state.routes[state.index];
    const focusedOptions = descriptors[focusedRoute.key].options;
    if (focusedOptions?.tabBarStyle?.display === 'none') {
        return null;
    }

    return (
        <>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;

                    // Center "Start" button
                    if (route.name === 'Start') {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={styles.startWrap}
                                onPress={() => {
                                    navigation.navigate('Dashboard', { screen: 'SelectTemplate' });
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.startBtn}>
                                    <Play size={28} color="#000" fill="#000" />
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    // Menu button (last tab)
                    if (route.name === 'Menu') {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                style={styles.tab}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setDrawerVisible(true);
                                }}
                                activeOpacity={0.6}
                            >
                                <Menu size={24} color={drawerVisible ? appColors.accent : '#777777'} strokeWidth={focusedStroke(drawerVisible)} />
                                <Text style={[styles.tabLabel, { color: drawerVisible ? appColors.accent : '#777777' }]}>Menu</Text>
                            </TouchableOpacity>
                        );
                    }

                    // Regular tabs
                    const tabMeta: Record<string, { icon: any; label: string }> = {
                        Dashboard: { icon: Home, label: 'Home' },
                        Templates: { icon: ClipboardList, label: 'Workouts' },
                        Exercises: { icon: Dumbbell, label: 'Exercises' },
                    };
                    const meta = tabMeta[route.name];
                    if (!meta) return null;
                    const IconComp = meta.icon;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.tab}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (!isFocused) navigation.navigate(route.name);
                            }}
                            activeOpacity={0.6}
                        >
                            <IconComp size={24} color={isFocused ? appColors.accent : '#777777'} strokeWidth={focusedStroke(isFocused)} />
                            <Text style={[styles.tabLabel, { color: isFocused ? appColors.accent : '#777777' }]}>{meta.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />
        </>
    );
};

const focusedStroke = (focused: boolean) => focused ? 2.5 : 2;

/* ─── Main Tabs ─── */
export const MainTabs: React.FC = () => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen name="Dashboard" component={DashboardStackScreen}
            options={({ route }) => {
                const routeName = getFocusedRouteNameFromRoute(route) ?? 'DashboardHome';
                const hideOnScreens = ['ActiveWorkout', 'WorkoutSummary'];
                return {
                    tabBarStyle: { display: hideOnScreens.includes(routeName) ? 'none' : 'flex' },
                };
            }}
        />
        <Tab.Screen name="Templates" component={TemplateStackScreen} options={{ title: 'Workouts' }} />
        <Tab.Screen name="Start" component={DummyStart} />
        <Tab.Screen name="Exercises" component={ExercisesScreen} />
        <Tab.Screen name="Menu" component={DummyStart} />

        {/* Hidden tabs — navigated from sidebar only */}
        <Tab.Screen name="History" component={HistoryStackScreen}
            options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Progress" component={ProgressStackScreen}
            options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Body" component={BodyTrackingScreen}
            options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
);

/* ─── Styles ─── */
const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: appColors.cardBg,
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        height: 75,
        paddingBottom: 10,
        paddingHorizontal: 4,
        overflow: 'visible',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
    },
    tabLabel: { ...appTypography.small, fontSize: 10, color: appColors.textTertiary, marginTop: 4, fontFamily: 'Inter-Bold' },

    // Center raised button
    startWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: -32,
    },
    startBtn: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: appColors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow for iOS
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        // Elevation for Android
        elevation: 10,
        borderWidth: 4,
        borderColor: appColors.bg,
    },
});
