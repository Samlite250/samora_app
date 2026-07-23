import React from 'react';
import { ImageBackground, StyleSheet, ViewStyle } from 'react-native';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
    imageUri?: string;
    imageOpacity?: number;
}

const DEFAULT_BG = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
    children,
    style,
    imageUri = DEFAULT_BG,
    imageOpacity = 0.14,
}) => {
    return (
        <ImageBackground
            source={{ uri: imageUri }}
            style={[styles.container, style]}
            imageStyle={{ opacity: imageOpacity }}
            resizeMode="cover"
        >
            {children}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FB', // Opaque base prevents React Navigation screen overlap/ghosting
    },
});
