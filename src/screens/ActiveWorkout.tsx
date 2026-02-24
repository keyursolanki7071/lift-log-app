import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Card, Button, TextInput, Portal, Dialog, Divider, ActivityIndicator, Chip, List } from 'react-native-paper';
import { Timer, Plus, CheckCircle, X, Check, Dumbbell } from 'lucide-react-native';
import { useWorkout } from '../hooks/useWorkout';
import { useExercises } from '../hooks/useExercises';
import { RestTimer } from '../components/RestTimer';
import { WorkoutTimer } from '../components/WorkoutTimer';
import { SmartSetsPrompt } from '../components/SmartSetsPrompt';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { MotiView, AnimatePresence } from 'moti';

export const ActiveWorkoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        session, activeExercises, isFinishing, loading: sessionLoading, updateSet, addSet, deleteSet,
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

    const getVal = (setId: string, field: 'weight' | 'reps', dbVal: number | null) => {
        if (localSets[setId]?.[field] !== undefined) return localSets[setId][field];
        return dbVal !== null ? String(dbVal) : '';
    };

    const handleChange = (setId: string, field: 'weight' | 'reps', value: string) => {
        setLocalSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: value } }));
        const numVal = value === '' ? null : parseFloat(value);
        const cur = localSets[setId] || {};
        const w = field === 'weight' ? numVal : (cur.weight ? parseFloat(cur.weight) : null);
        const r = field === 'reps' ? numVal : (cur.reps ? parseFloat(cur.reps) : null);
        updateSet(setId, w, r);
    };

    const handleComplete = (setId: string) => {
        setCompletedSets(prev => {
            const next = new Set(prev);
            if (next.has(setId)) next.delete(setId);
            else { next.add(setId); setRestAutoStart(true); setShowRestTimer(true); }
            return next;
        });
    };

    const handleDelete = async (seId: string, setId: string) => {
        await deleteSet(seId, setId);
        setLocalSets(prev => { const n = { ...prev }; delete n[setId]; return n; });
        setCompletedSets(prev => { const n = new Set(prev); n.delete(setId); return n; });
    };

    const handleFinish = async () => {
        setShowFinishConfirm(false);
        const mins = Math.round((Date.now() - startTime.getTime()) / 60000);
        const result = await finishWorkout(mins);
        if (result.smartUpdates && result.smartUpdates.length > 0) {
            setSmartUpdates(result.smartUpdates);
            setShowSmartPrompt(true);
        } else { navigation.popToTop(); clearWorkout(); }
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

    if (isFinishing && !showSmartPrompt) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={appColors.accent} />
                <Text style={{ color: appColors.textSecondary, marginTop: 16, fontSize: 15 }}>Saving workout...</Text>
            </View>
        );
    }

    if (!session) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>No active workout</Text>
                <Button mode="text" onPress={() => navigation.popToTop()} textColor={appColors.accent} style={{ marginTop: 12 }}>Go Back</Button>
            </View>
        );
    }

    return (
        <AnimatedScreen style={styles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setShowCancelConfirm(true)} style={styles.cancelLink}>
                    <Text style={{ color: appColors.danger, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <WorkoutTimer startTime={startTime} />
                <Button
                    mode="outlined"
                    onPress={() => { setRestAutoStart(false); setShowRestTimer(prev => !prev); }}
                    style={styles.restBtn}
                    textColor={appColors.textSecondary}
                    icon={() => <Timer size={18} color={appColors.textSecondary} />}
                    compact
                >
                    Rest
                </Button>
            </View>

            {showRestTimer && (
                <RestTimer onClose={() => { setShowRestTimer(false); setRestAutoStart(false); }} autoStart={restAutoStart} />
            )}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                {activeExercises.map((ex, index) => (
                    <AnimatedListItem key={ex.id} index={index}>
                        <Card style={styles.exerciseCard} mode="contained">
                            <Card.Content>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <View style={{ flex: 1, marginRight: 12 }}>
                                        <Text style={styles.exerciseName} numberOfLines={1}>{ex.exerciseName}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeExerciseFromSession(ex.id)}
                                        style={{ padding: 4 }}
                                    >
                                        <X size={20} color={appColors.textTertiary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.headerRow}>
                                    <Text style={[styles.colHeader, { width: 36 }]}>SET</Text>
                                    <Text style={[styles.colHeader, { flex: 1 }]}>KG</Text>
                                    <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                                    <View style={{ width: 76 }} />
                                </View>
                                <Divider style={{ backgroundColor: appColors.border, marginBottom: 8 }} />

                                <AnimatePresence>
                                    {ex.sets.sort((a, b) => a.set_number - b.set_number).map((set) => {
                                        const done = completedSets.has(set.id);
                                        return (
                                            <MotiView
                                                key={set.id}
                                                from={{ opacity: 0, scale: 0.9, translateY: -10 }}
                                                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, translateY: -10 }}
                                                transition={{ type: 'timing', duration: 300 }}
                                                style={[styles.setRow, done && styles.setDone]}
                                            >
                                                <View style={[styles.setNum, done && { backgroundColor: appColors.success }]}>
                                                    <Text style={{ fontSize: 14, fontWeight: '800', color: done ? '#000' : appColors.textSecondary }}>
                                                        {set.set_number}
                                                    </Text>
                                                </View>
                                                <TextInput style={styles.setInput} mode="outlined" dense keyboardType="numeric"
                                                    value={getVal(set.id, 'weight', set.weight)} onChangeText={v => handleChange(set.id, 'weight', v)}
                                                    placeholder="0" disabled={done} outlineStyle={styles.inputOutline}
                                                    outlineColor={appColors.border} activeOutlineColor={appColors.accent} textColor="#fff" />
                                                <TextInput style={styles.setInput} mode="outlined" dense keyboardType="numeric"
                                                    value={getVal(set.id, 'reps', set.reps)} onChangeText={v => handleChange(set.id, 'reps', v)}
                                                    placeholder="0" disabled={done} outlineStyle={styles.inputOutline}
                                                    outlineColor={appColors.border} activeOutlineColor={appColors.accent} textColor="#fff" />
                                                <View style={styles.setActions}>
                                                    <TouchableOpacity onPress={() => handleComplete(set.id)} style={{ padding: 8 }}>
                                                        {done ? (
                                                            <CheckCircle size={24} color={appColors.success} fill={appColors.success + '20'} />
                                                        ) : (
                                                            <CheckCircle size={24} color={appColors.textTertiary} />
                                                        )}
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDelete(ex.id, set.id)} disabled={done} style={{ padding: 8 }}>
                                                        <X size={18} color={done ? appColors.textTertiary : appColors.danger} />
                                                    </TouchableOpacity>
                                                </View>
                                            </MotiView>
                                        );
                                    })}
                                </AnimatePresence>

                                <Button
                                    mode="text"
                                    onPress={() => addSet(ex.id)}
                                    textColor={appColors.accent}
                                    compact
                                    style={{ marginTop: 6 }}
                                    labelStyle={{ fontSize: 14, fontWeight: '700' }}
                                    icon={() => <Plus size={18} color={appColors.accent} strokeWidth={3} />}
                                >
                                    Add Set
                                </Button>
                            </Card.Content>
                        </Card>
                    </AnimatedListItem>
                ))}

                <Button
                    mode="outlined"
                    onPress={() => setShowExercisePicker(true)}
                    textColor={appColors.accent}
                    style={{ marginTop: 8, borderColor: appColors.border, borderStyle: 'dashed' }}
                    icon={() => <Plus size={20} color={appColors.accent} />}
                >
                    Add Exercise
                </Button>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={() => setShowFinishConfirm(true)}
                    buttonColor={appColors.accent}
                    textColor="#000"
                    style={{ borderRadius: 8 }}
                    contentStyle={{ height: 56 }}
                    labelStyle={{ fontSize: 16, fontWeight: '900', letterSpacing: 1 }}
                    icon={() => <Check size={20} color="#000" strokeWidth={3} />}
                >
                    Finish Workout
                </Button>
            </View>

            <Portal>
                <Dialog visible={showFinishConfirm} onDismiss={() => setShowFinishConfirm(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Finish Workout?</Dialog.Title>
                    <Dialog.Content><Text style={styles.dialogText}>Make sure all sets are logged.</Text></Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowFinishConfirm(false)} textColor={appColors.textSecondary}>Close</Button>
                        <Button onPress={handleFinish} textColor={appColors.accent}>Finish</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={showCancelConfirm} onDismiss={() => setShowCancelConfirm(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Cancel Workout?</Dialog.Title>
                    <Dialog.Content><Text style={styles.dialogText}>This will delete the current session and all logged data. This cannot be undone.</Text></Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCancelConfirm(false)} textColor={appColors.textSecondary}>No, Resume</Button>
                        <Button onPress={handleCancel} textColor={appColors.danger}>Yes, Cancel</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={showExercisePicker} onDismiss={() => setShowExercisePicker(false)} style={[styles.dialog, { maxHeight: '80%' }]}>
                    <Dialog.Title style={styles.dialogTitle}>Add Exercise</Dialog.Title>
                    <Dialog.Content>
                        <FlatList
                            data={exercises}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAddExercise(item)}
                                    style={styles.pickerItem}
                                >
                                    <Text style={styles.pickerName}>{item.name}</Text>
                                    <Text style={styles.pickerSub}>{item.muscle_group}</Text>
                                </TouchableOpacity>
                            )}
                            ListFooterComponent={
                                exercises.length > 0 ? (
                                    <View style={{ borderTopWidth: 1, borderTopColor: appColors.border, marginTop: 16 }}>
                                        <Button
                                            mode="text"
                                            onPress={() => {
                                                setShowExercisePicker(false);
                                                setShowCreateExercise(true);
                                            }}
                                            textColor={appColors.accent}
                                            style={{ marginTop: 12 }}
                                            labelStyle={{ fontWeight: '800' }}
                                            icon={() => <Plus size={18} color={appColors.accent} />}
                                        >
                                            Create New Exercise
                                        </Button>
                                    </View>
                                ) : null
                            }
                            ListEmptyComponent={
                                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                    <Text style={{ color: appColors.textTertiary, marginBottom: 20, textAlign: 'center' }}>
                                        You haven't created any exercises yet.
                                    </Text>
                                    <Button
                                        mode="contained"
                                        onPress={() => {
                                            setShowExercisePicker(false);
                                            setShowCreateExercise(true);
                                        }}
                                        buttonColor={appColors.accent}
                                        textColor="#000"
                                        style={{ borderRadius: 8, width: '100%' }}
                                        labelStyle={{ fontWeight: '900' }}
                                        icon={() => <Plus size={18} color="#000" />}
                                    >
                                        Create First Exercise
                                    </Button>
                                </View>
                            }
                        />
                    </Dialog.Content>
                </Dialog>

                <Dialog visible={showCreateExercise} onDismiss={() => setShowCreateExercise(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Create Exercise</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Name" value={newExName} onChangeText={setNewExName} mode="outlined" />
                        <View style={{ marginTop: 12 }}>
                            <Text style={{ color: appColors.textTertiary, fontSize: 12, marginBottom: 8 }}>Muscle Group</Text>
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
                        <Button onPress={() => setShowCreateExercise(false)}>Cancel</Button>
                        <Button onPress={handleCreateExercise} disabled={!newExName}>Create & Add</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <SmartSetsPrompt visible={showSmartPrompt} updates={smartUpdates}
                onAccept={async (id, n) => { await updateDefaultSets(id, n); setSmartUpdates(p => p.filter(u => u.exerciseId !== id)); }}
                onSkip={id => setSmartUpdates(p => p.filter(u => u.exerciseId !== id))}
                onClose={() => { setShowSmartPrompt(false); navigation.popToTop(); clearWorkout(); }} />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: appColors.border, backgroundColor: appColors.cardBg },
    cancelLink: { paddingRight: 10, minWidth: 60 },
    restBtn: { borderRadius: 8, borderColor: appColors.border },
    scrollContent: { padding: 20, paddingBottom: 130 },
    exerciseCard: { marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.cardBg },
    exerciseName: { ...appTypography.h1, color: '#fff', fontSize: 26, marginBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    colHeader: { ...appTypography.small, color: appColors.textSecondary, textAlign: 'center', letterSpacing: 1.5, fontSize: 11 },
    setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6 },
    setDone: { backgroundColor: appColors.accent + '15' },
    setNum: { width: 36, height: 36, borderRadius: 8, backgroundColor: appColors.inputBg, justifyContent: 'center', alignItems: 'center' },
    setInput: { ...appTypography.body, flex: 1, height: 56, textAlign: 'center', backgroundColor: appColors.bg, fontSize: 18, fontFamily: appFonts.bold },
    inputOutline: { borderRadius: 6 },
    setActions: { flexDirection: 'row', width: 76, justifyContent: 'flex-end' },
    pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: appColors.border },
    pickerName: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    pickerSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 12, marginTop: 2, fontFamily: appFonts.bold },
    footer: { padding: 20, paddingBottom: 32 },
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 12, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8, fontSize: 22 },
    dialogText: { ...appTypography.body, color: appColors.textSecondary, lineHeight: 22 },
});
