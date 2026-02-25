import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { appColors, appFonts } from '../theme';

interface Props {
    startTime: Date;
    isRestActive?: boolean;
}

export const WorkoutTimer: React.FC<Props> = ({ startTime, isRestActive = false }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;

    const formatted = hours > 0
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
        <View style={styles.wrap}>
            {/* Subtle pulse ring when rest is active */}
            {isRestActive && (
                <MotiView
                    from={{ opacity: 0.4, scale: 0.9 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    transition={{
                        type: 'timing',
                        duration: 1500,
                        loop: true,
                    }}
                    style={styles.pulse}
                />
            )}
            <Text style={[styles.timer, isRestActive && styles.timerRest]}>{formatted}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: appColors.accent,
    },
    timer: {
        color: '#fff',
        fontSize: 26,
        fontFamily: appFonts.black,
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    timerRest: {
        color: appColors.accent,
    },
});
