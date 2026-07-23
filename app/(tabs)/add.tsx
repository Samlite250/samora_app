import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Action {
    id: string;
    label: string;
    icon: IoniconsName;
    color: string;
    desc: string;
}

const ACTIONS: Action[] = [
    { id: 'income', label: 'Add Income', icon: 'arrow-down-circle', color: COLORS.success, desc: 'Record earnings' },
    { id: 'expense', label: 'Add Expense', icon: 'arrow-up-circle', color: COLORS.expense, desc: 'Log spending' },
    { id: 'transfer', label: 'Transfer', icon: 'swap-horizontal', color: COLORS.primary, desc: 'Between wallets' },
    { id: 'bill', label: 'Add Bill', icon: 'receipt-outline', color: COLORS.warning, desc: 'Schedule payment' },
    { id: 'budget', label: 'Set Budget', icon: 'pie-chart-outline', color: '#8B5CF6', desc: 'Spending limit' },
    { id: 'goal', label: 'Create Goal', icon: 'flag-outline', color: '#F43F5E', desc: 'Save for a target' },
    { id: 'investment', label: 'Investment', icon: 'trending-up', color: '#0EA5E9', desc: 'Track portfolio' },
    { id: 'loan', label: 'Add Loan', icon: 'business-outline', color: '#F97316', desc: 'Manage borrowing' },
];

export default function AddScreen() {
    const router = useRouter();

    const handleActionPress = (id: string) => {
        if (id === 'income' || id === 'expense') {
            router.push('/(tabs)/wallet');
        } else if (id === 'transfer' || id === 'loan') {
            router.push('/(tabs)/transactions');
        } else if (id === 'bill') {
            router.push('/(tabs)/bills');
        } else if (id === 'budget') {
            router.push('/(tabs)/budgets');
        } else if (id === 'goal') {
            router.push('/(tabs)/goals');
        } else if (id === 'investment') {
            router.push('/(tabs)/analytics');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Add New</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.promptText}>What would you like to do?</Text>
                <Text style={styles.promptSub}>Select an action to get started</Text>

                <View style={styles.grid}>
                    {ACTIONS.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.gridItem}
                            activeOpacity={0.7}
                            onPress={() => handleActionPress(action.id)}>
                            <View style={styles.actionCard}>
                                <View style={[styles.iconContainer, { backgroundColor: action.color + '12' }]}>
                                    <Ionicons name={action.icon} size={24} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                                <Text style={styles.actionDesc}>{action.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: SIZES.lg, paddingBottom: 120 },
    promptText: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginBottom: 4, marginTop: SIZES.sm },
    promptSub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.secondaryText, marginBottom: SIZES.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: { width: '48.5%' },
    actionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SIZES.md, borderWidth: 1, borderColor: '#EEF1F7', gap: 6, minHeight: 140, justifyContent: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    actionLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    actionDesc: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.secondaryText },
});
