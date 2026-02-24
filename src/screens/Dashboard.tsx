import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Play, Trophy, Dumbbell, Flame, TrendingUp, Calendar, Clock, BarChart2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProgress } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';
import { MotiView } from 'moti';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const { getDashboardStats } = useProgress();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (user) fetchStats(); }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={appColors.accent} />
            </View>
        );
    }

    const { weeklyWorkouts, weeklyVolume, streak, lastWorkout, bodyWeight, bodyWeightChange, trends, topPrMonth } = stats || {};

    return (
        <AnimatedScreen style={styles.container}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}>
                {/* 1. Big Start Workout Button */}
                <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('SelectTemplate')}
                        buttonColor={appColors.accent}
                        textColor="#000"
                        style={styles.ctaBtn}
                        contentStyle={styles.ctaInner}
                        labelStyle={styles.ctaLabel}
                        icon={() => <Play size={24} color="#000" fill="#000" />}
                    >
                        START WORKOUT
                    </Button>
                </MotiView>

                {/* 2. Body Weight */}
                <View style={styles.metricRow}>
                    <View style={[styles.card, { flex: 1 }]}>
                        <View style={styles.cardHeader}>
                            <TrendingUp size={16} color={appColors.textTertiary} />
                            <Text style={styles.cardLabel}>BODY WEIGHT</Text>
                        </View>
                        <View style={styles.valueRow}>
                            <Text style={styles.bigValue}>{bodyWeight || '—'}</Text>
                            <Text style={styles.unit}>kg</Text>
                            {bodyWeightChange !== 0 && (
                                <Text style={[styles.changeText, { color: bodyWeightChange < 0 ? appColors.success : appColors.danger }]}>
                                    {bodyWeightChange < 0 ? '↓' : '↑'} {Math.abs(bodyWeightChange).toFixed(1)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* 3. Weekly Consistency */}
                <View style={styles.metricRow}>
                    <View style={[styles.card, { flex: 1 }]}>
                        <View style={styles.cardHeader}>
                            <Flame size={18} color={streak > 0 ? appColors.accent : appColors.textTertiary} fill={streak > 0 ? appColors.accent : 'transparent'} />
                            <Text style={styles.cardLabel}>WEEKLY CONSISTENCY</Text>
                        </View>
                        <View style={styles.valueRow}>
                            <Text style={styles.bigValue}>{weeklyWorkouts}</Text>
                            <Text style={styles.unit}>sessions this week</Text>
                        </View>
                        {streak > 0 && (
                            <Text style={styles.streakText}>🔥 {streak} week streak</Text>
                        )}
                    </View>
                </View>

                {/* 4. Last Workout Summary */}
                {lastWorkout && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>LAST WORKOUT</Text>
                        <TouchableOpacity
                            style={styles.summaryCard}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('History')}
                        >
                            <View style={styles.summaryContent}>
                                <View style={styles.summaryMain}>
                                    <Text style={styles.summaryName}>{lastWorkout.name}</Text>
                                    <View style={styles.summaryMeta}>
                                        <View style={styles.metaItem}>
                                            <Clock size={14} color={appColors.textSecondary} />
                                            <Text style={styles.metaText}>{lastWorkout.duration} min</Text>
                                        </View>
                                        {lastWorkout.prs > 0 && (
                                            <View style={[styles.metaItem, styles.prHighlight]}>
                                                <Trophy size={14} color={appColors.accent} />
                                                <Text style={[styles.metaText, { color: appColors.accent, fontFamily: appFonts.bold }]}>
                                                    +{lastWorkout.prs} PR{lastWorkout.prs > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <BarChart2 size={24} color={appColors.borderLight} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 5. Top PR This Month */}
                {topPrMonth && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>TOP PR THIS MONTH</Text>
                        <View style={styles.prMonthCard}>
                            <Trophy size={20} color={appColors.accent} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.prMonthEx}>{topPrMonth.name}</Text>
                                <Text style={styles.prMonthLabel}>New Personal Best</Text>
                            </View>
                            <Text style={styles.prMonthWeight}>{topPrMonth.weight}kg</Text>
                        </View>
                    </View>
                )}

                {/* 5. Strength Trend Indicator */}
                {trends && trends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>STRENGTH TRENDS (30D)</Text>
                        <View style={styles.trendGrid}>
                            {trends.map((t: any, i: number) => (
                                <View key={i} style={styles.trendItem}>
                                    <Text style={styles.trendEx}>{t.name}</Text>
                                    <View style={styles.trendValueRow}>
                                        <Text style={styles.trendWeight}>{t.currentMax}kg</Text>
                                        {t.change !== 0 && (
                                            <Text style={[styles.trendChange, { color: t.change > 0 ? appColors.success : appColors.danger }]}>
                                                {t.change > 0 ? '↑' : '↓'} {Math.abs(t.change)}kg
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Bonus: Total Volume This Week */}
                <View style={[styles.card, { marginTop: 20, borderLeftWidth: 0, backgroundColor: appColors.inputBg + '40' }]}>
                    <Text style={[styles.cardLabel, { marginBottom: 6 }]}>TOTAL VOLUME THIS WEEK</Text>
                    <Text style={styles.bigValue}>
                        {new Intl.NumberFormat().format(weeklyVolume)} <Text style={{ fontSize: 16, color: appColors.textTertiary }}>kg</Text>
                    </Text>
                </View>

            </ScrollView>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1, paddingHorizontal: 20 },

    ctaBtn: { borderRadius: 16, marginBottom: 24, elevation: 8, shadowColor: appColors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    ctaInner: { height: 74 },
    ctaLabel: { ...appTypography.h1, fontSize: 20, letterSpacing: 2, fontFamily: appFonts.black },

    metricRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    card: {
        backgroundColor: appColors.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardLabel: { ...appTypography.small, color: appColors.textTertiary, fontFamily: appFonts.bold, letterSpacing: 1, textTransform: 'uppercase' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    bigValue: { ...appTypography.h1, fontSize: 32, color: '#fff' },
    unit: { ...appTypography.body, color: appColors.textSecondary, fontSize: 14 },
    changeText: { ...appTypography.body, fontFamily: appFonts.bold, fontSize: 14, marginLeft: 8 },
    streakText: { ...appTypography.body, color: appColors.accent, fontFamily: appFonts.black, marginTop: 8, fontSize: 14 },

    section: { marginTop: 24 },
    sectionTitle: { ...appTypography.small, color: appColors.textTertiary, marginBottom: 12, letterSpacing: 1.5, fontFamily: appFonts.bold },

    summaryCard: { backgroundColor: appColors.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: appColors.border },
    summaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryMain: { flex: 1 },
    summaryName: { ...appTypography.h2, color: '#fff', fontSize: 18, marginBottom: 8 },
    summaryMeta: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { ...appTypography.small, color: appColors.textSecondary, fontSize: 13 },
    prHighlight: { backgroundColor: appColors.accent + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    trendGrid: { gap: 10 },
    trendItem: { backgroundColor: appColors.cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: appColors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trendEx: { ...appTypography.body, color: appColors.textSecondary, fontFamily: appFonts.bold },
    trendValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    trendWeight: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    trendChange: { ...appTypography.small, fontFamily: appFonts.bold, fontSize: 13 },

    prMonthCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.accent + '15',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.accent + '30'
    },
    prMonthEx: { ...appTypography.h2, color: '#fff', fontSize: 18 },
    prMonthLabel: { ...appTypography.small, color: appColors.accent, fontSize: 12, marginTop: 2, fontFamily: appFonts.bold },
    prMonthWeight: { ...appTypography.h1, color: appColors.accent, fontSize: 24 },
});
