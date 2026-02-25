import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Dumbbell, ChevronRight, TrendingUp, Minus, TrendingDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useExercises } from '../hooks/useExercises';
import { usePersonalRecords } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

const FILTER_ALL = 'All';

export const ProgressScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { exercises, loading: loadingEx } = useExercises();
    const { getPersonalRecord, getOldPersonalRecord } = usePersonalRecords();
    const [prs, setPrs] = useState<Record<string, number>>({});
    const [oldPrs, setOldPrs] = useState<Record<string, number>>({});
    const [loadingPR, setLoadingPR] = useState(false);
    const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

    const fetchAllPRs = useCallback(async () => {
        if (!exercises || exercises.length === 0) return;
        setLoadingPR(true);
        const prMap: Record<string, number> = {};
        const oldPrMap: Record<string, number> = {};

        await Promise.all(exercises.map(async (ex) => {
            const [pr, oldPr] = await Promise.all([
                getPersonalRecord(ex.id),
                getOldPersonalRecord(ex.id),
            ]);
            prMap[ex.id] = pr;
            oldPrMap[ex.id] = oldPr;
        }));

        setPrs(prMap);
        setOldPrs(oldPrMap);
        setLoadingPR(false);
    }, [exercises, getPersonalRecord, getOldPersonalRecord]);

    useEffect(() => {
        if (exercises.length > 0) fetchAllPRs();
    }, [exercises, fetchAllPRs]);

    // Muscle group filter chips
    const muscleGroups = useMemo(() => {
        const groups = new Set(exercises.map(e => e.muscle_group).filter(Boolean));
        return [FILTER_ALL, ...Array.from(groups).sort()];
    }, [exercises]);

    const sections = useMemo(() => {
        if (!exercises || exercises.length === 0) return [];

        const filtered = activeFilter === FILTER_ALL
            ? exercises
            : exercises.filter(e => e.muscle_group === activeFilter);

        const grouped = filtered.reduce((acc: Record<string, any[]>, ex) => {
            const group = ex.muscle_group || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push(ex);
            return acc;
        }, {});

        return Object.keys(grouped)
            .sort()
            .map(group => ({
                title: group,
                data: grouped[group].sort((a, b) => a.name.localeCompare(b.name))
            }));
    }, [exercises, activeFilter]);

    const isLoading = loadingEx || (exercises.length > 0 && loadingPR);

    // Compute improvement delta
    const getDelta = (id: string) => {
        const current = prs[id] || 0;
        const old = oldPrs[id] || 0;
        if (current === 0) return null; // no PR at all
        if (old === 0) return null; // no historical data
        return current - old;
    };

    return (
        <AnimatedScreen style={styles.container}>
            {/* ═══ Header ═══ */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Progress</Text>
                        <Text style={styles.subtitle}>Track your evolution on each exercise</Text>
                    </View>
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
                                    style={[styles.chip, isActive && styles.chipActive]}
                                >
                                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                        {group}
                                    </Text>
                                </MotiPressable>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {isLoading && exercises.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={appColors.accent} />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBox}>
                                <TrendingUp size={36} color={appColors.textTertiary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {activeFilter !== FILTER_ALL ? 'No exercises found' : 'No exercises yet'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {activeFilter !== FILTER_ALL
                                    ? 'Try a different filter.'
                                    : 'Add exercises and train to start tracking PRs.'}
                            </Text>
                        </View>
                    }
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
                            <View style={styles.sectionDivider} />
                        </View>
                    )}
                    renderItem={({ item, index }) => {
                        const prWeight = prs[item.id] || 0;
                        const delta = getDelta(item.id);

                        return (
                            <MotiView
                                from={{ opacity: 0, translateY: 12 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                            >
                                <MotiPressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        navigation.navigate('ExerciseDetail', { exerciseId: item.id, exerciseName: item.name, muscleGroup: item.muscle_group });
                                    }}
                                    animate={({ pressed }) => {
                                        'worklet';
                                        return { scale: pressed ? 0.97 : 1 };
                                    }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    style={styles.card}
                                >
                                    <View style={styles.cardRow}>
                                        {/* Icon */}
                                        <View style={styles.iconBox}>
                                            <Dumbbell size={18} color={appColors.accent} />
                                        </View>

                                        {/* Middle */}
                                        <View style={styles.middleSection}>
                                            <Text style={styles.exName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.exSub}>
                                                {prWeight > 0 ? 'Personal Record' : 'No PR Yet'}
                                            </Text>
                                        </View>

                                        {/* Right: PR + Delta */}
                                        <View style={styles.rightSection}>
                                            <View style={styles.prContainer}>
                                                <Text style={[
                                                    styles.prWeight,
                                                    prWeight === 0 && styles.prWeightNone,
                                                ]}>
                                                    {prWeight > 0 ? `${prWeight}kg` : '—'}
                                                </Text>
                                                {prWeight > 0 && (
                                                    <Text style={styles.prLabel}>PR</Text>
                                                )}
                                            </View>

                                            {/* Improvement indicator */}
                                            {delta !== null && delta !== 0 && (
                                                <View style={[
                                                    styles.deltaBadge,
                                                    delta > 0 ? styles.deltaBadgeUp : styles.deltaBadgeDown,
                                                ]}>
                                                    {delta > 0 ? (
                                                        <TrendingUp size={10} color={appColors.accent} />
                                                    ) : (
                                                        <TrendingDown size={10} color={appColors.warning} />
                                                    )}
                                                    <Text style={[
                                                        styles.deltaText,
                                                        delta > 0 ? styles.deltaTextUp : styles.deltaTextDown,
                                                    ]}>
                                                        {delta > 0 ? '+' : ''}{delta}kg
                                                    </Text>
                                                </View>
                                            )}

                                            {delta === 0 && prWeight > 0 && (
                                                <View style={styles.deltaStagnant}>
                                                    <Minus size={10} color={appColors.textTertiary} />
                                                </View>
                                            )}
                                        </View>

                                        <ChevronRight size={16} color={appColors.textTertiary} style={{ marginLeft: 8 }} />
                                    </View>
                                </MotiPressable>
                            </MotiView>
                        );
                    }}
                />
            )}
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
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: appColors.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
    title: { ...appTypography.h1, color: '#fff', fontSize: 26, fontFamily: appFonts.black },
    subtitle: { ...appTypography.small, color: '#888', marginTop: 4, letterSpacing: 0.3 },

    // ═══ Filter Chips ═══
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 16, paddingBottom: 2 },
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
    list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },

    // ═══ Section Headers ═══
    sectionHeader: { marginTop: 24, marginBottom: 12 },
    sectionTitle: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontFamily: appFonts.bold,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    sectionDivider: { height: 1, backgroundColor: appColors.border },

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
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: appColors.accent + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: appColors.accent + '15',
    },
    middleSection: { flex: 1, justifyContent: 'center' },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 16, fontFamily: appFonts.bold, letterSpacing: 0.3 },
    exSub: { ...appTypography.small, color: appColors.textTertiary, fontSize: 11, marginTop: 3, fontFamily: appFonts.semiBold },

    // ═══ PR Display ═══
    rightSection: { alignItems: 'flex-end', marginLeft: 12 },
    prContainer: { alignItems: 'flex-end' },
    prWeight: {
        ...appTypography.h1,
        color: appColors.accent,
        fontSize: 20,
        fontFamily: appFonts.black,
    },
    prWeightNone: { color: appColors.textTertiary, fontSize: 16 },
    prLabel: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 9,
        fontFamily: appFonts.bold,
        letterSpacing: 0.5,
        marginTop: -1,
    },

    // ═══ Improvement Indicator ═══
    deltaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
    },
    deltaBadgeUp: { backgroundColor: appColors.accent + '15' },
    deltaBadgeDown: { backgroundColor: appColors.warning + '15' },
    deltaText: { fontSize: 9, fontFamily: appFonts.bold },
    deltaTextUp: { color: appColors.accent },
    deltaTextDown: { color: appColors.warning },
    deltaStagnant: {
        marginTop: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

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
});
