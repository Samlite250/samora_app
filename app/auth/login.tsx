import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/core/components/Button';
import { Input } from '../../src/core/components/Input';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { supabase } from '../../src/data/api/supabase';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const setSession = useAuthStore((state) => state.setSession);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        if (!supabase) {
            Alert.alert('Configuration Error', 'Supabase is not configured. Please add your credentials to the .env file.');
            return;
        }
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            setSession(data.session);
            router.replace('/(tabs)');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Image
                        source={require('../../samora_logo.jpeg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Welcome to Samora</Text>
                    <Text style={styles.subtitle}>Manage Money. Plan Life. Achieve More.</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email Address"
                        placeholder="example@email.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <Input
                        label="Password"
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <View style={styles.forgotPasswordContainer}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </View>

                    <Button
                        title="Log In"
                        onPress={handleLogin}
                        loading={loading}
                        style={{ marginTop: SIZES.md }}
                    />

                    <View style={styles.registerContainer}>
                        <Text style={{ color: COLORS.secondaryText, fontFamily: FONTS.regular }}>Don't have an account? </Text>
                        <Text
                            style={styles.registerLink}
                            onPress={() => router.push('/auth/register')}
                        >
                            Sign Up
                        </Text>
                    </View>

                    {/* TODO: Remove this button once Supabase is configured */}
                    <TouchableOpacity
                        style={styles.demoBtn}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={styles.demoBtnText}>🚀 Continue as Demo</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        flexGrow: 1,
        padding: SIZES.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SIZES.xxl,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: SIZES.lg,
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
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: SIZES.sm,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SIZES.xl,
    },
    registerLink: {
        color: COLORS.primary,
        fontFamily: FONTS.semiBold,
    },
    demoBtn: {
        marginTop: SIZES.xl,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    demoBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: 15,
        color: COLORS.primary,
    }
});
