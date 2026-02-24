import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useProgress } from '../hooks/useProgress';
import { appColors, appFonts, appTypography } from '../theme';

const W = Dimensions.get('window').width;

export const ExerciseDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { exerciseId, exerciseName } = route.params;
    const { getExerciseHistory, getPersonalRecord } = useProgress();
    const [sessions, setSessions] = useState<any[]>([]);
    const [pr, setPr] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getExerciseHistory(exerciseId), getPersonalRecord(exerciseId)])
            .then(([h, p]) => { setSessions(h); setPr(p); setLoading(false); });
    }, [exerciseId]);

    if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;

    const chartData = sessions.length > 1 ? {
        labels: sessions.slice(-6).map((s: any) => { const d = new Date(s.sessionDate); return `${d.getDate()}/${d.getMonth() + 1}`; }),
        datasets: [{ data: sessions.slice(-6).map((s: any) => s.maxWeight || 0), strokeWidth: 2 }],
    } : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>{exerciseName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {pr > 0 && (
                    <Card style={styles.card} mode="contained">
                        <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Trophy size={32} color={appColors.accent} fill={appColors.accent + '20'} />
                            <View style={{ marginLeft: 14 }}>
                                <Text style={styles.prLabel}>PERSONAL RECORD</Text>
                                <Text style={styles.prValue}>{pr} kg</Text>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {chartData && chartData.labels.length > 0 && (
                    <Card style={styles.card} mode="contained">
                        <Card.Content>
                            <Text style={styles.cardTitle}>Weight Progression</Text>
                            <LineChart data={chartData} width={W - 72} height={200} bezier
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: appColors.cardBg,
                                    backgroundGradientTo: appColors.cardBg,
                                    decimalPlaces: 1,
                                    color: (opacity = 1) => appColors.accent,
                                    labelColor: (opacity = 1) => appColors.textSecondary,
                                    propsForDots: { r: '4', strokeWidth: '2', stroke: appColors.accent },
                                    propsForBackgroundLines: { strokeDasharray: '', stroke: appColors.border, strokeWidth: 0.5 },
                                    style: { borderRadius: 16 }
                                }}
                                style={{ borderRadius: 12, marginLeft: -16, paddingRight: 40 }}
                                verticalLabelRotation={0}
                                xLabelsOffset={-5}
                                fromZero
                                renderDotContent={({ x, y, index }) => (
                                    <View key={index} style={{ position: 'absolute', left: x - 15, top: y - 25, width: 30, alignItems: 'center' }}>
                                        <Text style={{ color: appColors.accent, fontSize: 10, fontWeight: '900' }}>
                                            {chartData.datasets[0].data[index]}
                                        </Text>
                                    </View>
                                )}
                            />
                        </Card.Content>
                    </Card>
                )}

                {sessions.length === 0 ? (
                    <Text style={{ color: appColors.textSecondary, textAlign: 'center', paddingVertical: 20 }}>No data yet</Text>
                ) : sessions.map((s: any, i: number) => (
                    <Card key={i} style={styles.card} mode="contained">
                        <Card.Content>
                            <View style={styles.sessionHeader}>
                                <View style={styles.dateGroup}>
                                    <Calendar size={16} color={appColors.accent} style={{ marginRight: 8 }} />
                                    <Text style={styles.sessionDate}>{new Date(s.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                </View>
                                <View style={styles.maxBadge}>
                                    <Text style={styles.maxText}>Max: {s.maxWeight || 0}kg</Text>
                                </View>
                            </View>

                            {s.sets?.map((set: any, j: number) => (
                                <View key={j} style={styles.setRow}>
                                    <View style={styles.setNum}>
                                        <Text style={styles.setNumText}>{j + 1}</Text>
                                    </View>
                                    <Text style={styles.setDataText}>
                                        <Text style={{ fontFamily: appFonts.bold }}>{set.weight || 0} kg</Text>
                                        <Text style={{ color: appColors.textTertiary, fontSize: 13 }}>  ×  </Text>
                                        <Text style={{ fontFamily: appFonts.bold }}>{set.reps || 0}</Text>
                                    </Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingRight: 20 },
    title: { ...appTypography.h1, color: '#fff', flex: 1, fontSize: 22 }, // H1
    scroll: { padding: 20, paddingBottom: 40 },
    card: { marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.cardBg },
    cardTitle: { ...appTypography.h2, color: '#fff', marginBottom: 14 }, // H2
    prLabel: { ...appTypography.small, color: appColors.accent, letterSpacing: 1, fontFamily: appFonts.bold },
    prValue: { ...appTypography.h1, color: '#fff', marginTop: 2, fontSize: 28 },
    sectionLabel: { ...appTypography.small, color: appColors.textTertiary, marginTop: 24, marginBottom: 12, letterSpacing: 1.5, fontFamily: appFonts.bold },
    sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: appColors.border + '50' },
    dateGroup: { flexDirection: 'row', alignItems: 'center' },
    sessionDate: { ...appTypography.h2, color: '#fff', fontSize: 16 },
    maxBadge: { backgroundColor: appColors.accent + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    maxText: { ...appTypography.small, color: appColors.accent, fontFamily: appFonts.bold, fontSize: 12 },
    setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    setNum: { width: 28, height: 28, borderRadius: 6, backgroundColor: appColors.inputBg, justifyContent: 'center', alignItems: 'center' },
    setNumText: { color: appColors.textSecondary, fontWeight: '800', fontSize: 12 },
    setDataText: { color: '#fff', fontSize: 16 },
});
