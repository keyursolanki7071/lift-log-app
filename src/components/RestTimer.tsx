import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton, Portal } from 'react-native-paper';
import { appColors } from '../theme';

const PRESETS = [30, 60, 90, 120, 180];

interface Props {
    onClose: () => void;
    autoStart?: boolean;
    initialSeconds?: number;
}

export const RestTimer: React.FC<Props> = ({ onClose, autoStart = false, initialSeconds = 90 }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) { setIsRunning(false); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, seconds]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const addTime = (extra: number) => {
        setSeconds(prev => prev + extra);
        if (!isRunning) setIsRunning(true);
    };

    return (
        <Portal>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Rest Timer</Text>
                        <IconButton icon="close" iconColor={appColors.textTertiary} size={20} onPress={onClose} style={{ margin: 0 }} />
                    </View>

                    {/* Timer */}
                    <Text style={[styles.timer, seconds === 0 && { color: appColors.success }]}>{fmt(seconds)}</Text>
                    {seconds === 0 && <Text style={styles.doneText}>Rest complete</Text>}

                    {/* Presets */}
                    <View style={styles.presets}>
                        {PRESETS.map(p => (
                            <Button key={p} mode={seconds === p && !isRunning ? 'contained' : 'outlined'} compact
                                onPress={() => { setSeconds(p); setIsRunning(false); }}
                                style={[styles.presetBtn, seconds === p && !isRunning && { backgroundColor: appColors.accent }]}
                                textColor={seconds === p && !isRunning ? '#000' : appColors.textSecondary}
                                labelStyle={{ fontSize: 12, fontWeight: '600' }}>
                                {p >= 60 ? `${p / 60}m` : `${p}s`}
                            </Button>
                        ))}
                    </View>

                    {/* Extend */}
                    <View style={styles.extendRow}>
                        {[{ l: '+15s', v: 15 }, { l: '+30s', v: 30 }, { l: '+1m', v: 60 }].map(e => (
                            <Button key={e.l} mode="outlined" compact onPress={() => addTime(e.v)}
                                style={styles.extendBtn} textColor={appColors.textSecondary} labelStyle={{ fontSize: 12 }}>{e.l}</Button>
                        ))}
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <Button mode="contained" icon={isRunning ? 'pause' : 'play'}
                            onPress={() => setIsRunning(!isRunning)}
                            style={styles.ctrlBtn} buttonColor={appColors.accent} textColor="#000"
                            contentStyle={{ height: 48 }} labelStyle={{ fontWeight: '800', fontSize: 15 }}>
                            {isRunning ? 'Pause' : 'Start'}
                        </Button>
                        <Button mode="outlined" icon="refresh"
                            onPress={() => { setSeconds(90); setIsRunning(false); }}
                            style={[styles.ctrlBtn, { borderColor: appColors.border }]}
                            textColor={appColors.textSecondary} contentStyle={{ height: 48 }}>
                            Reset
                        </Button>
                    </View>
                </View>
            </View>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    modal: { width: '88%', maxWidth: 380, borderRadius: 8, padding: 24, backgroundColor: appColors.cardBg, borderWidth: 1, borderColor: appColors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 18, fontWeight: '800', color: '#fff' },
    timer: { textAlign: 'center', fontWeight: '900', fontSize: 64, color: '#fff', marginVertical: 16, fontVariant: ['tabular-nums'] },
    doneText: { textAlign: 'center', color: appColors.success, fontWeight: '700', fontSize: 15, marginBottom: 8 },
    presets: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 },
    presetBtn: { borderRadius: 8, borderColor: appColors.border, minWidth: 48 },
    extendRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
    extendBtn: { borderRadius: 8, borderColor: appColors.border },
    controls: { flexDirection: 'row', gap: 10 },
    ctrlBtn: { flex: 1, borderRadius: 8 },
});
