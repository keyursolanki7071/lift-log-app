import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Button, TextInput, Portal, Dialog, Chip, ActivityIndicator } from 'react-native-paper';
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
            <Portal>
                {/* Finish Confirm */}
                <Dialog visible={showFinishConfirm} onDismiss={() => setShowFinishConfirm(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Finish Workout?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>Make sure all sets are logged before finishing.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowFinishConfirm(false)} textColor="#888">Not Yet</Button>
                        <Button onPress={handleFinish} textColor={appColors.accent}>Finish</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Empty Warning */}
                <Dialog visible={showEmptyWarning} onDismiss={() => setShowEmptyWarning(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>No Sets Completed</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>Complete at least one set before finishing, or cancel the workout.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowEmptyWarning(false)} textColor={appColors.accent}>Got it</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Remove Exercise */}
                <Dialog visible={!!exerciseToRemove} onDismiss={() => setExerciseToRemove(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Remove Exercise?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>This will remove the exercise and all its logged sets.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setExerciseToRemove(null)} textColor="#888">Keep</Button>
                        <Button onPress={confirmRemoveExercise} textColor={appColors.danger}>Remove</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Cancel Confirm */}
                <Dialog visible={showCancelConfirm} onDismiss={() => setShowCancelConfirm(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Cancel Workout?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>All logged data will be lost. This cannot be undone.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCancelConfirm(false)} textColor="#888">Resume</Button>
                        <Button onPress={handleCancel} textColor={appColors.danger}>Discard</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Exercise Picker */}
                <Dialog visible={showExercisePicker} onDismiss={() => setShowExercisePicker(false)} style={[styles.dialog, { maxHeight: '80%' }]}>
                    <Dialog.Title style={styles.dialogTitle}>Add Exercise</Dialog.Title>
                    <Dialog.Content>
                        <FlatList
                            data={exercises}
                            keyExtractor={item => item.id}
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
                    </Dialog.Content>
                </Dialog>

                {/* Create Exercise */}
                <Dialog visible={showCreateExercise} onDismiss={() => setShowCreateExercise(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Create Exercise</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Name" value={newExName} onChangeText={setNewExName} mode="outlined" />
                        <View style={{ marginTop: 12 }}>
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
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCreateExercise(false)} textColor="#888">Cancel</Button>
                        <Button onPress={handleCreateExercise} disabled={!newExName} textColor={appColors.accent}>Create & Add</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

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

    // ═══ Dialogs ═══
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 16, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8, fontSize: 20, fontFamily: appFonts.bold },
    dialogText: { ...appTypography.body, color: '#888', lineHeight: 22, fontSize: 13 },

    // ═══ Exercise Picker ═══
    pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: appColors.border },
    pickerName: { ...appTypography.h2, color: '#fff', fontSize: 15, fontFamily: appFonts.bold },
    pickerSub: { ...appTypography.small, color: '#888', fontSize: 11, marginTop: 2, fontFamily: appFonts.semiBold },
});
