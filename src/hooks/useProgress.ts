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

            // 1. Weekly Workouts & Volume
            const { data: weekSessions, error: wsErr } = await supabase
                .from('workout_sessions')
                .select(`
                    id, date, duration_minutes,
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
            weekSessions?.forEach(s => {
                s.session_exercises?.forEach((se: any) => {
                    se.sets?.forEach((set: any) => {
                        if (set.weight && set.reps) weeklyVolume += set.weight * set.reps;
                    });
                });
            });

            // 2. Streak Calculation (Consecutive weeks with workouts)
            const { data: allSessions, error: asErr } = await supabase
                .from('workout_sessions')
                .select('date')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false });

            if (asErr) throw asErr;

            let streak = 0;
            if (allSessions && allSessions.length > 0) {
                const workoutWeeks = new Set();
                allSessions.forEach(s => {
                    const d = new Date(s.date);
                    // Get a unique week identifier (Year-WeekNumber)
                    const startOfYear = new Date(d.getFullYear(), 0, 1);
                    const weekNum = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
                    workoutWeeks.add(`${d.getFullYear()}-${weekNum}`);
                });

                const sortedWeeks = Array.from(workoutWeeks).sort().reverse() as string[];

                // Current week
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
                        // Check if it's the week immediately before the last one we counted
                        const [y, w] = weekId.split('-').map(Number);
                        const [ly, lw] = lastWeekId.split('-').map(Number);

                        // Simple check: decrease week by 1, handle year boundary
                        let expectedW = lw - 1;
                        let expectedY = ly;
                        if (expectedW === 0) { expectedW = 52; expectedY--; }

                        if (y === expectedY && w === expectedW) {
                            streak++;
                        } else if (i === 0 && !foundThisWeek) {
                            // If first session is last week, and we didn't work out this week, streak starts from 1 if it's last week
                            if (y === expectedY && w === expectedW) {
                                streak = 1;
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    lastWeekId = weekId;
                }
            }

            // 3. Last Workout Summary
            const { data: lastSession, error: lsErr } = await supabase
                .from('workout_sessions')
                .select(`
                    id, date, duration_minutes,
                    template:templates(name),
                    session_exercises(
                        exercise_id,
                        exercise:exercises(name),
                        sets(weight, reps)
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('date', { ascending: false })
                .limit(1)
                .single();

            let lastWorkoutSummary = null;
            if (lastSession) {
                // Count PRs in last session
                // We'll define a PR as weight > all-time former max for that exercise
                let prCount = 0;
                for (const se of (lastSession.session_exercises || [])) {
                    const exId = se.exercise_id;
                    const sessionMax = Math.max(...(se.sets || []).map((s: any) => s.weight || 0));

                    if (sessionMax > 0) {
                        const { data: formerMaxData } = await supabase
                            .from('sets')
                            .select('weight')
                            .eq('session_exercise.exercise_id', exId)
                            .lt('session_exercise.session.date', lastSession.date)
                            .order('weight', { ascending: false })
                            .limit(1);

                        const formerMax = formerMaxData?.[0]?.weight || 0;
                        if (sessionMax > formerMax) prCount++;
                    }
                }

                lastWorkoutSummary = {
                    name: (lastSession as any).template?.name || 'Custom Workout',
                    date: lastSession.date,
                    duration: lastSession.duration_minutes || 0,
                    prs: prCount
                };
            }

            // 4. Body Metrics (Current + Change)
            const { data: weightData } = await supabase
                .from('body_metrics')
                .select('weight')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(2);

            const currentWeight = weightData?.[0]?.weight || null;
            const prevWeight = weightData?.[1]?.weight || null;
            const weightChange = currentWeight && prevWeight ? currentWeight - prevWeight : 0;

            // 5. Strength Trend Indicator (Top Lifts)
            const keyLifts = ['Bench Press', 'Squat', 'Deadlift'];
            const trends = [];
            for (const liftName of keyLifts) {
                const { data: liftData } = await supabase
                    .from('exercises')
                    .select('id')
                    .eq('name', liftName)
                    .single();

                if (liftData) {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                    // Current max
                    const currentMax = await getPersonalRecord(liftData.id);

                    // Max from 30 days ago
                    const { data: oldMaxData } = await supabase
                        .from('sets')
                        .select('weight, session_exercise!inner(session:workout_sessions!inner(date))')
                        .eq('session_exercise.exercise_id', liftData.id)
                        .lt('session_exercise.session.date', thirtyDaysAgo.toISOString())
                        .order('weight', { ascending: false })
                        .limit(1);

                    const oldMax = oldMaxData?.[0]?.weight || 0;
                    if (currentMax > 0) {
                        trends.push({
                            name: liftName,
                            currentMax,
                            change: oldMax > 0 ? currentMax - oldMax : 0
                        });
                    }
                }
            }

            // 6. Top PR This Month
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

            setLoading(false);
            return {
                weeklyWorkouts: weekSessions?.length || 0,
                weeklyVolume,
                streak,
                lastWorkout: lastWorkoutSummary,
                bodyWeight: currentWeight,
                bodyWeightChange: weightChange,
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
