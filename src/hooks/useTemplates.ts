import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { WorkoutTemplate, TemplateExercise } from '../types';

export const useTemplates = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        // Fetch templates with exercise counts and last session date
        const { data, error: err } = await supabase
            .from('workout_templates')
            .select(`
                *,
                template_exercises(id),
                sessions:workout_sessions(date)
            `)
            .eq('user_id', user.id)
            .eq('workout_sessions.status', 'completed')
            .order('created_at', { ascending: false });

        if (err) {
            setError(err.message);
        } else {
            const processed = (data || []).map((t: any) => ({
                ...t,
                exercise_count: t.template_exercises?.length || 0,
                last_session_date: t.sessions?.sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0]?.date || null
            }));
            setTemplates(processed);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const createTemplate = async (name: string) => {
        if (!user) return { error: 'Not authenticated', data: null };
        const { data, error: err } = await supabase
            .from('workout_templates')
            .insert({ name, user_id: user.id })
            .select()
            .single();
        if (err) return { error: err.message, data: null };
        setTemplates(prev => [data, ...prev]);
        return { error: null, data };
    };

    const deleteTemplate = async (id: string) => {
        if (!user) return { error: 'Not authenticated' };

        // Nullify references in workout_sessions to avoid FK constraint errors
        await supabase
            .from('workout_sessions')
            .update({ template_id: null })
            .eq('template_id', id);

        // Delete associated exercises
        await supabase.from('template_exercises').delete().eq('template_id', id);

        // Finally delete the template
        const { error: err } = await supabase
            .from('workout_templates')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (err) return { error: err.message };
        setTemplates(prev => prev.filter(t => t.id !== id));
        return { error: null };
    };

    const fetchTemplateExercises = async (templateId: string): Promise<TemplateExercise[]> => {
        const { data, error: err } = await supabase
            .from('template_exercises')
            .select('*, exercise:exercises(*)')
            .eq('template_id', templateId)
            .order('exercise_order');
        if (err) { setError(err.message); return []; }
        return data || [];
    };

    const addExerciseToTemplate = async (templateId: string, exerciseId: string, exerciseOrder: number) => {
        const { data, error: err } = await supabase
            .from('template_exercises')
            .insert({ template_id: templateId, exercise_id: exerciseId, exercise_order: exerciseOrder })
            .select('*, exercise:exercises(*)')
            .single();
        if (err) return { error: err.message, data: null };
        return { error: null, data };
    };

    const removeExerciseFromTemplate = async (id: string) => {
        const { error: err } = await supabase
            .from('template_exercises')
            .delete()
            .eq('id', id);
        if (err) return { error: err.message };
        return { error: null };
    };

    const updateTemplate = async (id: string, name: string) => {
        if (!user) return { error: 'Not authenticated' };
        const { error: err } = await supabase
            .from('workout_templates')
            .update({ name })
            .eq('id', id)
            .eq('user_id', user.id);
        if (err) return { error: err.message };
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, name } : t));
        return { error: null };
    };

    return {
        templates, loading, error, fetchTemplates,
        createTemplate, deleteTemplate, updateTemplate,
        fetchTemplateExercises, addExerciseToTemplate, removeExerciseFromTemplate,
    };
};
