import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { WorkoutSession, SessionExercise, WorkoutSet, TemplateExercise } from '../types';

interface ActiveExercise extends SessionExercise {
    sets: WorkoutSet[];
    exerciseName: string;
    defaultSets: number;
}

interface WorkoutContextType {
    session: WorkoutSession | null;
    activeExercises: ActiveExercise[];
    templateName: string | null;
    loading: boolean;
    isFinishing: boolean;
    error: string | null;
    startWorkout: (templateId: string, templateExercises: TemplateExercise[]) => Promise<{ error: string | null; session?: WorkoutSession }>;
    updateSet: (setId: string, weight: number | null, reps: number | null) => Promise<{ error: string | null }>;
    addSet: (sessionExerciseId: string) => Promise<{ error: string | null }>;
    deleteSet: (sessionExerciseId: string, setId: string) => Promise<{ error: string | null }>;
    finishWorkout: (durationMinutes: number) => Promise<{ error: string | null; smartUpdates?: any[] }>;
    cancelWorkout: () => Promise<{ error: string | null }>;
    addExerciseToSession: (exerciseId: string, exerciseName: string, defaultSets: number) => Promise<{ error: string | null }>;
    removeExerciseFromSession: (sessionExerciseId: string) => Promise<{ error: string | null }>;
    clearWorkout: () => void;
    updateDefaultSets: (exerciseId: string, newDefault: number) => Promise<{ error: string | null }>;
    deleteSession: (sessionId: string) => Promise<{ error: string | null }>;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
    const [templateName, setTemplateName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startWorkout = async (templateId: string, templateExercises: TemplateExercise[]) => {
        if (!user) return { error: 'Not authenticated' };
        setLoading(true);
        setError(null);

        try {
            const { data: sessionData, error: sessionErr } = await supabase
                .from('workout_sessions')
                .insert({ user_id: user.id, template_id: templateId, status: 'active' })
                .select()
                .single();

            if (sessionErr) throw sessionErr;
            setSession(sessionData);

            const exercises: ActiveExercise[] = [];

            for (const te of templateExercises) {
                const { data: seData, error: seErr } = await supabase
                    .from('session_exercises')
                    .insert({ workout_session_id: sessionData.id, exercise_id: te.exercise_id })
                    .select()
                    .single();

                if (seErr) throw seErr;

                const defaultSets = te.exercise?.default_sets || 3;
                const setsToCreate = Array.from({ length: defaultSets }, (_, i) => ({
                    session_exercise_id: seData.id,
                    set_number: i + 1,
                    weight: null,
                    reps: null,
                }));

                const { data: setsData, error: setsErr } = await supabase
                    .from('sets')
                    .insert(setsToCreate)
                    .select();

                if (setsErr) throw setsErr;

                exercises.push({
                    ...seData,
                    sets: setsData || [],
                    exerciseName: te.exercise?.name || 'Unknown',
                    defaultSets: defaultSets,
                });
            }

            setActiveExercises(exercises);

            // Fetch template name 
            const { data: tmplData } = await supabase
                .from('workout_templates')
                .select('name')
                .eq('id', templateId)
                .single();
            setTemplateName(tmplData?.name || 'Custom Workout');

            setLoading(false);
            return { error: null, session: sessionData };
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return { error: err.message };
        }
    };

    const updateSet = async (setId: string, weight: number | null, reps: number | null) => {
        try {
            const { error: err } = await supabase
                .from('sets')
                .update({ weight, reps })
                .eq('id', setId);

            if (err) throw err;

            setActiveExercises(prev =>
                prev.map(ex => ({
                    ...ex,
                    sets: ex.sets.map(s => s.id === setId ? { ...s, weight, reps } : s),
                }))
            );
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to update set' };
        }
    };

    const addSet = async (sessionExerciseId: string) => {
        const exercise = activeExercises.find(e => e.id === sessionExerciseId);
        if (!exercise) return { error: 'Exercise not found' };

        try {
            const maxSetNumber = Math.max(...exercise.sets.map(s => s.set_number), 0);

            const { data, error: err } = await supabase
                .from('sets')
                .insert({
                    session_exercise_id: sessionExerciseId,
                    set_number: maxSetNumber + 1,
                    weight: null,
                    reps: null,
                })
                .select()
                .single();

            if (err) throw err;

            setActiveExercises(prev =>
                prev.map(ex =>
                    ex.id === sessionExerciseId
                        ? { ...ex, sets: [...ex.sets, data] }
                        : ex
                )
            );
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to add set' };
        }
    };

    const deleteSet = async (sessionExerciseId: string, setId: string) => {
        try {
            const { error: err } = await supabase
                .from('sets')
                .delete()
                .eq('id', setId);

            if (err) throw err;

            setActiveExercises(prev =>
                prev.map(ex =>
                    ex.id === sessionExerciseId
                        ? {
                            ...ex,
                            sets: ex.sets
                                .filter(s => s.id !== setId)
                                .map((s, i) => ({ ...s, set_number: i + 1 })),
                        }
                        : ex
                )
            );
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to delete set' };
        }
    };

    const finishWorkout = async (durationMinutes: number) => {
        if (!session) return { error: 'No active session' };
        setIsFinishing(true);

        try {
            const { error: err } = await supabase
                .from('workout_sessions')
                .update({ status: 'completed', duration_minutes: durationMinutes })
                .eq('id', session.id);

            if (err) throw err;

            const smartUpdates: { exerciseId: string; exerciseName: string; actual: number; default: number }[] = [];

            for (const ex of activeExercises) {
                const filledSets = ex.sets.filter(s => s.weight !== null && s.reps !== null).length;
                if (filledSets > ex.defaultSets) {
                    smartUpdates.push({
                        exerciseId: ex.exercise_id,
                        exerciseName: ex.exerciseName,
                        actual: filledSets,
                        default: ex.defaultSets,
                    });
                }
            }

            return { error: null, smartUpdates };
        } catch (err: any) {
            setIsFinishing(false);
            return { error: err.message || 'Failed to finish workout' };
        }
    };

    const cancelWorkout = async () => {
        if (!session) return { error: 'No active session' };
        try {
            const { error } = await supabase
                .from('workout_sessions')
                .delete()
                .eq('id', session.id);

            if (error) throw error;
            clearWorkout();
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to cancel workout' };
        }
    };

    const addExerciseToSession = async (exerciseId: string, exerciseName: string, defaultSets: number) => {
        if (!session) return { error: 'No active session' };

        try {
            const { data: seData, error: seErr } = await supabase
                .from('session_exercises')
                .insert({ workout_session_id: session.id, exercise_id: exerciseId })
                .select()
                .single();

            if (seErr) throw seErr;

            const setsToCreate = Array.from({ length: defaultSets }, (_, i) => ({
                session_exercise_id: seData.id,
                set_number: i + 1,
                weight: null,
                reps: null,
            }));

            const { data: setsData, error: setsErr } = await supabase
                .from('sets')
                .insert(setsToCreate)
                .select();

            if (setsErr) throw setsErr;

            const newEx: ActiveExercise = {
                ...seData,
                sets: setsData || [],
                exerciseName,
                defaultSets,
            };

            setActiveExercises(prev => [...prev, newEx]);
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to add exercise' };
        }
    };

    const removeExerciseFromSession = async (sessionExerciseId: string) => {
        if (!session) return { error: 'No active session' };

        try {
            // 1. Delete sets for this exercise
            const { error: setsErr } = await supabase
                .from('sets')
                .delete()
                .eq('session_exercise_id', sessionExerciseId);

            if (setsErr) throw setsErr;

            // 2. Delete the session_exercise
            const { error: seErr } = await supabase
                .from('session_exercises')
                .delete()
                .eq('id', sessionExerciseId);

            if (seErr) throw seErr;

            setActiveExercises(prev => prev.filter(ex => ex.id !== sessionExerciseId));
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to remove exercise' };
        }
    };

    const clearWorkout = () => {
        setSession(null);
        setActiveExercises([]);
        setIsFinishing(false);
    };

    const updateDefaultSets = async (exerciseId: string, newDefault: number) => {
        if (!user) return { error: 'Not authenticated' };
        const { error: err } = await supabase
            .from('exercises')
            .update({ default_sets: newDefault })
            .eq('id', exerciseId)
            .eq('user_id', user.id);
        return { error: err?.message || null };
    };

    const deleteSession = async (sessionId: string) => {
        try {
            // 1. Get session exercises
            const { data: se } = await supabase
                .from('session_exercises')
                .select('id')
                .eq('workout_session_id', sessionId);

            if (se && se.length > 0) {
                const seIds = se.map(x => x.id);
                // 2. Delete sets
                await supabase.from('sets').delete().in('session_exercise_id', seIds);
                // 3. Delete session exercises
                await supabase.from('session_exercises').delete().eq('workout_session_id', sessionId);
            }

            // 4. Delete session
            const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
            if (error) throw error;

            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        }
    };

    return (
        <WorkoutContext.Provider
            value={{
                session, activeExercises, templateName, loading, isFinishing, error,
                startWorkout, updateSet, addSet, deleteSet,
                finishWorkout, cancelWorkout, addExerciseToSession, removeExerciseFromSession, clearWorkout, updateDefaultSets,
                deleteSession,
            }}
        >
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = (): WorkoutContextType => {
    const context = useContext(WorkoutContext);
    if (!context) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
};
