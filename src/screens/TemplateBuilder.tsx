import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Portal, Dialog, Button } from 'react-native-paper';
import { ArrowLeft, Plus, Layout, Trash2, Dumbbell, Play } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useTemplates } from '../hooks/useTemplates';
import { useExercises } from '../hooks/useExercises';
import { useWorkout } from '../hooks/useWorkout';
import { appColors, appFonts, appTypography } from '../theme';

export const TemplateBuilderScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { templateId, templateName } = route.params;
    const { fetchTemplateExercises, addExerciseToTemplate, removeExerciseFromTemplate } = useTemplates();
    const { startWorkout } = useWorkout();
    const { exercises } = useExercises();
    const [templateExercises, setTemplateExercises] = useState<any[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => { loadExercises(); }, []);

    const loadExercises = async () => { setTemplateExercises(await fetchTemplateExercises(templateId)); };
    const handleAdd = async (exerciseId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowPicker(false);
        await addExerciseToTemplate(templateId, exerciseId, templateExercises.length + 1);
        loadExercises();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Remove Exercise?",
            "Are you sure you want to remove this exercise from the template?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        await removeExerciseFromTemplate(id);
                        loadExercises();
                    }
                }
            ]
        );
    };

    const handleStart = async () => {
        if (templateExercises.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const result = await startWorkout(templateId, templateExercises);
        if (!result.error) navigation.navigate('ActiveWorkout');
    };

    const available = exercises.filter(e => !templateExercises.some(te => te.exercise_id === e.id));

    const renderRightActions = (id: string) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(id)}
        >
            <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{templateName?.toUpperCase()}</Text>
                    <Text style={styles.headerSub}>{templateExercises.length} Exercise{templateExercises.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPicker(true);
                    }}
                    style={styles.addBtn}
                >
                    <Plus size={22} color={appColors.accent} strokeWidth={3} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={templateExercises}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<View style={{ height: 12 }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Layout size={64} color={appColors.textTertiary} strokeWidth={1.5} />
                        <Text style={styles.emptyTitle}>Build Your Workout</Text>
                        <Text style={styles.emptySub}>Add exercises to get started</Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: index * 50 }}
                            style={styles.card}
                        >
                            <View style={styles.cardRow}>
                                <View style={styles.exIcon}>
                                    <Dumbbell size={18} color={appColors.textSecondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.exHeader}>
                                        <Text style={styles.exName}>{item.exercise?.name || 'Unknown'}</Text>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                                            <Trash2 size={16} color={appColors.textTertiary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.tagRow}>
                                        <View style={styles.tag}>
                                            <Text style={styles.tagText}>{item.exercise?.muscle_group || '—'}</Text>
                                        </View>
                                        <View style={styles.tag}>
                                            <Text style={styles.tagText}>{item.exercise?.default_sets || 3} Sets</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </MotiView>
                    </Swipeable>
                )}
                ListFooterComponent={
                    templateExercises.length > 0 ? (
                        <TouchableOpacity
                            style={styles.startBtn}
                            onPress={handleStart}
                            activeOpacity={0.8}
                        >
                            <Play size={20} color="#000" fill="#000" />
                            <Text style={styles.startBtnText}>START WORKOUT</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />

            <Portal>
                <Dialog visible={showPicker} onDismiss={() => setShowPicker(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Add Exercise</Dialog.Title>
                    <Dialog.Content>
                        <FlatList
                            data={available}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAdd(item.id)}
                                    style={styles.pickerItem}
                                >
                                    <Text style={styles.pickerName}>{item.name}</Text>
                                    <Text style={styles.pickerSub}>{item.muscle_group}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                    <Text style={{ color: appColors.textTertiary, marginBottom: 8, textAlign: 'center' }}>
                                        No exercises available
                                    </Text>
                                </View>
                            }
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPicker(false)} textColor={appColors.accent}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 8, paddingBottom: 12 },
    backBtn: { padding: 12 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 20, fontFamily: appFonts.black, letterSpacing: 1 },
    headerSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 13, marginTop: 2 },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: appColors.cardBg, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: appColors.border },
    list: { paddingHorizontal: 20, paddingBottom: 60 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { ...appTypography.h2, color: '#fff', marginTop: 16 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, marginTop: 6 },
    card: { marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.cardBg, padding: 14 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    exIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: appColors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 18, fontFamily: appFonts.bold, flex: 1 },
    tagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: appColors.border },
    tagText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 11, fontFamily: appFonts.bold },
    deleteAction: { backgroundColor: appColors.danger, justifyContent: 'center', alignItems: 'center', width: 70, borderRadius: 16, marginBottom: 12, marginLeft: 10 },
    startBtn: {
        marginTop: 32,
        backgroundColor: appColors.accent,
        paddingVertical: 18,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    startBtnText: { ...appTypography.h2, color: '#000', fontSize: 16, fontFamily: appFonts.black, letterSpacing: 1, marginLeft: 10 },
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 16, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8, fontSize: 22 },
    pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: appColors.border },
    pickerName: { ...appTypography.h2, color: '#fff', fontSize: 17 },
    pickerSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 12, marginTop: 4, fontFamily: appFonts.bold },
});
