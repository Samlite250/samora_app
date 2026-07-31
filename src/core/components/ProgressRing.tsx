import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface ProgressRingProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 120,
    strokeWidth = 12,
    color = COLORS.primary,
    label
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    const center = size / 2;

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={COLORS.secondaryBackground || '#E2E8F0'}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Animated progress arc */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    rotation="-90"
                    origin={`${center}, ${center}`}
                />
            </Svg>
            <View style={styles.innerLabelContainer}>
                <Text style={[styles.percentageLabel, { color }]}>{`${Math.round(progress * 100)}%`}</Text>
                {label && <Text style={styles.subLabel}>{label}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    innerLabelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageLabel: {
        fontFamily: FONTS.bold,
        fontSize: 24,
    },
    subLabel: {
        fontFamily: FONTS.medium,
        fontSize: 10,
        color: COLORS.secondaryText,
        marginTop: 2,
    }
});
