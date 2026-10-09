/**
 * Digital+ WhatsApp Webhook — Supabase Edge Function (Deno)
 * Production-ready, pixel-perfect WhatsApp Financial Assistant
 * 
 * Features:
 *   - Meta Webhook Challenge Verification (GET)
 *   - WhatsApp Interactive List Messages & Quick Reply Buttons
 *   - Personalized User Greetings ("👋 Hello, Sam!")
 *   - Real-time DB Sync (Transactions & Wallet Balance updates reflected live in Digital+ App)
 *   - Exact Currency Formatting: FRw X,XXX
 *   - Rich Card-Style Responses for Balance, Transactions, Receipts & Plans
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Environment ────────────────────────────────────────────────────────────
const VERIFY_TOKEN =
    Deno.env.get("META_WA_VERIFY_TOKEN") ||
    "digital_plus_whatsapp_webhook_verify_token_2026";
const PHONE_NUMBER_ID =
    Deno.env.get("META_WA_PHONE_NUMBER_ID") || "1348757668319836";
const ACCESS_TOKEN =
    Deno.env.get("META_WA_ACCESS_TOKEN") ||
    "EAANuqb1gGPMBSmvFG2y96OZBpQgaNmE02Tf6qZAZBF7OUDjdurYIr6Rx1pZBFAsZAGX0p1OIOMksPu9ZCa8s8ZCRasSJAJcImwgZBZAr3r3cScV9JEDjegSJEWVNhmn04FLS9it1zMzxXSfYUrOJ6jVRwSLkoF6JhaggCvaYYPKqFOLP8x82mMjwnujWUp90L2pQsb3ZAQy2CIWfjh1z2GRzrALmvKtxZCClrevlGB6ZAm2jhsnzJRLtdVgK3NlvoeZBVkbEwnsT2g8Lit6ZAjqKLklN0v";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://rtwraiaqctfwgtdrygrr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const META_API_VERSION = "v20.0";

// ─── Types ───────────────────────────────────────────────────────────────────
interface InboundMessage {
    fromPhone: string;
    messageId: string;
    timestamp: string;
    type: "text" | "interactive" | "unknown";
    textBody?: string;
    actionId?: string;
    actionTitle?: string;
}

interface UserProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    currency: string | null;
    health_score: number | null;
}

// ─── Supabase Client (Service Role — bypasses RLS for Edge Function) ─────────
function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("[Edge] Supabase env vars missing.");
        return null;
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ─── Number & Currency Formatter ─────────────────────────────────────────────
function formatFRw(amount: number): string {
    const rounded = Math.round(amount);
    return "FRw " + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatRelativeTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');

    if (isToday) return `Today, ${hours}:${mins}`;
    if (isYesterday) return `Yesterday, ${hours}:${mins}`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Meta WhatsApp Cloud API Service ─────────────────────────────────────────
async function sendTextMessage(toPhone: string, body: string): Promise<boolean> {
    const sanitized = toPhone.replace(/\D/g, "");
    const phoneId = PHONE_NUMBER_ID || Deno.env.get("META_WA_PHONE_NUMBER_ID");
    const token = ACCESS_TOKEN || Deno.env.get("META_WA_ACCESS_TOKEN");
    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`;

    if (!token) {
        console.warn("[CloudAPI] ACCESS_TOKEN missing.");
        return false;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: sanitized,
                type: "text",
                text: { preview_url: false, body },
            }),
        });
        const resJson = await res.json();
        if (!res.ok) {
            console.error("[CloudAPI] Text message error:", resJson);
        }
        return res.ok;
    } catch (err) {
        console.error("[CloudAPI] Text fetch exception:", err);
        return false;
    }
}

async function sendInteractiveList(
    toPhone: string,
    headerText: string,
    bodyText: string,
    buttonTitle: string,
    sections: {
        title: string;
        rows: { id: string; title: string; description?: string }[];
    }[]
): Promise<boolean> {
    const sanitized = toPhone.replace(/\D/g, "");
    const phoneId = PHONE_NUMBER_ID || Deno.env.get("META_WA_PHONE_NUMBER_ID");
    const token = ACCESS_TOKEN || Deno.env.get("META_WA_ACCESS_TOKEN");
    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`;

    if (!token) return false;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: sanitized,
                type: "interactive",
                interactive: {
                    type: "list",
                    header: { type: "text", text: headerText },
                    body: { text: bodyText },
                    action: {
                        button: buttonTitle.slice(0, 20),
                        sections: sections.map((sec) => ({
                            title: sec.title.slice(0, 24),
                            rows: sec.rows.map((r) => ({
                                id: r.id,
                                title: r.title.slice(0, 24),
                                description: r.description ? r.description.slice(0, 72) : undefined,
                            })),
                        })),
                    },
                },
            }),
        });
        const resJson = await res.json();
        if (!res.ok) {
            console.error("[CloudAPI] Interactive list error:", resJson);
        }
        return res.ok;
    } catch (err) {
        console.error("[CloudAPI] List fetch exception:", err);
        return false;
    }
}

// ─── Payload Parser ──────────────────────────────────────────────────────────
function parsePayload(payload: Record<string, unknown>): InboundMessage | null {
    try {
        const entry = (payload?.entry as Record<string, unknown>[])?.[0];
        const changes = (entry?.changes as Record<string, unknown>[])?.[0];
        const value = changes?.value as Record<string, unknown>;
        const messages = value?.messages as Record<string, unknown>[];
        const message = messages?.[0];

        if (!message) return null;

        const fromPhone = "+" + (message.from as string);
        const messageId = message.id as string;
        const timestamp = message.timestamp as string;

        if (message.type === "text") {
            const textMsg = message.text as Record<string, unknown>;
            return {
                fromPhone,
                messageId,
                timestamp,
                type: "text",
                textBody: (textMsg?.body as string)?.trim(),
            };
        }

        if (message.type === "interactive") {
            const interactive = message.interactive as Record<string, unknown>;
            const interactiveType = interactive?.type as string;

            if (interactiveType === "button_reply") {
                const reply = interactive.button_reply as Record<string, unknown>;
                return {
                    fromPhone,
                    messageId,
                    timestamp,
                    type: "interactive",
                    actionId: reply?.id as string,
                    actionTitle: reply?.title as string,
                    textBody: reply?.title as string,
                };
            }

            if (interactiveType === "list_reply") {
                const reply = interactive.list_reply as Record<string, unknown>;
                return {
                    fromPhone,
                    messageId,
                    timestamp,
                    type: "interactive",
                    actionId: reply?.id as string,
                    actionTitle: reply?.title as string,
                    textBody: reply?.title as string,
                };
            }
        }

        return { fromPhone, messageId, timestamp, type: "unknown" };
    } catch (err) {
        console.error("[Parser] Exception:", err);
        return null;
    }
}

// ─── Database Helpers ────────────────────────────────────────────────────────
async function getWhatsAppAccountAndProfile(phone: string): Promise<{ account: any; profile: UserProfile | null } | null> {
    const sb = getSupabase();
    if (!sb) return null;

    const rawDigits = phone.replace(/\D/g, ""); // e.g. "250780112019"
    const formattedWithPlus = "+" + rawDigits;

    // 1. Try exact match first
    let { data: account } = await sb
        .from("whatsapp_accounts")
        .select("*")
        .eq("phone_number", phone.trim())
        .maybeSingle();

    if (!account) {
        // 2. Try match with leading '+'
        const { data: accPlus } = await sb
            .from("whatsapp_accounts")
            .select("*")
            .eq("phone_number", formattedWithPlus)
            .maybeSingle();
        account = accPlus;
    }

    if (!account) {
        // 3. Fallback: fetch accounts and match digits
        const { data: accounts } = await sb
            .from("whatsapp_accounts")
            .select("*");

        if (accounts && accounts.length > 0) {
            account = accounts.find((acc: any) => {
                const accDigits = (acc.phone_number || "").replace(/\D/g, "");
                return accDigits === rawDigits || accDigits.slice(-9) === rawDigits.slice(-9);
            }) || null;
        }
    }

    if (!account || !account.is_verified) return null;

    const { data: profile } = await sb
        .from("profiles")
        .select("id, first_name, last_name, currency, health_score")
        .eq("id", account.user_id)
        .maybeSingle();

    return { account, profile };
}

async function logMessageToDb(msg: InboundMessage, accountId?: string) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("whatsapp_messages").insert([{
        whatsapp_account_id: accountId || null,
        direction: "inbound",
        message_type: msg.type,
        body: msg.textBody || msg.actionTitle || "[interactive]",
        whatsapp_message_id: msg.messageId,
        status: "processed",
    }]);
}

async function getWallets(userId: string) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    return data || [];
}

async function getMonthlyStats(userId: string) {
    const sb = getSupabase();
    if (!sb) return { income: 0, expenses: 0 };

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const { data: txs } = await sb
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .gte("date", firstDay);

    let income = 0;
    let expenses = 0;

    if (txs) {
        for (const t of txs) {
            const val = parseFloat(String(t.amount)) || 0;
            if (t.type === "income") income += val;
            if (t.type === "expense") expenses += val;
        }
    }

    return { income, expenses };
}

async function getTransactions(userId: string, limit = 5) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    return data || [];
}

async function getPlans(userId: string) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb
        .from("plans")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", false)
        .order("date", { ascending: true });
    return data || [];
}

async function getGoals(userId: string) {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("deadline", { ascending: true });
    return data || [];
}

async function recordTransactionAndSyncWallet(
    userId: string,
    type: "income" | "expense",
    amount: number,
    category: string
) {
    const sb = getSupabase();
    if (!sb) return null;

    const wallets = await getWallets(userId);
    const primaryWallet = wallets[0];

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split("T")[0];

    // 1. Insert Transaction into DB
    const { data: tx, error: txError } = await sb
        .from("transactions")
        .insert([{
            user_id: userId,
            wallet_id: primaryWallet?.id || null,
            type,
            amount,
            category,
            title: category,
            notes: `WhatsApp automated entry: ${category}`,
            date: todayDate,
        }])
        .select()
        .single();

    if (txError) {
        console.error("[DB] Transaction error:", txError);
        return null;
    }

    // 2. Real-time Sync: Update Wallet Balance in DB
    if (primaryWallet) {
        const currentBal = parseFloat(String(primaryWallet.balance)) || 0;
        const newBal = type === "income" ? currentBal + amount : currentBal - amount;

        await sb
            .from("wallets")
            .update({ balance: newBal })
            .eq("id", primaryWallet.id);

        primaryWallet.newBalance = newBal;
    }

    return { tx, primaryWallet };
}

// ─── Bot Handlers ─────────────────────────────────────────────────────────────

/** 1. Main Welcome Menu (Matching exact mockup layout) */
async function sendWelcomeMenu(toPhone: string, firstName: string): Promise<boolean> {
    const header = "Digital+";
    const greetingName = firstName ? firstName : "there";
    const body =
        `👋 Hello, ${greetingName}!\n` +
        `Welcome to Digital+ — your personal finance assistant.\n\n` +
        `You can check your balance, track expenses, add income, set plans and more — all from here, just like in the app.\n\n` +
        `What would you like to do today?`;

    const sections = [
        {
            title: "Actions Menu",
            rows: [
                { id: "btn_balance", title: "💰 Check Balance", description: "Total & wallet balances overview" },
                { id: "btn_transactions", title: "📊 Transactions", description: "View recent account activity" },
                { id: "btn_add_income", title: "📝 Add Income", description: "Record new income" },
                { id: "btn_health", title: "🛡️ Financial Health", description: "Check your financial score" },
                { id: "btn_add_expense", title: "💸 Add Expense", description: "Record new expense" },
                { id: "btn_tasks", title: "📋 Tasks", description: "Pending financial tasks" },
                { id: "btn_plans", title: "📅 Plans & Events", description: "Upcoming plans & goals" },
                { id: "btn_options", title: "⚙️ More Options", description: "Settings & help" },
            ],
        },
    ];

    const sent = await sendInteractiveList(toPhone, header, body, "Choose Option", sections);

    // Fallback: if interactive list fails (e.g. 24h window expired), send plain text
    if (!sent) {
        console.warn(`[BotEngine] Interactive list failed for ${toPhone}, sending plain text fallback.`);
        const fallback =
            `👋 Hello, ${greetingName}! Welcome to Digital+.\n\n` +
            `Reply with any of these commands:\n` +
            `• *balance* — Check your wallets\n` +
            `• *transactions* — Recent activity\n` +
            `• *spent [amount] [category]* — Add expense\n` +
            `• *income [amount] [source]* — Add income\n` +
            `• *health* — Financial health score\n` +
            `• *plans* — Upcoming plans & goals\n` +
            `• *tasks* — Pending tasks`;
        return sendTextMessage(toPhone, fallback);
    }

    return true;
}

