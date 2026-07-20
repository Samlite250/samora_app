import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'default':
                return styles.default;
            case 'elevated':
                return styles.elevated;
            case 'outlined':
                return styles.outlined;
            default:
                return styles.default;
        }
    };

    return <View style={[styles.container, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZES.radiusLg,
        padding: SIZES.lg,
        backgroundColor: COLORS.card,
    },
    default: {
        ...SHADOWS.soft,
    },
    elevated: {
        ...SHADOWS.medium,
    },
    outlined: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    }
});
