import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/core/components/Button';
import { Input } from '../../src/core/components/Input';
import { VideoBackground } from '../../src/core/components/VideoBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { supabase } from '../../src/data/api/supabase';

export default function RegisterScreen() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !firstName) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (!supabase) {
            Alert.alert('Configuration Error', 'Supabase is not configured. Please add your credentials to the .env file.');
            return;
        }
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        });
        setLoading(false);

        if (error) {
            Alert.alert('Registration Failed', error.message);
        } else {
            Alert.alert('Success', 'Check your email for the confirmation link!');
            router.push('/auth/login');
        }
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
        marginBottom: SIZES.xxl,
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
