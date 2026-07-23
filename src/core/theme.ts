export const COLORS = {
    // Primary
    primary: '#1A56DB',       // Deep Finance Blue

    // Secondary
    secondary: '#C9A84C',     // Refined Gold

    // Status
    success: '#16A34A',       // Emerald Green
    warning: '#D97706',       // Warm Amber
    expense: '#DC2626',       // Bold Red
    danger: '#DC2626',

    // Backgrounds
    background: '#FFFFFF',
    secondaryBackground: '#F8FAFC',
    card: '#FFFFFF',
    sectionBackground: '#F0F5FF',

    // Text
    text: '#111827',          // Near-Black
    secondaryText: '#6B7280',
    lightText: '#FFFFFF',

    // UI elements
    border: '#E5E7EB',
    divider: '#F3F4F6',
};

export const SIZES = {
    // Spacing (8-point system)
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,

    // Border Radius
    radiusSm: 8,
    radiusMd: 16,
    radiusLg: 24,
    radiusXl: 30,
};

/**
 * FONT STACK
 * UI text:      DM Sans  — clean, geometric, professional (fintech standard)
 * Mono/numbers: DM Mono  — tabular, ensures aligned financial figures
 */
export const FONTS = {
    // DM Sans – all UI text, labels, headings
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    semiBold: 'DMSans-SemiBold',
    bold: 'DMSans-Bold',

    // DM Mono – currency amounts, account numbers, stats
    mono: 'DMMono-Regular',
    monoMedium: 'DMMono-Medium',
};

export const SHADOWS = {
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    card: {
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
};
