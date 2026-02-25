import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Trophy, Clock, Dumbbell, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { appColors, appFonts, appTypography } from '../theme';
import { BrandLogo } from './BrandLogo';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface WorkoutShareCardProps {
    workoutName: string;
    duration: number;
    totalVolume: number;
    topLift?: {
        name: string;
        weight: number;
    };
    date: string;
}

export const WorkoutShareCard: React.FC<WorkoutShareCardProps> = ({
    workoutName,
    duration,
    totalVolume,
    topLift,
    date,
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1A1A1A', '#0F0F0F']}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Header with Brand */}
                <View style={styles.header}>
                    <BrandLogo size={24} />
                    <View style={styles.dateChip}>
                        <Calendar size={12} color={appColors.textSecondary} />
                        <Text style={styles.dateText}>{date}</Text>
                    </View>
                </View>

                {/* Workout Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.workoutTitle}>{workoutName.toUpperCase()}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.completedSubtext}>WORKOUT COMPLETED</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Clock size={20} color={appColors.accent} style={styles.statIcon} />
                        <Text style={styles.statValue}>{duration}m</Text>
                        <Text style={styles.statLabel}>DURATION</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Dumbbell size={20} color={appColors.accent} style={styles.statIcon} />
                        <Text style={styles.statValue}>{new Intl.NumberFormat().format(totalVolume)}kg</Text>
                        <Text style={styles.statLabel}>VOLUME</Text>
                    </View>
                </View>

                {/* Top Lift Highlight */}
                {topLift && (
                    <View style={styles.topLiftContainer}>
                        <LinearGradient
                            colors={[appColors.accent + '20', 'transparent']}
                            style={styles.topLiftGradient}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                        />
                        <Trophy size={24} color={appColors.accent} fill={appColors.accent} />
                        <View style={styles.topLiftInfo}>
                            <Text style={styles.topLiftWeight}>{topLift.weight}kg</Text>
                            <Text style={styles.topLiftName}>BEST: {topLift.name.toUpperCase()}</Text>
                        </View>
                    </View>
                )}

                {/* Footer Decor */}
                <View style={styles.footer}>
                    <Text style={styles.footerTag}>LIFTLOG • PREMIUM FITNESS TRACKING</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#000',
    },
    card: {
        width: CARD_WIDTH,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    dateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    dateText: {
        fontFamily: appFonts.semiBold,
        fontSize: 11,
        color: appColors.textSecondary,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    workoutTitle: {
        fontFamily: appFonts.bold,
        fontSize: 28,
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 1,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: appColors.accent,
        marginVertical: 12,
        borderRadius: 2,
    },
    completedSubtext: {
        fontFamily: appFonts.semiBold,
        fontSize: 12,
        color: appColors.accent,
        letterSpacing: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontFamily: appFonts.bold,
        fontSize: 24,
        color: '#FFF',
    },
    statLabel: {
        fontFamily: appFonts.semiBold,
        fontSize: 10,
        color: appColors.textTertiary,
        letterSpacing: 1,
        marginTop: 2,
    },
    topLiftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden',
    },
    topLiftGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    topLiftInfo: {
        marginLeft: 16,
    },
    topLiftWeight: {
        fontFamily: appFonts.bold,
        fontSize: 20,
        color: appColors.accent,
    },
    topLiftName: {
        fontFamily: appFonts.semiBold,
        fontSize: 10,
        color: appColors.textSecondary,
        letterSpacing: 0.5,
    },
    footer: {
        alignItems: 'center',
        marginTop: 8,
    },
    footerTag: {
        fontFamily: appFonts.semiBold,
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.2)',
        letterSpacing: 1.5,
    },
});
