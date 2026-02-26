import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { AppModal } from '../components/AppModal';
import { Search, Plus, Dumbbell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useExercises } from '../hooks/useExercises';
import { ExerciseModal } from '../components/ExerciseModal';
import { ExerciseItem } from '../components/ExerciseItem';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { useErrorToast } from '../components/ErrorToast';

const FILTER_ALL = 'All';

export const ExercisesScreen: React.FC = () => {
    const { exercises, createExercise, updateExercise, deleteExercise } = useExercises();
    const { showError } = useErrorToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExercise, setEditingExercise] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Unique muscle groups for filter chips
    const muscleGroups = useMemo(() => {
        const groups = new Set(exercises.map(e => e.muscle_group).filter(Boolean));
        return [FILTER_ALL, ...Array.from(groups).sort()];
    }, [exercises]);

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch =
                ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === FILTER_ALL || ex.muscle_group === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [exercises, searchQuery, activeFilter]);

    const handleSave = async (name: string, category: string, defaultSets: number) => {
        let result;
        if (editingExercise) result = await updateExercise(editingExercise.id, { name, muscle_group: category, default_sets: defaultSets });
        else result = await createExercise(name, category, defaultSets);
        if (result?.error) { showError(result.error); return; }
        setModalVisible(false); setEditingExercise(null);
    };

    const handleEdit = React.useCallback((item: any) => {
        setEditingExercise(item);
        setModalVisible(true);
    }, []);

    const handleDeletePress = React.useCallback((id: string) => {
        setDeleteId(id);
    }, []);

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <Text style={styles.title}>Exercises</Text>
                <Text style={styles.subtitle}>Manage your training movements</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={16} color={appColors.textTertiary} style={{ marginLeft: 14 }} />
                    <TextInput
                        placeholder="Search exercises..."
                        placeholderTextColor={appColors.textTertiary}
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchInput}
                    />
                </View>

                {/* Filter Chips */}
                {muscleGroups.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRow}
                    >
                        {muscleGroups.map(group => {
                            const isActive = group === activeFilter;
                            return (
                                <MotiPressable
                                    key={group}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveFilter(group);
                                    }}
                                    animate={({ pressed }) => {
                                        'worklet';
                                        return { scale: pressed ? 0.93 : 1 };
                                    }}
                                    style={[
                                        styles.chip,
                                        isActive && styles.chipActive,
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        isActive && styles.chipTextActive,
                                    ]}>
                                        {group}
                                    </Text>
                                </MotiPressable>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {/* ═══ Exercise List ═══ */}
            <FlatList
                data={filteredExercises}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Dumbbell size={36} color={appColors.textTertiary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery || activeFilter !== FILTER_ALL ? 'No matches found' : 'No exercises yet'}
                        </Text>
                        <Text style={styles.emptySub}>
                            {searchQuery || activeFilter !== FILTER_ALL
                                ? 'Try adjusting your search or filters.'
                                : 'Add your first movement to start building workouts.'}
                        </Text>
                        {!searchQuery && activeFilter === FILTER_ALL && (
                            <MotiPressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setEditingExercise(null);
                                    setModalVisible(true);
                                }}
                                animate={({ pressed }) => {
                                    'worklet';
                                    return { scale: pressed ? 0.95 : 1 };
                                }}
                                style={styles.emptyBtn}
                            >
                                <Plus size={18} color="#000" strokeWidth={3} />
                                <Text style={styles.emptyBtnText}>Add Exercise</Text>
                            </MotiPressable>
                        )}
                    </View>
                }
                renderItem={({ item, index }) => (
                    <ExerciseItem
                        item={item}
                        index={index}
                        onPress={handleEdit}
                        onDelete={handleDeletePress}
                    />
                )}
            />

            {/* ═══ Bottom CTA ═══ */}
            {exercises.length > 0 && (
                <View style={styles.bottomBar}>
                    <MotiPressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setEditingExercise(null);
                            setModalVisible(true);
                        }}
                        animate={({ pressed }) => {
                            'worklet';
                            return { scale: pressed ? 0.97 : 1 };
                        }}
                        style={styles.bottomBtn}
                    >
                        <Plus size={18} color="#000" strokeWidth={3} />
                        <Text style={styles.bottomBtnText}>ADD EXERCISE</Text>
                    </MotiPressable>
                </View>
            )}

            {/* ═══ Modals ═══ */}
            <ExerciseModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditingExercise(null); }}
                onSave={handleSave}
                title={editingExercise ? 'Edit Exercise' : 'New Exercise'}
                initialName={editingExercise?.name}
                initialCategory={editingExercise?.muscle_group}
                initialDefaultSets={editingExercise?.default_sets}
            />

            <AppModal
                visible={!!deleteId}
                onDismiss={() => setDeleteId(null)}
                title="Delete Exercise?"
                body="This will permanently remove this exercise from your library."
                actions={[
                    { label: 'Cancel', onPress: () => setDeleteId(null), variant: 'secondary' },
                    { label: 'Delete', onPress: async () => { if (deleteId) { await deleteExercise(deleteId); setDeleteId(null); } }, variant: 'destructive' },
                ]}
            />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },

    // ═══ Header ═══
    header: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: appColors.bg,
        borderBottomWidth: 1,
        borderBottomColor: appColors.border,
    },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    subtitle: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4, letterSpacing: 0.3, marginBottom: 20 },

    // ═══ Search ═══
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: appColors.border,
        height: 48,
    },
    searchInput: {
        flex: 1,
        ...appTypography.body,
        fontSize: 14,
        color: '#fff',
        fontFamily: appFonts.regular,
        paddingHorizontal: 10,
        paddingVertical: 0,
        height: 48,
    },

    // ═══ Filter Chips ═══
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 14, paddingBottom: 2 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: 'transparent',
    },
    chipActive: {
        backgroundColor: appColors.accent + '18',
        borderColor: appColors.accent + '40',
    },
    chipText: { ...appTypography.small, fontSize: 12, color: appColors.textTertiary, fontFamily: appFonts.bold },
    chipTextActive: { color: appColors.accent },

    // ═══ List ═══
    list: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 },

    // ═══ Empty State ═══
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: appColors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 18,
    },
    emptyTitle: { ...appTypography.h2, color: '#fff', fontSize: 18 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        backgroundColor: appColors.accent,
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 12,
    },
    emptyBtnText: { ...appTypography.h2, color: '#000', fontSize: 14, fontFamily: appFonts.black },

    // ═══ Bottom Button ═══
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 32,
        backgroundColor: appColors.bg,
        borderTopWidth: 1,
        borderTopColor: appColors.border,
    },
    bottomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: appColors.accent,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    bottomBtnText: { ...appTypography.h2, color: '#000', fontSize: 14, fontFamily: appFonts.black, letterSpacing: 1 },

});
