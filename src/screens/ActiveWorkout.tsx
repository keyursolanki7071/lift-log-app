import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Button, TextInput, Chip, ActivityIndicator } from 'react-native-paper';
import { AppModal } from '../components/AppModal';
import { Timer, Plus, Check, Dumbbell } from 'lucide-react-native';
import { MotiPressable } from 'moti/interactions';
import * as Haptics from 'expo-haptics';
import { useWorkout } from '../hooks/useWorkout';
import { useExercises } from '../hooks/useExercises';
import { RestTimer } from '../components/RestTimer';
import { WorkoutTimer } from '../components/WorkoutTimer';
import { SmartSetsPrompt } from '../components/SmartSetsPrompt';
import { appColors, appFonts, appTypography } from '../theme';
import { ActiveExerciseCard } from '../components/ActiveExerciseCard';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { triggerHaptic } from '../utils';

export const ActiveWorkoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        session, activeExercises, templateName, isFinishing, loading: sessionLoading, updateSet, addSet, deleteSet,
        finishWorkout, cancelWorkout, addExerciseToSession, removeExerciseFromSession, clearWorkout, updateDefaultSets,
    } = useWorkout();

    const [showRestTimer, setShowRestTimer] = useState(false);
    const [restAutoStart, setRestAutoStart] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [showCreateExercise, setShowCreateExercise] = useState(false);
    const [newExName, setNewExName] = useState('');
    const [newExMuscle, setNewExMuscle] = useState('Chest');
    const [smartUpdates, setSmartUpdates] = useState<any[]>([]);
    const [showSmartPrompt, setShowSmartPrompt] = useState(false);
    const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
    const [localSets, setLocalSets] = useState<Record<string, { weight: string; reps: string }>>({});
    const { exercises, createExercise } = useExercises();
    const startTime = useRef(new Date()).current;
    const pendingSummaryRef = useRef<any>(null);

    const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
    const [showEmptyWarning, setShowEmptyWarning] = useState(false);

    const handleSetChange = React.useCallback((setId: string, field: 'weight' | 'reps', value: string) => {
        setLocalSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: value } }));
        const numVal = value === '' ? null : parseFloat(value);
        const cur = localSets[setId] || {};
        const w = field === 'weight' ? numVal : (cur.weight ? parseFloat(cur.weight) : null);
        const r = field === 'reps' ? numVal : (cur.reps ? parseFloat(cur.reps) : null);
        updateSet(setId, w, r);
    }, [localSets, updateSet]);

    const handleSetComplete = React.useCallback((setId: string) => {
        setCompletedSets(prev => {
            const next = new Set(prev);
            if (next.has(setId)) next.delete(setId);
            else {
                next.add(setId);
                setRestAutoStart(true);
                setShowRestTimer(true);
                triggerHaptic('success');
            }
            return next;
        });
    }, []);

    const handleSetDelete = React.useCallback(async (seId: string, setId: string) => {
        await deleteSet(seId, setId);
        setLocalSets(prev => { const n = { ...prev }; delete n[setId]; return n; });
        setCompletedSets(prev => { const n = new Set(prev); n.delete(setId); return n; });
    }, [deleteSet]);

    const handleFinish = async () => {
        setShowFinishConfirm(false);
        const hasCompletedSet = completedSets.size > 0;
        if (!hasCompletedSet) {
            setShowEmptyWarning(true);
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const mins = Math.round((Date.now() - startTime.getTime()) / 60000);
        let totalVolume = 0;
        let maxWeight = 0;
        let bestExercise = '';
        activeExercises.forEach(ex => {
            ex.sets.forEach(s => {
                if (completedSets.has(s.id)) {
                    const w = s.weight || 0;
                    const r = s.reps || 0;
                    totalVolume += w * r;
                    if (w > maxWeight) { maxWeight = w; bestExercise = ex.exerciseName; }
                }
            });
        });
        const workoutSummary = {
            name: templateName || 'Custom Workout',
            duration: mins,
            volume: totalVolume,
            topLift: maxWeight > 0 ? { name: bestExercise, weight: maxWeight } : undefined,
        };

        const result = await finishWorkout(mins);
        if (result.smartUpdates && result.smartUpdates.length > 0) {
            pendingSummaryRef.current = workoutSummary;
            setSmartUpdates(result.smartUpdates);
            setShowSmartPrompt(true);
        } else {
            clearWorkout();
            navigation.replace('WorkoutSummary', { workoutData: workoutSummary });
        }
    };

    const confirmRemoveExercise = async () => {
        if (exerciseToRemove) {
            await removeExerciseFromSession(exerciseToRemove);
            setExerciseToRemove(null);
        }
    };

    const handleCancel = async () => {
        setShowCancelConfirm(false);
        const { error } = await cancelWorkout();
        if (!error) navigation.popToTop();
    };

    const handleAddExercise = async (ex: any) => {
        const { error } = await addExerciseToSession(ex.id, ex.name, ex.default_sets || 3);
        if (!error) setShowExercisePicker(false);
    };

    const handleCreateExercise = async () => {
        if (!newExName) return;
        const { error, data } = await createExercise(newExName, newExMuscle);
        if (!error && data) {
            setNewExName('');
            setShowCreateExercise(false);
            handleAddExercise(data);
        }
    };

    const renderExercises = React.useMemo(() => {
        return activeExercises.map((ex, index) => (
            <AnimatedListItem key={ex.id} index={index}>
                <ActiveExerciseCard
                    exercise={ex}
                    completedSets={completedSets}
                    localSets={localSets}
                    onRemoveExercise={() => setExerciseToRemove(ex.id)}
                    onAddSet={() => addSet(ex.id)}
                    onDeleteSet={(setId) => handleSetDelete(ex.id, setId)}
                    onCompleteSet={handleSetComplete}
                    onSetChange={handleSetChange}
                />
            </AnimatedListItem>
        ));
    }, [activeExercises, completedSets, localSets, addSet, handleSetDelete, handleSetComplete, handleSetChange]);

    if (isFinishing && !showSmartPrompt) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={appColors.accent} />
                <Text style={{ color: '#888', marginTop: 16, fontSize: 14, fontFamily: appFonts.semiBold }}>Saving workout...</Text>
            </View>
        );
    }

    if (!session) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={{ color: '#fff', fontSize: 18, fontFamily: appFonts.bold }}>No active workout</Text>
                <TouchableOpacity onPress={() => navigation.popToTop()} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20 }}>
                    <Text style={{ color: appColors.accent, fontFamily: appFonts.bold, fontSize: 15 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Top Bar ═══ */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setShowCancelConfirm(true)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <View style={styles.timerWrap}>
                    <WorkoutTimer startTime={startTime} isRestActive={showRestTimer} />
                </View>

                <TouchableOpacity
                    onPress={() => { setRestAutoStart(false); setShowRestTimer(prev => !prev); }}
                    style={[styles.restBtn, showRestTimer && styles.restBtnActive]}
                >
                    <Timer size={16} color={showRestTimer ? appColors.accent : '#888'} />
                    <Text style={[styles.restBtnText, showRestTimer && { color: appColors.accent }]}>Rest</Text>
                </TouchableOpacity>
            </View>

            {showRestTimer && (
                <RestTimer onClose={() => { setShowRestTimer(false); setRestAutoStart(false); }} autoStart={restAutoStart} />
            )}

            {/* ═══ Exercise List ═══ */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {renderExercises}

                {/* Add Exercise */}
                <TouchableOpacity
                    onPress={() => setShowExercisePicker(true)}
                    style={styles.addExBtn}
                    activeOpacity={0.7}
                >
                    <Plus size={18} color={appColors.accent} strokeWidth={2.5} />
                    <Text style={styles.addExText}>Add Exercise</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ═══ Sticky Footer ═══ */}
            <View style={styles.footer}>
                <MotiPressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowFinishConfirm(true);
                    }}
                    animate={({ pressed }) => {
                        'worklet';
                        return { scale: pressed ? 0.97 : 1 };
                    }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    style={styles.finishBtn}
                >
                    <Check size={20} color="#000" strokeWidth={3} />
                    <Text style={styles.finishBtnText}>Finish Workout</Text>
                </MotiPressable>
            </View>

            {/* ═══ Dialogs ═══ */}
            <AppModal
                visible={showFinishConfirm}
                onDismiss={() => setShowFinishConfirm(false)}
                title="Finish Workout?"
                body="Make sure all sets are logged before finishing."
                actions={[
                    { label: 'Finish', onPress: handleFinish, variant: 'primary' },
                    { label: 'Not Yet', onPress: () => setShowFinishConfirm(false), variant: 'secondary' },
                ]}
            />

            <AppModal
                visible={showEmptyWarning}
                onDismiss={() => setShowEmptyWarning(false)}
                title="No Sets Completed"
                body="Complete at least one set before finishing, or cancel the workout."
                actions={[
                    { label: 'Got it', onPress: () => setShowEmptyWarning(false), variant: 'primary' },
                ]}
            />

            <AppModal
                visible={!!exerciseToRemove}
                onDismiss={() => setExerciseToRemove(null)}
                title="Remove Exercise?"
                body="This will remove the exercise and all its logged sets."
                actions={[
                    { label: 'Keep', onPress: () => setExerciseToRemove(null), variant: 'primary' },
                    { label: 'Remove', onPress: confirmRemoveExercise, variant: 'destructive' },
                ]}
            />

            <AppModal
                visible={showCancelConfirm}
                onDismiss={() => setShowCancelConfirm(false)}
                title="Cancel Workout?"
                body="All logged data will be lost. This cannot be undone."
                actions={[
                    { label: 'Resume Workout', onPress: () => setShowCancelConfirm(false), variant: 'primary' },
                    { label: 'Discard', onPress: handleCancel, variant: 'destructive' },
                ]}
            />

            <AppModal
                visible={showExercisePicker}
                onDismiss={() => setShowExercisePicker(false)}
                title="Add Exercise"
                showClose
            >
                <FlatList
                    data={exercises}
                    keyExtractor={item => item.id}
                    style={{ maxHeight: 400 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleAddExercise(item)} style={styles.pickerItem}>
                            <Text style={styles.pickerName}>{item.name}</Text>
                            <Text style={styles.pickerSub}>{item.muscle_group}</Text>
                        </TouchableOpacity>
                    )}
                    ListFooterComponent={
                        exercises.length > 0 ? (
                            <View style={{ borderTopWidth: 1, borderTopColor: appColors.border, marginTop: 16 }}>
                                <TouchableOpacity
                                    onPress={() => { setShowExercisePicker(false); setShowCreateExercise(true); }}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 }}
                                >
                                    <Plus size={16} color={appColors.accent} />
                                    <Text style={{ color: appColors.accent, fontFamily: appFonts.bold, fontSize: 14 }}>Create New Exercise</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#888', marginBottom: 20, textAlign: 'center', fontSize: 13 }}>
                                No exercises created yet.
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setShowExercisePicker(false); setShowCreateExercise(true); }}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: appColors.accent, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 }}
                            >
                                <Plus size={16} color="#000" />
                                <Text style={{ color: '#000', fontFamily: appFonts.bold, fontSize: 14 }}>Create First Exercise</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </AppModal>

            <AppModal
                visible={showCreateExercise}
                onDismiss={() => setShowCreateExercise(false)}
                title="Create Exercise"
                actions={[
                    { label: 'Create & Add', onPress: handleCreateExercise, variant: 'primary', disabled: !newExName },
                    { label: 'Cancel', onPress: () => setShowCreateExercise(false), variant: 'secondary' },
                ]}
            >
                <TextInput label="Name" value={newExName} onChangeText={setNewExName} mode="outlined"
                    outlineColor={appColors.border} activeOutlineColor={appColors.accent}
                    textColor="#fff" style={{ backgroundColor: appColors.bg, marginBottom: 12 }}
                    outlineStyle={{ borderRadius: 10 }}
                />
                <Text style={{ color: '#888', fontSize: 11, marginBottom: 8, fontFamily: appFonts.bold }}>Muscle Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'].map(m => (
                        <Chip
                            key={m}
                            selected={newExMuscle === m}
                            onPress={() => setNewExMuscle(m)}
                            style={{ marginRight: 8 }}
                        >
                            {m}
                        </Chip>
                    ))}
                </ScrollView>
            </AppModal>

            <SmartSetsPrompt visible={showSmartPrompt} updates={smartUpdates}
                onAccept={async (id, n) => { await updateDefaultSets(id, n); setSmartUpdates(p => p.filter(u => u.exerciseId !== id)); }}
                onSkip={id => setSmartUpdates(p => p.filter(u => u.exerciseId !== id))}
                onClose={() => {
                    setShowSmartPrompt(false);
                    const summary = pendingSummaryRef.current;
                    clearWorkout();
                    if (summary) {
                        navigation.replace('WorkoutSummary', { workoutData: summary });
                    } else {
                        navigation.popToTop();
                    }
                }} />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ═══ Top Bar ═══
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: appColors.border,
        backgroundColor: appColors.cardBg,
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        minWidth: 56,
    },
    cancelText: {
        color: '#888',
        fontSize: 13,
        fontFamily: appFonts.semiBold,
    },
    timerWrap: {
        flex: 1,
        alignItems: 'center',
    },
    restBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: appColors.border,
        minWidth: 56,
        justifyContent: 'center',
    },
    restBtnText: {
        color: '#888',
        fontSize: 12,
        fontFamily: appFonts.bold,
    },
    restBtnActive: {
        borderColor: appColors.accent + '50',
        backgroundColor: appColors.accent + '10',
    },

    // ═══ Scroll ═══
    scrollContent: { padding: 20, paddingBottom: 120 },

    // ═══ Add Exercise ═══
    addExBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: appColors.border,
        borderStyle: 'dashed',
    },
    addExText: {
        color: appColors.accent,
        fontSize: 14,
        fontFamily: appFonts.bold,
    },

    // ═══ Footer ═══
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 30,
        backgroundColor: appColors.bg,
        borderTopWidth: 1,
        borderTopColor: appColors.border,
    },
    finishBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 56,
        borderRadius: 14,
        backgroundColor: appColors.accent,
    },
    finishBtnText: {
        color: '#000',
        fontSize: 16,
        fontFamily: appFonts.black,
        letterSpacing: 0.5,
    },



    // ═══ Exercise Picker ═══
    pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: appColors.border },
    pickerName: { ...appTypography.h2, color: '#fff', fontSize: 15, fontFamily: appFonts.bold },
    pickerSub: { ...appTypography.small, color: '#888', fontSize: 11, marginTop: 2, fontFamily: appFonts.semiBold },
});
