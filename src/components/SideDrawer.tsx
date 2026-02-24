import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, BackHandler } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Text, Divider, IconButton, Portal } from 'react-native-paper';
import {
    History,
    Dumbbell,
    Scale,
    BarChart2,
    LogOut,
    X
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { appColors } from '../theme';

const DRAWER_W = 280;

interface DrawerItem {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    navigation: any;
}

export const SideDrawer: React.FC<Props> = ({ visible, onClose, navigation }) => {
    const { signOut } = useAuth();

    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (visible) { onClose(); return true; }
            return false;
        });
        return () => handler.remove();
    }, [visible]);

    const items: DrawerItem[] = [
        {
            icon: <History size={22} color={appColors.textSecondary} />,
            label: 'Workout History',
            onPress: () => { onClose(); navigation.navigate('History'); }
        },
        {
            icon: <Dumbbell size={22} color={appColors.textSecondary} />,
            label: 'Exercises',
            onPress: () => { onClose(); navigation.navigate('Exercises'); }
        },
        {
            icon: <Scale size={22} color={appColors.textSecondary} />,
            label: 'Body Tracking',
            onPress: () => { onClose(); navigation.navigate('Body'); }
        },
        {
            icon: <BarChart2 size={22} color={appColors.textSecondary} />,
            label: 'Progress',
            onPress: () => { onClose(); navigation.navigate('Progress'); }
        },
    ];

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
                            <View style={styles.drawerHeader}>
                                <Text style={styles.appTitle}>LiftLog</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <X size={24} color={appColors.textTertiary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.drawerContent}>
                                {items.map((item, i) => (
                                    <TouchableOpacity key={i} style={styles.drawerItem} onPress={item.onPress} activeOpacity={0.6}>
                                        <View style={styles.drawerIconContainer}>{item.icon}</View>
                                        <Text style={styles.drawerLabel}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Divider style={{ backgroundColor: appColors.border }} />

                            <TouchableOpacity style={styles.drawerItem} onPress={() => { onClose(); signOut(); }} activeOpacity={0.6}>
                                <View style={styles.drawerIconContainer}>
                                    <LogOut size={22} color={appColors.danger} />
                                </View>
                                <Text style={[styles.drawerLabel, { color: appColors.danger }]}>Sign Out</Text>
                            </TouchableOpacity>
                        </MotiView>
                    </View>
                )}
            </AnimatePresence>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100 },
    drawer: {
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: DRAWER_W, backgroundColor: appColors.cardBg,
        borderRightWidth: 1, borderRightColor: appColors.border,
        zIndex: 101, paddingTop: 64,
    },
    drawerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: appColors.border,
    },
    appTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 4 },
    drawerContent: { paddingVertical: 8 },
    drawerItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
    },
    drawerIconContainer: { marginRight: 16, width: 28, alignItems: 'center' },
    drawerLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
