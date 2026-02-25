import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal, Dialog, Button } from 'react-native-paper';
import { ArrowLeft, Plus, Layout, Trash2, Dumbbell, Play, MoreVertical, Clock, ListChecks } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useTemplates } from '../hooks/useTemplates';
import { useExercises } from '../hooks/useExercises';
import { useWorkout } from '../hooks/useWorkout';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

export const TemplateBuilderScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { templateId, templateName } = route.params;
    const { fetchTemplateExercises, addExerciseToTemplate, removeExerciseFromTemplate } = useTemplates();
    const { startWorkout } = useWorkout();
    const { exercises } = useExercises();
    const [templateExercises, setTemplateExercises] = useState<any[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => { loadExercises(); }, []);

    const loadExercises = async () => { setTemplateExercises(await fetchTemplateExercises(templateId)); };

    const handleAdd = async (exerciseId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowPicker(false);
        await addExerciseToTemplate(templateId, exerciseId, templateExercises.length + 1);
        loadExercises();
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await removeExerciseFromTemplate(deleteId);
        setDeleteId(null);
        loadExercises();
    };

    const handleStart = async () => {
        if (templateExercises.length === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const result = await startWorkout(templateId, templateExercises);
        if (!result.error) navigation.navigate('ActiveWorkout');
    };

    const available = exercises.filter(e => !templateExercises.some(te => te.exercise_id === e.id));

    // Estimated time: ~8 min per exercise (avg warm-up + sets + rest)
    const totalSets = templateExercises.reduce((acc: number, te: any) => acc + (te.exercise?.default_sets || 3), 0);
    const estMinLow = Math.max(15, Math.round(totalSets * 2.5));
    const estMinHigh = Math.round(totalSets * 3.5);

    const renderSwipeDelete = (id: string) => (
        <TouchableOpacity
            style={styles.swipeDelete}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setDeleteId(id);
            }}
        >
            <Trash2 size={20} color="#fff" />
        </TouchableOpacity>
    );

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{templateName?.toUpperCase()}</Text>
                    <Text style={styles.headerSub}>
                        {templateExercises.length} Exercise{templateExercises.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPicker(true);
                    }}
                    style={styles.addBtn}
                >
                    <Plus size={20} color={appColors.accent} strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {/* ═══ Contextual Info Bar ═══ */}
            {templateExercises.length > 0 && (
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.infoBar}
                >
                    <View style={styles.infoItem}>
                        <ListChecks size={13} color={appColors.textTertiary} />
                        <Text style={styles.infoText}>{totalSets} Sets</Text>
                    </View>
                    <View style={styles.infoDot} />
                    <View style={styles.infoItem}>
                        <Clock size={13} color={appColors.textTertiary} />
                        <Text style={styles.infoText}>~{estMinLow}–{estMinHigh} min</Text>
                    </View>
                </MotiView>
            )}

            {/* ═══ Exercise List ═══ */}
            <FlatList
                data={templateExercises}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Layout size={36} color={appColors.textTertiary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>Build Your Workout</Text>
                        <Text style={styles.emptySub}>Add exercises to create your training plan.</Text>
                        <MotiPressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setShowPicker(true);
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
                    </View>
                }
                renderItem={({ item, index }) => (
                    <MotiView
                        from={{ opacity: 0, translateY: 15 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300, delay: index * 60 }}
                    >
                        <Swipeable renderRightActions={() => renderSwipeDelete(item.id)}>
                            <MotiPressable
                                animate={({ pressed }) => {
                                    'worklet';
                                    return { scale: pressed ? 0.97 : 1 };
                                }}
                                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                style={styles.card}
                            >
                                <View style={styles.cardRow}>
                                    {/* Icon */}
                                    <View style={styles.exIcon}>
                                        <Dumbbell size={16} color={appColors.textSecondary} />
                                    </View>

                                    {/* Content */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.exName}>{item.exercise?.name || 'Unknown'}</Text>
                                        <View style={styles.tagRow}>
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{item.exercise?.muscle_group || '—'}</Text>
                                            </View>
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{item.exercise?.default_sets || 3} Sets</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Menu */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setMenuId(menuId === item.id ? null : item.id);
                                        }}
                                        style={styles.menuBtn}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MoreVertical size={16} color={appColors.textTertiary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Expandable menu */}
                                {menuId === item.id && (
                                    <MotiView
                                        from={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 42 }}
                                        transition={{ type: 'timing', duration: 180 }}
                                        style={styles.menuExpandable}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                setMenuId(null);
                                                setDeleteId(item.id);
                                            }}
                                            style={styles.menuDeleteAction}
                                        >
                                            <Trash2 size={13} color={appColors.danger} />
                                            <Text style={styles.menuDeleteText}>Remove Exercise</Text>
                                        </TouchableOpacity>
                                    </MotiView>
                                )}
                            </MotiPressable>
                        </Swipeable>
                    </MotiView>
                )}
            />

            {/* ═══ Sticky Start Button ═══ */}
            {templateExercises.length > 0 && (
                <View style={styles.stickyBottom}>
                    <MotiPressable
                        onPress={handleStart}
                        animate={({ pressed }) => {
                            'worklet';
                            return { scale: pressed ? 0.97 : 1 };
                        }}
                        style={styles.startBtn}
                    >
                        <Play size={18} color="#000" fill="#000" />
                        <Text style={styles.startBtnText}>START WORKOUT</Text>
                    </MotiPressable>
                </View>
            )}

            {/* ═══ Dialogs ═══ */}
            <Portal>
                {/* Add exercise picker */}
                <Dialog visible={showPicker} onDismiss={() => setShowPicker(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Add Exercise</Dialog.Title>
                    <Dialog.Content>
                        <FlatList
                            data={available}
                            keyExtractor={item => item.id}
                            style={{ maxHeight: 350 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAdd(item.id)}
                                    style={styles.pickerItem}
                                >
                                    <View style={styles.pickerRow}>
                                        <View style={styles.pickerIcon}>
                                            <Dumbbell size={14} color={appColors.textSecondary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.pickerName}>{item.name}</Text>
                                            <Text style={styles.pickerSub}>{item.muscle_group}</Text>
                                        </View>
                                        <Plus size={16} color={appColors.accent} />
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                    <Text style={{ color: appColors.textTertiary, textAlign: 'center' }}>
                                        No exercises available.{'\n'}Create one from the Exercises tab.
                                    </Text>
                                </View>
                            }
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowPicker(false)} textColor={appColors.textSecondary} labelStyle={{ fontFamily: appFonts.bold }}>Close</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Delete confirmation */}
                <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Remove Exercise?</Dialog.Title>
                    <Dialog.Content><Text style={styles.dialogText}>This exercise will be removed from the template.</Text></Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteId(null)} textColor={appColors.textSecondary} labelStyle={{ fontFamily: appFonts.bold }}>Cancel</Button>
                        <Button onPress={confirmDelete} textColor={appColors.danger} labelStyle={{ fontFamily: appFonts.bold }}>Remove</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },

    // ═══ Header ═══
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    backBtn: { padding: 12 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 22, fontFamily: appFonts.black, letterSpacing: 0.8 },
    headerSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 12, marginTop: 3 },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: appColors.accent + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: appColors.accent + '25',
    },

    // ═══ Info Bar ═══
    infoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 10,
        marginHorizontal: 20,
        marginBottom: 4,
        borderRadius: 10,
        backgroundColor: appColors.cardBg,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    infoText: { ...appTypography.small, color: appColors.textTertiary, fontSize: 11, fontFamily: appFonts.semiBold },
    infoDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: appColors.textTertiary, marginHorizontal: 10 },

    // ═══ List ═══
    list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

    // ═══ Exercise Card ═══
    card: {
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    exIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 17, fontFamily: appFonts.bold },
    tagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: appColors.border,
    },
    tagText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 11, fontFamily: appFonts.bold },

    // ═══ Menu ═══
    menuBtn: { padding: 6 },
    menuExpandable: {
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        overflow: 'hidden',
    },
    menuDeleteAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 11,
    },
    menuDeleteText: { ...appTypography.small, color: appColors.danger, fontSize: 12, fontFamily: appFonts.bold },

    // ═══ Swipe Delete ═══
    swipeDelete: {
        backgroundColor: appColors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 16,
        marginBottom: 10,
        marginLeft: 10,
    },

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

    // ═══ Sticky Start ═══
    stickyBottom: {
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
    startBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: appColors.accent,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    startBtnText: { ...appTypography.h2, color: '#000', fontSize: 15, fontFamily: appFonts.black, letterSpacing: 1 },

    // ═══ Dialog ═══
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 16, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8, fontSize: 20 },
    dialogText: { ...appTypography.body, color: appColors.textSecondary, lineHeight: 22 },
    pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: appColors.border },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pickerIcon: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerName: { ...appTypography.h2, color: '#fff', fontSize: 15 },
    pickerSub: { ...appTypography.small, color: appColors.textSecondary, fontSize: 11, marginTop: 2, fontFamily: appFonts.bold },
});
