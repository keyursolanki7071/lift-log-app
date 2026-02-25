import React from 'react';
import { Text } from 'react-native-paper';
import { AppModal } from './AppModal';
import { appColors, appFonts, appTypography } from '../theme';

interface SmartUpdate {
    exerciseId: string;
    exerciseName: string;
    actual: number;
    default: number;
}

interface Props {
    visible: boolean;
    updates: SmartUpdate[];
    onAccept: (exerciseId: string, newDefault: number) => void;
    onSkip: (exerciseId: string) => void;
    onClose: () => void;
}

export const SmartSetsPrompt: React.FC<Props> = ({
    visible, updates, onAccept, onSkip, onClose,
}) => {
    if (!visible || updates.length === 0) return null;

    const current = updates[0];

    return (
        <AppModal
            visible={visible}
            onDismiss={onClose}
            title="🧠 Smart Update"
            actions={[
                { label: `Update to ${current.actual}`, onPress: () => onAccept(current.exerciseId, current.actual), variant: 'primary' as const },
                { label: 'Skip', onPress: () => onSkip(current.exerciseId), variant: 'secondary' as const },
            ]}
        >
            <Text style={{ color: '#fff', fontSize: 15, fontFamily: appFonts.regular, lineHeight: 22, marginBottom: 4 }}>
                Update default sets for <Text style={{ color: appColors.accent, fontFamily: appFonts.bold }}>{current.exerciseName}</Text>?
            </Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 13, fontFamily: appFonts.regular, lineHeight: 20 }}>
                You performed <Text style={{ color: appColors.accentAlt, fontFamily: appFonts.bold }}>{current.actual} sets</Text> (previous default: {current.default}).
            </Text>
        </AppModal>
    );
};