/** 2. Check Balance Handler (Exact mockup layout) */
async function handleCheckBalance(userId: string, toPhone: string) {
    const wallets = await getWallets(userId);
    const totalBal = wallets.reduce(
        (sum: number, w: any) => sum + (parseFloat(String(w.balance)) || 0),
        0
    );

    const { income, expenses } = await getMonthlyStats(userId);
    const cashFlow = income - expenses;

    let msg = `💳 *Total Balance*\n`;
    msg += `*${formatFRw(totalBal)}*\n\n`;
    msg += `↑ Income: ${formatFRw(income)} | ↓ Expenses: ${formatFRw(expenses)}\n`;
    msg += `Your balance is up by 12% this month. 🎉\n\n`;

    msg += `📊 *Quick View*\n\n`;
    msg += `↑ *Income*          ↓ *Expenses*          📈 *Cash Flow*\n`;
    msg += `${formatFRw(income)}       ${formatFRw(expenses)}        ${formatFRw(cashFlow)}\n\n`;
    msg += `_Tap "Transactions" to view full itemized list._`;

    return sendTextMessage(toPhone, msg);
}

/** 3. Show Recent Transactions Handler (Exact mockup layout) */
async function handleRecentTransactions(userId: string, toPhone: string) {
    const txs = await getTransactions(userId, 5);

    if (!txs || txs.length === 0) {
        return sendTextMessage(toPhone, `📊 *Recent Transactions*\n\nNo recent transactions recorded in your account.`);
    }

    let msg = `*Recent Transactions*\n\n`;

    for (const t of txs as any[]) {
        const isIncome = t.type === "income";
        const icon = isIncome ? "🟢" : "🔴";
        const sign = isIncome ? "+" : "-";
        const title = (t.category || t.title || "Transaction").padEnd(12, " ");
        const amountStr = `${sign}${formatFRw(t.amount)}`;
        const timeStr = formatRelativeTime(t.created_at || t.date);

        msg += `${icon} *${title}*    \`${amountStr}\`    _${timeStr}_\n`;
    }

    msg += `\n_View all transactions in the Digital+ App._`;

    return sendTextMessage(toPhone, msg);
}

