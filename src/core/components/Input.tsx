import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { COLORS, FONTS, SIZES } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    leftIcon,
    rightIcon,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.secondaryText}
                    {...props}
                />
                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.md,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.text,
        marginBottom: SIZES.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondaryBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radiusSm,
        height: 52,
        paddingHorizontal: SIZES.md,
    },
    inputError: {
        borderColor: COLORS.expense,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        height: '100%',
    },
    leftIcon: {
        marginRight: SIZES.sm,
    },
    rightIcon: {
        marginLeft: SIZES.sm,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.expense,
        marginTop: SIZES.xs,
    }
});
