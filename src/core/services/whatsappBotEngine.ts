/**
 * Digital+ WhatsApp Bot Engine & Financial Command Processor
 * Stages 5, 6, 7, 8 Implementation
 */

import {
    createExpense,
    createIncome,
    getBills,
    getTransactions,
    getWallets,
} from './financialService';
import { sendWhatsAppInteractiveButtons, sendWhatsAppTextMessage } from './whatsappCloudApi';
import { InboundWhatsAppMessage, logInboundMessageToDb } from './whatsappWebhookHandler';

export async function processInboundWhatsAppMessage(msg: InboundWhatsAppMessage): Promise<boolean> {
    const fromPhone = msg.fromPhone;
    const text = (msg.textBody || msg.buttonReplyId || '').trim().toLowerCase();

    console.log(`[whatsappBotEngine] Processing inbound message from ${fromPhone}: "${text}"`);

    // 1. Verify user account linking
    // We search database for linked user matching phone number
    const account = await getWhatsAppAccountByPhone(fromPhone);

    if (!account || !account.is_verified) {
        await logInboundMessageToDb(msg);
        const unlinkedNotice =
            `👋 Welcome to Digital+ Financial Assistant!\n\n` +
            `Your WhatsApp number (${fromPhone}) is not linked to a Digital+ account.\n\n` +
            `Please open the Digital+ App -> Profile -> WhatsApp Integration to link and verify your account.`;

        return await sendWhatsAppTextMessage(fromPhone, unlinkedNotice);
    }

    // Log message linked to user's account
    await logInboundMessageToDb(msg, account.id);
    const userId = account.user_id;

    // 2. Command Routing & Natural Language Keyword Matching

    // A. Main Menu / Help
    if (text === 'menu' || text === 'help' || text === 'hi' || text === 'hello' || text === 'start' || msg.buttonReplyId === 'btn_menu') {
        return await sendMainMenu(fromPhone);
    }

    // B. Check Balance
    if (text.includes('balance') || text === 'wallets' || msg.buttonReplyId === 'btn_balance') {
        return await handleCheckBalanceCommand(userId, fromPhone);
    }

    // C. View Bills
    if (text.includes('bill') || text.includes('due') || msg.buttonReplyId === 'btn_bills') {
        return await handleViewBillsCommand(userId, fromPhone);
    }

    // D. Add Expense (e.g., "add expense 5000 lunch", "spent 2000 on food", "expense 1500 taxi")
    const expenseMatch = text.match(/(?:add expense|spent|expense)\s+(\d+(?:\.\d+)?)\s*(?:on\s+)?(.+)?/i);
    if (expenseMatch) {
        const amount = parseFloat(expenseMatch[1]);
        const categoryOrNote = expenseMatch[2]?.trim() || 'General Expense';
        return await handleAddExpenseCommand(userId, fromPhone, amount, categoryOrNote);
    }

    // E. Add Income (e.g., "add income 50000 salary", "received 10000 bonus")
    const incomeMatch = text.match(/(?:add income|received|income)\s+(\d+(?:\.\d+)?)\s*(?:from\s+)?(.+)?/i);
    if (incomeMatch) {
        const amount = parseFloat(incomeMatch[1]);
        const sourceOrNote = incomeMatch[2]?.trim() || 'General Income';
        return await handleAddIncomeCommand(userId, fromPhone, amount, sourceOrNote);
    }

    // F. Recent Transactions
    if (text.includes('transaction') || text.includes('recent') || text.includes('history')) {
        return await handleRecentTransactionsCommand(userId, fromPhone);
    }

    // Default Fallback: Send interactive menu options
    const fallbackText =
        `🤖 Digital+ AI Assistant:\n` +
        `I didn't quite catch that. Here are things you can ask me:\n\n` +
        `• "balance" - Check total & wallet balances\n` +
        `• "spent 5000 on Food" - Record an expense\n` +
        `• "income 50000 Salary" - Record income\n` +
        `• "bills" - View pending bill payments`;

    await sendWhatsAppTextMessage(fromPhone, fallbackText);
    return await sendMainMenu(fromPhone);
}

/** Helper: Find whatsapp_account record by phone number */
async function getWhatsAppAccountByPhone(phone: string) {
    const { supabase } = await import('../../data/api/supabase');
    if (!supabase) return null;

    const formatted = phone.trim();
    const { data } = await supabase
        .from('whatsapp_accounts')
        .select('*')
        .eq('phone_number', formatted)
        .maybeSingle();

    return data;
}

