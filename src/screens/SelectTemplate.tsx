import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, ClipboardList, PlayCircle } from 'lucide-react-native';
import { useTemplates } from '../hooks/useTemplates';
import { useWorkout } from '../hooks/useWorkout';
import { appColors, appTypography } from '../theme';
import { TouchableOpacity } from 'react-native';

export const SelectTemplateScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { templates, loading: templatesLoading, fetchTemplateExercises } = useTemplates();
    const { startWorkout, loading: startingWorkout } = useWorkout();

    const handleSelect = async (templateId: string) => {
        const templateExercises = await fetchTemplateExercises(templateId);
        if (templateExercises.length === 0) return;
        const result = await startWorkout(templateId, templateExercises);
        if (!result.error) navigation.replace('ActiveWorkout');
    };

    if (templatesLoading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={appColors.accent} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Choose Workout</Text>
            </View>

            {startingWorkout && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={appColors.accent} />
                    <Text style={styles.overlayText}>Starting workout...</Text>
                </View>
            )}

            <FlatList data={templates} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <ClipboardList size={48} color={appColors.textTertiary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>No workouts yet</Text>
                        <Text style={styles.emptySub}>Create your first workout in the Workouts tab</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Card style={styles.card} mode="contained" onPress={() => handleSelect(item.id)} disabled={startingWorkout}>
                        <Card.Content style={styles.cardRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <Text style={{ color: appColors.textTertiary, fontSize: 12, marginTop: 3 }}>Tap to start</Text>
                            </View>
                            <View style={{ padding: 4 }}>
                                <PlayCircle size={32} color={appColors.accent} fill={appColors.accent + '20'} />
                            </View>
                        </Card.Content>
                    </Card>
                )} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 8 },
    backBtn: { padding: 12 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 24 },
    list: { paddingHorizontal: 20 },
    card: { marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.cardBg },
    cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    cardName: { ...appTypography.h2, color: '#fff' },
    empty: { alignItems: 'center', paddingTop: 100 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: appColors.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: appColors.border },
    emptyTitle: { ...appTypography.h2, color: '#fff', fontSize: 20 },
    emptySub: { ...appTypography.body, color: appColors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
    overlayText: { ...appTypography.body, color: '#fff', marginTop: 16 },
});
