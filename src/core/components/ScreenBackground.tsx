import React from 'react';
import { ImageBackground, Platform, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
    source?: any;
    imageOpacity?: number;
}

const DEFAULT_BG = require('../../../assets/images/premium_bg.png');

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
    children,
    style,
    source = DEFAULT_BG,
    imageOpacity = 0.2,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width >= 1024;

    return (
        <ImageBackground
            source={source}
            style={[styles.container, style]}
            imageStyle={{ opacity: imageOpacity }}
            resizeMode="cover"
        >
            <View style={[styles.contentWrapper, isDesktop && styles.desktopWrapper]}>
                {children}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FB', // Opaque base prevents React Navigation screen overlap/ghosting
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
    },
    desktopWrapper: {
        maxWidth: 1024,
        alignSelf: 'center',
    }
});
