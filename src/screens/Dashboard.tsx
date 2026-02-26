import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Play, Trophy, Dumbbell, TrendingUp, ArrowUpRight, Minus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useAuth } from '../hooks/useAuth';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { triggerHaptic } from '../utils';
import { LinearGradient } from 'expo-linear-gradient';

import { useErrorToast } from '../components/ErrorToast';

import { useDashboardStats } from '../hooks/useProgress';
import { DashboardStatCard } from '../components/DashboardStatCard';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const { getDashboardStats } = useDashboardStats();
    const { showError } = useErrorToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch {
            showError('Failed to load dashboard. Check your connection.');
        } finally {
            setLoading(false);
        }
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
        weeklyVolume,
        prevWeekVolume,
        prsThisWeek,
        monthlyHighlight,
        allTimeTopPRs,
        recentPRNames = [],
    } = stats || {};

    const volumeChange = prevWeekVolume > 0 ? ((weeklyVolume - prevWeekVolume) / prevWeekVolume) * 100 : 0;

    const handleStartWorkout = () => {
        triggerHaptic('medium');
        navigation.navigate('SelectTemplate');
    };

    return (
        <AnimatedScreen style={styles.container}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 60, paddingBottom: 100 }}>

                {/* 🏆 PR Reward Badge */}
                {prsThisWeek > 0 && (
                    <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.prBadge}>
                        <Trophy size={16} color={appColors.accent} fill={appColors.accent} />
                        <Text style={styles.prBadgeText}>{prsThisWeek} NEW PR{prsThisWeek > 1 ? 'S' : ''} THIS WEEK</Text>
                    </MotiView>
                )}

                {/* PRIMARY ACTION */}
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }}>
                    <MotiPressable
                        onPress={handleStartWorkout}
                        animate={({ pressed }) => { 'worklet'; return { scale: pressed ? 0.97 : 1 }; }}
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

                {/* ═══ 1. MONTHLY HIGHLIGHT (moved right after CTA) ═══ */}
                {monthlyHighlight && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>MONTHLY HIGHLIGHT</Text>
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 500 }}
                        >
                            <View style={styles.highlightCard}>
                                <LinearGradient
                                    colors={[appColors.accent + '12', appColors.accent + '04']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.highlightIconBox}>
                                    <TrendingUp size={20} color={appColors.accent} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.highlightExName}>{monthlyHighlight.name}</Text>
                                    <Text style={styles.highlightSubLabel}>Most Improved This Month</Text>
                                </View>
                                <View style={styles.highlightRight}>
                                    <Text style={styles.highlightWeight}>{monthlyHighlight.weight}<Text style={styles.highlightWeightUnit}>kg</Text></Text>
                                    <View style={styles.highlightChangeBadge}>
                                        <ArrowUpRight size={10} color={appColors.accent} />
                                        <Text style={styles.highlightChangeText}>+{monthlyHighlight.change}kg</Text>
                                    </View>
                                </View>
                            </View>
                        </MotiView>
                    </View>
                )}

                {/* ═══ 2. VOLUME (with comparison) ═══ */}
                <DashboardStatCard
                    title="TOTAL VOLUME THIS WEEK"
                    value={new Intl.NumberFormat().format(weeklyVolume)}
                    unit="kg"
                    subtitle={prevWeekVolume > 0 ? `${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)}% vs last week` : undefined}
                    badge={volumeChange !== 0 ? {
                        text: `${volumeChange > 0 ? '↑' : '↓'} ${Math.abs(volumeChange).toFixed(1)}%`,
                        type: volumeChange > 0 ? 'success' : 'danger'
                    } : undefined}
                    icon={<Dumbbell size={24} color={appColors.textTertiary} />}
                />

                {/* ═══ 3. TOP 3 ALL-TIME PRs (with visual depth & indicators) ═══ */}
                {allTimeTopPRs && allTimeTopPRs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>TOP PERSONAL RECORDS</Text>
                        <View style={styles.prGrid}>
                            {allTimeTopPRs.map((pr: any, i: number) => {
                                const isRecent = recentPRNames.includes(pr.name);
                                const trophyColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32';
                                return (
                                    <MotiPressable
                                        key={i}
                                        onPress={() => {
                                            triggerHaptic('light');
                                            navigation.navigate('ExerciseDetail', {
                                                exerciseId: pr.id,
                                                exerciseName: pr.name
                                            });
                                        }}
                                        from={{ opacity: 0, scale: 0.9 }}
                                        animate={({ pressed }) => {
                                            'worklet';
                                            return {
                                                opacity: 1,
                                                scale: pressed ? 0.95 : 1,
                                            };
                                        }}
                                        transition={{ delay: i * 100 }}
                                        style={styles.prItem}
                                    >
                                        {/* Subtle top gradient for depth */}
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.03)', 'transparent']}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                                        />
                                        <View style={[styles.prIconBox, { backgroundColor: trophyColor + '18' }]}>
                                            <Trophy size={16} color={trophyColor} fill={trophyColor} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.prExName}>{pr.name}</Text>
                                            <View style={styles.prWeightRow}>
                                                <Text style={styles.prWeightValue}>{pr.weight}</Text>
                                                <Text style={styles.prWeightUnit}>kg</Text>
                                                <View style={styles.prTag}>
                                                    <Text style={styles.prTagText}>PR</Text>
                                                </View>
                                            </View>
                                        </View>
                                        {/* ═══ 6. Improvement indicator ═══ */}
                                        {isRecent ? (
                                            <View style={styles.indicatorNew}>
                                                <ArrowUpRight size={12} color={appColors.accent} />
                                            </View>
                                        ) : (
                                            <View style={styles.indicatorStale}>
                                                <Minus size={8} color={appColors.textTertiary} />
                                            </View>
                                        )}
                                    </MotiPressable>
                                );
                            })}
                        </View>
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
    section: { marginTop: 0 },

    // ═══ Monthly Highlight Card (new design) ═══
    highlightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.accent + '25',
        backgroundColor: appColors.cardBg,
    },
    highlightIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: appColors.accent + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightExName: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    highlightSubLabel: { ...appTypography.small, color: appColors.accent, fontSize: 11, marginTop: 2, fontFamily: appFonts.bold },
    highlightRight: { alignItems: 'flex-end' },
    highlightWeight: { ...appTypography.h1, color: '#fff', fontSize: 22 },
    highlightWeightUnit: { ...appTypography.body, color: appColors.textSecondary, fontSize: 14 },
    highlightChangeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: appColors.accent + '18',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
    },
    highlightChangeText: { ...appTypography.small, color: appColors.accent, fontSize: 10, fontFamily: appFonts.bold },

    // ═══ PR Cards (improved depth & hierarchy) ═══
    prGrid: { gap: 10 },
    prItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: appColors.border,
        gap: 14,
        overflow: 'hidden',
        // Subtle elevation for perceived depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    prIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prExName: { ...appTypography.body, color: appColors.textSecondary, fontFamily: appFonts.bold, fontSize: 13 },
    prWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 2 },
    prWeightValue: { ...appTypography.h1, color: '#fff', fontSize: 22 },
    prWeightUnit: { ...appTypography.body, color: appColors.textSecondary, fontSize: 13 },
    prTag: {
        backgroundColor: appColors.accent + '20',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
        marginLeft: 6,
    },
    prTagText: { ...appTypography.small, color: appColors.accent, fontSize: 9, fontFamily: appFonts.black, letterSpacing: 0.5 },

    // ═══ Improvement indicators ═══
    indicatorNew: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: appColors.accent + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorStale: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: appColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
