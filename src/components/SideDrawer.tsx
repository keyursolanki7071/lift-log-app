import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, BackHandler } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { Text, Divider, Portal } from 'react-native-paper';
import {
    History,
    Dumbbell,
    Scale,
    BarChart2,
    LogOut,
    X,
    User as UserIcon
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { appColors, appTypography, appFonts } from '../theme';

const DRAWER_W = 280;

interface DrawerItem {
    icon: (color: string) => React.ReactNode;
    label: string;
    routeName: string;
    onPress: () => void;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    navigation: any;
}

export const SideDrawer: React.FC<Props> = ({ visible, onClose, navigation }) => {
    const { user, signOut } = useAuth();

    // Get current route name to highlight active item
    const state = navigation.getState();
    const currentRoute = state?.routes[state.index]?.name === 'Start' ? 'Dashboard' : (state?.routes[state.index]?.name || 'Dashboard');

    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (visible) { onClose(); return true; }
            return false;
        });
        return () => handler.remove();
    }, [visible]);

    const items: DrawerItem[] = useMemo(() => [
        {
            icon: (color: string) => <History size={22} color={color} />,
            label: 'Workout History',
            routeName: 'History',
            onPress: () => { onClose(); navigation.navigate('History'); }
        },
        {
            icon: (color: string) => <BarChart2 size={22} color={color} />,
            label: 'Progress',
            routeName: 'Progress',
            onPress: () => { onClose(); navigation.navigate('Progress'); }
        },
        {
            icon: (color: string) => <Scale size={22} color={color} />,
            label: 'Body Tracking',
            routeName: 'Body',
            onPress: () => { onClose(); navigation.navigate('Body'); }
        },
        {
            icon: (color: string) => <Dumbbell size={22} color={color} />,
            label: 'Exercises',
            routeName: 'Exercises',
            onPress: () => { onClose(); navigation.navigate('Exercises'); }
        },
    ], [navigation, onClose]);

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || 'No email provided';

    return (
        <Portal>
            <AnimatePresence>
                {visible && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        {/* Overlay */}
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'timing', duration: 250 }}
                            style={styles.overlay}
                        >
                            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                        </MotiView>

                        {/* Drawer */}
                        <MotiView
                            from={{ translateX: -DRAWER_W }}
                            animate={{ translateX: 0 }}
                            exit={{ translateX: -DRAWER_W }}
                            transition={{ type: 'timing', duration: 300 }}
                            style={styles.drawer}
                        >
                            {/* 1. Brand Logo */}
                            <View style={styles.brandContainer}>
                                <View style={styles.brandRow}>
                                    <Dumbbell size={28} color={appColors.accent} strokeWidth={3} />
                                    <Text style={styles.appTitle}>LiftLog</Text>
                                </View>
                                <View style={styles.brandUnderline} />
                            </View>

                            {/* 2. User Header Section */}
                            <View style={styles.userSection}>
                                <View style={styles.avatar}>
                                    <UserIcon size={32} color="#fff" />
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                                    <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
                                </View>
                            </View>

                            <Divider style={styles.divider} />

                            {/* 3. Navigation Items */}
                            <View style={styles.drawerContent}>
                                {items.map((item, i) => {
                                    const isActive = currentRoute === item.routeName;
                                    return (
                                        <MotiPressable
                                            key={i}
                                            onPress={item.onPress}
                                            animate={({ pressed }) => {
                                                'worklet';
                                                return {
                                                    scale: pressed ? 0.98 : 1,
                                                    backgroundColor: pressed || isActive ? '#1A1A1A' : 'transparent',
                                                };
                                            }}
                                            style={[styles.drawerItem, isActive && styles.activeItem]}
                                        >
                                            {isActive && <View style={styles.activeBar} />}
                                            <View style={styles.drawerIconContainer}>
                                                {item.icon(isActive ? appColors.accent : appColors.textSecondary)}
                                            </View>
                                            <Text style={[styles.drawerLabel, isActive && styles.activeLabel]}>
                                                {item.label}
                                            </Text>
                                        </MotiPressable>
                                    );
                                })}
                            </View>

                            <View style={styles.bottomSection}>
                                <Divider style={styles.divider} />
                                <MotiPressable
                                    onPress={() => { onClose(); signOut(); }}
                                    animate={({ pressed }) => {
                                        'worklet';
                                        return {
                                            scale: pressed ? 0.98 : 1,
                                            backgroundColor: pressed ? '#1A1A1A' : 'transparent',
                                        };
                                    }}
                                    style={styles.drawerItem}
                                >
                                    <View style={styles.drawerIconContainer}>
                                        <LogOut size={22} color="#FF4D4D" />
                                    </View>
                                    <Text style={[styles.drawerLabel, { color: '#FF4D4D' }]}>Sign Out</Text>
                                </MotiPressable>

                                <View style={styles.footer}>
                                    <Text style={styles.versionText}>LiftLog v1.0</Text>
                                </View>
                            </View>
                        </MotiView>
                    </View>
                )}
            </AnimatePresence>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100 },
    drawer: {
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: DRAWER_W, backgroundColor: appColors.cardBg,
        borderRightWidth: 1, borderRightColor: appColors.border,
        zIndex: 101,
    },
    // Branding
    brandContainer: {
        paddingTop: Dimensions.get('window').height * 0.08,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        fontFamily: appFonts.black,
    },
    brandUnderline: {
        width: 40,
        height: 3,
        backgroundColor: appColors.accent,
        marginTop: 8,
        borderRadius: 2,
    },
    // User Header
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 16,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: appFonts.bold,
    },
    userEmail: {
        color: appColors.textTertiary,
        fontSize: 13,
        marginTop: 2,
    },
    // Navigation
    drawerContent: { flex: 1, paddingVertical: 12 },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        position: 'relative',
    },
    activeItem: {
        backgroundColor: '#1A1A1A',
    },
    activeBar: {
        position: 'absolute',
        left: 0,
        top: 12,
        bottom: 12,
        width: 3,
        backgroundColor: appColors.accent,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    drawerIconContainer: { marginRight: 20, width: 24, alignItems: 'center' },
    drawerLabel: {
        color: appColors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: appFonts.bold,
    },
    activeLabel: {
        color: appColors.accent,
    },
    // Bottom Section
    bottomSection: {
        paddingBottom: Dimensions.get('window').height * 0.03,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 16,
    },
    versionText: {
        color: appColors.textTertiary,
        fontSize: 12,
        opacity: 0.5,
    },
    divider: {
        backgroundColor: appColors.border,
        marginHorizontal: 24,
    },
});
