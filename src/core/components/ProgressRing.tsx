import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { COLORS, FONTS } from '../theme';

interface ProgressRingProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 120,
    strokeWidth = 12,
    color = COLORS.primary,
    label
}) => {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const path = Skia.Path.Make();

    // Create arc for circle
    path.addArc(
        { x: strokeWidth / 2, y: strokeWidth / 2, width: size - strokeWidth, height: size - strokeWidth },
        270, // start angle (top)
        360 // sweep angle
    );

    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(progress, {
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
        });
    }, [progress]);

    // @ts-ignore
    const animatedProps = useAnimatedProps(() => {
        return {
            end: animatedProgress.value
        };
    });

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Canvas style={{ width: size, height: size, position: 'absolute' }}>
                {/* Background track */}
                <Path
                    path={path}
                    style="stroke"
                    strokeWidth={strokeWidth}
                    color={COLORS.secondaryBackground}
                    strokeCap="round"
                    start={0}
                    end={1}
                />
                {/* Animated Progress */}
                <Path
                    path={path}
                    style="stroke"
                    strokeWidth={strokeWidth}
                    color={color}
                    strokeCap="round"
                    // @ts-ignore
                    animatedProps={animatedProps}
                />
            </Canvas>
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
