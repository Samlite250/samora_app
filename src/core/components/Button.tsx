import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, FONTS, SHADOWS, SIZES } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {
    const getContainerStyle = () => {
        switch (variant) {
            case 'primary': return styles.primaryContainer;
            case 'secondary': return styles.secondaryContainer;
            case 'outline': return styles.outlineContainer;
            case 'ghost': return styles.ghostContainer;
            default: return styles.primaryContainer;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
            case 'secondary': return styles.primaryText;
            case 'outline':
            case 'ghost': return styles.outlineText;
            default: return styles.primaryText;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                getContainerStyle(),
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.lightText} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, getTextStyle(), textStyle, icon ? { marginLeft: SIZES.sm } : undefined]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: SIZES.radiusMd,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SIZES.lg,
    },
    primaryContainer: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.soft,
    },
    secondaryContainer: {
        backgroundColor: COLORS.secondary,
        ...SHADOWS.soft,
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    ghostContainer: {
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
    },
    primaryText: {
        color: COLORS.lightText,
    },
    outlineText: {
        color: COLORS.primary,
    }
});
