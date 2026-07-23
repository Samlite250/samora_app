import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';

interface VideoBackgroundProps {
    videoSource: any; // e.g. { uri: '...' } or require('...')
    imageFallback?: any; // Fallback image if video fails or during load
    children?: React.ReactNode;
    overlayOpacity?: number; // Optional dark or light overlay to ensure text legibility
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
    videoSource,
    imageFallback,
    children,
    overlayOpacity = 0.2
}) => {
    const src = typeof videoSource === 'object' && videoSource.uri ? videoSource.uri : videoSource;
    const player = useVideoPlayer(src, player => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return (
        <View style={styles.container}>
            {/* Fallback image shown while video loads or if it's not provided */}
            {imageFallback && (
                <Image
                    source={imageFallback}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
            )}

            {/* Video Background */}
            <VideoView
                player={player}
                style={styles.video}
                nativeControls={false}
                contentFit="cover"
            />

            {/* Overlay to dim/brighten the background for better contrast */}
            <View style={[styles.overlay, { backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }]} />

            {/* Content passed from parent (e.g. glassmorphic form) */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#FFFFFF',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
    },
    video: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFill,
    },
    content: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});
