import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, FAB, Portal, Dialog, Button } from 'react-native-paper';
import { Trash2, Plus, Dumbbell } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { ExerciseModal } from '../components/ExerciseModal';
import { appColors, appFonts, appTypography } from '../theme';

export const ExercisesScreen: React.FC = () => {
    const { exercises, createExercise, updateExercise, deleteExercise } = useExercises();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExercise, setEditingExercise] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleSave = async (name: string, category: string, defaultSets: number) => {
        if (editingExercise) await updateExercise(editingExercise.id, { name, muscle_group: category, default_sets: defaultSets });
        else await createExercise(name, category, defaultSets);
        setModalVisible(false); setEditingExercise(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Exercises</Text>
                <Text style={styles.count}>{exercises.length} available</Text>
            </View>

            <FlatList data={exercises} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => { setEditingExercise(item); setModalVisible(true); }}
                        style={styles.card}
                    >
                        <View style={styles.iconBox}>
                            <Dumbbell size={20} color={appColors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.exerciseName}>{item.name}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.muscleBadge}>
                                    <Text style={styles.muscleText}>{item.muscle_group}</Text>
                                </View>
                                <View style={styles.setsBadge}>
                                    <Text style={styles.setsText}>{item.default_sets} sets</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setDeleteId(item.id)} style={styles.deleteBtn}>
                            <Trash2 size={20} color={appColors.danger} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )} />

            <FAB
                visible
                icon={() => <Plus size={24} color="#000" strokeWidth={3} />}
                onPress={() => { setEditingExercise(null); setModalVisible(true); }}
                style={styles.fab}
                color="#000"
            />

            <ExerciseModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditingExercise(null); }}
                onSave={handleSave} title={editingExercise ? 'Edit Exercise' : 'New Exercise'}
                initialName={editingExercise?.name} initialCategory={editingExercise?.muscle_group}
                initialDefaultSets={editingExercise?.default_sets} />

            <Portal>
                <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Delete Exercise?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogText}>This will permanently remove this exercise from your library.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteId(null)} textColor={appColors.textSecondary}>Cancel</Button>
                        <Button onPress={async () => { if (deleteId) { await deleteExercise(deleteId); setDeleteId(null); } }} textColor={appColors.danger}>Delete</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 32 },
    count: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: appColors.border
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    exerciseName: { ...appTypography.h2, color: '#fff', fontSize: 16, marginBottom: 6 },
    badgeRow: { flexDirection: 'row', gap: 6 },
    muscleBadge: { backgroundColor: appColors.accent + '1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    muscleText: { ...appTypography.small, color: appColors.accent, fontSize: 11, fontFamily: appFonts.black, textTransform: 'uppercase' },
    setsBadge: { backgroundColor: appColors.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    setsText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 10, fontFamily: appFonts.bold, textTransform: 'uppercase' },
    deleteBtn: { padding: 8 },

    fab: { position: 'absolute', right: 20, bottom: 28, borderRadius: 16, backgroundColor: appColors.accent, elevation: 4 },
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 12, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8 },
    dialogText: { ...appTypography.body, color: appColors.textSecondary, lineHeight: 22 },
});
