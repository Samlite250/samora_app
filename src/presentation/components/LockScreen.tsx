import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { COLORS, FONTS } from '../../core/theme';
import { useAuthStore } from '../../store/useAuthStore';

interface LockScreenProps {
    onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const { profile, pinCode } = useAuthStore();
    const [pinSequence, setPinSequence] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    // Animation for error shake
    const shakeAnim = new Animated.Value(0);

    const checkBiometricSupport = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(hasHardware && isEnrolled);

        if (hasHardware && isEnrolled) {
            handleBiometricAuth();
        }
    };

    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Samora App',
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: true,
            });

            if (result.success) {
                onUnlock();
            }
        } catch (error) {
            console.error('Biometric Auth Error', error);
        }
    };

    const handlePinPress = (digit: string) => {
        setErrorMsg('');
        if (pinSequence.length < 4) {
            const newSequence = pinSequence + digit;
            setPinSequence(newSequence);

            if (newSequence.length === 4) {
                verifyPin(newSequence);
            }
        }
    };

    const handleDelete = () => {
        if (pinSequence.length > 0) {
            setPinSequence(pinSequence.slice(0, -1));
            setErrorMsg('');
        }
    };

    const verifyPin = useCallback((enteredPin: string) => {
        if (enteredPin === pinCode) {
            onUnlock();
        } else {
            setErrorMsg('Incorrect PIN. Try again.');
            Vibration.vibrate(400);
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
            ]).start(() => setPinSequence(''));
        }
    }, [pinCode, onUnlock, shakeAnim]);

    // Renders the dot indicators for the PIN
    const renderDots = () => {
        return (
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
                {[1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            pinSequence.length >= i ? styles.dotFilled : styles.dotEmpty
                        ]}
                    />
                ))}
            </Animated.View>
        );
    };

    // Renders the numpad grid
    const renderNumpad = () => {
        const rows = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
        ];

        return (
            <View style={styles.numpad}>
                {rows.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.numpadRow}>
                        {row.map((digit) => (
                            <TouchableOpacity key={digit} style={styles.numpadBtn} onPress={() => handlePinPress(digit)}>
                                <Text style={styles.numpadBtnText}>{digit}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Last Row with Biometric, 0, and Delete */}
                <View style={styles.numpadRow}>
                    {isBiometricSupported ? (
                        <TouchableOpacity style={styles.numpadBtn} onPress={handleBiometricAuth}>
                            <Ionicons name="finger-print-outline" size={32} color={COLORS.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.numpadBtn} />
                    )}

                    <TouchableOpacity style={styles.numpadBtn} onPress={() => handlePinPress('0')}>
                        <Text style={styles.numpadBtnText}>0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.numpadBtn} onPress={handleDelete}>
                        <Ionicons name="backspace-outline" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{profile.firstName.charAt(0)}{profile.lastName.charAt(0) || ''}</Text>
                </View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{profile.fullName}</Text>
                <Text style={styles.subtitleText}>Enter your PIN to unlock</Text>
            </View>

            <View style={styles.pinArea}>
                {renderDots()}
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>

            <View style={styles.numpadContainer}>
                {renderNumpad()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    avatarContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontFamily: FONTS.bold,
        fontSize: 28,
        color: COLORS.primary,
    },
    welcomeText: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.secondaryText,
        marginBottom: 4,
    },
    nameText: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitleText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    pinArea: {
        alignItems: 'center',
        height: 80,
        justifyContent: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    dotEmpty: {
        borderColor: COLORS.secondaryText + '50',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    errorText: {
        fontFamily: FONTS.medium,
        color: COLORS.danger,
        fontSize: 14,
        height: 20,
    },
    numpadContainer: {
        paddingHorizontal: 40,
        width: '100%',
        paddingBottom: 40,
    },
    numpad: {
        width: '100%',
        gap: 15,
    },
    numpadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    numpadBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    numpadBtnText: {
        fontFamily: FONTS.medium,
        fontSize: 28,
        color: COLORS.text,
    },
});
