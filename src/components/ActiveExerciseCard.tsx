import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Plus, X, ChevronDown } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { appColors, appFonts, appTypography } from '../theme';
import { ActiveSetRow } from './ActiveSetRow';
import { WorkoutSet } from '../types';

interface Props {
    exercise: {
        id: string;
        exerciseName: string;
        sets: WorkoutSet[];
    };
    completedSets: Set<string>;
    localSets: Record<string, { weight: string; reps: string }>;
    onRemoveExercise: () => void;
    onAddSet: () => void;
    onDeleteSet: (setId: string) => void;
    onCompleteSet: (setId: string) => void;
    onSetChange: (setId: string, field: 'weight' | 'reps', val: string) => void;
}

export const ActiveExerciseCard: React.FC<Props> = React.memo(({
    exercise, completedSets, localSets,
    onRemoveExercise, onAddSet, onDeleteSet, onCompleteSet, onSetChange
}) => {
    const completedCount = exercise.sets.filter(s => completedSets.has(s.id)).length;
    const totalSets = exercise.sets.length;
    const allDone = totalSets > 0 && completedCount === totalSets;
    const [collapsed, setCollapsed] = useState(false);

    // Auto-collapse when all sets completed
    const isCollapsed = collapsed || allDone;

    // Calculate volume for completed sets
    const volume = useMemo(() => {
        let v = 0;
        exercise.sets.forEach(s => {
            if (completedSets.has(s.id)) {
                const w = s.weight || 0;
                const r = s.reps || 0;
                v += w * r;
            }
        });
        return v;
    }, [exercise.sets, completedSets]);

    // Get last set values for hint
    const lastSetHint = useMemo(() => {
        const sorted = [...exercise.sets]
            .sort((a, b) => a.set_number - b.set_number)
            .filter(s => (s.weight || 0) > 0);
        if (sorted.length === 0) return null;
        const last = sorted[sorted.length - 1];
        return { weight: last.weight || 0, reps: last.reps || 0 };
    }, [exercise.sets]);

    return (
        <View style={[styles.card, allDone && styles.cardDone]}>
            {/* Header */}
            <TouchableOpacity
                onPress={() => {
                    if (allDone) {
                        setCollapsed(prev => !prev);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                }}
                activeOpacity={allDone ? 0.7 : 1}
                style={styles.header}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.name, allDone && styles.nameDone]} numberOfLines={1}>
                        {exercise.exerciseName}
                    </Text>
                    <View style={styles.subtitleRow}>
                        {allDone ? (
                            <Text style={styles.completedText}>✔ All Sets Completed</Text>
                        ) : (
                            <Text style={styles.subtitle}>
                                {completedCount}/{totalSets} sets
                            </Text>
                        )}
                        {volume > 0 && (
                            <Text style={styles.volumeText}>
                                • {new Intl.NumberFormat().format(volume)}kg vol
                            </Text>
                        )}
                        {lastSetHint && !allDone && (
                            <Text style={styles.hintText}>
                                • Last: {lastSetHint.weight}kg × {lastSetHint.reps}
                            </Text>
                        )}
                    </View>
                </View>
                {allDone ? (
                    <MotiView
                        animate={{ rotateZ: isCollapsed ? '0deg' : '180deg' }}
                        transition={{ type: 'timing', duration: 200 }}
                    >
                        <ChevronDown size={18} color="#555" />
                    </MotiView>
                ) : (
                    <TouchableOpacity onPress={onRemoveExercise} style={styles.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={18} color="#555" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* Collapsible content */}
            {!isCollapsed && (
                <>
                    {/* Column headers */}
                    <View style={styles.colRow}>
                        <Text style={[styles.colLabel, { width: 36 }]}>SET</Text>
                        <Text style={[styles.colLabel, { flex: 1 }]}>KG</Text>
                        <Text style={[styles.colLabel, { flex: 1 }]}>REPS</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={styles.colDivider} />

                    {/* Set rows */}
                    <AnimatePresence>
                        {exercise.sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
                            <ActiveSetRow
                                key={set.id}
                                setId={set.id}
                                exerciseId={exercise.id}
                                setNumber={set.set_number}
                                weight={localSets[set.id]?.weight !== undefined ? localSets[set.id].weight : (set.weight != null ? String(set.weight) : '')}
                                reps={localSets[set.id]?.reps !== undefined ? localSets[set.id].reps : (set.reps != null ? String(set.reps) : '')}
                                isDone={completedSets.has(set.id)}
                                onWeightChange={(v) => onSetChange(set.id, 'weight', v)}
                                onRepsChange={(v) => onSetChange(set.id, 'reps', v)}
                                onComplete={() => onCompleteSet(set.id)}
                                onDelete={() => onDeleteSet(set.id)}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Add Set — subtle outline */}
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAddSet();
                        }}
                        style={styles.addSetBtn}
                        activeOpacity={0.7}
                    >
                        <Plus size={14} color={appColors.textTertiary} strokeWidth={2.5} />
                        <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        padding: 18,
    },
    cardDone: {
        borderColor: appColors.accent + '30',
    },

    // Header
    removeBtn: { padding: 6 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        ...appTypography.h1,
        color: '#fff',
        fontSize: 20,
        fontFamily: appFonts.black,
    },
    nameDone: {
        color: appColors.accent,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
    },
    subtitle: {
        ...appTypography.small,
        color: '#666',
        fontSize: 11,
        fontFamily: appFonts.semiBold,
    },
    completedText: {
        ...appTypography.small,
        color: appColors.accent,
        fontSize: 11,
        fontFamily: appFonts.semiBold,
    },
    volumeText: {
        ...appTypography.small,
        color: appColors.accent,
        fontSize: 11,
        fontFamily: appFonts.semiBold,
    },
    hintText: {
        ...appTypography.small,
        color: '#555',
        fontSize: 11,
        fontFamily: appFonts.semiBold,
    },

    // Column headers
    colRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 6,
        gap: 8,
    },
    colLabel: {
        ...appTypography.small,
        color: '#555',
        textAlign: 'center',
        letterSpacing: 1.5,
        fontSize: 10,
        fontFamily: appFonts.bold,
    },
    colDivider: {
        height: 1,
        backgroundColor: appColors.border,
        marginBottom: 8,
    },

    // Add Set
    addSetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        marginTop: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: appColors.border,
        borderStyle: 'dashed',
    },
    addSetText: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 12,
        fontFamily: appFonts.bold,
    },
});
