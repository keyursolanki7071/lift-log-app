import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Portal, Dialog } from 'react-native-paper';
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
        <Portal>
            <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
                <Dialog.Title style={styles.dialogTitle}>🧠 Smart Update</Dialog.Title>
                <Dialog.Content>
                    <Text style={styles.label}>
                        Update default sets for <Text style={styles.accentText}>{current.exerciseName}</Text>?
                    </Text>
                    <Text style={styles.description}>
                        You performed <Text style={styles.accentTextSecondary}>{current.actual} sets</Text> (previous default: {current.default}).
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => onSkip(current.exerciseId)} textColor={appColors.textSecondary} labelStyle={{ fontFamily: appFonts.bold }}>Skip</Button>
                    <Button
                        mode="contained"
                        onPress={() => onAccept(current.exerciseId, current.actual)}
                        buttonColor={appColors.accent}
                        textColor="#000"
                        labelStyle={{ fontFamily: appFonts.black }}
                        style={{ borderRadius: 8 }}
                    >
                        Update to {current.actual}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: { backgroundColor: appColors.cardBg, borderRadius: 12, paddingBottom: 8 },
    dialogTitle: { ...appTypography.h2, color: '#fff', fontSize: 22, marginTop: 8 },
    label: { ...appTypography.body, color: '#fff', fontSize: 16, marginBottom: 10, lineHeight: 22 },
    description: { ...appTypography.body, color: appColors.textSecondary, fontSize: 14, lineHeight: 20 },
    accentText: { color: appColors.accent, fontFamily: appFonts.bold },
    accentTextSecondary: { color: appColors.accentAlt, fontFamily: appFonts.bold },
});
