import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight, Dumbbell } from 'lucide-react-native';
import { useExercises } from '../hooks/useExercises';
import { appColors, appFonts, appTypography } from '../theme';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { AnimatedListItem } from '../components/AnimatedListItem';

export const ProgressScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { exercises } = useExercises();

    return (
        <AnimatedScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Progress</Text>
                <Text style={styles.sub}>Track your evolution on each exercise</Text>
            </View>

            <FlatList data={exercises} keyExtractor={item => item.id} contentContainerStyle={styles.list}
                renderItem={({ item, index }) => (
                    <AnimatedListItem index={index}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id, exerciseName: item.name })}
                            style={styles.card}
                        >
                            <View style={styles.iconBox}>
                                <Dumbbell size={20} color={appColors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exName}>{item.name}</Text>
                                <View style={styles.badgeRow}>
                                    <View style={styles.muscleBadge}>
                                        <Text style={styles.muscleText}>{item.muscle_group}</Text>
                                    </View>
                                </View>
                            </View>
                            <ChevronRight size={20} color={appColors.textTertiary} />
                        </TouchableOpacity>
                    </AnimatedListItem>
                )} />
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { ...appTypography.h1, color: '#fff', fontSize: 32 }, // Page Title override
    sub: { ...appTypography.small, color: appColors.textSecondary, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: appColors.border
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: appColors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    exName: { ...appTypography.h2, color: '#fff', fontSize: 16 }, // Adjusted to H2 logic but keep slightly smaller for list
    badgeRow: { flexDirection: 'row', gap: 6 },
    muscleBadge: { backgroundColor: appColors.accent + '1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    muscleText: { ...appTypography.small, color: appColors.accent, fontFamily: appFonts.black, textTransform: 'uppercase', fontSize: 10 },
});
