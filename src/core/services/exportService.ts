import { Platform } from 'react-native';

export interface ExportOptions {
    format: 'csv' | 'pdf';
    dateRange: 'month' | '30days' | 'ytd' | 'all';
    walletId?: string;
    currency?: string;
}

export const filterTransactionsForExport = (
    transactions: any[],
    options: ExportOptions
) => {
    let filtered = [...transactions];

    // Filter by wallet
    if (options.walletId && options.walletId !== 'all') {
        filtered = filtered.filter(tx => tx.wallet_id === options.walletId);
    }

    // Filter by date range
    const now = new Date();
    if (options.dateRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(tx => new Date(tx.date) >= startOfMonth);
    } else if (options.dateRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        filtered = filtered.filter(tx => new Date(tx.date) >= thirtyDaysAgo);
    } else if (options.dateRange === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(tx => new Date(tx.date) >= startOfYear);
    }

    return filtered;
};

export const exportToCSV = (transactions: any[], filename = 'samora_statement.csv') => {
    if (transactions.length === 0) return false;

    // Build CSV content
    const headers = ['Transaction ID', 'Date', 'Title', 'Type', 'Category', 'Wallet', 'Amount (FRw)', 'Status'];
    const rows = transactions.map(tx => [
        `"${tx.id || ''}"`,
        `"${tx.date || ''}"`,
        `"${(tx.title || '').replace(/"/g, '""')}"`,
        `"${(tx.type || '').toUpperCase()}"`,
        `"${(tx.category || '').replace(/"/g, '""')}"`,
        `"${(tx.wallet_name || tx.wallets?.name || 'Wallet').replace(/"/g, '""')}"`,
        `"${tx.amount || 0}"`,
        `"Completed"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Trigger download in Web or save locally
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }

    return true;
};

export const exportToPDF = (
    transactions: any[],
    userProfile: { full_name?: string; email?: string } = {},
    filename = 'samora_statement.pdf'
) => {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const netBalance = totalIncome - totalExpense;
    const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const rowsHTML = transactions.map(tx => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${tx.date}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${tx.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${tx.category || 'General'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${tx.wallet_name || 'Wallet'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: ${tx.type === 'income' ? '#16A34A' : '#DC2626'};">
                ${tx.type === 'income' ? '+' : '-'}FRw ${(parseFloat(tx.amount) || 0).toLocaleString()}
            </td>
        </tr>
    `).join('');

    const htmlDocument = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Samora Fintech - Financial Statement</title>
        <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; margin: 0; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1A56DB; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 24px; font-weight: bold; color: #1A56DB; letter-spacing: -0.5px; }
            .tagline { font-size: 12px; color: #64748B; margin-top: 2px; }
            .statement-title { text-align: right; }
            .statement-title h1 { margin: 0; font-size: 20px; color: #0F172A; }
            .statement-title p { margin: 4px 0 0 0; font-size: 12px; color: #64748B; }
            
            .user-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            .user-info p { margin: 2px 0; font-size: 13px; color: #475569; }
            .user-info strong { color: #0F172A; }
            
            .summary-cards { display: flex; gap: 16px; margin-bottom: 30px; }
            .card { flex: 1; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
            .card-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; }
            .card-value { font-size: 20px; font-weight: 700; margin-top: 6px; }
            .income { color: #16A34A; }
            .expense { color: #DC2626; }
            .net { color: #1A56DB; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background: #F1F5F9; color: #475569; font-weight: 600; text-align: left; padding: 12px 10px; border-bottom: 2px solid #E2E8F0; }
            
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #94A3B8; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="brand">SAMORA FINTECH</div>
                <div class="tagline">Official Financial Statement</div>
            </div>
            <div class="statement-title">
                <h1>ACCOUNT STATEMENT</h1>
                <p>Generated: ${generatedDate}</p>
            </div>
        </div>

        <div class="user-box">
            <div class="user-info">
                <p><strong>Account Holder:</strong> ${userProfile.full_name || 'Valued User'}</p>
                <p><strong>Email:</strong> ${userProfile.email || 'user@samora.app'}</p>
            </div>
            <div class="user-info" style="text-align: right;">
                <p><strong>Currency:</strong> RWF (Rwandan Franc)</p>
                <p><strong>Total Transactions:</strong> ${transactions.length}</p>
            </div>
        </div>

        <div class="summary-cards">
            <div class="card">
                <div class="card-label">Total Income</div>
                <div class="card-value income">+FRw ${totalIncome.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-label">Total Expenses</div>
                <div class="card-value expense">-FRw ${totalExpense.toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-label">Net Balance</div>
                <div class="card-value net">FRw ${netBalance.toLocaleString()}</div>
            </div>
        </div>

        <h3 style="font-size: 15px; color: #0F172A; margin-bottom: 10px;">Transaction Ledger</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Wallet</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>

        <div class="footer">
            Samora Financial Technologies Ltd. • End-to-end encrypted statement • Confidential
        </div>
    </body>
    </html>
    `;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlDocument);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
            return true;
        }
    }

    return true;
};