/** Send Interactive Main Menu Buttons */
async function sendMainMenu(toPhone: string): Promise<boolean> {
    const body = `💡 Digital+ Quick Financial Menu\nSelect an action below or type a command directly:`;
    const buttons = [
        { id: 'btn_balance', title: '💰 Check Balance' },
        { id: 'btn_bills', title: '📄 Pending Bills' },
        { id: 'btn_menu', title: '❓ Command List' },
    ];
    return await sendWhatsAppInteractiveButtons(toPhone, body, buttons, 'Digital+ Assistant');
}

/** Command: Check Balance */
async function handleCheckBalanceCommand(userId: string, toPhone: string): Promise<boolean> {
    const wallets = await getWallets(userId);
    if (!wallets || wallets.length === 0) {
        return await sendWhatsAppTextMessage(toPhone, `💳 No wallets found in your Digital+ account.`);
    }

    const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(String(w.balance)) || 0), 0);
    let msg = `💳 *Digital+ Wallet Summary*\n\n`;
    msg += `*Total Balance:* RWF ${totalBalance.toLocaleString()}\n\n`;
    msg += `*Wallets Breakdown:*\n`;

    wallets.forEach((w) => {
        msg += `• ${w.name} (${w.type}): RWF ${(parseFloat(String(w.balance)) || 0).toLocaleString()}\n`;
    });

    return await sendWhatsAppTextMessage(toPhone, msg);
}

/** Command: View Bills */
async function handleViewBillsCommand(userId: string, toPhone: string): Promise<boolean> {
    const bills = await getBills(userId);
    const unpaid = bills.filter(b => !b.is_paid);

    if (unpaid.length === 0) {
        return await sendWhatsAppTextMessage(toPhone, `🎉 All caught up! You have 0 pending bills.`);
    }

    let msg = `📄 *Pending Bills (${unpaid.length})*\n\n`;
    unpaid.forEach((b) => {
        msg += `• *${b.title}*: RWF ${parseFloat(String(b.amount)).toLocaleString()} (Due: ${b.due_date})\n`;
    });

    return await sendWhatsAppTextMessage(toPhone, msg);
}

/** Command: Add Expense */
async function handleAddExpenseCommand(userId: string, toPhone: string, amount: number, note: string): Promise<boolean> {
    const wallets = await getWallets(userId);
    const primaryWallet = wallets[0];

    const tx = await createExpense(userId, {
        wallet_id: primaryWallet?.id,
        amount,
        category: note,
        title: note,
        notes: `WhatsApp entry: ${note}`,
        date: new Date().toISOString().split('T')[0],
    });

    if (!tx) {
        return await sendWhatsAppTextMessage(toPhone, `❌ Failed to record expense. Please try again.`);
    }

    const reply = `✅ *Expense Recorded!*\n\n` +
        `• *Amount:* RWF ${amount.toLocaleString()}\n` +
        `• *Category/Note:* ${note}\n` +
        `• *Wallet:* ${primaryWallet ? primaryWallet.name : 'Main Wallet'}\n` +
        `• *Date:* ${new Date().toISOString().split('T')[0]}`;

    return await sendWhatsAppTextMessage(toPhone, reply);
}

/** Command: Add Income */
async function handleAddIncomeCommand(userId: string, toPhone: string, amount: number, note: string): Promise<boolean> {
    const wallets = await getWallets(userId);
    const primaryWallet = wallets[0];

    const tx = await createIncome(userId, {
        wallet_id: primaryWallet?.id,
        amount,
        category: note,
        title: note,
        notes: `WhatsApp entry: ${note}`,
        date: new Date().toISOString().split('T')[0],
    });

    if (!tx) {
        return await sendWhatsAppTextMessage(toPhone, `❌ Failed to record income. Please try again.`);
    }

    const reply = `🟢 *Income Recorded!*\n\n` +
        `• *Amount:* RWF ${amount.toLocaleString()}\n` +
        `• *Source/Note:* ${note}\n` +
        `• *Wallet:* ${primaryWallet ? primaryWallet.name : 'Main Wallet'}\n` +
        `• *Date:* ${new Date().toISOString().split('T')[0]}`;

    return await sendWhatsAppTextMessage(toPhone, reply);
}

/** Command: Recent Transactions */
async function handleRecentTransactionsCommand(userId: string, toPhone: string): Promise<boolean> {
    const txs = await getTransactions(userId);
    const recent = txs.slice(0, 5);

    if (recent.length === 0) {
        return await sendWhatsAppTextMessage(toPhone, `📊 No recent transactions recorded.`);
    }

    let msg = `📊 *Recent Transactions (Last ${recent.length})*\n\n`;
    recent.forEach((t) => {
        const sign = t.type === 'income' ? '+' : '-';
        msg += `${t.type === 'income' ? '🟢' : '🔴'} ${t.category || t.title}: ${sign}RWF ${parseFloat(String(t.amount)).toLocaleString()} (${t.date})\n`;
    });

    return await sendWhatsAppTextMessage(toPhone, msg);
}
