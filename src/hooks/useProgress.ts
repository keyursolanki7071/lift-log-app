import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface ExerciseProgress {
    sessionDate: string;
    maxWeight: number;
    totalVolume: number;
    sets: { weight: number; reps: number }[];
}

export const useProgress = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getExerciseHistory = useCallback(async (exerciseId: string): Promise<ExerciseProgress[]> => {
        if (!user) return [];
        setLoading(true);
        setError(null);

        try {
            // Get session_exercises for this exercise from completed sessions
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
            return history.reverse(); // chronological order
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return [];
        }
    }, [user]);

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

    const getDashboardStats = useCallback(async () => {
        if (!user) return null;
        setLoading(true);
        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // 1. Weekly Workouts & Volume
            const { data: weekSessions, error: wsErr } = await supabase
                .from('workout_sessions')
                .select(`
                    id, date, duration_minutes,
                    template:workout_templates(name),
                    session_exercises(
                        id,
                        sets(weight, reps)
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('date', weekAgo.toISOString());

            if (wsErr) throw wsErr;

            let weeklyVolume = 0;
            let prsThisWeek = 0;
            weekSessions?.forEach(s => {
                s.session_exercises?.forEach((se: any) => {
                    se.sets?.forEach((set: any) => {
                        if (set.weight && set.reps) weeklyVolume += set.weight * set.reps;
                    });
                });
            });

            // Calculate PRs this week
            const { data: recentSets } = await supabase
                .from('sets')
                .select(`
                    weight,
                    session_exercise!inner(
                        exercise_id,
                        session:workout_sessions!inner(date)
                    )
                `)
                .eq('session_exercise.session.user_id', user.id)
                .eq('session_exercise.session.status', 'completed')
                .gte('session_exercise.session.date', weekAgo.toISOString());

            if (recentSets) {
                // To find if a set is a PR, we need to know if it's > former max
                // For simplicity and performance, we'll check each exercise max weight in this week vs before this week
                const exerciseMaxesThisWeek: Record<string, number> = {};
                recentSets.forEach((s: any) => {
                    const exId = s.session_exercise.exercise_id;
                    if (!exerciseMaxesThisWeek[exId] || s.weight > exerciseMaxesThisWeek[exId]) {
                        exerciseMaxesThisWeek[exId] = s.weight;
                    }
                });

                for (const exId in exerciseMaxesThisWeek) {
                    const { data: formerMaxData } = await supabase
                        .from('sets')
                        .select('weight')
                        .eq('session_exercise.exercise_id', exId)
                        .eq('session_exercise.session.user_id', user.id)
                        .eq('session_exercise.session.status', 'completed')
                        .lt('session_exercise.session.date', weekAgo.toISOString())
                        .order('weight', { ascending: false })
                        .limit(1);

                    const formerMax = formerMaxData?.[0]?.weight || 0;
                    if (exerciseMaxesThisWeek[exId] > formerMax) {
                        prsThisWeek++;
                    }
                }
            }

            // 2. Previous Week Volume (7-14 days ago)
            const { data: prevWeekSessions } = await supabase
                .from('workout_sessions')
                .select('session_exercises(sets(weight, reps))')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('date', twoWeeksAgo.toISOString())
                .lt('date', weekAgo.toISOString());

            let prevWeekVolume = 0;
            prevWeekSessions?.forEach(s => {
                s.session_exercises?.forEach((se: any) => {
                    se.sets?.forEach((set: any) => {
                        if (set.weight && set.reps) prevWeekVolume += set.weight * set.reps;
                    });
                });
            });

            // 3. Last Workout Subtext
            const { data: lastSession } = await supabase
                .from('workout_sessions')
                .select('date, template:workout_templates(name)')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false })
                .limit(1)
                .single();

            let lastWorkoutSubtext = '';
            if (lastSession) {
                const daysAgo = Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
                const daysText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
                lastWorkoutSubtext = `${(lastSession as any).template?.name || 'Custom'} • ${daysText}`;
            }

            // 4. Streak Calculation
            const { data: allSessions } = await supabase
                .from('workout_sessions')
                .select('date')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false });

            let streak = 0;
            if (allSessions && allSessions.length > 0) {
                const workoutWeeks = new Set();
                allSessions.forEach(s => {
                    const d = new Date(s.date);
                    const startOfYear = new Date(d.getFullYear(), 0, 1);
                    const weekNum = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
                    workoutWeeks.add(`${d.getFullYear()}-${weekNum}`);
                });

                const sortedWeeks = Array.from(workoutWeeks).sort().reverse() as string[];
                const dNow = new Date();
                const startOfYearNow = new Date(dNow.getFullYear(), 0, 1);
                const currentWeekNum = Math.ceil((((dNow.getTime() - startOfYearNow.getTime()) / 86400000) + startOfYearNow.getDay() + 1) / 7);
                const currentWeekId = `${dNow.getFullYear()}-${currentWeekNum}`;

                let lastWeekId = currentWeekId;
                let foundThisWeek = false;

                for (let i = 0; i < sortedWeeks.length; i++) {
                    const weekId = sortedWeeks[i];
                    if (weekId === currentWeekId) {
                        streak++;
                        foundThisWeek = true;
                    } else {
                        const [y, w] = weekId.split('-').map(Number);
                        const [ly, lw] = lastWeekId.split('-').map(Number);
                        let expectedW = lw - 1;
                        let expectedY = ly;
                        if (expectedW === 0) { expectedW = 52; expectedY--; }

                        if (y === expectedY && w === expectedW) {
                            streak++;
                        } else if (i === 0 && !foundThisWeek) {
                            if (y === expectedY && w === expectedW) streak = 1;
                            else break;
                        } else break;
                    }
                    lastWeekId = weekId;
                }
            }

            // 5. Body Weight
            const { data: weightData } = await supabase
                .from('body_metrics')
                .select('weight')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);

            const currentWeight = weightData?.[0]?.weight || null;
            const prevWeight = weightData?.[1]?.weight || null;

            // 6. Trends
            const keyLifts = ['Bench Press', 'Squat', 'Deadlift'];
            const trends = [];
            for (const liftName of keyLifts) {
                const { data: liftData } = await supabase.from('exercises').select('id').eq('name', liftName).single();
                if (liftData) {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    const currentMax = await getPersonalRecord(liftData.id);
                    const { data: oldMaxData } = await supabase
                        .from('sets')
                        .select('weight')
                        .eq('session_exercise.exercise_id', liftData.id)
                        .lt('session_exercise.session.date', thirtyDaysAgo.toISOString())
                        .order('weight', { ascending: false })
                        .limit(1);

                    const oldMax = oldMaxData?.[0]?.weight || 0;
                    if (currentMax > 0) {
                        trends.push({
                            name: liftName,
                            currentMax,
                            change: currentMax - oldMax
                        });
                    }
                }
            }

            // 7. Top PR Monthly
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const { data: monthPrData } = await supabase
                .from('sets')
                .select('weight, session_exercise!inner(exercise:exercises!inner(name))')
                .eq('session_exercise.session.user_id', user.id)
                .eq('session_exercise.session.status', 'completed')
                .gte('session_exercise.session.date', thirtyDaysAgo.toISOString())
                .order('weight', { ascending: false })
                .limit(1);

            let topPrMonth = null;
            if (monthPrData && monthPrData.length > 0) {
                topPrMonth = {
                    name: (monthPrData[0].session_exercise as any).exercise?.name,
                    weight: monthPrData[0].weight
                };
            }

            return {
                weeklyWorkouts: weekSessions?.length || 0,
                weeklyVolume,
                prevWeekVolume,
                prsThisWeek,
                weeklyGoal: 4,
                lastWorkoutSubtext,
                streak,
                bodyWeight: currentWeight,
                bodyWeightChange: currentWeight && prevWeight ? currentWeight - prevWeight : 0,
                trends,
                topPrMonth
            };
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    }, [user, getPersonalRecord]);

    return { loading, error, getExerciseHistory, getPersonalRecord, getDashboardStats };
};
