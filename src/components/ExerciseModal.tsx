import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
    Portal, Modal, TextInput, Button, Text,
} from 'react-native-paper';
import { appColors, appTypography } from '../theme';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string, muscleGroup: string, defaultSets: number) => void;
    title: string;
    initialName?: string;
    initialCategory?: string;
    initialDefaultSets?: number;
}

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio', 'Other'];

export const ExerciseModal: React.FC<Props> = ({
    visible, onClose, onSave, title,
    initialName, initialCategory, initialDefaultSets,
}) => {
    const [name, setName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState('Other');
    const [defaultSets, setDefaultSets] = useState('3');

    useEffect(() => {
        if (visible) {
            setName(initialName || '');
            setMuscleGroup(initialCategory || 'Other');
            setDefaultSets(String(initialDefaultSets || 3));
        }
    }, [visible]);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const setsNum = parseInt(defaultSets);
        if (isNaN(setsNum) || setsNum < 1 || setsNum > 20) {
            // We could show an alert here, but for now we'll just fall back to 3 
            // but the UI should ideally prevent 0. 
            // Let's at least ensure it's a positive integer for the actual save.
            onSave(trimmedName, muscleGroup, Math.max(1, Math.min(20, setsNum || 3)));
        } else {
            onSave(trimmedName, muscleGroup, setsNum);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onClose}
                contentContainerStyle={[styles.modal, { backgroundColor: appColors.cardBg }]}
            >
                <Text style={styles.modalTitle}>
                    {title}
                </Text>

                <TextInput
                    label="Exercise name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    outlineStyle={styles.outline}
                    outlineColor={appColors.border}
                    activeOutlineColor={appColors.accent}
                    textColor="#fff"
                    autoFocus
                />

                <Text style={styles.label}>
                    Muscle Group
                </Text>
                <View style={styles.chipGrid}>
                    {muscleGroups.map(mg => (
                        <Button
                            key={mg}
                            mode={muscleGroup === mg ? 'contained' : 'outlined'}
                            compact
                            onPress={() => setMuscleGroup(mg)}
                            style={[
                                styles.chipBtn,
                                muscleGroup === mg ? { backgroundColor: appColors.accent } : { borderColor: appColors.border }
                            ]}
                            labelStyle={{
                                fontSize: 11,
                                fontFamily: muscleGroup === mg ? 'Inter-Bold' : 'Inter-Regular',
                                color: muscleGroup === mg ? '#000' : appColors.textSecondary
                            }}
                        >
                            {mg}
                        </Button>
                    ))}
                </View>

                <TextInput
                    label="Default sets"
                    value={defaultSets}
                    onChangeText={setDefaultSets}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    outlineStyle={styles.outline}
                    outlineColor={appColors.border}
                    activeOutlineColor={appColors.accent}
                    textColor="#fff"
                    left={<TextInput.Icon icon="counter" color={appColors.textTertiary} />}
                />

                <View style={styles.actions}>
                    <Button mode="text" onPress={onClose} textColor={appColors.textSecondary} labelStyle={{ fontFamily: 'Inter-Bold' }}>Cancel</Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        disabled={!name.trim()}
                        buttonColor={appColors.accent}
                        textColor="#000"
                        labelStyle={{ fontFamily: 'Inter-Black' }}
                        style={{ borderRadius: 8 }}
                    >
                        Save
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 20,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: appColors.border,
    },
    modalTitle: {
        ...appTypography.h2,
        color: '#fff',
        fontSize: 22,
        marginBottom: 20,
    },
    label: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    input: {
        marginBottom: 20,
        backgroundColor: appColors.bg,
    },
    outline: {
        borderRadius: 10,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    chipBtn: {
        borderRadius: 8,
        minWidth: 80,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 10,
    },
});
