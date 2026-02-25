/**
 * Core utility functions for LiftLog
 */

/**
 * Calculates the current workout streak in weeks.
 * Each week where at least one workout occurred contributes to the streak.
 */
export const calculateWeeklyStreak = (allSessions: { date: string }[]) => {
    if (!allSessions || allSessions.length === 0) return 0;

    const workoutWeeks = new Set<string>();

    allSessions.forEach(s => {
        const d = new Date(s.date);
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
        workoutWeeks.add(`${d.getFullYear()}-${weekNum}`);
    });

    const sortedWeeks = Array.from(workoutWeeks).sort().reverse();
    const dNow = new Date();
    const startOfYearNow = new Date(dNow.getFullYear(), 0, 1);
    const currentWeekNum = Math.ceil((((dNow.getTime() - startOfYearNow.getTime()) / 86400000) + startOfYearNow.getDay() + 1) / 7);
    const currentWeekId = `${dNow.getFullYear()}-${currentWeekNum}`;

    let streak = 0;
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
            if (expectedW === 0) {
                expectedW = 52;
                expectedY--;
            }

            if (y === expectedY && w === expectedW) {
                streak++;
            } else if (i === 0 && !foundThisWeek) {
                // If not found this week, check if it was last week
                if (y === expectedY && w === expectedW) streak = 1;
                else break;
            } else {
                break;
            }
        }
        lastWeekId = weekId;
    }

    return streak;
};

/**
 * Parses a numeric value from a string, returning null if invalid/empty.
 */
export const parseNumeric = (value: string): number | null => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
};

/**
 * Triggers a haptic feedback effect.
 * Handles dynamics imports to avoid issues in environments where Haptics might not be available.
 */
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    try {
        const Haptics = await import('expo-haptics');
        switch (style) {
            case 'light': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
            case 'medium': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
            case 'heavy': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
            case 'success': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
            case 'warning': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
            case 'error': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
        }
    } catch (e) {
        // Silently ignore if haptics fail (e.g. on web or unsupported devices)
    }
};

/**
 * Formats a date relative to now (e.g., "Today", "Yesterday", "3 days ago").
 */
export const formatRelativeDate = (dateStr: string): string => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
};