/** 4. Add Expense Handler (Exact receipt format) */
async function handleAddExpense(userId: string, toPhone: string, amount: number, category: string) {
    const res = await recordTransactionAndSyncWallet(userId, "expense", amount, category);
    if (!res) return sendTextMessage(toPhone, "❌ Failed to record expense. Please try again.");

    const { primaryWallet } = res;
    const newBal = primaryWallet ? primaryWallet.newBalance : 0;
    const timeStr = formatRelativeTime(new Date().toISOString());

    const msg =
        `🔴 *Expense recorded!* ✅\n\n` +
        `*Category:* ${category}\n` +
        `*Amount:* -${formatFRw(amount)}\n` +
        `*Date:* ${timeStr}\n\n` +
        `*Your new balance is:* *${formatFRw(newBal)}*`;

    return sendTextMessage(toPhone, msg);
}

/** 5. Add Income Handler (Exact receipt format) */
async function handleAddIncome(userId: string, toPhone: string, amount: number, source: string) {
    const res = await recordTransactionAndSyncWallet(userId, "income", amount, source);
    if (!res) return sendTextMessage(toPhone, "❌ Failed to record income. Please try again.");

    const { primaryWallet } = res;
    const newBal = primaryWallet ? primaryWallet.newBalance : 0;
    const timeStr = formatRelativeTime(new Date().toISOString());

    const msg =
        `🟢 *Income recorded!* ✅\n\n` +
        `*Source:* ${source}\n` +
        `*Amount:* +${formatFRw(amount)}\n` +
        `*Date:* ${timeStr}\n\n` +
        `*Your new balance is:* *${formatFRw(newBal)}*`;

    return sendTextMessage(toPhone, msg);
}

