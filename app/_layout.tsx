import {
    DMMono_400Regular,
    DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../src/core/theme';

const queryClient = new QueryClient();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'DMSans-Regular': DMSans_400Regular,
        'DMSans-Medium': DMSans_500Medium,
        'DMSans-SemiBold': DMSans_600SemiBold,
        'DMSans-Bold': DMSans_700Bold,
        'DMMono-Regular': DMMono_400Regular,
        'DMMono-Medium': DMMono_500Medium,
    });

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <View style={styles.container}>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth" />
                </Stack>
            </View>
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
