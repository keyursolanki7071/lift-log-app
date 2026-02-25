import React, { useState, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { AppModal } from '../components/AppModal';
import { ChevronDown, Dumbbell, Clock, Activity, Trash2, Trophy } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkout } from '../hooks/useWorkout';
import { appColors, appFonts, appTypography } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedScreen } from '../components/AnimatedScreen';

interface SessionItem {
    id: string; date: string; status: string; duration_minutes: number | null;
    template_id: string; templateName: string; exerciseCount: number;
}

export const WorkoutHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const { deleteSession } = useWorkout();
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [expandedData, setExpandedData] = useState<Record<string, any[]>>({});
    const [expandedVolume, setExpandedVolume] = useState<Record<string, number>>({});
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase.from('workout_sessions')
            .select('id, date, status, duration_minutes, template_id, template:workout_templates(name), session_exercises(id, exercise:exercises(name))')
            .eq('user_id', user.id).eq('status', 'completed').order('date', { ascending: false }).limit(50);

        if (data) setSessions(data.map((s: any) => {
            const fallbackName = s.session_exercises?.[0]?.exercise?.name
                ? `${s.session_exercises[0].exercise.name} Session`
                : 'Untitled';
            return {
                id: s.id, date: s.date, status: s.status, duration_minutes: s.duration_minutes,
                template_id: s.template_id, templateName: s.template?.name || fallbackName,
                exerciseCount: s.session_exercises?.length || 0,
            };
        }));
        setLoading(false);
    }, [user]);

    useFocusEffect(useCallback(() => { fetchSessions(); }, [fetchSessions]));

    const toggleExpand = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        if (!expandedData[id]) {
            const { data } = await supabase.from('session_exercises')
                .select('id, exercise:exercises(name, muscle_group), sets(weight, reps, set_number)')
                .eq('workout_session_id', id).order('created_at');
            if (data) {
                let totalVol = 0;
                const mapped = data.map((se: any) => {
                    const sets = (se.sets || []).sort((a: any, b: any) => a.set_number - b.set_number);
                    sets.forEach((s: any) => { totalVol += (s.weight || 0) * (s.reps || 0); });
                    return {
                        name: se.exercise?.name || 'Unknown',
                        muscleGroup: se.exercise?.muscle_group || '',
                        sets,
                    };
                });
                setExpandedData(prev => ({ ...prev, [id]: mapped }));
                setExpandedVolume(prev => ({ ...prev, [id]: totalVol }));
            }
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const { error } = await deleteSession(deleteId);
        if (!error) {
            setSessions(prev => prev.filter(s => s.id !== deleteId));
            setDeleteId(null);
        } else {
            Alert.alert('Error', error);
        }
    };

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

    // ═══ Date helpers ═══
    const fmtDur = (m: number | null) => !m ? '—' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;

    const getDateGroup = (d: string) => {
        const dt = new Date(d), now = new Date(), yd = new Date();
        yd.setDate(yd.getDate() - 1);
        if (dt.toDateString() === now.toDateString()) return 'TODAY';
        if (dt.toDateString() === yd.toDateString()) return 'YESTERDAY';
        const diffDays = Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) return 'THIS WEEK';
        if (diffDays < 30) return 'THIS MONTH';
        return dt.toLocaleDateString('en', { month: 'long', year: 'numeric' }).toUpperCase();
    };

    const fmtDateShort = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // ═══ Group sessions by date ═══
    const sections = useMemo(() => {
        const groups: Record<string, SessionItem[]> = {};
        const order: string[] = [];
        sessions.forEach(s => {
            const group = getDateGroup(s.date);
            if (!groups[group]) { groups[group] = []; order.push(group); }
            groups[group].push(s);
        });
        return order.map(title => ({ title, data: groups[title] }));
    }, [sessions]);

    if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
                <Text style={styles.subtitle}>{sessions.length} Session{sessions.length !== 1 ? 's' : ''} Logged</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Dumbbell size={36} color={appColors.textTertiary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptySub}>Complete a workout to see your training log here.</Text>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const isExpanded = expanded === item.id;
                    const exercises = expandedData[item.id];
                    const volume = expandedVolume[item.id] || 0;

                    return (
                        <MotiView
                            from={{ opacity: 0, translateY: 12 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300, delay: index * 60 }}
                        >
                            <Swipeable renderRightActions={() => renderSwipeDelete(item.id)}>
                                <MotiPressable
                                    onPress={() => toggleExpand(item.id)}
                                    animate={({ pressed }) => {
                                        'worklet';
                                        return { scale: pressed ? 0.98 : 1 };
                                    }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    style={styles.card}
                                >
                                    {/* ─── Collapsed Header ─── */}
                                    <View style={styles.cardTop}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.dateBadge}>{fmtDateShort(item.date)}</Text>
                                            <Text style={styles.cardName}>{item.templateName}</Text>
                                            <View style={styles.metaRow}>
                                                <Clock size={11} color={appColors.textTertiary} />
                                                <Text style={styles.metaText}>{fmtDur(item.duration_minutes)}</Text>
                                                <View style={styles.metaDot} />
                                                <Activity size={11} color={appColors.textTertiary} />
                                                <Text style={styles.metaText}>{item.exerciseCount} exercise{item.exerciseCount !== 1 ? 's' : ''}</Text>
                                                {volume > 0 && (
                                                    <>
                                                        <View style={styles.metaDot} />
                                                        <Text style={styles.metaText}>{new Intl.NumberFormat().format(volume)} kg</Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                        <MotiView
                                            animate={{ rotateZ: isExpanded ? '180deg' : '0deg' }}
                                            transition={{ type: 'timing', duration: 250 }}
                                            style={styles.chevronBox}
                                        >
                                            <ChevronDown size={18} color={appColors.textTertiary} />
                                        </MotiView>
                                    </View>

                                    {/* ─── Expanded Detail ─── */}
                                    {isExpanded && exercises && (
                                        <MotiView
                                            from={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ type: 'timing', duration: 250 }}
                                            style={styles.expandedSection}
                                        >
                                            {exercises.map((ex: any, i: number) => (
                                                <View key={i} style={[styles.exBlock, i > 0 && styles.exDivider]}>
                                                    <View style={styles.exHeader}>
                                                        <Text style={styles.exName}>{ex.name}</Text>
                                                        {ex.muscleGroup ? (
                                                            <View style={styles.musclePill}>
                                                                <Text style={styles.muscleText}>{ex.muscleGroup}</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                    <Text style={styles.setsLine}>
                                                        {ex.sets.map((s: any, j: number) => (
                                                            `${s.weight || 0}kg × ${s.reps || 0}${j < ex.sets.length - 1 ? '  •  ' : ''}`
                                                        )).join('')}
                                                    </Text>
                                                </View>
                                            ))}

                                            {/* ─── Session Summary ─── */}
                                            {volume > 0 && (
                                                <View style={styles.summaryBar}>
                                                    <View style={styles.summaryItem}>
                                                        <Dumbbell size={12} color={appColors.textTertiary} />
                                                        <Text style={styles.summaryText}>Volume: {new Intl.NumberFormat().format(volume)} kg</Text>
                                                    </View>
                                                </View>
                                            )}
                                        </MotiView>
                                    )}
                                </MotiPressable>
                            </Swipeable>
                        </MotiView>
                    );
                }}
            />

            {/* ═══ Delete Dialog ═══ */}
            <AppModal
                visible={!!deleteId}
                onDismiss={() => setDeleteId(null)}
                title="Delete Session?"
                body="This will permanently delete this workout history entry."
                actions={[
                    { label: 'Cancel', onPress: () => setDeleteId(null), variant: 'secondary' },
                    { label: 'Delete', onPress: handleDelete, variant: 'destructive' },
                ]}
            />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },

    // ═══ Header ═══
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    subtitle: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4, letterSpacing: 0.3 },

    // ═══ Section Headers ═══
    sectionHeader: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontFamily: appFonts.bold,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 12,
    },

    // ═══ List ═══
    list: { paddingHorizontal: 20, paddingBottom: 40 },

    // ═══ Card ═══
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
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    dateBadge: {
        ...appTypography.small,
        color: appColors.accent,
        fontSize: 10,
        fontFamily: appFonts.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    cardName: { ...appTypography.h2, color: '#fff', fontSize: 18, fontFamily: appFonts.bold, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { ...appTypography.small, color: appColors.textTertiary, fontSize: 11 },
    metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: appColors.textTertiary },
    chevronBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },

    // ═══ Expanded ═══
    expandedSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: appColors.border,
    },
    exBlock: { paddingTop: 14 },
    exDivider: {
        borderTopWidth: 1,
        borderTopColor: appColors.border + '60',
        marginTop: 2,
    },
    exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 14, fontFamily: appFonts.bold },
    musclePill: {
        backgroundColor: appColors.border,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    muscleText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 10, fontFamily: appFonts.bold, textTransform: 'uppercase' },
    setsLine: {
        ...appTypography.small,
        color: appColors.textSecondary,
        fontSize: 12,
        lineHeight: 20,
    },

    // ═══ Session Summary ═══
    summaryBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: appColors.border,
    },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    summaryText: { ...appTypography.small, color: appColors.textTertiary, fontSize: 11, fontFamily: appFonts.bold },

    // ═══ Empty State ═══
    empty: { alignItems: 'center', paddingTop: 100 },
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

});
