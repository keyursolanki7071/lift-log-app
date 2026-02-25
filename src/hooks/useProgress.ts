import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { calculateWeeklyStreak, formatRelativeDate } from '../utils';

export interface ExerciseProgress {
    sessionDate: string;
    maxWeight: number;
    totalVolume: number;
    sets: { weight: number; reps: number }[];
}

export const useExerciseHistory = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getExerciseHistory = useCallback(async (exerciseId: string): Promise<ExerciseProgress[]> => {
        if (!user) return [];
        setLoading(true);
        setError(null);

        try {
            const { data: sessionExercises, error: err } = await supabase
                .from('session_exercises')
                .select(`
                    id,
                    session:workout_sessions!inner(id, date, status, user_id),
                    sets(weight, reps, set_number)
                `)
                .eq('exercise_id', exerciseId)
                .eq('session.user_id', user.id)
                .eq('session.status', 'completed')
                .order('session(date)', { ascending: false })
                .limit(5);

            if (err) throw err;

            const history: ExerciseProgress[] = (sessionExercises || []).map((se: any) => {
                const sets = (se.sets || [])
                    .filter((s: any) => s.weight != null && s.reps != null)
                    .sort((a: any, b: any) => a.set_number - b.set_number);

                const maxWeight = sets.length > 0 ? Math.max(...sets.map((s: any) => s.weight)) : 0;
                const totalVolume = sets.reduce((sum: number, s: any) => sum + (s.weight * s.reps), 0);

                return {
                    sessionDate: se.session?.date || '',
                    maxWeight,
                    totalVolume,
                    sets: sets.map((s: any) => ({ weight: s.weight, reps: s.reps })),
                };
            });

            setLoading(false);
            return history.reverse();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return [];
        }
    }, [user]);

    return { getExerciseHistory, loading, error };
};

export const usePersonalRecords = () => {
    const { user } = useAuth();

    const getPersonalRecord = useCallback(async (exerciseId: string): Promise<number> => {
        if (!user) return 0;

        const { data, error: err } = await supabase
            .from('sets')
            .select(`
                weight,
                session_exercise:session_exercises!inner(
                    exercise_id,
                    session:workout_sessions!inner(user_id, status)
                )
            `)
            .eq('session_exercise.exercise_id', exerciseId)
            .eq('session_exercise.session.user_id', user.id)
            .eq('session_exercise.session.status', 'completed')
            .not('weight', 'is', null)
            .order('weight', { ascending: false })
            .limit(1);

        if (err || !data || data.length === 0) return 0;
        return data[0].weight || 0;
    }, [user]);

    // Get PR from sessions older than 30 days (for improvement indicator)
    const getOldPersonalRecord = useCallback(async (exerciseId: string): Promise<number> => {
        if (!user) return 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error: err } = await supabase
            .from('sets')
            .select(`
                weight,
                session_exercise:session_exercises!inner(
                    exercise_id,
                    session:workout_sessions!inner(user_id, status, date)
                )
            `)
            .eq('session_exercise.exercise_id', exerciseId)
            .eq('session_exercise.session.user_id', user.id)
            .eq('session_exercise.session.status', 'completed')
            .lt('session_exercise.session.date', thirtyDaysAgo)
            .not('weight', 'is', null)
            .order('weight', { ascending: false })
            .limit(1);

        if (err || !data || data.length === 0) return 0;
        return data[0].weight || 0;
    }, [user]);

    return { getPersonalRecord, getOldPersonalRecord };
};

