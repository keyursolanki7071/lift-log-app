export interface Exercise {
    id: string;
    user_id: string;
    name: string;
    muscle_group: string;
    default_sets: number;
    created_at: string;
}

export interface WorkoutTemplate {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    exercise_count?: number;
    last_session_date?: string | null;
}

export interface TemplateExercise {
    id: string;
    template_id: string;
    exercise_id: string;
    exercise_order: number;
    created_at: string;
    exercise?: Exercise;
}

export interface WorkoutSession {
    id: string;
    user_id: string;
    template_id: string;
    date: string;
    duration_minutes: number | null;
    status: 'active' | 'completed';
    created_at: string;
}

export interface SessionExercise {
    id: string;
    workout_session_id: string;
    exercise_id: string;
    created_at: string;
    exercise?: Exercise;
}

export interface WorkoutSet {
    id: string;
    session_exercise_id: string;
    set_number: number;
    weight: number | null;
    reps: number | null;
    created_at: string;
}

export interface BodyMetric {
    id: string;
    user_id: string;
    weight: number | null;
    waist: number | null;
    photo_url: string | null;
    date: string;
    created_at: string;
}
