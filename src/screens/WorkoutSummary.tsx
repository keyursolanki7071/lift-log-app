import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Share2, Check } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MotiView } from 'moti';
import { appColors, appFonts } from '../theme';
import { WorkoutShareCard } from '../components/WorkoutShareCard';
import { AnimatedScreen } from '../components/AnimatedScreen';
import { triggerHaptic } from '../utils';

export const WorkoutSummaryScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { workoutData } = route.params;
    const viewShotRef = useRef<any>(null);

    const handleShare = async () => {
        try {
            triggerHaptic('medium');
            const uri = await viewShotRef.current.capture();
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Sharing is not available', 'Could not share the image on this device.');
                return;
            }
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share your workout progress!',
                UTI: 'public.png',
            });
        } catch (error) {
            console.error('Error sharing workout:', error);
            Alert.alert('Sharing Error', 'Something went wrong while trying to share your workout.');
        }
    };

    const handleDone = () => {
        triggerHaptic('light');
        navigation.popToTop();
    };

    return (
        <AnimatedScreen style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                >
                    <Text style={styles.title}>Session Complete!</Text>
                    <Text style={styles.subtitle}>You've put in the work today.</Text>
                </MotiView>

                {/* THE CARD TO CAPTURE */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 300 }}
                    style={styles.cardWrapper}
                >
                    <ViewShot
                        ref={viewShotRef}
                        options={{ format: 'png', quality: 1.0 }}
                        style={styles.viewShot}
                    >
                        <WorkoutShareCard
                            workoutName={workoutData.name}
                            duration={workoutData.duration}
                            totalVolume={workoutData.volume}
                            topLift={workoutData.topLift}
                            date={new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        />
                    </ViewShot>
                </MotiView>

                {/* ACTIONS */}
                <View style={styles.actions}>
                    <Button
                        mode="contained"
                        onPress={handleShare}
                        style={styles.shareButton}
                        labelStyle={styles.buttonLabel}
                        icon={({ color, size }) => <Share2 size={size} color={color} />}
                        buttonColor={appColors.accent}
                        textColor="#000"
                    >
                        SHARE AS IMAGE
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={handleDone}
                        style={styles.doneButton}
                        labelStyle={styles.doneLabel}
                        icon={({ color, size }) => <Check size={size} color={color} />}
                        textColor={appColors.textSecondary}
                    >
                        DONE
                    </Button>
                </View>
            </ScrollView>
        </AnimatedScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    title: {
        fontFamily: appFonts.bold,
        fontSize: 32,
        color: '#FFF',
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: appFonts.semiBold,
        fontSize: 16,
        color: appColors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    cardWrapper: {
        shadowColor: appColors.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    viewShot: {
        backgroundColor: '#000',
        borderRadius: 24,
    },
    actions: {
        width: '100%',
        paddingHorizontal: 40,
        marginTop: 40,
        gap: 16,
    },
    shareButton: {
        paddingVertical: 8,
        borderRadius: 16,
    },
    buttonLabel: {
        fontFamily: appFonts.bold,
        fontSize: 14,
        letterSpacing: 1,
    },
    doneButton: {
        borderRadius: 16,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    doneLabel: {
        fontFamily: appFonts.semiBold,
        fontSize: 14,
    },
});
