import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Portal, Dialog, Button } from 'react-native-paper';
import { ChevronUp, ChevronDown, Dumbbell, Calendar, Clock, Activity, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkout } from '../hooks/useWorkout';
import { appColors, appFonts, appTypography } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';

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
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        if (!expandedData[id]) {
            const { data } = await supabase.from('session_exercises')
                .select('id, exercise:exercises(name, muscle_group), sets(weight, reps, set_number)')
                .eq('workout_session_id', id).order('created_at');
            if (data) setExpandedData(prev => ({
                ...prev, [id]: data.map((se: any) => ({
                    name: se.exercise?.name || 'Unknown', muscleGroup: se.exercise?.muscle_group || '',
                    sets: (se.sets || []).sort((a: any, b: any) => a.set_number - b.set_number),
                }))
            }));
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

    const renderRightActions = (id: string) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setDeleteId(id);
            }}
        >
            <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
    );

    const fmtDur = (m: number | null) => !m ? '—' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
    const fmtDate = (d: string) => {
        const dt = new Date(d), now = new Date(), yd = new Date(); yd.setDate(yd.getDate() - 1);
        if (dt.toDateString() === now.toDateString()) return 'Today';
        if (dt.toDateString() === yd.toDateString()) return 'Yesterday';
        return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;

    return (
        <AnimatedScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>History</Text>
                <Text style={styles.count}>{sessions.length} sessions logged</Text>
            </View>

            <FlatList data={sessions} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Dumbbell size={64} color={appColors.inputBg} strokeWidth={1} />
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptySub}>Complete a workout to see it here</Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <AnimatedListItem index={index}>
                        <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                            <Card style={styles.card} mode="contained" onPress={() => toggleExpand(item.id)}>
                                <Card.Content style={{ paddingBottom: 12 }}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.dateRow}>
                                                <Calendar size={12} color={appColors.accent} />
                                                <Text style={styles.dateText}>{fmtDate(item.date)}</Text>
                                            </View>
                                            <Text style={styles.cardName}>{item.templateName}</Text>
                                        </View>
                                        <View style={styles.expandIcon}>
                                            {expanded === item.id ? (
                                                <ChevronUp size={22} color={appColors.textSecondary} />
                                            ) : (
                                                <ChevronDown size={22} color={appColors.textSecondary} />
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.metaGrid}>
                                        <View style={styles.metaItem}>
                                            <Clock size={14} color={appColors.textTertiary} />
                                            <Text style={styles.metaLabel}>{fmtDur(item.duration_minutes)}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Activity size={14} color={appColors.textTertiary} />
                                            <Text style={styles.metaLabel}>{item.exerciseCount} exercises</Text>
                                        </View>
                                    </View>

                                    {expanded === item.id && expandedData[item.id] && (
                                        <View style={styles.expandedSection}>
                                            {expandedData[item.id].map((ex: any, i: number) => (
                                                <View key={i} style={styles.expandedEx}>
                                                    <View style={styles.exHeader}>
                                                        <Text style={styles.exName}>{ex.name}</Text>
                                                        <View style={styles.muscleBadge}>
                                                            <Text style={styles.muscleText}>{ex.muscleGroup}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={styles.setsFlow}>
                                                        {ex.sets.map((s: any, j: number) => (
                                                            <View key={j} style={styles.setTag}>
                                                                <Text style={styles.setTagText}>{s.weight || 0}kg × {s.reps || 0}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        </Swipeable>
                    </AnimatedListItem>
                )} />

            <Portal>
                <Dialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Delete Session?</Dialog.Title>
                    <Dialog.Content><Text style={styles.dialogText}>This will permanently delete this workout history entry.</Text></Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteId(null)} textColor={appColors.textSecondary}>Cancel</Button>
                        <Button onPress={handleDelete} textColor={appColors.danger}>Delete</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 32 },
    count: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    empty: { alignItems: 'center', paddingTop: 100 },
    emptyTitle: { ...appTypography.h2, color: '#fff', marginTop: 24, fontSize: 20 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, marginTop: 8, fontSize: 14 },

    card: {
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: appColors.cardBg,
        borderWidth: 1,
        borderColor: appColors.border
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    dateText: { ...appTypography.small, color: appColors.accent, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: appTypography.small.fontFamily },
    cardName: { ...appTypography.h2, color: '#fff', marginBottom: 12 },
    expandIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    metaGrid: { flexDirection: 'row', gap: 16, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaLabel: { ...appTypography.small, color: appColors.textSecondary, fontSize: 12 },

    expandedSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: appColors.border
    },
    expandedEx: { marginBottom: 18 },
    exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 15 },
    muscleBadge: { backgroundColor: appColors.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    muscleText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 11, textTransform: 'uppercase', fontFamily: appFonts.bold },

    setsFlow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    setTag: { backgroundColor: appColors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: appColors.border },
    setTagText: { ...appTypography.small, color: '#fff', fontSize: 12 },
    deleteAction: { backgroundColor: appColors.danger, justifyContent: 'center', alignItems: 'center', width: 70, borderRadius: 16, marginBottom: 12, marginLeft: 10 },
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 16, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', marginTop: 8 },
    dialogText: { ...appTypography.body, color: appColors.textSecondary, lineHeight: 22 },
});
