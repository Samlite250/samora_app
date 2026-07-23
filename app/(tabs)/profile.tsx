import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { useAuthStore } from '../../src/store/useAuthStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
    label: string;
    icon: IoniconsName;
    iconColor: string;
    badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
    { label: 'Personal Information', icon: 'person-outline', iconColor: COLORS.primary },
    { label: 'Security & Privacy', icon: 'shield-checkmark-outline', iconColor: COLORS.success },
    { label: 'Preferences', icon: 'settings-outline', iconColor: '#8B5CF6' },
    { label: 'Notification Settings', icon: 'notifications-outline', iconColor: COLORS.warning },
    { label: 'Linked Accounts', icon: 'link-outline', iconColor: '#0EA5E9' },
    { label: 'Help & Support', icon: 'help-circle-outline', iconColor: COLORS.secondaryText },
    { label: 'About Samora', icon: 'information-circle-outline', iconColor: COLORS.secondaryText },
];

export default function ProfileScreen() {
    const signOut = useAuthStore(state => state.signOut);
    const router = useRouter();

    const handleMenuPress = (label: string) => {
        if (label === 'Personal Information' || label === 'Security & Privacy') {
            router.push('/(tabs)/financial-health');
        } else if (label === 'Preferences') {
            router.push('/(tabs)/budgets');
        } else if (label === 'Notification Settings') {
            router.push('/(tabs)/bills');
        } else if (label === 'Linked Accounts') {
            router.push('/(tabs)/wallet');
        } else if (label === 'Help & Support' || label === 'About Samora') {
            router.push('/assistant');
        }
    };

    const handleLogOut = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: signOut }
        ]);
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ─── Profile Hero ─── */}
                    <View style={styles.profileHero}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarBg}>
                                <Ionicons name="person" size={44} color={COLORS.primary} />
                            </View>
                            <TouchableOpacity style={styles.editAvatar}>
                                <Ionicons name="camera" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.profileName}>Sam Ndayambaje</Text>
                        <Text style={styles.profileEmail}>sam@samora.com</Text>
                    </View>

                    {/* ─── Menu Items ─── */}
                    <View style={styles.menuCard}>
                        {MENU_ITEMS.map((item, idx) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[styles.menuRow, idx < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
                                onPress={() => handleMenuPress(item.label)}
                            >
                                <View style={[styles.menuIconBg, { backgroundColor: item.iconColor + '15' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                                </View>
                                <Text style={styles.menuText}>{item.label}</Text>
                                {item.badge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.badge}</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ─── Log Out ─── */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogOut}>
                        <Ionicons name="log-out-outline" size={18} color={COLORS.expense} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: SIZES.lg, paddingBottom: 120 },
    profileHero: { alignItems: 'center', paddingVertical: SIZES.xl },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarBg: { width: 88, height: 88, borderRadius: 44, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${COLORS.primary}30` },
    editAvatar: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
    profileName: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginBottom: 4 },
    profileEmail: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.secondaryText },
    menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF1F7', overflow: 'hidden', marginBottom: SIZES.lg },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: SIZES.md, gap: 12 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F4F7FB' },
    menuIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    menuText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text, flex: 1 },
    badge: { backgroundColor: COLORS.expense, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: FONTS.bold },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
    logoutText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.expense },
});
