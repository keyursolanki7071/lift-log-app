import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Exercise } from '../types';

export const useExercises = () => {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchExercises = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('exercises')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (err) throw err;
            setExercises(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load exercises');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    const createExercise = async (name: string, muscleGroup: string, defaultSets: number = 3) => {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { data, error: err } = await supabase
                .from('exercises')
                .insert({ name, muscle_group: muscleGroup, default_sets: defaultSets, user_id: user.id })
                .select()
                .single();
            if (err) throw err;
            setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            return { error: null, data };
        } catch (err: any) {
            return { error: err.message || 'Failed to create exercise' };
        }
    };

    const updateExercise = async (id: string, updates: Partial<Pick<Exercise, 'name' | 'muscle_group' | 'default_sets'>>) => {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { data, error: err } = await supabase
                .from('exercises')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();
            if (err) throw err;
            setExercises(prev => prev.map(e => e.id === id ? data : e));
            return { error: null, data };
        } catch (err: any) {
            return { error: err.message || 'Failed to update exercise' };
        }
    };

    const deleteExercise = async (id: string) => {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { error: err } = await supabase
                .from('exercises')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
            if (err) throw err;
            setExercises(prev => prev.filter(e => e.id !== id));
            return { error: null };
        } catch (err: any) {
            return { error: err.message || 'Failed to delete exercise' };
        }
    };

    return { exercises, loading, error, fetchExercises, createExercise, updateExercise, deleteExercise };
};
