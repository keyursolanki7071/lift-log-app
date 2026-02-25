import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Trophy, TrendingUp, Dumbbell } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import * as Haptics from 'expo-haptics';
import { useExerciseHistory, usePersonalRecords } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

const W = Dimensions.get('window').width;
const TIME_FILTERS = ['30D', '3M', '6M', '1Y'] as const;

export const ExerciseDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { exerciseId, exerciseName, muscleGroup } = route.params;
    const { getExerciseHistory } = useExerciseHistory();
    const { getPersonalRecord, getOldPersonalRecord } = usePersonalRecords();
    const [sessions, setSessions] = useState<any[]>([]);
    const [pr, setPr] = useState(0);
    const [oldPr, setOldPr] = useState(0);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<typeof TIME_FILTERS[number]>('30D');

    useEffect(() => {
        Promise.all([
            getExerciseHistory(exerciseId),
            getPersonalRecord(exerciseId),
            getOldPersonalRecord(exerciseId),
        ]).then(([h, p, op]) => {
            setSessions(h);
            setPr(p);
            setOldPr(op);
            setLoading(false);
        });
    }, [exerciseId]);

    if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;

    // ═══ Computed metrics ═══
    const prDelta = oldPr > 0 && pr > 0 ? pr - oldPr : null;
    const allMaxWeights = sessions.map((s: any) => s.maxWeight || 0).filter(w => w > 0);
    const avgWeight = allMaxWeights.length > 0 ? Math.round(allMaxWeights.reduce((a, b) => a + b, 0) / allMaxWeights.length) : 0;
    const lastWeight = sessions.length > 0 ? sessions[sessions.length - 1].maxWeight || 0 : 0;
    const totalVolume = sessions.reduce((sum: number, s: any) => sum + (s.totalVolume || 0), 0);
    const totalReps = sessions.reduce((sum: number, s: any) => sum + s.sets.reduce((rs: number, set: any) => rs + (set.reps || 0), 0), 0);
    const avgReps = sessions.length > 0 ? Math.round(totalReps / sessions.length) : 0;

    // ═══ Chart data ═══
    const chartSessions = sessions.slice(-6);
    const chartData = chartSessions.length > 1 ? {
        labels: chartSessions.map((s: any) => {
            const d = new Date(s.sessionDate);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [{ data: chartSessions.map((s: any) => s.maxWeight || 0), strokeWidth: 2 }],
    } : null;

    // ═══ Date formatter ═══
    const fmtDate = (d: string) => {
        const dt = new Date(d), now = new Date(), yd = new Date();
        yd.setDate(yd.getDate() - 1);
        if (dt.toDateString() === now.toDateString()) return 'Today';
        if (dt.toDateString() === yd.toDateString()) return 'Yesterday';
        return dt.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{exerciseName}</Text>
                    <Text style={styles.headerSub}>
                        {muscleGroup || 'Exercise'} • {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ═══ PR Card ═══ */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 350 }}
                >
                    <View style={styles.prCard}>
                        <View style={styles.prIconBox}>
                            <Trophy size={20} color={appColors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prValue}>{pr > 0 ? `${pr}kg` : '—'}</Text>
                            <Text style={styles.prCardLabel}>
                                {pr > 0 ? 'Personal Record' : 'No PR Yet'}
                            </Text>
                        </View>
                        {prDelta !== null && prDelta !== 0 && (
                            <View style={[
                                styles.prDeltaBadge,
                                prDelta > 0 ? styles.prDeltaUp : styles.prDeltaDown,
                            ]}>
                                <TrendingUp size={10} color={prDelta > 0 ? appColors.accent : appColors.warning} />
                                <Text style={[
                                    styles.prDeltaText,
                                    prDelta > 0 ? { color: appColors.accent } : { color: appColors.warning },
                                ]}>
                                    {prDelta > 0 ? '+' : ''}{prDelta}kg
                                </Text>
                            </View>
                        )}
                    </View>
                </MotiView>

                {/* ═══ Chart Section ═══ */}
                {chartData && chartData.labels.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 15 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 100 }}
                    >
                        <View style={styles.section}>
                            {/* Section title + time filter chips */}
                            <View style={styles.chartTitleRow}>
                                <Text style={styles.sectionTitle}>WEIGHT PROGRESSION</Text>
                                <View style={styles.timeFilterRow}>
                                    {TIME_FILTERS.map(f => (
                                        <TouchableOpacity
                                            key={f}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setTimeFilter(f);
                                            }}
                                            style={[styles.timeChip, timeFilter === f && styles.timeChipActive]}
                                        >
                                            <Text style={[styles.timeChipText, timeFilter === f && styles.timeChipTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.chartCard}>
                                <LineChart
                                    data={chartData}
                                    width={W - 72}
                                    height={180}
                                    bezier
                                    chartConfig={{
                                        backgroundColor: 'transparent',
                                        backgroundGradientFrom: appColors.cardBg,
                                        backgroundGradientTo: appColors.cardBg,
                                        decimalPlaces: 0,
                                        color: () => appColors.accent,
                                        labelColor: () => '#666',
                                        fillShadowGradientFrom: appColors.accent,
                                        fillShadowGradientFromOpacity: 0.08,
                                        fillShadowGradientTo: appColors.cardBg,
                                        fillShadowGradientToOpacity: 0,
                                        propsForDots: { r: '4', strokeWidth: '2', stroke: appColors.accent },
                                        propsForBackgroundLines: { strokeDasharray: '4, 6', stroke: appColors.border, strokeWidth: 0.5 },
                                        style: { borderRadius: 12 },
                                    }}
                                    style={{ borderRadius: 12, marginLeft: -16, paddingRight: 40 }}
                                    verticalLabelRotation={0}
                                    xLabelsOffset={-5}
                                    fromZero
                                    renderDotContent={({ x, y, index }) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                            style={{ position: 'absolute', left: x - 20, top: y - 30, width: 40, alignItems: 'center', padding: 4 }}
                                        >
                                            <Text style={styles.dotLabel}>
                                                {chartData.datasets[0].data[index]}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />

                                {/* Graph Summary Row */}
                                <View style={styles.graphSummary}>
                                    <View style={styles.graphStat}>
                                        <Text style={styles.graphStatValue}>{pr > 0 ? `${pr}kg` : '—'}</Text>
                                        <Text style={styles.graphStatLabel}>Highest</Text>
                                    </View>
                                    <View style={styles.graphStatDivider} />
                                    <View style={styles.graphStat}>
                                        <Text style={styles.graphStatValue}>{avgWeight > 0 ? `${avgWeight}kg` : '—'}</Text>
                                        <Text style={styles.graphStatLabel}>Average</Text>
                                    </View>
                                    <View style={styles.graphStatDivider} />
                                    <View style={styles.graphStat}>
                                        <Text style={styles.graphStatValue}>{lastWeight > 0 ? `${lastWeight}kg` : '—'}</Text>
                                        <Text style={styles.graphStatLabel}>Last</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* ═══ Summary Metrics ═══ */}
                {sessions.length > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300, delay: 200 }}
                    >
                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{new Intl.NumberFormat().format(totalVolume)}</Text>
                                <Text style={styles.metricUnit}>kg</Text>
                                <Text style={styles.metricLabel}>Total Volume</Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{avgReps}</Text>
                                <Text style={styles.metricLabel}>Avg Reps</Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metricItem}>
                                <Text style={styles.metricValue}>{sessions.length}</Text>
                                <Text style={styles.metricLabel}>Sessions</Text>
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* ═══ Session History ═══ */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginTop: 8 }]}>SESSION HISTORY</Text>

                    {sessions.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <Dumbbell size={28} color={appColors.textTertiary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No sessions yet</Text>
                            <Text style={styles.emptySub}>Train this exercise to start tracking progress.</Text>
                        </View>
                    ) : (
                        [...sessions].reverse().map((s: any, i: number) => {
                            const hasWeight = s.sets.some((set: any) => (set.weight || 0) > 0);

                            return (
                                <MotiView
                                    key={i}
                                    from={{ opacity: 0, translateY: 10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ type: 'timing', duration: 250, delay: 250 + i * 60 }}
                                >
                                    <MotiPressable
                                        animate={({ pressed }) => {
                                            'worklet';
                                            return { scale: pressed ? 0.98 : 1 };
                                        }}
                                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                        style={styles.sessionCard}
                                    >
                                        {/* Header */}
                                        <View style={styles.sessionHeader}>
                                            <Text style={styles.sessionDate}>{fmtDate(s.sessionDate)}</Text>
                                            {hasWeight && (s.maxWeight || 0) > 0 ? (
                                                <View style={styles.maxBadge}>
                                                    <Text style={styles.maxText}>Max: {s.maxWeight}kg</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.noSetsText}>No sets recorded</Text>
                                            )}
                                        </View>

                                        {/* Vertical set list */}
                                        <View style={styles.setsList}>
                                            {s.sets.map((set: any, j: number) => (
                                                <View key={j} style={styles.setRow}>
                                                    <View style={styles.setNum}>
                                                        <Text style={styles.setNumText}>{j + 1}</Text>
                                                    </View>
                                                    <Text style={styles.setWeight}>{set.weight || 0}kg</Text>
                                                    <Text style={styles.setX}>×</Text>
                                                    <Text style={styles.setReps}>{set.reps || 0}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </MotiPressable>
                                </MotiView>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ═══ Header ═══
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 8,
        paddingBottom: 12,
    },
    backBtn: { padding: 12 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 22, fontFamily: appFonts.black },
    headerSub: { ...appTypography.small, color: '#888', fontSize: 12, marginTop: 3 },

    scroll: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 8 },

    // ═══ PR Card ═══
    prCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    prIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: appColors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    prValue: { ...appTypography.h1, color: '#fff', fontSize: 30, fontFamily: appFonts.black },
    prCardLabel: { ...appTypography.small, color: '#888', fontSize: 11, fontFamily: appFonts.semiBold, marginTop: 1 },
    prDeltaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    prDeltaUp: { backgroundColor: appColors.accent + '12' },
    prDeltaDown: { backgroundColor: appColors.warning + '12' },
    prDeltaText: { fontSize: 11, fontFamily: appFonts.bold },

    // ═══ Sections ═══
    section: { marginBottom: 16 },
    sectionTitle: {
        ...appTypography.small,
        color: '#666',
        fontFamily: appFonts.bold,
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 12,
    },

    // ═══ Chart ═══
    chartTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeFilterRow: { flexDirection: 'row', gap: 4 },
    timeChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    timeChipActive: {
        backgroundColor: appColors.accent + '15',
    },
    timeChipText: { ...appTypography.small, color: '#555', fontSize: 10, fontFamily: appFonts.bold },
    timeChipTextActive: { color: appColors.accent },

    chartCard: {
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        paddingTop: 16,
        paddingBottom: 0,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    dotLabel: { color: appColors.accent, fontSize: 10, fontFamily: appFonts.black },
    graphSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        paddingVertical: 16,
        marginTop: 8,
    },
    graphStat: { alignItems: 'center', flex: 1 },
    graphStatValue: { ...appTypography.h2, color: '#fff', fontSize: 16, fontFamily: appFonts.bold },
    graphStatLabel: { ...appTypography.small, color: '#777', fontSize: 10, marginTop: 3, fontFamily: appFonts.semiBold },
    graphStatDivider: { width: 1, height: 28, backgroundColor: appColors.border },

    // ═══ Summary Metrics ═══
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        paddingVertical: 18,
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    metricItem: { flex: 1, alignItems: 'center', gap: 1 },
    metricValue: { ...appTypography.h2, color: '#fff', fontSize: 17, fontFamily: appFonts.bold },
    metricUnit: { ...appTypography.small, color: '#666', fontSize: 10, fontFamily: appFonts.semiBold, marginTop: -2 },
    metricLabel: { ...appTypography.small, color: '#666', fontSize: 9, fontFamily: appFonts.semiBold, letterSpacing: 0.3, marginTop: 2 },
    metricDivider: { width: 1, height: 28, backgroundColor: appColors.border },

    // ═══ Session History ═══
    sessionCard: {
        backgroundColor: appColors.cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: appColors.border,
        padding: 16,
        marginBottom: 12,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: appColors.border + '60',
    },
    sessionDate: { ...appTypography.h2, color: '#fff', fontSize: 15, fontFamily: appFonts.bold },
    maxBadge: {
        backgroundColor: appColors.accent + '12',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    maxText: { ...appTypography.small, color: appColors.accent, fontFamily: appFonts.bold, fontSize: 11 },
    noSetsText: { ...appTypography.small, color: '#666', fontSize: 11, fontFamily: appFonts.semiBold },

    // ═══ Set Rows (Vertical) ═══
    setsList: { gap: 6 },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    setNum: {
        width: 24,
        height: 24,
        borderRadius: 7,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setNumText: { color: '#666', fontFamily: appFonts.bold, fontSize: 10 },
    setWeight: { color: '#fff', fontFamily: appFonts.bold, fontSize: 14, minWidth: 48 },
    setX: { color: '#555', fontSize: 12 },
    setReps: { color: '#fff', fontFamily: appFonts.bold, fontSize: 14 },

    // ═══ Empty ═══
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: appColors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 14,
    },
    emptyTitle: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    emptySub: { ...appTypography.body, color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
});
