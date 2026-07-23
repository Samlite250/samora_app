import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ScreenBackground } from '../../src/core/components/ScreenBackground';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';
import { CurrencySelectorModal } from '../../src/presentation/components/CurrencySelectorModal';
import { ExportStatementModal } from '../../src/presentation/components/ExportStatementModal';
import { useAuthStore } from '../../src/store/useAuthStore';
import { CURRENCIES, useCurrencyStore } from '../../src/store/useCurrencyStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/* ─── Generic inline drawer modal ─── */
function DrawerModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={dr.overlay}>
                <View style={dr.sheet}>
                    <View style={dr.header}>
                        <Text style={dr.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={dr.closeBtn}>
                            <Ionicons name="close" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={dr.body} showsVerticalScrollIndicator={false}>
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const dr = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    title: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
    closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    body: { padding: 20, gap: 14 },
});

/* ─── PersonalInfoModal ─── */
function PersonalInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { profile, updateProfile } = useAuthStore();
    const [name, setName] = useState(profile.fullName);
    const [phone, setPhone] = useState(profile.phone);

    // Sync input when modal opens
    React.useEffect(() => {
        if (visible) {
            setName(profile.fullName);
            setPhone(profile.phone);
        }
    }, [visible, profile]);

    const handleSave = async () => {
        await updateProfile({ fullName: name, phone });
        Alert.alert('Saved & Persisted', 'Your personal information has been saved successfully!');
        onClose();
    };

    return (
        <DrawerModal visible={visible} title="Personal Information" onClose={onClose}>
            <Text style={s.fieldLabel}>Full Name</Text>
            <TextInput style={s.fieldInput} value={name} onChangeText={setName} placeholder="Full Name" />
            <Text style={s.fieldLabel}>Email Address</Text>
            <TextInput style={[s.fieldInput, { color: COLORS.secondaryText }]} value={profile.email} editable={false} />
            <Text style={s.fieldLabel}>Phone Number</Text>
            <TextInput style={s.fieldInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+250 780 000 000" />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
        </DrawerModal>
    );
}

/* ─── SecurityModal ─── */
function SecurityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [biometrics, setBiometrics] = useState(true);
    const [twoFA, setTwoFA] = useState(false);
    return (
        <DrawerModal visible={visible} title="Security & Privacy" onClose={onClose}>
            <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Biometric Login</Text>
                    <Text style={s.toggleSub}>Use fingerprint or Face ID to sign in</Text>
                </View>
                <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ true: COLORS.primary }} />
            </View>
            <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Two-Factor Authentication</Text>
                    <Text style={s.toggleSub}>Receive an OTP code on sign in</Text>
                </View>
                <Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ true: COLORS.primary }} />
            </View>
            <TouchableOpacity style={[s.saveBtn, { marginTop: 8 }]} onPress={() => { Alert.alert('Updated', 'Security settings saved.'); onClose(); }}>
                <Text style={s.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dangerBtn} onPress={() => Alert.alert('Change Password', 'A reset link has been sent to sam@samora.com')}>
                <Ionicons name="lock-closed-outline" size={16} color={COLORS.expense} />
                <Text style={s.dangerBtnText}>Change Password</Text>
            </TouchableOpacity>
        </DrawerModal>
    );
}

/* ─── PreferencesModal ─── */
function PreferencesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [darkMode, setDarkMode] = useState(false);
    const [compactView, setCompactView] = useState(false);
    const [autoSync, setAutoSync] = useState(true);
    return (
        <DrawerModal visible={visible} title="Preferences" onClose={onClose}>
            <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Dark Mode</Text>
                    <Text style={s.toggleSub}>Switch to dark theme</Text>
                </View>
                <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} />
            </View>
            <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Compact View</Text>
                    <Text style={s.toggleSub}>Show more data per screen</Text>
                </View>
                <Switch value={compactView} onValueChange={setCompactView} trackColor={{ true: COLORS.primary }} />
            </View>
            <View style={s.toggleRow}>
                <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Auto Sync</Text>
                    <Text style={s.toggleSub}>Sync data with cloud in real time</Text>
                </View>
                <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: COLORS.primary }} />
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={() => { Alert.alert('Saved', 'Preferences updated!'); onClose(); }}>
                <Text style={s.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
        </DrawerModal>
    );
}