export const useDashboardStats = () => {
    const { user } = useAuth();
    const { getPersonalRecord } = usePersonalRecords();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getDashboardStats = useCallback(async () => {
        if (!user) return null;
        setLoading(true);
        setError(null);

        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // Fetch weekly sessions and PRs concurrently
            const [sessionsRes, prSetsRes, prevSessionsRes, lastSessionRes] = await Promise.all([
                supabase.from('workout_sessions').select('id, date, duration_minutes, template:workout_templates(name), session_exercises(id, sets(weight, reps))').eq('user_id', user.id).eq('status', 'completed').gte('date', weekAgo.toISOString()),
                supabase.from('sets').select('weight, session_exercise!inner(exercise_id, session:workout_sessions!inner(date))').eq('session_exercise.session.user_id', user.id).eq('session_exercise.session.status', 'completed').gte('session_exercise.session.date', weekAgo.toISOString()),
                supabase.from('workout_sessions').select('session_exercises(sets(weight, reps))').eq('user_id', user.id).eq('status', 'completed').gte('date', twoWeeksAgo.toISOString()).lt('date', weekAgo.toISOString()),
                supabase.from('workout_sessions').select('date, template:workout_templates(name)').eq('user_id', user.id).eq('status', 'completed').order('date', { ascending: false }).limit(1).single()
            ]);

            if (sessionsRes.error) throw sessionsRes.error;

            // Volume Calculation
            let weeklyVolume = 0;
            sessionsRes.data?.forEach(s => {
                s.session_exercises?.forEach((se: any) => se.sets?.forEach((set: any) => {
                    if (set.weight && set.reps) weeklyVolume += set.weight * set.reps;
                }));
            });

            // PR Calculation
            let prsThisWeek = 0;
            if (prSetsRes.data) {
                const exerciseMaxesThisWeek: Record<string, number> = {};
                prSetsRes.data.forEach((s: any) => {
                    const exId = s.session_exercise.exercise_id;
                    if (!exerciseMaxesThisWeek[exId] || s.weight > exerciseMaxesThisWeek[exId]) {
                        exerciseMaxesThisWeek[exId] = s.weight;
                    }
                });

                // Batch PR check (simplified logic for better performance)
                for (const exId in exerciseMaxesThisWeek) {
                    const { data: formerMaxData } = await supabase.from('sets').select('weight').eq('session_exercise.exercise_id', exId).eq('session_exercise.session.user_id', user.id).eq('session_exercise.session.status', 'completed').lt('session_exercise.session.date', weekAgo.toISOString()).order('weight', { ascending: false }).limit(1);
                    if (exerciseMaxesThisWeek[exId] > (formerMaxData?.[0]?.weight || 0)) prsThisWeek++;
                }
            }

            // Prev Volume
            let prevWeekVolume = 0;
            prevSessionsRes.data?.forEach(s => s.session_exercises?.forEach((se: any) => se.sets?.forEach((set: any) => {
                if (set.weight && set.reps) prevWeekVolume += set.weight * set.reps;
            })));

            // Last Workout Text
            const lastSessionData = lastSessionRes.data;
            const lastWorkoutSubtext = lastSessionData ? `${(lastSessionData as any).template?.name || 'Custom'} • ${formatRelativeDate(lastSessionData.date)}` : '';

            // Top 3 All-Time PRs
            const { data: allPrs } = await supabase
                .from('sets')
                .select(`
                    weight, 
                    session_exercise:session_exercises!inner(
                        exercise:exercises!inner(id, name),
                        session:workout_sessions!inner(user_id, status)
                    )
                `)
                .eq('session_exercise.session.user_id', user.id)
                .eq('session_exercise.session.status', 'completed')
                .gt('weight', 0)
                .order('weight', { ascending: false })
                .limit(200);

            const uniquePRs: any[] = [];
            const seenExercises = new Set();
            if (allPrs) {
                for (const pr of allPrs) {
                    const exerciseObj = (pr.session_exercise as any).exercise;
                    const exName = exerciseObj?.name;
                    const exId = exerciseObj?.id;

                    if (exName && !seenExercises.has(exName)) {
                        uniquePRs.push({ id: exId, name: exName, weight: pr.weight });
                        seenExercises.add(exName);
                        if (uniquePRs.length === 3) break;
                    }
                }
            }

            // Most improved lift this month (compares current max vs 30+ day old max)
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get all recent sets (last 30 days) grouped by exercise
            const { data: recentSets } = await supabase
                .from('sets')
                .select(`
                    weight, 
                    session_exercise:session_exercises!inner(
                        exercise:exercises!inner(id, name),
                        session:workout_sessions!inner(user_id, status, date)
                    )
                `)
                .eq('session_exercise.session.user_id', user.id)
                .eq('session_exercise.session.status', 'completed')
                .gte('session_exercise.session.date', thirtyDaysAgo.toISOString())
                .gt('weight', 0)
                .order('weight', { ascending: false })
                .limit(200);

            // Get older sets (before 30 days) for comparison
            const { data: olderSets } = await supabase
                .from('sets')
                .select(`
                    weight, 
                    session_exercise:session_exercises!inner(
                        exercise:exercises!inner(id, name),
                        session:workout_sessions!inner(user_id, status, date)
                    )
                `)
                .eq('session_exercise.session.user_id', user.id)
                .eq('session_exercise.session.status', 'completed')
                .lt('session_exercise.session.date', thirtyDaysAgo.toISOString())
                .gt('weight', 0)
                .order('weight', { ascending: false })
                .limit(200);

            // Build max maps
            const recentMaxMap: Record<string, { id: string; name: string; max: number }> = {};
            if (recentSets) {
                for (const s of recentSets) {
                    const ex = (s.session_exercise as any).exercise;
                    if (ex?.name && (!recentMaxMap[ex.name] || s.weight > recentMaxMap[ex.name].max)) {
                        recentMaxMap[ex.name] = { id: ex.id, name: ex.name, max: s.weight };
                    }
                }
            }
            const olderMaxMap: Record<string, number> = {};
            if (olderSets) {
                for (const s of olderSets) {
                    const ex = (s.session_exercise as any).exercise;
                    if (ex?.name && (!olderMaxMap[ex.name] || s.weight > olderMaxMap[ex.name])) {
                        olderMaxMap[ex.name] = s.weight;
                    }
                }
            }

            // Find biggest improvement
            let bestImprovement: { name: string; weight: number; change: number } | null = null;
            for (const [name, data] of Object.entries(recentMaxMap)) {
                const oldMax = olderMaxMap[name] || 0;
                const change = data.max - oldMax;
                if (oldMax > 0 && change > 0 && (!bestImprovement || change > bestImprovement.change)) {
                    bestImprovement = { name, weight: data.max, change };
                }
            }

            // Build set of exercise names that got a PR this week
            const recentPRNames: string[] = [];
            if (allPrs && recentSets) {
                const weekMaxMap: Record<string, number> = {};
                // Get week-only sets
                const { data: weekSets } = await supabase
                    .from('sets')
                    .select(`weight, session_exercise:session_exercises!inner(exercise:exercises!inner(name), session:workout_sessions!inner(user_id, status, date))`)
                    .eq('session_exercise.session.user_id', user.id)
                    .eq('session_exercise.session.status', 'completed')
                    .gte('session_exercise.session.date', weekAgo.toISOString())
                    .gt('weight', 0)
                    .order('weight', { ascending: false })
                    .limit(100);
                if (weekSets) {
                    for (const s of weekSets) {
                        const exName = (s.session_exercise as any).exercise?.name;
                        if (exName && (!weekMaxMap[exName] || s.weight > weekMaxMap[exName])) {
                            weekMaxMap[exName] = s.weight;
                        }
                    }
                }
                // If week max = all-time max, it's a recent PR
                for (const pr of uniquePRs) {
                    if (weekMaxMap[pr.name] && weekMaxMap[pr.name] >= pr.weight) {
                        recentPRNames.push(pr.name);
                    }
                }
            }

            setLoading(false);
            return {
                weeklyVolume,
                prevWeekVolume,
                prsThisWeek,
                lastWorkoutSubtext,
                monthlyHighlight: bestImprovement,
                allTimeTopPRs: uniquePRs,
                recentPRNames,
            };
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, [user, getPersonalRecord]);

    return { getDashboardStats, loading, error };
};

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use useExerciseHistory, usePersonalRecords, or useDashboardStats directly
 */
export const useProgress = () => {
    const { getExerciseHistory, loading: hL, error: hE } = useExerciseHistory();
    const { getPersonalRecord } = usePersonalRecords();
    const { getDashboardStats, loading: sL, error: sE } = useDashboardStats();

    return {
        loading: hL || sL,
        error: hE || sE,
        getExerciseHistory,
        getPersonalRecord,
        getDashboardStats
    };
};