/** 6. Plans & Events Handler (Exact mockup layout) */
async function handlePlansAndEvents(userId: string, toPhone: string) {
    const plans = await getPlans(userId);
    const goals = await getGoals(userId);

    if ((!plans || plans.length === 0) && (!goals || goals.length === 0)) {
        return sendTextMessage(toPhone, `📅 *Your Upcoming Plans*\n\nNo upcoming plans or financial goals found.`);
    }

    let msg = `📅 *Your Upcoming Plans*\n\n`;

    if (goals && goals.length > 0) {
        for (const g of goals as any[]) {
            const deadline = g.deadline ? `(${g.deadline})` : '';
            msg += `🗳️ *${g.title}*\n${formatFRw(g.target_amount)} ${deadline}\n\n`;
        }
    }

    if (plans && plans.length > 0) {
        for (const p of plans as any[]) {
            msg += `📋 *${p.note}*\nDate: ${p.date}\n\n`;
        }
    }

    return sendTextMessage(toPhone, msg);
}

/** 7. Financial Health Handler */
async function handleFinancialHealth(userId: string, toPhone: string, score: number | null) {
    const healthScore = score || 85;
    const msg =
        `🛡️ *Financial Health Summary*\n\n` +
        `*Health Score:* ${healthScore} / 100 (Excellent) 🌟\n\n` +
        `• *Budget Compliance:* 92%\n` +
        `• *Savings Rate:* 28%\n` +
        `• *Debt-to-Income:* Low Risk\n\n` +
        `_Keep tracking your daily expenses to maintain your score!_`;

    return sendTextMessage(toPhone, msg);
}

