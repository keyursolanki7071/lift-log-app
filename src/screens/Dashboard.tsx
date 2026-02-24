import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Play, Trophy, Dumbbell, Flame } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const { getDashboardStats } = useProgress();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setLoading(false);
    }, [user, getDashboardStats]);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [fetchStats])
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={appColors.accent} />
            </View>
        );
    }

    const {
        weeklyWorkouts,
        weeklyVolume,
        prevWeekVolume,
        prsThisWeek,
        weeklyGoal,
        streak,
        bodyWeight,
        bodyWeightChange,
        trends,
        topPrMonth
    } = stats || {};

    const consistencyProgress = Math.min((weeklyWorkouts || 0) / (weeklyGoal || 4), 1);
    const volumeChange = prevWeekVolume > 0 ? ((weeklyVolume - prevWeekVolume) / prevWeekVolume) * 100 : 0;

    const handleStartWorkout = () => {
        import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
        navigation.navigate('SelectTemplate');
    };

    return (
        <AnimatedScreen style={styles.container}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}>

                {/* 🏆 PR Reward Badge (Conditional) */}
                {prsThisWeek > 0 && (
                    <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={styles.prBadge}
                    >
                        <Trophy size={16} color={appColors.accent} fill={appColors.accent} />
                        <Text style={styles.prBadgeText}>{prsThisWeek} NEW PR{prsThisWeek > 1 ? 'S' : ''} THIS WEEK</Text>
                    </MotiView>
                )}

                {/* 1. Big Start Workout Button (PRIMARY ACTION) */}
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }}>
                    <MotiPressable
                        onPress={handleStartWorkout}
                        animate={({ pressed }) => {
                            'worklet';
                            return {
                                scale: pressed ? 0.97 : 1,
                            };
                        }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={styles.ctaBtnContainer}
                    >
                        <View style={styles.ctaInner}>
                            <View style={styles.ctaLeft}>
                                <Play size={20} color="#000" fill="#000" style={{ marginRight: 8 }} />
                                <Text style={styles.ctaLabel}>START WORKOUT</Text>
                            </View>
                        </View>
                    </MotiPressable>
                </MotiView>

                {/* 2. Weekly Consistency (RETENTION DRIVER) */}
                <Text style={styles.sectionTitle}>WEEKLY CONSISTENCY</Text>
                <MotiPressable
                    onPress={() => { }}
                    animate={({ pressed }) => {
                        'worklet';
                        return {
                            scale: pressed ? 0.98 : 1,
                        };
                    }}
                    style={[styles.card, styles.shadowed]}
                >
                    <View style={styles.consistencyRow}>
                        <View>
                            <View style={styles.valueRow}>
                                <Text style={styles.bigValue}>{weeklyWorkouts}</Text>
                                <Text style={styles.unit}>/ {weeklyGoal} workouts</Text>
                            </View>
                            {streak > 0 && (
                                <Text style={styles.streakText}>🔥 {streak} week streak</Text>
                            )}
                        </View>
                        <View style={styles.iconCircleSubtle}>
                            <Flame size={24} color={consistencyProgress >= 1 ? appColors.accent : appColors.textTertiary} fill={consistencyProgress >= 1 ? appColors.accent : 'transparent'} />
                        </View>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <MotiView
                                from={{ width: '0%' }}
                                animate={{ width: `${consistencyProgress * 100}%` }}
                                transition={{ type: 'spring', damping: 15 }}
                                style={styles.progressBarFill}
                            />
                        </View>
                        <Text style={styles.progressGoalLabel}>Goal: {weeklyGoal} per week</Text>
                    </View>
                </MotiPressable>

                {/* 3. Body Weight (CLINICAL METRIC) */}
                <Text style={styles.sectionTitle}>BODY WEIGHT</Text>
                <MotiPressable
                    onPress={() => { }}
                    animate={({ pressed }) => {
                        'worklet';
                        return {
                            scale: pressed ? 0.98 : 1,
                        };
                    }}
                    style={[styles.card, styles.shadowed]}
                >
                    <View style={styles.valueRow}>
                        <Text style={styles.bigValue}>{bodyWeight || '—'}</Text>
                        <Text style={[styles.unit, { marginLeft: 4 }]}>kg</Text>
                        {bodyWeightChange !== 0 && (
                            <View style={[styles.pillBadge, { backgroundColor: (bodyWeightChange < 0 ? appColors.success : appColors.danger) + '15' }]}>
                                <Text style={[styles.pillBadgeText, { color: bodyWeightChange < 0 ? appColors.success : appColors.danger }]}>
                                    {bodyWeightChange < 0 ? '↓' : '↑'} {Math.abs(bodyWeightChange).toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                </MotiPressable>

                {/* 4. Strength Trend Indicator (PROGRESS VISUAL) */}
                {trends && trends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>STRENGTH TRENDS (30D)</Text>
                        <View style={styles.trendGrid}>
                            {trends.map((t: any, i: number) => (
                                <MotiPressable
                                    key={i}
                                    onPress={() => { }}
                                    animate={({ pressed }) => {
                                        'worklet';
                                        return {
                                            scale: pressed ? 0.98 : 1,
                                        };
                                    }}
                                    style={[styles.trendItem, styles.shadowed]}
                                >
                                    <Text style={styles.trendEx}>{t.name}</Text>
                                    <View style={styles.trendValueRow}>
                                        <Text style={styles.trendWeight}>{t.currentMax}kg</Text>
                                        <View style={[styles.pillBadge, { backgroundColor: (t.change > 0 ? appColors.success : t.change < 0 ? appColors.danger : appColors.textTertiary) + '15' }]}>
                                            <Text style={[styles.pillBadgeText, { color: t.change > 0 ? appColors.success : t.change < 0 ? appColors.danger : appColors.textTertiary }]}>
                                                {t.change > 0 ? '↑' : t.change < 0 ? '↓' : '→'} {Math.abs(t.change)}kg
                                            </Text>
                                        </View>
                                    </View>
                                </MotiPressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* 5. Total Volume This Week (WORKHORSE METRIC) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TOTAL VOLUME THIS WEEK</Text>
                    <MotiPressable
                        onPress={() => { }}
                        animate={({ pressed }) => {
                            'worklet';
                            return {
                                scale: pressed ? 0.98 : 1,
                            };
                        }}
                        style={[styles.card, styles.shadowed, { backgroundColor: appColors.inputBg + '40' }]}
                    >
                        <View style={styles.volumeRow}>
                            <View>
                                <Text style={styles.bigValue}>
                                    {new Intl.NumberFormat().format(weeklyVolume)} <Text style={styles.unit}>kg</Text>
                                </Text>
                                {volumeChange !== 0 && (
                                    <View style={[styles.pillBadge, { backgroundColor: (volumeChange > 0 ? appColors.success : appColors.danger) + '15', marginTop: 8, alignSelf: 'flex-start' }]}>
                                        <Text style={[styles.pillBadgeText, { color: volumeChange > 0 ? appColors.success : appColors.danger }]}>
                                            {volumeChange > 0 ? '↑' : '↓'} {Math.abs(volumeChange).toFixed(1)}% vs last week
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Dumbbell size={24} color={appColors.textTertiary} />
                        </View>
                    </MotiPressable>
                </View>

                {/* 6. Top PR This Month (HIGHLIGHT) */}
                {topPrMonth && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MONTHLY HIGHLIGHT</Text>
                        <MotiPressable
                            onPress={() => { }}
                            animate={({ pressed }) => {
                                'worklet';
                                return {
                                    scale: pressed ? 0.98 : 1,
                                };
                            }}
                            style={[styles.prMonthCard, styles.shadowed]}
                        >
                            <Trophy size={20} color={appColors.accent} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.prMonthEx}>{topPrMonth.name}</Text>
                                <Text style={styles.prMonthLabel}>New Personal Best</Text>
                            </View>
                            <Text style={styles.prMonthWeight}>{topPrMonth.weight}kg</Text>
                        </MotiPressable>
                    </View>
                )}

            </ScrollView>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1, paddingHorizontal: 20 },

    // PR Badge
    prBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.accent + '15',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: appColors.accent + '25'
    },
    prBadgeText: { ...appTypography.small, color: appColors.accent, fontFamily: appFonts.black, letterSpacing: 0.5 },

    // CTA Button
    ctaBtnContainer: {
        backgroundColor: appColors.accent,
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 24,
        elevation: 6,
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    ctaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    ctaLeft: { flexDirection: 'row', alignItems: 'center' },
    ctaLabel: { ...appTypography.h1, fontSize: 18, color: '#000', fontFamily: appFonts.black, letterSpacing: 1 },

    sectionTitle: { ...appTypography.small, color: '#888', letterSpacing: 0.5, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },

    card: {
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    shadowed: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },

    consistencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    iconCircleSubtle: { backgroundColor: appColors.cardBg, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    progressBarContainer: { gap: 10 },
    progressBarBg: { height: 8, backgroundColor: appColors.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: appColors.accent, borderRadius: 4 },
    progressGoalLabel: { ...appTypography.small, color: appColors.textTertiary, fontSize: 11, fontFamily: appFonts.bold },

    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    bigValue: { ...appTypography.h1, fontSize: 36, color: '#fff' },
    unit: { ...appTypography.body, color: appColors.textSecondary, fontSize: 16 },
    streakText: { ...appTypography.body, color: appColors.accent, fontFamily: appFonts.black, marginTop: 4, fontSize: 12 },

    pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    pillBadgeText: { ...appTypography.small, fontFamily: appFonts.black, fontSize: 11 },

    section: { marginTop: 0 },
    trendGrid: { gap: 12 },
    trendItem: {
        backgroundColor: appColors.cardBg,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: appColors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    trendEx: { ...appTypography.body, color: appColors.textSecondary, fontFamily: appFonts.bold },
    trendValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    trendWeight: { ...appTypography.h2, color: '#fff', fontSize: 18 },

    volumeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    prMonthCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.accent + '08',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.accent + '20'
    },
    prMonthEx: { ...appTypography.h2, color: '#fff', fontSize: 18 },
    prMonthLabel: { ...appTypography.small, color: appColors.accent, fontSize: 12, marginTop: 2, fontFamily: appFonts.bold },
    prMonthWeight: { ...appTypography.h1, color: appColors.accent, fontSize: 24 },
});