/* ─── NotificationsModal ─── */
function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [billReminders, setBillReminders] = useState(true);
    const [goalAlerts, setGoalAlerts] = useState(true);
    const [budgetAlerts, setBudgetAlerts] = useState(false);
    return (
        <DrawerModal visible={visible} title="Notification Settings" onClose={onClose}>
            {[
                { label: 'Push Notifications', sub: 'Receive in-app alerts', val: pushEnabled, set: setPushEnabled },
                { label: 'Bill Reminders', sub: 'Get notified before bills are due', val: billReminders, set: setBillReminders },
                { label: 'Goal Milestones', sub: 'Celebrate savings progress', val: goalAlerts, set: setGoalAlerts },
                { label: 'Budget Warnings', sub: 'Alert when 80% budget is used', val: budgetAlerts, set: setBudgetAlerts },
            ].map(({ label, sub, val, set }) => (
                <View key={label} style={s.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.toggleLabel}>{label}</Text>
                        <Text style={s.toggleSub}>{sub}</Text>
                    </View>
                    <Switch value={val} onValueChange={set} trackColor={{ true: COLORS.primary }} />
                </View>
            ))}
            <TouchableOpacity style={s.saveBtn} onPress={() => { Alert.alert('Saved', 'Notification settings saved!'); onClose(); }}>
                <Text style={s.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>
        </DrawerModal>
    );
}

/* ─── LinkedAccountsModal ─── */
function LinkedAccountsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const LINKED = [
        { name: 'Bank of Kigali', icon: 'business-outline', connected: true, color: COLORS.primary },
        { name: 'MTN Mobile Money', icon: 'phone-portrait-outline', connected: true, color: '#FFC72C' },
        { name: 'Airtel Money', icon: 'phone-portrait-outline', connected: false, color: '#E4002B' },
        { name: 'I&M Bank', icon: 'business-outline', connected: false, color: COLORS.success },
    ];
    return (
        <DrawerModal visible={visible} title="Linked Accounts" onClose={onClose}>
            {LINKED.map((acc) => (
                <View key={acc.name} style={s.linkedRow}>
                    <View style={[s.linkedIcon, { backgroundColor: acc.color + '18' }]}>
                        <Ionicons name={acc.icon as IoniconsName} size={18} color={acc.color} />
                    </View>
                    <Text style={s.linkedName}>{acc.name}</Text>
                    <TouchableOpacity
                        style={[s.linkedBtn, { backgroundColor: acc.connected ? 'rgba(239,68,68,0.08)' : `${COLORS.primary}12` }]}
                        onPress={() => Alert.alert(acc.connected ? 'Disconnect' : 'Connect', `${acc.connected ? 'Disconnect from' : 'Connect to'} ${acc.name}?`)}>
                        <Text style={[s.linkedBtnText, { color: acc.connected ? COLORS.expense : COLORS.primary }]}>
                            {acc.connected ? 'Disconnect' : 'Connect'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}
        </DrawerModal>
    );
}

/* ─── HelpModal ─── */
function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const FAQ = [
        { q: 'How do I add a transaction?', a: 'Tap the ➕ button on the top navigation bar or the Add tab.' },
        { q: 'How do I change my currency?', a: 'Go to Profile → Display Currency and select your preferred currency.' },
        { q: 'How do budgets work?', a: 'Set a monthly spending limit per category. Expenses automatically track against it.' },
        { q: 'How do I mark a bill as paid?', a: 'Open the Planner tab, find the bill, and tap "Mark as Paid".' },
    ];
    return (
        <DrawerModal visible={visible} title="Help & Support" onClose={onClose}>
            {FAQ.map(({ q, a }, i) => (
                <View key={i} style={s.faqItem}>
                    <Text style={s.faqQ}>{q}</Text>
                    <Text style={s.faqA}>{a}</Text>
                </View>
            ))}
            <TouchableOpacity style={s.saveBtn} onPress={() => Alert.alert('Support', 'Email sent to support@samora.app')}>
                <Ionicons name="mail-outline" size={16} color="#FFF" />
                <Text style={s.saveBtnText}>  Contact Support</Text>
            </TouchableOpacity>
        </DrawerModal>
    );
}

/* ─── AboutModal ─── */
function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    return (
        <DrawerModal visible={visible} title="About Samora" onClose={onClose}>
            <View style={s.aboutHero}>
                <View style={s.aboutLogo}>
                    <Ionicons name="wallet" size={40} color={COLORS.primary} />
                </View>
                <Text style={s.aboutAppName}>Samora Finance</Text>
                <Text style={s.aboutVersion}>Version 1.0.0 (Build 100)</Text>
            </View>
            <Text style={s.aboutDesc}>Samora Finance is a premium personal finance manager built for East Africa — helping you track spending, manage bills, and grow your savings.</Text>
            {[
                { label: 'Privacy Policy', icon: 'shield-outline' },
                { label: 'Terms of Service', icon: 'document-text-outline' },
                { label: 'Open Source Licenses', icon: 'code-slash-outline' },
            ].map(({ label, icon }) => (
                <TouchableOpacity key={label} style={s.aboutRow} onPress={() => Alert.alert(label, 'Coming soon.')}>
                    <Ionicons name={icon as IoniconsName} size={18} color={COLORS.primary} />
                    <Text style={s.aboutRowText}>{label}</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
                </TouchableOpacity>
            ))}
        </DrawerModal>
    );
}

