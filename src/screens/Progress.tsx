import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { useProgress } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';

export const ProgressScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { exercises, loading: loadingEx } = useExercises();
    const { getPersonalRecord } = useProgress();
    const [prs, setPrs] = useState<Record<string, number>>({});
    const [loadingPR, setLoadingPR] = useState(false);

    const fetchAllPRs = useCallback(async () => {
        if (!exercises || exercises.length === 0) return;
        setLoadingPR(true);
        const prMap: Record<string, number> = {};

        // Fetch PRs in parallel
        await Promise.all(exercises.map(async (ex) => {
            const pr = await getPersonalRecord(ex.id);
            prMap[ex.id] = pr;
        }));

        setPrs(prMap);
        setLoadingPR(false);
    }, [exercises, getPersonalRecord]);

    useEffect(() => {
        if (exercises.length > 0) {
            fetchAllPRs();
        }
    }, [exercises, fetchAllPRs]);

    const sections = useMemo(() => {
        if (!exercises || exercises.length === 0) return [];

        const grouped = exercises.reduce((acc: Record<string, any[]>, ex) => {
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
    }, [exercises]);

    const isLoading = loadingEx || (exercises.length > 0 && loadingPR);

    return (
        <AnimatedScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Progress</Text>
                <Text style={styles.sub}>Track your evolution on each exercise</Text>
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
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
                        </View>
                    )}
                    renderItem={({ item, index, section }) => {
                        const prWeight = prs[item.id] || 0;
                        const absoluteIndex = sections.slice(0, sections.indexOf(section)).reduce((sum, s) => sum + s.data.length, 0) + index;

                        return (
                            <AnimatedListItem index={absoluteIndex}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id, exerciseName: item.name })}
                                    style={styles.card}
                                >
                                    {/* Left: Icon */}
                                    <View style={styles.iconBox}>
                                        <Dumbbell size={20} color={appColors.accent} />
                                    </View>

                                    {/* Middle: Name & Muscle Tag */}
                                    <View style={styles.middleSection}>
                                        <Text style={styles.exName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.muscleTag}>Muscle: {item.muscle_group}</Text>
                                    </View>

                                    {/* Right: PR Info */}
                                    <View style={styles.rightSection}>
                                        <View style={styles.prContainer}>
                                            <Text style={styles.prWeight}>{prWeight > 0 ? `${prWeight}kg` : '—'}</Text>
                                            <Text style={styles.prLabel}>PR</Text>
                                        </View>
                                        <ChevronRight size={18} color={appColors.textTertiary} style={{ marginLeft: 8 }} />
                                    </View>
                                </TouchableOpacity>
                            </AnimatedListItem>
                        );
                    }}
                />
            )}
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 32 },
    sub: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontFamily: appFonts.black,
        letterSpacing: 2,
        fontSize: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 18,
        borderRadius: 22,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    middleSection: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 2,
    },
    exName: {
        ...appTypography.h2,
        color: '#fff',
        fontSize: 18,
        fontFamily: appFonts.bold,
        letterSpacing: 0.3
    },
    muscleTag: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 11,
        marginTop: 4,
        fontFamily: appFonts.semiBold,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    prContainer: {
        alignItems: 'flex-end',
    },
    prWeight: {
        ...appTypography.h1,
        color: appColors.accent,
        fontSize: 20,
        fontFamily: appFonts.black
    },
    prLabel: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 10,
        fontFamily: appFonts.bold,
        marginTop: -1
    },
});
