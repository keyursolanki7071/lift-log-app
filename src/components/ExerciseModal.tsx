import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { AppModal } from './AppModal';
import { appColors, appFonts, appTypography } from '../theme';

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
            onSave(trimmedName, muscleGroup, Math.max(1, Math.min(20, setsNum || 3)));
        } else {
            onSave(trimmedName, muscleGroup, setsNum);
        }
    };

    return (
        <AppModal
            visible={visible}
            onDismiss={onClose}
            title={title}
            actions={[
                { label: 'Save', onPress: handleSave, variant: 'primary', disabled: !name.trim() },
                { label: 'Cancel', onPress: onClose, variant: 'secondary' },
            ]}
        >
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

            <Text style={styles.label}>Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
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
                                fontFamily: muscleGroup === mg ? appFonts.bold : appFonts.regular,
                                color: muscleGroup === mg ? '#000' : appColors.textSecondary
                            }}
                        >
                            {mg}
                        </Button>
                    ))}
                </View>
            </ScrollView>

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
        </AppModal>
    );
};

const styles = StyleSheet.create({
    label: {
        ...appTypography.small,
        color: appColors.textTertiary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    input: {
        marginBottom: 16,
        backgroundColor: appColors.bg,
    },
    outline: {
        borderRadius: 10,
    },
    chipGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    chipBtn: {
        borderRadius: 8,
        minWidth: 80,
    },
});
