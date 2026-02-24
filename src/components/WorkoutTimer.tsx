import React, { useState, useEffect } from 'react';
import { Text, useTheme } from 'react-native-paper';

interface Props {
    startTime: Date;
}

export const WorkoutTimer: React.FC<Props> = ({ startTime }) => {
    const theme = useTheme();
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
        <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            ⏱ {formatted}
        </Text>
    );
};
