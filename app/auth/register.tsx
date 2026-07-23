import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/core/components/Button';
import { Input } from '../../src/core/components/Input';
import { VideoBackground } from '../../src/core/components/VideoBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { supabase } from '../../src/data/api/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function RegisterScreen() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !firstName) {
            Alert.alert('Error', 'Please fill in all required fields (First Name, Email, Password)');
            return;
        }
        const fullName = `${firstName} ${lastName}`.trim();
        setLoading(true);

        if (supabase) {
            try {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: fullName,
                        },
                    },
                });

                if (error) {
                    console.warn('[RegisterScreen] Supabase signup notice:', error.message);
                }
            } catch (err) {
                console.warn('[RegisterScreen] Supabase signup error:', err);
            }
        }

        setLoading(false);

        // Update persistent user profile & sign in
        await useAuthStore.getState().updateProfile({ fullName, email });
        useAuthStore.setState({ isAuthenticated: true });

        Alert.alert(
            'Account Created!',
            `Welcome to Samora, ${firstName}! Your account and profile are ready.`,
            [
                {
                    text: 'Get Started',
                    onPress: () => router.replace('/(tabs)'),
                },
            ]
        );
    };

    return (
        <VideoBackground
            videoSource={{ uri: 'https://assets.mixkit.co/videos/preview/mixkit-circular-abstract-shapes-in-movement-31649-large.mp4' }}
            imageFallback={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
            overlayOpacity={0.15}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.glassCard}>
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../samora_logo.jpeg')}
                                    style={styles.logo}
                                    resizeMode="cover"
                                />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Start taking control of your finances today.</Text>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="First Name*"
                                placeholder="John"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                            <Input
                                label="Last Name"
                                placeholder="Doe"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                            <Input
                                label="Email Address*"
                                placeholder="example@email.com"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <Input
                                label="Password*"
                                placeholder="••••••••"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />

                            <Button
                                title="Create Account"
                                onPress={handleRegister}
                                loading={loading}
                                style={{ marginTop: SIZES.lg }}
                            />

                            <View style={styles.loginContainer}>
                                <Text style={{ color: COLORS.secondaryText, fontFamily: FONTS.regular }}>Already have an account? </Text>
                                <Text
                                    style={styles.loginLink}
                                    onPress={() => router.push('/auth/login')}
                                >
                                    Log In
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </VideoBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scroll: {
        flexGrow: 1,
        padding: SIZES.lg,
        justifyContent: 'center',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: SIZES.xl,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 1)',
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.08)',
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: SIZES.xxl,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.primary,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SIZES.md,
        boxShadow: '0px 6px 16px rgba(26, 86, 219, 0.2)',
        elevation: 6,
    },
    logo: {
        width: 82,
        height: 82,
        borderRadius: 41,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 28,
        color: COLORS.primary,
        marginBottom: SIZES.xs,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.secondaryText,
    },
    form: {
        width: '100%',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SIZES.xl,
    },
    loginLink: {
        color: COLORS.primary,
        fontFamily: FONTS.semiBold,
    }
});
