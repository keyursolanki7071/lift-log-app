import React, { useState, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TextInput as RNTextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Scale, Ruler, TrendingDown, TrendingUp, Minus, Dumbbell } from 'lucide-react-native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import * as Haptics from 'expo-haptics';
import { useBodyMetrics } from '../hooks/useBodyMetrics';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

const W = Dimensions.get('window').width;

export const BodyTrackingScreen: React.FC = () => {
    const { metrics, loading, logMetric } = useBodyMetrics();
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const waistRef = useRef<RNTextInput>(null);

    const handleSave = async () => {
        Keyboard.dismiss();
        const wVal = parseFloat(weight);
        if (isNaN(wVal) || wVal <= 0 || wVal > 500) return;
        const waistVal = waist ? parseFloat(waist) : null;
        if (waistVal !== null && (isNaN(waistVal) || waistVal <= 0 || waistVal > 300)) return;

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logMetric(wVal, waistVal, null);
        setWeight(''); setWaist('');
        setSaving(false);
        setSaved(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setSaved(false), 2000);
    };

    // ═══ Computed stats ═══
    const stats = useMemo(() => {
        if (metrics.length === 0) return null;
        const latest = metrics[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const oldMetric = metrics.find(m => new Date(m.date) <= thirtyDaysAgo);
        const weightDelta = oldMetric ? Math.round((latest.weight - oldMetric.weight) * 10) / 10 : null;
        const waistDelta = oldMetric && latest.waist && oldMetric.waist
            ? Math.round((latest.waist - oldMetric.waist) * 10) / 10
            : null;
        return {
            currentWeight: latest.weight,
            currentWaist: latest.waist,
            weightDelta,
            waistDelta,
            lastLogged: latest.date,
        };
    }, [metrics]);

    // ═══ Chart data ═══
    const chartEntries = useMemo(() => metrics.slice(0, 6).reverse(), [metrics]);
    const chartData = chartEntries.length > 1 ? {
        labels: chartEntries.map(m => {
            const d = new Date(m.date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [{ data: chartEntries.map(m => m.weight || 0), strokeWidth: 2 }],
    } : null;

    const chartWeights = chartEntries.map(m => m.weight || 0).filter(w => w > 0);
    const chartHighest = chartWeights.length > 0 ? Math.max(...chartWeights) : 0;
    const chartLowest = chartWeights.length > 0 ? Math.min(...chartWeights) : 0;
    const chartCurrent = metrics.length > 0 ? metrics[0].weight || 0 : 0;

    // ═══ Date formatter ═══
    const fmtDate = (d: string) => {
        const dt = new Date(d), now = new Date(), yd = new Date();
        yd.setDate(yd.getDate() - 1);
        if (dt.toDateString() === now.toDateString()) return 'Today';
        if (dt.toDateString() === yd.toDateString()) return 'Yesterday';
        return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    };

    const DeltaBadge = ({ value, unit }: { value: number; unit: string }) => {
        const isPositive = value > 0;
        const isNeutral = value === 0;
        // For body weight, negative is good (loss). For clarity we color code:
        // weight down = green, weight up = orange
        const color = isNeutral ? '#666' : (value < 0 ? appColors.accent : appColors.warning);
        const Icon = isNeutral ? Minus : (value < 0 ? TrendingDown : TrendingUp);
        return (
            <View style={[styles.deltaBadge, { backgroundColor: color + '12' }]}>
                <Icon size={10} color={color} />
                <Text style={[styles.deltaText, { color }]}>
                    {value > 0 ? '+' : ''}{value}{unit}
                </Text>
            </View>
        );
    };

    if (loading && metrics.length === 0) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;
    }

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <Text style={styles.title}>Body Tracking</Text>
                <Text style={styles.subtitle}>Track your physical transformation</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ═══ Current Stats Summary ═══ */}
                {stats && (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 300 }}
                    >
                        <View style={styles.statsCard}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.currentWeight}kg</Text>
                                <Text style={styles.statLabel}>Weight</Text>
                                {stats.weightDelta !== null && (
                                    <DeltaBadge value={stats.weightDelta} unit="kg" />
                                )}
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.currentWaist ? `${stats.currentWaist}cm` : '—'}</Text>
                                <Text style={styles.statLabel}>Waist</Text>
                                {stats.waistDelta !== null && (
                                    <DeltaBadge value={stats.waistDelta} unit="cm" />
                                )}
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* ═══ Log Today ═══ */}
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: 80 }}
                >
                    <View style={styles.logCard}>
                        <Text style={styles.logTitle}>Log Today</Text>
                        {stats && (
                            <Text style={styles.lastLogged}>Last logged: {stats.currentWeight}kg • {fmtDate(stats.lastLogged)}</Text>
                        )}

                        <View style={styles.inputRow}>
                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Weight</Text>
                                <RNTextInput
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="kg"
                                    placeholderTextColor="#555"
                                    keyboardType="numeric"
                                    returnKeyType="next"
                                    onSubmitEditing={() => waistRef.current?.focus()}
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.inputLabel}>Waist</Text>
                                <RNTextInput
                                    ref={waistRef}
                                    value={waist}
                                    onChangeText={setWaist}
                                    placeholder="cm"
                                    placeholderTextColor="#555"
                                    keyboardType="numeric"
                                    returnKeyType="done"
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <MotiPressable
                            onPress={handleSave}
                            disabled={saving || !weight}
                            animate={({ pressed }) => {
                                'worklet';
                                return { scale: pressed ? 0.97 : 1 };
                            }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            style={[
                                styles.saveBtn,
                                (!weight || saving) && styles.saveBtnDisabled,
                            ]}
                        >
                            <Text style={[styles.saveBtnText, (!weight || saving) && styles.saveBtnTextDisabled]}>
                                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Entry'}
                            </Text>
                        </MotiPressable>
                    </View>
                </MotiView>

                {/* ═══ Weight Progress Chart ═══ */}
                {chartData && (
                    <MotiView
                        from={{ opacity: 0, translateY: 15 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 400, delay: 150 }}
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>WEIGHT PROGRESS (30D)</Text>
                            <View style={styles.chartCard}>
                                <LineChart
                                    data={chartData}
                                    width={W - 72}
                                    height={170}
                                    bezier
                                    chartConfig={{
                                        backgroundColor: 'transparent',
                                        backgroundGradientFrom: appColors.cardBg,
                                        backgroundGradientTo: appColors.cardBg,
                                        decimalPlaces: 1,
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
                                    renderDotContent={({ x, y, index }) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                            style={{ position: 'absolute', left: x - 20, top: y - 28, width: 40, alignItems: 'center', padding: 4 }}
                                        >
                                            <Text style={styles.dotLabel}>
                                                {chartData.datasets[0].data[index]}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />

                                {/* Summary */}
                                <View style={styles.chartSummary}>
                                    <View style={styles.chartStat}>
                                        <Text style={styles.chartStatValue}>{chartHighest}kg</Text>
                                        <Text style={styles.chartStatLabel}>Highest</Text>
                                    </View>
                                    <View style={styles.chartStatDivider} />
                                    <View style={styles.chartStat}>
                                        <Text style={styles.chartStatValue}>{chartLowest}kg</Text>
                                        <Text style={styles.chartStatLabel}>Lowest</Text>
                                    </View>
                                    <View style={styles.chartStatDivider} />
                                    <View style={styles.chartStat}>
                                        <Text style={styles.chartStatValue}>{chartCurrent}kg</Text>
                                        <Text style={styles.chartStatLabel}>Current</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </MotiView>
                )}

                {/* ═══ Recent Entries ═══ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RECENT ENTRIES</Text>

                    {metrics.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <Scale size={30} color={appColors.textTertiary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No body metrics logged yet</Text>
                            <Text style={styles.emptySub}>Start tracking your transformation.</Text>
                        </View>
                    ) : (
                        metrics.slice(0, 15).map((m, i) => {
                            const d = new Date(m.date);
                            return (
                                <MotiView
                                    key={m.id || i}
                                    from={{ opacity: 0, translateY: 8 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ type: 'timing', duration: 200, delay: 200 + i * 40 }}
                                >
                                    <View style={[styles.entryCard, i > 0 && styles.entryDivider]}>
                                        {/* Date block */}
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateDay}>{d.getDate()}</Text>
                                            <Text style={styles.dateMonth}>
                                                {d.toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                                            </Text>
                                        </View>

                                        {/* Values */}
                                        <View style={styles.entryValues}>
                                            <Text style={styles.entryWeight}>{m.weight}kg</Text>
                                            {m.waist ? (
                                                <Text style={styles.entryWaist}>{m.waist}cm</Text>
                                            ) : null}
                                        </View>
                                    </View>
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
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 20,
    },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    subtitle: { ...appTypography.small, color: '#888', marginTop: 4, letterSpacing: 0.3 },

    scroll: { paddingHorizontal: 20, paddingBottom: 80 },

    // ═══ Stats Summary ═══
    statsCard: {
        flexDirection: 'row',
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        paddingVertical: 20,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { ...appTypography.h1, color: '#fff', fontSize: 22, fontFamily: appFonts.black },
    statLabel: { ...appTypography.small, color: '#777', fontSize: 10, fontFamily: appFonts.semiBold, marginBottom: 4 },
    statDivider: { width: 1, height: 40, backgroundColor: appColors.border, alignSelf: 'center' },
    deltaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    deltaText: { fontSize: 10, fontFamily: appFonts.bold },

    // ═══ Log Card ═══
    logCard: {
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        padding: 20,
        marginBottom: 20,
    },
    logTitle: { ...appTypography.h2, color: '#fff', fontSize: 17, fontFamily: appFonts.bold, marginBottom: 4 },
    lastLogged: { ...appTypography.small, color: '#666', fontSize: 11, fontFamily: appFonts.semiBold, marginBottom: 16 },

    inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    inputWrap: { flex: 1 },
    inputLabel: { ...appTypography.small, color: '#777', fontSize: 10, fontFamily: appFonts.bold, letterSpacing: 0.5, marginBottom: 6 },
    input: {
        height: 52,
        backgroundColor: appColors.bg,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: appColors.border,
        color: '#fff',
        fontSize: 16,
        fontFamily: appFonts.bold,
        paddingHorizontal: 14,
    },

    saveBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: appColors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnDisabled: { backgroundColor: '#333' },
    saveBtnText: { color: '#000', fontSize: 15, fontFamily: appFonts.black, letterSpacing: 0.5 },
    saveBtnTextDisabled: { color: '#666' },

    // ═══ Section ═══
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
    chartSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderTopWidth: 1,
        borderTopColor: appColors.border,
        paddingVertical: 16,
        marginTop: 8,
    },
    chartStat: { flex: 1, alignItems: 'center' },
    chartStatValue: { ...appTypography.h2, color: '#fff', fontSize: 15, fontFamily: appFonts.bold },
    chartStatLabel: { ...appTypography.small, color: '#777', fontSize: 10, marginTop: 3, fontFamily: appFonts.semiBold },
    chartStatDivider: { width: 1, height: 28, backgroundColor: appColors.border },

    // ═══ Recent Entries ═══
    entryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 8,
    },
    entryDivider: {},
    dateBox: {
        alignItems: 'center',
        width: 46,
        marginRight: 16,
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: appColors.border,
    },
    dateDay: { ...appTypography.h1, color: '#fff', fontSize: 20, fontFamily: appFonts.black },
    dateMonth: { ...appTypography.small, color: '#777', fontSize: 9, fontFamily: appFonts.bold, letterSpacing: 0.5 },
    entryValues: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 16 },
    entryWeight: { ...appTypography.h2, color: '#fff', fontSize: 18, fontFamily: appFonts.bold },
    entryWaist: { ...appTypography.small, color: '#777', fontSize: 13, fontFamily: appFonts.semiBold },

    // ═══ Empty ═══
    empty: { alignItems: 'center', paddingVertical: 50 },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: appColors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: appColors.border,
        marginBottom: 16,
    },
    emptyTitle: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    emptySub: { ...appTypography.body, color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center' },
});
