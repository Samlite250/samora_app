import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../src/core/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS = ['All', 'Income', 'Expense', 'Transfer'];

const TODAY_TXS = [
    { title: 'Salary', sub: 'Bank Account', amount: '+$3,850.00', type: 'in', icon: 'briefcase-outline' as IoniconsName },
    { title: 'Uber', sub: 'Transportation', amount: '-$12.50', type: 'out', icon: 'car-outline' as IoniconsName },
    { title: 'Grocery Store', sub: 'Food & Dining', amount: '-$46.80', type: 'out', icon: 'cart-outline' as IoniconsName },
];

const YESTERDAY_TXS = [
    { title: 'Freelance Work', sub: 'Income', amount: '+$250.00', type: 'in', icon: 'code-slash-outline' as IoniconsName },
    { title: 'Electricity Bill', sub: 'Bills & Utilities', amount: '-$120.00', type: 'out', icon: 'flash-outline' as IoniconsName },
];

export default function TransactionsScreen() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Transactions</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={COLORS.secondaryText} style={{ marginLeft: 12 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    placeholderTextColor={COLORS.secondaryText}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity key={f} style={[styles.filterTab, activeFilter === f && styles.filterTabActive]} onPress={() => setActiveFilter(f)}>
                        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Today */}
                <Text style={styles.groupLabel}>Today</Text>
                {TODAY_TXS.map((tx, i) => (
                    <TouchableOpacity key={i} style={styles.txItem}>
                        <View style={[styles.txIcon, { backgroundColor: tx.type === 'in' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                            <Ionicons name={tx.icon} size={20} color={tx.type === 'in' ? COLORS.success : COLORS.expense} />
                        </View>
                        <View style={styles.txDetails}>
                            <Text style={styles.txTitle}>{tx.title}</Text>
                            <Text style={styles.txSub}>{tx.sub}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.type === 'in' ? COLORS.success : COLORS.expense }]}>{tx.amount}</Text>
                    </TouchableOpacity>
                ))}

                {/* Yesterday */}
                <Text style={styles.groupLabel}>Yesterday</Text>
                {YESTERDAY_TXS.map((tx, i) => (
                    <TouchableOpacity key={i} style={styles.txItem}>
                        <View style={[styles.txIcon, { backgroundColor: tx.type === 'in' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.08)' }]}>
                            <Ionicons name={tx.icon} size={20} color={tx.type === 'in' ? COLORS.success : COLORS.expense} />
                        </View>
                        <View style={styles.txDetails}>
                            <Text style={styles.txTitle}>{tx.title}</Text>
                            <Text style={styles.txSub}>{tx.sub}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.type === 'in' ? COLORS.success : COLORS.expense }]}>{tx.amount}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.viewAllBtn}>
                    <Text style={styles.viewAllText}>View All Transactions</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}12`, alignItems: 'center', justifyContent: 'center' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: SIZES.lg, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EEF1F7', height: 44 },
    searchInput: { flex: 1, paddingHorizontal: 10, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
    filterRow: { flexDirection: 'row', paddingHorizontal: SIZES.lg, marginBottom: SIZES.md, gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF1F7' },
    filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.secondaryText },
    filterTextActive: { color: '#FFFFFF' },
    scroll: { paddingHorizontal: SIZES.lg, paddingBottom: 120 },
    groupLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondaryText, marginBottom: 8, marginTop: 8 },
    txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: SIZES.md, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEF1F7' },
    txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txDetails: { flex: 1 },
    txTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
    txSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText },
    txAmount: { fontFamily: FONTS.semiBold, fontSize: 14 },
    viewAllBtn: { paddingVertical: 14, alignItems: 'center' },
    viewAllText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
});
