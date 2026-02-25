import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import { X, Pause, Play, RotateCcw } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { appColors, appFonts, appTypography } from '../theme';

const QUICK_PRESETS = [
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '1.5m', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
];

const ADJUST_PRESETS = [
    { label: '+15s', value: 15 },
    { label: '+30s', value: 30 },
    { label: '+1m', value: 60 },
];

interface Props {
    onClose: () => void;
    autoStart?: boolean;
    initialSeconds?: number;
}

export const RestTimer: React.FC<Props> = ({ onClose, autoStart = false, initialSeconds = 90 }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(autoStart);
    const [selectedPreset, setSelectedPreset] = useState<number | null>(initialSeconds);
    const [restComplete, setRestComplete] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, seconds]);

    // Rest complete haptic + visual
    useEffect(() => {
        if (seconds === 0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setRestComplete(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Second strong haptic after 200ms for emphasis
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 200);
        }
    }, [seconds]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const selectPreset = (value: number) => {
        setSeconds(value);
        setSelectedPreset(value);
        setIsRunning(false);
        setRestComplete(false);
        hasCompletedRef.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const addTime = (extra: number) => {
        setSeconds(prev => prev + extra);
        setRestComplete(false);
        hasCompletedRef.current = false;
        if (!isRunning) setIsRunning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (seconds === 0) {
            // Reset and start
            setSeconds(selectedPreset || 90);
            setRestComplete(false);
            hasCompletedRef.current = false;
            setIsRunning(true);
        } else {
            setIsRunning(!isRunning);
        }
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSeconds(selectedPreset || 90);
        setIsRunning(false);
        setRestComplete(false);
        hasCompletedRef.current = false;
    };

    return (
        <Portal>
            <View style={styles.overlay}>
                <MotiView
                    from={{ opacity: 0, scale: 0.92, translateY: 30 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    style={styles.modal}
                >
                    {/* ═══ Header ═══ */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Rest Timer</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={styles.closeBtn}
                        >
                            <X size={18} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {/* ═══ Timer Display ═══ */}
                    <View style={styles.timerSection}>
                        {/* Timer text with pulse when running */}
                        <MotiView
                            from={{ scale: 1 }}
                            animate={{
                                scale: isRunning ? [1, 1.02, 1] : 1,
                            }}
                            transition={{
                                type: 'timing',
                                duration: 2000,
                                loop: isRunning,
                            }}
                        >
                            <Text style={[
                                styles.timer,
                                isRunning && styles.timerActive,
                                restComplete && styles.timerComplete,
                            ]}>
                                {fmt(seconds)}
                            </Text>
                        </MotiView>

                        {/* Rest complete text */}
                        {restComplete && (
                            <MotiView
                                from={{ opacity: 0, translateY: 6 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 400 }}
                            >
                                <Text style={styles.completeText}>Rest Complete</Text>
                            </MotiView>
                        )}
                    </View>

                    {/* ═══ Quick Set Presets ═══ */}
                    <View style={styles.sectionGroup}>
                        <Text style={styles.sectionLabel}>Quick Set</Text>
                        <View style={styles.presetRow}>
                            {QUICK_PRESETS.map(p => (
                                <TouchableOpacity
                                    key={p.value}
                                    onPress={() => selectPreset(p.value)}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.presetBtn,
                                        selectedPreset === p.value && !isRunning && styles.presetBtnActive,
                                    ]}
                                >
                                    <Text style={[
                                        styles.presetText,
                                        selectedPreset === p.value && !isRunning && styles.presetTextActive,
                                    ]}>
                                        {p.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ═══ Adjust Presets ═══ */}
                    <View style={[styles.sectionGroup, { marginTop: 14 }]}>
                        <Text style={styles.sectionLabel}>Adjust</Text>
                        <View style={styles.presetRow}>
                            {ADJUST_PRESETS.map(p => (
                                <TouchableOpacity
                                    key={p.label}
                                    onPress={() => addTime(p.value)}
                                    activeOpacity={0.7}
                                    style={styles.adjustBtn}
                                >
                                    <Text style={styles.adjustText}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ═══ Action Buttons ═══ */}
                    <View style={styles.actions}>
                        {/* Pause/Start — Primary */}
                        <TouchableOpacity
                            onPress={handleToggle}
                            activeOpacity={0.8}
                            style={styles.primaryBtn}
                        >
                            <MotiView
                                animate={{ scale: [1, 0.96, 1] }}
                                transition={{ type: 'timing', duration: 150 }}
                            >
                                <View style={styles.primaryBtnInner}>
                                    {isRunning ? (
                                        <Pause size={18} color="#000" fill="#000" />
                                    ) : (
                                        <Play size={18} color="#000" fill="#000" />
                                    )}
                                    <Text style={styles.primaryBtnText}>
                                        {seconds === 0 ? 'Restart' : isRunning ? 'Pause' : 'Start'}
                                    </Text>
                                </View>
                            </MotiView>
                        </TouchableOpacity>

                        {/* Reset — Secondary */}
                        <TouchableOpacity
                            onPress={handleReset}
                            activeOpacity={0.7}
                            style={styles.secondaryBtn}
                        >
                            <RotateCcw size={16} color="#888" />
                            <Text style={styles.secondaryBtnText}>Reset</Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>
            </View>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modal: {
        width: '90%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 28,
        backgroundColor: appColors.cardBg,
        borderWidth: 1,
        borderColor: appColors.border,
        // Subtle shadow depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 20,
    },

    // ═══ Header ═══
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontFamily: appFonts.bold,
        color: '#888',
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
    },

    // ═══ Timer ═══
    timerSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    timer: {
        fontSize: 52,
        fontFamily: appFonts.black,
        color: '#fff',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
        textAlign: 'center',
    },
    timerActive: {
        color: appColors.accent + 'DD',  // Slight green tint, not full neon
    },
    timerComplete: {
        color: appColors.accent,
    },
    completeText: {
        ...appTypography.small,
        color: appColors.accent,
        fontSize: 14,
        fontFamily: appFonts.semiBold,
        marginTop: 8,
        letterSpacing: 0.5,
    },

    // ═══ Presets ═══
    sectionGroup: {
        marginTop: 20,
    },
    sectionLabel: {
        ...appTypography.small,
        color: '#555',
        fontSize: 10,
        fontFamily: appFonts.bold,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    presetRow: {
        flexDirection: 'row',
        gap: 8,
    },
    presetBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColors.border,
        alignItems: 'center',
    },
    presetBtnActive: {
        borderColor: appColors.accent + '60',
        backgroundColor: appColors.accent + '08',
    },
    presetText: {
        fontSize: 13,
        fontFamily: appFonts.bold,
        color: '#888',
    },
    presetTextActive: {
        color: appColors.accent,
    },

    // Adjust buttons
    adjustBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColors.border,
        alignItems: 'center',
    },
    adjustText: {
        fontSize: 13,
        fontFamily: appFonts.bold,
        color: '#666',
    },

    // ═══ Actions ═══
    actions: {
        marginTop: 24,
        gap: 10,
    },
    primaryBtn: {
        backgroundColor: appColors.accent,
        borderRadius: 14,
        overflow: 'hidden',
    },
    primaryBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
    },
    primaryBtnText: {
        color: '#000',
        fontSize: 16,
        fontFamily: appFonts.black,
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    secondaryBtnText: {
        color: '#888',
        fontSize: 14,
        fontFamily: appFonts.bold,
    },
});
