import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../../core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const getIcon = (routeName: string, focused: boolean): IoniconsName => {
    switch (routeName) {
        case 'index': return focused ? 'home' : 'home-outline';
        case 'wallet': return focused ? 'wallet' : 'wallet-outline';
        case 'planner': return focused ? 'calendar' : 'calendar-outline';
        case 'profile': return focused ? 'person' : 'person-outline';
        default: return 'grid-outline';
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

// Light Brand Palette matching Samora Design System
const LIGHT_BAR_BG = '#FFFFFF';
const BAR_BORDER_COLOR = '#EEF1F7';
const ACCENT_BLUE = COLORS.primary; // #4285F4 Google Blue
const INACTIVE_TEXT = COLORS.secondaryText; // #6B7280

export const CustomTabBar: React.FC<any> = ({ state, navigation }) => {
    const addScale = useSharedValue(1);
    const { width: windowWidth } = useWindowDimensions();

    const barWidth = Math.min(windowWidth, 1024);
    const barHeight = 74;
    const notchR = 34;
    const center = barWidth / 2;

    // Generate smooth SVG Notched Path
    const d = `
        M 0,16
        A 16,16 0 0 1 16,0
        L ${center - notchR - 16},0
        C ${center - notchR + 4},0 ${center - notchR / 2 - 4},28 ${center},28
        C ${center + notchR / 2 + 4},28 ${center + notchR - 4},0 ${center + notchR + 16},0
        L ${barWidth - 16},0
        A 16,16 0 0 1 ${barWidth},16
        L ${barWidth},${barHeight + 40}
        L 0,${barHeight + 40}
        Z
    `;

    const addAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: addScale.value }],
    }));

    const handleAddPress = () => {
        addScale.value = withSequence(
            withTiming(0.85, { duration: 90 }),
            withTiming(1, { duration: 150 })
        );
        navigation.navigate('add');
    };

    const leftRoutes = state.routes.filter((r: any) => ['index', 'wallet'].includes(r.name));
    const rightRoutes = state.routes.filter((r: any) => ['planner', 'profile'].includes(r.name));

    const renderTabItem = (route: any) => {
        const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
        const isFocused = state.index === routeIndex;

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
                style={styles.tabItem}
                activeOpacity={0.7}
            >
                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                    <Ionicons
                        name={getIcon(route.name, isFocused)}
                        size={22}
                        color={isFocused ? ACCENT_BLUE : INACTIVE_TEXT}
                    />
                </View>

                <Text style={[styles.label, isFocused && styles.labelActive]}>
                    {getLabel(route.name)}
                </Text>

                {isFocused ? (
                    <View style={styles.activeDot} />
                ) : (
                    <View style={styles.emptyDotPlaceholder} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrapper}>
            <View style={[styles.navContainer, { width: barWidth }]}>
                {/* SVG Notched Background Path */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg width={barWidth} height={barHeight + 40}>
                        <Path
                            d={d}
                            fill={LIGHT_BAR_BG}
                            stroke={BAR_BORDER_COLOR}
                            strokeWidth={1.5}
                        />
                    </Svg>
                </View>

                {/* Left Tabs Group */}
                <View style={styles.sideGroup}>
                    {leftRoutes.map(renderTabItem)}
                </View>

                {/* Center Floating Primary Blue Add Button */}
                <View style={styles.centerAddSlot}>
                    <Animated.View style={addAnimStyle}>
                        <TouchableOpacity
                            onPress={handleAddPress}
                            activeOpacity={0.85}
                            style={styles.floatingAddBtn}
                        >
                            <Ionicons name="add" size={32} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Right Tabs Group */}
                <View style={styles.sideGroup}>
                    {rightRoutes.map(renderTabItem)}
                </View>
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
        width: '100%',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 24 : 0,
        backgroundColor: 'transparent',

        // Soft elevation shadow for floating light bar
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 12,
    },
    navContainer: {
        height: 74,
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    sideGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        zIndex: 2,
    },
    centerAddSlot: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -30,
        zIndex: 10,
    },
    floatingAddBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: ACCENT_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3.5,
        borderColor: LIGHT_BAR_BG,
        shadowColor: ACCENT_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        paddingTop: 4,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    iconWrapActive: {
        backgroundColor: 'rgba(66, 133, 244, 0.12)',
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 10,
        color: INACTIVE_TEXT,
        letterSpacing: 0.2,
    },
    labelActive: {
        color: ACCENT_BLUE,
        fontFamily: FONTS.bold,
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: ACCENT_BLUE,
        marginTop: 1,
    },
    emptyDotPlaceholder: {
        width: 5,
        height: 5,
        marginTop: 1,
    },
});
