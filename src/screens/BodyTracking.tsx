import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, TextInput, Button, Chip } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Scale, Ruler } from 'lucide-react-native';
import { useBodyMetrics } from '../hooks/useBodyMetrics';
import { appColors, appTypography } from '../theme';

const W = Dimensions.get('window').width;

export const BodyTrackingScreen: React.FC = () => {
    const { metrics, logMetric } = useBodyMetrics();
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const wVal = parseFloat(weight);
        if (isNaN(wVal) || wVal <= 0 || wVal > 500) return;

        const waistVal = waist ? parseFloat(waist) : null;
        if (waistVal !== null && (isNaN(waistVal) || waistVal <= 0 || waistVal > 300)) return;

        setSaving(true);
        await logMetric(wVal, waistVal, null);
        setWeight(''); setWaist(''); setSaving(false);
    };

    const chartData = metrics.length > 1 ? {
        labels: metrics.slice(-6).reverse().map(m => { const d = new Date(m.date); return `${d.getDate()}/${d.getMonth() + 1}`; }),
        datasets: [{ data: metrics.slice(-6).reverse().map(m => m.weight || 0), strokeWidth: 3 }],
    } : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Body Tracking</Text>
                <Text style={styles.sub}>Track your physical transformation</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Card style={styles.card} mode="contained">
                    <Card.Content style={{ padding: 20 }}>
                        <Text style={styles.cardTitle}>Log Today</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                label="Weight (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineStyle={styles.outline}
                                outlineColor={appColors.border}
                                activeOutlineColor={appColors.accent}
                                textColor="#fff"
                                placeholderTextColor={appColors.textTertiary}
                            />
                            <TextInput
                                label="Waist (cm)"
                                value={waist}
                                onChangeText={setWaist}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                outlineStyle={styles.outline}
                                outlineColor={appColors.border}
                                activeOutlineColor={appColors.accent}
                                textColor="#fff"
                                placeholderTextColor={appColors.textTertiary}
                            />
                        </View>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={saving}
                            disabled={saving || !weight}
                            buttonColor={appColors.accent}
                            textColor="#000"
                            style={styles.saveBtn}
                            contentStyle={{ height: 56 }}
                            labelStyle={{ fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}
                        >
                            Save Entry
                        </Button>
                    </Card.Content>
                </Card>

                {chartData && (
                    <Card style={styles.card} mode="contained">
                        <Card.Content style={{ padding: 16 }}>
                            <Text style={styles.cardTitle}>Weight Trend</Text>
                            <LineChart
                                data={chartData}
                                width={W - 72}
                                height={200}
                                bezier
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: appColors.cardBg,
                                    backgroundGradientTo: appColors.cardBg,
                                    decimalPlaces: 1,
                                    color: (opacity = 1) => appColors.accent,
                                    labelColor: (opacity = 1) => appColors.textSecondary,
                                    propsForDots: { r: '4', strokeWidth: '2', stroke: appColors.accent },
                                    propsForBackgroundLines: { strokeDasharray: '', stroke: appColors.border, strokeWidth: 0.5 },
                                    fillShadowGradient: appColors.accent,
                                    fillShadowGradientOpacity: 0.1,
                                }}
                                style={{ borderRadius: 12, marginTop: 12, marginLeft: -16, paddingRight: 40 }}
                                withInnerLines={true}
                                withOuterLines={false}
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

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Entries</Text>
                </View>

                {metrics.slice(0, 10).map((m, i) => (
                    <View key={m.id || i} style={styles.entryCard}>
                        <View style={styles.dateBox}>
                            <Text style={styles.dateDay}>{new Date(m.date).getDate()}</Text>
                            <Text style={styles.dateMonth}>{new Date(m.date).toLocaleDateString('en', { month: 'short' })}</Text>
                        </View>
                        <View style={styles.entryValues}>
                            <View style={styles.valueItem}>
                                <Scale size={16} color={appColors.accent} />
                                <Text style={styles.valueText}>{m.weight}kg</Text>
                            </View>
                            {m.waist && (
                                <View style={styles.valueItem}>
                                    <Ruler size={16} color={appColors.accent} />
                                    <Text style={styles.valueText}>{m.waist}cm</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 32 },
    sub: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4 },
    scroll: { padding: 20, paddingBottom: 60 },

    card: {
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: appColors.cardBg,
        overflow: 'hidden'
    },
    cardTitle: { ...appTypography.h2, color: '#fff', fontSize: 16, marginBottom: 20 },
    inputRow: { flexDirection: 'row', gap: 12 },
    input: { backgroundColor: appColors.bg, height: 56, flex: 1 },
    outline: { borderRadius: 12 },
    saveBtn: { borderRadius: 12, marginTop: 20 },

    sectionHeader: { marginTop: 12, marginBottom: 16 },
    sectionTitle: { ...appTypography.h2, fontSize: 14, color: appColors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },

    entryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: appColors.border
    },
    dateBox: { alignItems: 'center', width: 44, borderRightWidth: 1, borderRightColor: appColors.border, marginRight: 16, paddingRight: 4 },
    dateDay: { ...appTypography.h1, color: '#fff', fontSize: 20 },
    dateMonth: { ...appTypography.small, color: appColors.textSecondary, fontSize: 10, textTransform: 'uppercase' },
    entryValues: { flex: 1, flexDirection: 'row', gap: 20 },
    valueItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    valueText: { ...appTypography.h2, color: '#fff', fontSize: 16 },
});
