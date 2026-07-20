import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../theme';

interface HeaderProps {
    title: string;
    subtitle?: string;
    leftIcon?: React.ReactNode;
    onLeftPress?: () => void;
    rightIcon?: React.ReactNode;
    onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    leftIcon,
    onLeftPress,
    rightIcon,
    onRightPress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.side}>
                {leftIcon && (
                    <TouchableOpacity onPress={onLeftPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        {leftIcon}
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.center}>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.side}>
                {rightIcon && (
                    <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    side: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: FONTS.semiBold,
        fontSize: 18,
        color: COLORS.text,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.secondaryText,
        marginBottom: 2,
    },
});
