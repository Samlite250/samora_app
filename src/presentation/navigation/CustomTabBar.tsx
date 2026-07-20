import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ROUTES = ['index', 'wallet', 'add', 'planner', 'profile'];

const getIcon = (routeName: string, focused: boolean): IoniconsName => {
    switch (routeName) {
        case 'index': return focused ? 'home' : 'home-outline';
        case 'wallet': return focused ? 'wallet' : 'wallet-outline';
        case 'planner': return focused ? 'calendar' : 'calendar-outline';
        case 'profile': return focused ? 'person' : 'person-outline';
        default: return 'home-outline';
    }
};

const getLabel = (routeName: string) => {
    switch (routeName) {
        case 'index': return 'Home';
        case 'wallet': return 'Wallet';
        case 'planner': return 'Planner';
        case 'profile': return 'Profile';
        default: return '';
    }
};

export const CustomTabBar: React.FC<any> = ({ state, navigation }) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handleAddPress = () => {
        scale.value = withSequence(withSpring(0.82), withSpring(1));
        navigation.navigate('add');
    };

    const visibleRoutes = state.routes.filter((r: any) => TAB_ROUTES.includes(r.name));

    return (
        <View style={styles.wrapper}>
            {/* Glassmorphism bar */}
            <View style={styles.glassBar}>
                {visibleRoutes.map((route: any) => {
                    const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
                    const isFocused = state.index === routeIndex;
                    const isAddBtn = route.name === 'add';

                    if (isAddBtn) {
                        return (
                            <View key={route.key} style={styles.addBtnWrapper}>
                                <Animated.View style={animStyle}>
                                    <TouchableOpacity
                                        onPress={handleAddPress}
                                        activeOpacity={0.85}
                                        style={styles.addBtn}
                                    >
                                        {/* Glow ring */}
                                        <View style={styles.addBtnGlow} />
                                        <Ionicons name="add" size={30} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </Animated.View>
                                <Text style={styles.addLabel}>Add</Text>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            }}
                            style={styles.tabBtn}
                            activeOpacity={0.7}
                        >
                            {/* Active indicator pill */}
                            {isFocused && <View style={styles.activePill} />}

                            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                                <Ionicons
                                    name={getIcon(route.name, isFocused)}
                                    size={22}
                                    color={isFocused ? '#FFFFFF' : COLORS.secondaryText}
                                />
                            </View>
                            <Text style={[styles.label, isFocused && styles.labelActive]}>
                                {getLabel(route.name)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    },
    glassBar: {
        flexDirection: 'row',
        height: 72,
        borderRadius: 28,
        // Light glassmorphism
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        // Soft shadow for floating effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 12,
        ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        } as any : {}),
    },
    tabBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 3,
        position: 'relative',
    },
    activePill: {
        position: 'absolute',
        top: 0,
        width: 32,
        height: 3,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 10,
        color: COLORS.secondaryText,
        letterSpacing: 0.3,
    },
    labelActive: {
        color: COLORS.primary,
        fontFamily: FONTS.semiBold,
    },
    addBtnWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        marginTop: -14,
    },
    addBtn: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.5)',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    addBtnGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        opacity: 0.15,
    },
    addLabel: {
        fontFamily: FONTS.semiBold,
        fontSize: 10,
        color: COLORS.primary,
        letterSpacing: 0.3,
    },
});