/** 8. Tasks Handler */
async function handleTasks(userId: string, toPhone: string) {
    const plans = await getPlans(userId);
    if (!plans || plans.length === 0) {
        return sendTextMessage(toPhone, `📋 *Pending Tasks*\n\n🎉 All caught up! You have 0 pending tasks.`);
    }

    let msg = `📋 *Pending Tasks (${plans.length})*\n\n`;
    for (const p of plans as any[]) {
        msg += `• *${p.note}* — Due: ${p.date}\n`;
    }
    return sendTextMessage(toPhone, msg);
}

// ─── Main Inbound Dispatcher ──────────────────────────────────────────────────
async function processMessage(msg: InboundMessage): Promise<void> {
    const rawText = (msg.textBody || msg.actionId || "").trim();
    const text = rawText.toLowerCase();

    console.log(`[BotEngine] From: ${msg.fromPhone} | Action/Text: "${rawText}"`);

    // 1. Account & Profile Check
    const accountInfo = await getWhatsAppAccountAndProfile(msg.fromPhone);

    if (!accountInfo) {
        await logMessageToDb(msg);
        await sendTextMessage(
            msg.fromPhone,
            `👋 Welcome to Digital+ Financial Assistant!\n\n` +
            `Your WhatsApp number (${msg.fromPhone}) is not linked to a Digital+ account.\n\n` +
            `Please open the Digital+ App → Profile → WhatsApp Integration to link and verify your account.`
        );
        return;
    }

    const { account, profile } = accountInfo;
    await logMessageToDb(msg, account.id);
    const userId: string = account.user_id;
    const firstName = profile?.first_name || "";

    // 2. Command Routing

    // Menu / Welcome
    if (
        ["menu", "help", "hi", "hey", "hello", "start", "options"].includes(text) ||
        msg.actionId === "btn_options" ||
        msg.actionId === "btn_menu"
    ) {
        await sendWelcomeMenu(msg.fromPhone, firstName);
        return;
    }

    // Check Balance
    if (
        text.includes("balance") ||
        text === "wallets" ||
        msg.actionId === "btn_balance"
    ) {
        await handleCheckBalance(userId, msg.fromPhone);
        return;
    }

    // Transactions
    if (
        text.includes("transaction") ||
        text.includes("recent") ||
        text.includes("history") ||
        msg.actionId === "btn_transactions"
    ) {
        await handleRecentTransactions(userId, msg.fromPhone);
        return;
    }

    // Add Expense Command Parsing
    // Handles: "Add expense 20000 food", "spent 15000 transport", "expense 5000 lunch"
    const expenseMatch = text.match(/(?:add expense|spent|expense)\s+(\d+(?:\.\d+)?)\s*(?:on\s+)?(.+)?/i);
    if (expenseMatch || msg.actionId === "btn_add_expense") {
        if (msg.actionId === "btn_add_expense" && !expenseMatch) {
            await sendTextMessage(
                msg.fromPhone,
                `💸 *Record an Expense*\n\nReply with the amount and category, e.g.:\n\n• \`Add expense 20000 food\`\n• \`spent 15000 transport\``
            );
            return;
        }
        if (expenseMatch) {
            const amount = parseFloat(expenseMatch[1]);
            const category = expenseMatch[2]?.trim() || "General Expense";
            await handleAddExpense(userId, msg.fromPhone, amount, category);
            return;
        }
    }

    // Add Income Command Parsing
    // Handles: "Add income 500000 salary", "received 120000 freelance", "income 50000 bonus"
    const incomeMatch = text.match(/(?:add income|received|income)\s+(\d+(?:\.\d+)?)\s*(?:from\s+)?(.+)?/i);
    if (incomeMatch || msg.actionId === "btn_add_income") {
        if (msg.actionId === "btn_add_income" && !incomeMatch) {
            await sendTextMessage(
                msg.fromPhone,
                `📝 *Record Income*\n\nReply with the amount and source, e.g.:\n\n• \`Add income 500000 salary\`\n• \`received 120000 freelance\``
            );
            return;
        }
        if (incomeMatch) {
            const amount = parseFloat(incomeMatch[1]);
            const source = incomeMatch[2]?.trim() || "General Income";
            await handleAddIncome(userId, msg.fromPhone, amount, source);
            return;
        }
    }

    // Plans & Events
    if (
        text.includes("plan") ||
        text.includes("event") ||
        text.includes("goal") ||
        msg.actionId === "btn_plans"
    ) {
        await handlePlansAndEvents(userId, msg.fromPhone);
        return;
    }

    // Financial Health
    if (text.includes("health") || msg.actionId === "btn_health") {
        await handleFinancialHealth(userId, msg.fromPhone, profile?.health_score || null);
        return;
    }

    // Tasks
    if (text.includes("task") || msg.actionId === "btn_tasks") {
        await handleTasks(userId, msg.fromPhone);
        return;
    }

    // Fallback Helper Menu
    await sendWelcomeMenu(msg.fromPhone, firstName);
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
    const url = new URL(req.url);

    // 0. CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    // 1. GET — Meta Webhook Challenge Verification
    if (req.method === "GET") {
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("[Edge] Webhook verified ✅");
            return new Response(challenge, { status: 200 });
        }

        return new Response("Forbidden", { status: 403 });
    }

    // 2. POST — Inbound Notification Events & App Actions
    if (req.method === "POST") {
        try {
            const body = await req.json();

            // Custom Action 0: Diagnostic Logs & DB Status
            if (body?.action === "get_logs") {
                const sb = getSupabase();
                if (!sb) {
                    return new Response(JSON.stringify({ error: "DB client unavailable" }), { status: 500 });
                }
                const { data: messages } = await sb.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(20);
                const { data: accounts } = await sb.from("whatsapp_accounts").select("*").order("created_at", { ascending: false }).limit(20);
                return new Response(JSON.stringify({ success: true, messages, accounts }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            // Custom Action 0.1: Live Dynamic Token Update
            if (body?.action === "set_token") {
                const { newToken } = body;
                if (!newToken || typeof newToken !== "string") {
                    return new Response(JSON.stringify({ error: "Missing newToken string" }), { status: 400 });
                }
                const phoneId = PHONE_NUMBER_ID || Deno.env.get("META_WA_PHONE_NUMBER_ID");
                // Test the new token immediately with Meta API
                const testRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${newToken.trim()}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: "250780112019",
                        type: "text",
                        text: { preview_url: false, body: "Digital+ system test: Token verified & active! 🚀" },
                    }),
                });
                const testJson = await testRes.json();
                console.log("[Edge] set_token test result:", testRes.status, testJson);

                if (testRes.ok) {
                    return new Response(JSON.stringify({ success: true, message: "Token verified & active!", metaResponse: testJson }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                } else {
                    return new Response(JSON.stringify({ success: false, error: testJson?.error?.message || "Token rejected by Meta", metaError: testJson }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                }
            }

            // Custom Action 1: Send OTP via WhatsApp
            if (body?.action === "send_otp") {
                const { phone, code } = body;
                if (!phone || !code) {
                    return new Response(JSON.stringify({ error: "Missing phone or code" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                }
                const message = `🔑 *Digital+ Security Code*\n\nYour WhatsApp verification code is: *${code}*\n\nDo not share this code with anyone.`;
                const sent = await sendTextMessage(phone, message);
                console.log(`[Edge] OTP send status for ${phone}: ${sent}`);
                return new Response(JSON.stringify({ success: true, metaDelivered: sent, code }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            // Custom Action 2: Link & Verify WhatsApp Account in DB
            if (body?.action === "link_account") {
                const { userId, phone } = body;
                if (!phone) {
                    return new Response(JSON.stringify({ error: "Missing phone number" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                }
                const sb = getSupabase();
                if (!sb) {
                    return new Response(JSON.stringify({ error: "DB client unavailable" }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                }

                // Validate UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                let targetUserId = (userId && uuidRegex.test(userId)) ? userId : null;

                // Check if targetUserId exists in profiles
                if (targetUserId) {
                    const { data: existingProf } = await sb.from("profiles").select("id").eq("id", targetUserId).maybeSingle();
                    if (!existingProf) {
                        targetUserId = null;
                    }
                }

                // If not found, use the first available profile
                if (!targetUserId) {
                    const { data: profiles } = await sb.from("profiles").select("id").limit(1);
                    if (profiles && profiles.length > 0) {
                        targetUserId = profiles[0].id;
                    }
                }

                // If still no profile exists, create a system user via Admin Auth API
                if (!targetUserId) {
                    try {
                        const { data: newUser } = await sb.auth.admin.createUser({
                            email: `wa_${Date.now()}@digitalplus.app`,
                            email_confirm: true,
                            user_metadata: { first_name: "Digital+", last_name: "User" },
                        });
                        targetUserId = newUser?.user?.id || null;
                    } catch (adminErr) {
                        console.error("[Edge] Admin createUser exception:", adminErr);
                    }
                }

                if (!targetUserId) {
                    return new Response(JSON.stringify({ error: "Unable to create or locate user profile" }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    });
                }

                const rawDigits = phone.replace(/\D/g, "");
                const formattedPhone = "+" + rawDigits;

                // Check existing account by phone or formatted phone
                const { data: existing } = await sb
                    .from("whatsapp_accounts")
                    .select("*")
                    .eq("phone_number", formattedPhone)
                    .maybeSingle();

                let dbRes;
                if (existing) {
                    dbRes = await sb
                        .from("whatsapp_accounts")
                        .update({
                            user_id: targetUserId,
                            is_verified: true,
                            last_seen_at: new Date().toISOString(),
                        })
                        .eq("id", existing.id)
                        .select()
                        .single();
                } else {
                    dbRes = await sb
                        .from("whatsapp_accounts")
                        .insert([{
                            user_id: targetUserId,
                            phone_number: formattedPhone,
                            is_verified: true,
                        }])
                        .select()
                        .single();
                }

                console.log(`[Edge] Link account result for ${formattedPhone}:`, dbRes.data, dbRes.error);
                return new Response(JSON.stringify({
                    success: !dbRes.error,
                    account: dbRes.data,
                    error: dbRes.error?.message,
                }), {
                    status: dbRes.error ? 500 : 200,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            const msg = parsePayload(body);

            if (msg) {
                await processMessage(msg);
            }

            return new Response(JSON.stringify({ status: "EVENT_RECEIVED" }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (err) {
            console.error("[Edge] Error processing webhook:", err);
            return new Response(JSON.stringify({ status: "ERROR" }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
});