/* ─────────────── MAIN PROFILE SCREEN ─────────────── */
export default function ProfileScreen() {
    const { profile, signOut } = useAuthStore();
    const { currency } = useCurrencyStore();

    const [modals, setModals] = useState({
        currency: false,
        personal: false,
        security: false,
        prefs: false,
        notifs: false,
        linked: false,
        help: false,
        about: false,
        export: false,
    });
    const show = (key: keyof typeof modals) => setModals(m => ({ ...m, [key]: true }));
    const hide = (key: keyof typeof modals) => setModals(m => ({ ...m, [key]: false }));

    const MENU: { label: string; icon: IoniconsName; color: string; sub?: string; key: keyof typeof modals }[] = [
        { label: 'Display Currency', icon: 'globe-outline', color: COLORS.primary, sub: `${CURRENCIES[currency].name} (${currency})`, key: 'currency' },
        { label: 'Download Financial Statement', icon: 'document-text-outline', color: COLORS.primary, sub: 'PDF Report & CSV Export', key: 'export' },
        { label: 'Personal Information', icon: 'person-outline', color: COLORS.primary, sub: `${profile.fullName} • ${profile.phone}`, key: 'personal' },
        { label: 'Security & Privacy', icon: 'shield-checkmark-outline', color: COLORS.success, key: 'security' },
        { label: 'Preferences', icon: 'settings-outline', color: '#8B5CF6', key: 'prefs' },
        { label: 'Notification Settings', icon: 'notifications-outline', color: COLORS.warning, key: 'notifs' },
        { label: 'Linked Accounts', icon: 'link-outline', color: '#0EA5E9', key: 'linked' },
        { label: 'Help & Support', icon: 'help-circle-outline', color: COLORS.secondaryText, key: 'help' },
        { label: 'About Samora', icon: 'information-circle-outline', color: COLORS.secondaryText, key: 'about' },
    ];

    const handleLogOut = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <ScreenBackground>
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.headerTitle}>Profile</Text>
                    <TouchableOpacity style={s.settingsBtn} onPress={() => show('currency')}>
                        <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {/* ─── Profile Hero ─── */}
                    <View style={s.profileHero}>
                        <View style={s.avatarWrapper}>
                            <View style={s.avatarBg}>
                                <Ionicons name="person" size={44} color={COLORS.primary} />
                            </View>
                            <TouchableOpacity style={s.editAvatar} onPress={() => Alert.alert('Change Photo', 'Camera/Gallery option coming soon.')}>
                                <Ionicons name="camera" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.profileName}>{profile.fullName}</Text>
                        <Text style={s.profileEmail}>{profile.email}</Text>
                    </View>

                    {/* ─── Menu Items ─── */}
                    <View style={s.menuCard}>
                        {MENU.map((item, idx) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[s.menuRow, idx < MENU.length - 1 && s.menuRowBorder]}
                                onPress={() => show(item.key)}>
                                <View style={[s.menuIconBg, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.menuText}>{item.label}</Text>
                                    {item.sub && <Text style={s.menuSubtitle}>{item.sub}</Text>}
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ─── Log Out ─── */}
                    <TouchableOpacity style={s.logoutBtn} onPress={handleLogOut}>
                        <Ionicons name="log-out-outline" size={18} color={COLORS.expense} />
                        <Text style={s.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* ─── All Modals ─── */}
            <CurrencySelectorModal visible={modals.currency} onClose={() => hide('currency')} />
            <ExportStatementModal visible={modals.export} onClose={() => hide('export')} />
            <PersonalInfoModal visible={modals.personal} onClose={() => hide('personal')} />
            <SecurityModal visible={modals.security} onClose={() => hide('security')} />
            <PreferencesModal visible={modals.prefs} onClose={() => hide('prefs')} />
            <NotificationsModal visible={modals.notifs} onClose={() => hide('notifs')} />
            <LinkedAccountsModal visible={modals.linked} onClose={() => hide('linked')} />
            <HelpModal visible={modals.help} onClose={() => hide('help')} />
            <AboutModal visible={modals.about} onClose={() => hide('about')} />
        </ScreenBackground>
    );
}

const s = StyleSheet.create({
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
    menuText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
    menuSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
    logoutText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.expense },
    /* Form fields */
    fieldLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
    fieldInput: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#EEF1F7', paddingHorizontal: 14, paddingVertical: 11, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 13 },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
    dangerBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.expense },
    /* Toggle rows */
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    toggleSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    /* Linked accounts */
    linkedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    linkedIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    linkedName: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    linkedBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
    linkedBtnText: { fontFamily: FONTS.semiBold, fontSize: 13 },
    /* FAQ */
    faqItem: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, gap: 6 },
    faqQ: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    faqA: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText },
    /* About */
    aboutHero: { alignItems: 'center', paddingVertical: 12, gap: 6 },
    aboutLogo: { width: 72, height: 72, borderRadius: 20, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
    aboutAppName: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    aboutVersion: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText },
    aboutDesc: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, lineHeight: 20 },
    aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    aboutRowText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
});
