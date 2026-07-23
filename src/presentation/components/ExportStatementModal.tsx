import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { exportToCSV, exportToPDF, filterTransactionsForExport } from '../../core/services/exportService';
import { COLORS, FONTS, SIZES } from '../../core/theme';
import { useAppDataStore } from '../../store/useAppDataStore';
import { useAuthStore } from '../../store/useAuthStore';

interface ExportStatementModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ExportStatementModal: React.FC<ExportStatementModalProps> = ({ visible, onClose }) => {
    const { transactions, wallets } = useAppDataStore();
    const { profile } = useAuthStore();

    const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
    const [dateRange, setDateRange] = useState<'month' | '30days' | 'ytd' | 'all'>('month');
    const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const filteredCount = filterTransactionsForExport(transactions, {
        format,
        dateRange,
        walletId: selectedWalletId,
    }).length;

    const handleGenerateExport = () => {
        setIsExporting(true);
        setSuccessMsg('');

        const targetTransactions = filterTransactionsForExport(transactions, {
            format,
            dateRange,
            walletId: selectedWalletId,
        });

        if (targetTransactions.length === 0) {
            setIsExporting(false);
            setSuccessMsg('No transactions match the selected criteria.');
            return;
        }

        setTimeout(() => {
            if (format === 'csv') {
                exportToCSV(targetTransactions, `samora_statement_${dateRange}.csv`);
            } else {
                exportToPDF(targetTransactions, profile || { full_name: 'Valued Account Holder' });
            }

            setIsExporting(false);
            setSuccessMsg(format === 'csv' ? 'CSV file downloaded successfully!' : 'PDF statement opened for print/download.');
        }, 600);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.iconBg}>
                                <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.title}>Export Financial Statement</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                        {/* 1. Format Selection */}
                        <Text style={styles.sectionLabel}>Select Export Format</Text>
                        <View style={styles.formatRow}>
                            <TouchableOpacity
                                style={[styles.formatCard, format === 'pdf' && styles.formatCardActive]}
                                onPress={() => setFormat('pdf')}>
                                <Ionicons name="newspaper-outline" size={24} color={format === 'pdf' ? COLORS.primary : COLORS.secondaryText} />
                                <View>
                                    <Text style={[styles.formatTitle, format === 'pdf' && styles.formatTitleActive]}>PDF Report</Text>
                                    <Text style={styles.formatSub}>Printable official statement with header & summary</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.formatCard, format === 'csv' && styles.formatCardActive]}
                                onPress={() => setFormat('csv')}>
                                <Ionicons name="grid-outline" size={24} color={format === 'csv' ? COLORS.primary : COLORS.secondaryText} />
                                <View>
                                    <Text style={[styles.formatTitle, format === 'csv' && styles.formatTitleActive]}>CSV Spreadsheet</Text>
                                    <Text style={styles.formatSub}>Raw transaction ledger for Excel / Google Sheets</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* 2. Date Range Selection */}
                        <Text style={styles.sectionLabel}>Select Date Range</Text>
                        <View style={styles.chipRow}>
                            {[
                                { key: 'month', label: 'This Month' },
                                { key: '30days', label: 'Last 30 Days' },
                                { key: 'ytd', label: 'Year to Date' },
                                { key: 'all', label: 'All Time' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.chip, dateRange === item.key && styles.chipActive]}
                                    onPress={() => setDateRange(item.key as any)}>
                                    <Text style={[styles.chipText, dateRange === item.key && styles.chipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 3. Wallet Filter */}
                        <Text style={styles.sectionLabel}>Filter by Wallet</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            <TouchableOpacity
                                style={[styles.walletChip, selectedWalletId === 'all' && styles.walletChipActive]}
                                onPress={() => setSelectedWalletId('all')}>
                                <Text style={[styles.walletChipText, selectedWalletId === 'all' && styles.walletChipTextActive]}>
                                    All Wallets
                                </Text>
                            </TouchableOpacity>

                            {wallets.map((w: any) => (
                                <TouchableOpacity
                                    key={w.id}
                                    style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]}
                                    onPress={() => setSelectedWalletId(w.id)}>
                                    <Text style={[styles.walletChipText, selectedWalletId === w.id && styles.walletChipTextActive]}>
                                        {w.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Counter Info Banner */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.infoText}>
                                {filteredCount} transaction{filteredCount !== 1 ? 's' : ''} will be included in this export.
                            </Text>
                        </View>

                        {successMsg ? (
                            <View style={[styles.successBanner, successMsg.includes('No') && { backgroundColor: `${COLORS.warning}18` }]}>
                                <Ionicons name={successMsg.includes('No') ? 'alert-circle' : 'checkmark-circle'} size={18} color={successMsg.includes('No') ? COLORS.warning : COLORS.success} />
                                <Text style={[styles.successText, successMsg.includes('No') && { color: COLORS.warning }]}>{successMsg}</Text>
                            </View>
                        ) : null}

                        {/* Generate Button */}
                        <TouchableOpacity
                            style={[styles.generateBtn, isExporting && { opacity: 0.7 }]}
                            onPress={handleGenerateExport}
                            disabled={isExporting}>
                            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.generateBtnText}>
                                {isExporting ? 'Generating Statement...' : `Download ${format.toUpperCase()} Statement`}
                            </Text>
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.lg, maxHeight: '88%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 20 },

    sectionLabel: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text, marginTop: 12, marginBottom: 8 },
    formatRow: { gap: 10, marginBottom: 12 },
    formatCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#EEF1F7' },
    formatCardActive: { backgroundColor: `${COLORS.primary}08`, borderColor: COLORS.primary },
    formatTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    formatTitleActive: { color: COLORS.primary },
    formatSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.secondaryText, marginTop: 2, paddingRight: 20 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7' },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    chipTextActive: { color: '#FFFFFF', fontFamily: FONTS.bold },

    walletChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F4F7FB', borderWidth: 1, borderColor: '#EEF1F7', marginRight: 8 },
    walletChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    walletChipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.secondaryText },
    walletChipTextActive: { color: '#FFFFFF', fontFamily: FONTS.bold },

    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${COLORS.primary}10`, padding: 12, borderRadius: 12, marginBottom: 12 },
    infoText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.primary },

    successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${COLORS.success}15`, padding: 12, borderRadius: 12, marginBottom: 12 },
    successText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.success },

    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, marginTop: 6 },
    generateBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
});
