import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { AppModal } from '../components/AppModal';
import { ClipboardList, Plus, ChevronRight, MoreVertical, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useTemplates } from '../hooks/useTemplates';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

export const TemplateListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { templates, createTemplate, deleteTemplate } = useTemplates();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [menuId, setMenuId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const result = await createTemplate(newName.trim());
        setShowCreate(false); setNewName('');
        if (result && !result.error && result.data) {
            navigation.navigate('TemplateBuilder', { templateId: result.data.id, templateName: result.data.name });
        }
    };

    const formatLastDone = (date: string | null | undefined) => {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 0) return 'Just now';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
        return `${Math.floor(diff / 30)}mo ago`;
    };

    const WorkoutCard = ({ item, index }: { item: any; index: number }) => {
        const isMenuOpen = menuId === item.id;

        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350, delay: index * 80 }}
            >
                <MotiPressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('TemplateBuilder', { templateId: item.id, templateName: item.name });
                    }}
                    animate={({ pressed }) => {
                        'worklet';
                        return {
                            scale: pressed ? 0.97 : 1,
                        };
                    }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    style={styles.card}
                >
                    <View style={styles.cardContent}>
                        {/* Card Body */}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardName}>{item.name}</Text>
                            <Text style={styles.cardExCount}>
                                {item.exercise_count || 0} Exercise{item.exercise_count !== 1 ? 's' : ''}
                            </Text>
                            <Text style={styles.cardLastTrained}>
                                Last trained: {formatLastDone(item.last_session_date)}
                            </Text>
                        </View>

                        {/* Right side: menu + arrow */}
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation?.();
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setMenuId(isMenuOpen ? null : item.id);
                                }}
                                style={styles.menuBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <MoreVertical size={18} color={appColors.textTertiary} />
                            </TouchableOpacity>
                            <ChevronRight size={16} color={appColors.borderLight} />
                        </View>
                    </View>

                    {/* Expandable delete action */}
                    {isMenuOpen && (
                        <MotiView
                            from={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 44 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'timing', duration: 200 }}
                            style={styles.menuOverlay}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setMenuId(null);
                                    setDeleteId(item.id);
                                }}
                                style={styles.deleteAction}
                            >
                                <Trash2 size={14} color={appColors.danger} />
                                <Text style={styles.deleteActionText}>Delete Workout</Text>
                            </TouchableOpacity>
                        </MotiView>
                    )}
                </MotiPressable>
            </MotiView>
        );
    };

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <Text style={styles.title}>Workouts</Text>
                <Text style={styles.headerSub}>Stay consistent. Progress weekly.</Text>
            </View>

            {/* ═══ Card List ═══ */}
            <FlatList
                data={templates}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    templates.length > 0 ? (
                        <Text style={styles.sectionLabel}>YOUR TEMPLATES</Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <ClipboardList size={40} color={appColors.textTertiary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptySub}>Create your first template to start training.</Text>
                        <MotiPressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setShowCreate(true);
                            }}
                            animate={({ pressed }) => {
                                'worklet';
                                return { scale: pressed ? 0.95 : 1 };
                            }}
                            style={styles.emptyBtn}
                        >
                            <Plus size={18} color="#000" strokeWidth={3} />
                            <Text style={styles.emptyBtnText}>Create Workout</Text>
                        </MotiPressable>
                    </View>
                }
                renderItem={({ item, index }) => <WorkoutCard item={item} index={index} />}
            />

            {/* ═══ Bottom CTA (full-width) ═══ */}
            {templates.length > 0 && (
                <View style={styles.bottomBar}>
                    <MotiPressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setShowCreate(true);
                        }}
                        animate={({ pressed }) => {
                            'worklet';
                            return { scale: pressed ? 0.97 : 1 };
                        }}
                        style={styles.bottomBtn}
                    >
                        <Plus size={18} color="#000" strokeWidth={3} />
                        <Text style={styles.bottomBtnText}>NEW WORKOUT</Text>
                    </MotiPressable>
                </View>
            )}

            {/* ═══ Dialogs ═══ */}
            <AppModal
                visible={showCreate}
                onDismiss={() => setShowCreate(false)}
                title="New Workout"
                actions={[
                    { label: 'Create', onPress: handleCreate, variant: 'primary', disabled: !newName.trim() },
                    { label: 'Cancel', onPress: () => setShowCreate(false), variant: 'secondary' },
                ]}
            >
                <TextInput label="Workout name" value={newName} onChangeText={setNewName} mode="outlined" autoFocus
                    outlineColor={appColors.border} activeOutlineColor={appColors.accent}
                    style={{ backgroundColor: appColors.bg }} textColor="#fff"
                    outlineStyle={{ borderRadius: 10 }}
                />
            </AppModal>

            <AppModal
                visible={!!deleteId}
                onDismiss={() => setDeleteId(null)}
                title="Delete Template?"
                body="This action cannot be undone. All exercise configurations for this template will be removed."
                actions={[
                    { label: 'Cancel', onPress: () => setDeleteId(null), variant: 'secondary' },
                    { label: 'Delete', onPress: async () => { if (deleteId) { await deleteTemplate(deleteId); setDeleteId(null); } }, variant: 'destructive' },
                ]}
            />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },

    // ═══ Header ═══
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    headerSub: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4, letterSpacing: 0.3 },

    // ═══ Section Label ═══
    sectionLabel: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontFamily: appFonts.bold,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 14,
    },

    // ═══ List ═══
    list: { paddingHorizontal: 20, paddingBottom: 120 },

    // ═══ Card ═══
    card: {
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        overflow: 'hidden',
        // Subtle depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
    },
    cardName: {
        ...appTypography.h2,
        color: '#fff',
        fontSize: 18,
        fontFamily: appFonts.bold,
    },
    cardExCount: {
        ...appTypography.body,
        color: appColors.textSecondary,
        fontSize: 13,
        marginTop: 6,
        fontFamily: appFonts.semiBold,
    },
    cardLastTrained: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 11,
        marginTop: 4,
    },
    cardActions: {
        alignItems: 'center',
        gap: 10,
    },

    // ═══ Menu ═══
    menuBtn: {
        padding: 6,
        borderRadius: 8,
    },
    menuOverlay: {
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        overflow: 'hidden',
    },
    deleteAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    deleteActionText: {
        ...appTypography.small,
        color: appColors.danger,
        fontFamily: appFonts.bold,
        fontSize: 12,
    },

    // ═══ Empty State ═══
    empty: { alignItems: 'center', paddingTop: 100 },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: appColors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 20,
    },
    emptyTitle: { ...appTypography.h2, color: '#fff', fontSize: 20 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 28,
        backgroundColor: appColors.accent,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    emptyBtnText: { ...appTypography.h2, color: '#000', fontSize: 14, fontFamily: appFonts.black, letterSpacing: 0.5 },

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
        // Glow
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    bottomBtnText: { ...appTypography.h2, color: '#000', fontSize: 14, fontFamily: appFonts.black, letterSpacing: 1 },

});
