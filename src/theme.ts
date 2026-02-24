import { MD3DarkTheme } from 'react-native-paper';

// ─── Design System ──────────────────────────────────────────────────
// Dark flat theme with neon accent. No gradients, no heavy shadows.
// Touch-friendly sizing, large bold typography, minimal icons.

export const appColors = {
    // Accent – clean electric green
    accent: '#22FF7A',
    accentAlt: '#1CD667',

    // Semantic
    success: '#22FF7A',
    warning: '#FCC419',
    danger: '#FF6B6B',

    // Surfaces
    bg: '#0F0F0F',
    cardBg: '#1A1A1A',
    inputBg: '#242424',
    border: '#2A2A2A',
    borderLight: '#333333',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',
};

// Use Inter fonts for a modern, sleek look
export const appFonts = {
    black: 'Inter-Black',
    extraBold: 'Inter-ExtraBold',
    bold: 'Inter-Bold',
    semiBold: 'Inter-SemiBold',
    regular: 'Inter-Regular',
};

// Standardized hierarchy
export const appTypography = {
    h1: { fontSize: 24, fontFamily: appFonts.bold },
    h2: { fontSize: 18, fontFamily: appFonts.semiBold },
    body: { fontSize: 16, fontFamily: appFonts.regular },
    small: { fontSize: 13, fontFamily: appFonts.regular },
};

export const theme = {
    ...MD3DarkTheme,
    roundness: 16,
    colors: {
        ...MD3DarkTheme.colors,
        primary: appColors.accent,
        onPrimary: '#000000',
        primaryContainer: appColors.accent + '33',
        onPrimaryContainer: appColors.accent,

        secondary: appColors.accentAlt,
        onSecondary: '#000000',
        secondaryContainer: appColors.accentAlt + '20',
        onSecondaryContainer: appColors.accentAlt,

        tertiary: appColors.textTertiary,
        onTertiary: '#FFFFFF',
        tertiaryContainer: appColors.inputBg,
        onTertiaryContainer: appColors.textPrimary,

        error: appColors.danger,
        onError: '#FFFFFF',
        errorContainer: appColors.danger + '20',
        onErrorContainer: appColors.danger,

        background: appColors.bg,
        onBackground: appColors.textPrimary,

        surface: appColors.cardBg,
        onSurface: appColors.textPrimary,
        surfaceVariant: appColors.inputBg,
        onSurfaceVariant: appColors.textSecondary,

        outline: appColors.border,
        outlineVariant: appColors.borderLight,

        inverseSurface: appColors.textPrimary,
        inverseOnSurface: appColors.bg,
        inversePrimary: appColors.accentAlt,

        elevation: {
            level0: 'transparent',
            level1: appColors.cardBg,
            level2: appColors.inputBg,
            level3: '#1c2128',
            level4: '#21262d',
            level5: '#30363d',
        },
        backdrop: 'rgba(0, 0, 0, 0.75)',
    },
    fonts: {
        ...MD3DarkTheme.fonts,
        displayLarge: { ...MD3DarkTheme.fonts.displayLarge, fontFamily: appFonts.black },
        displayMedium: { ...MD3DarkTheme.fonts.displayMedium, fontFamily: appFonts.black },
        displaySmall: { ...MD3DarkTheme.fonts.displaySmall, fontFamily: appFonts.black },
        headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, fontFamily: appFonts.black, fontSize: 32 },
        headlineMedium: { ...MD3DarkTheme.fonts.headlineMedium, fontFamily: appFonts.bold, fontSize: 28 },
        headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, fontFamily: appFonts.bold, fontSize: 24 }, // H1 logic
        titleLarge: { ...MD3DarkTheme.fonts.titleLarge, fontFamily: appFonts.semiBold, fontSize: 20 },
        titleMedium: { ...MD3DarkTheme.fonts.titleMedium, fontFamily: appFonts.semiBold, fontSize: 18 }, // H2 logic
        titleSmall: { ...MD3DarkTheme.fonts.titleSmall, fontFamily: appFonts.semiBold, fontSize: 16 },
        labelLarge: { ...MD3DarkTheme.fonts.labelLarge, fontFamily: appFonts.regular, fontSize: 14 },
        labelMedium: { ...MD3DarkTheme.fonts.labelMedium, fontFamily: appFonts.regular, fontSize: 12 }, // Small Label
        labelSmall: { ...MD3DarkTheme.fonts.labelSmall, fontFamily: appFonts.regular, fontSize: 10 },
        bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, fontFamily: appFonts.regular, fontSize: 16 }, // Body logic
        bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, fontFamily: appFonts.regular, fontSize: 14 },
        bodySmall: { ...MD3DarkTheme.fonts.bodySmall, fontFamily: appFonts.regular, fontSize: 12 },
    } as any,
};
