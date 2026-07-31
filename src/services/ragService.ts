import { AppFinancialData } from './aiService';

export interface RAGKnowledgeChunk {
    id: string;
    category: 'budgeting' | 'savings' | 'investing' | 'debt' | 'app_guide' | 'security' | 'account_fact';
    title: string;
    keywords: string[];
    content: string;
}

/**
 * Knowledge Base Chunks for Financial Literacy & Digital+ System Features
 */
const FINANCIAL_KNOWLEDGE_BASE: RAGKnowledgeChunk[] = [
    {
        id: '50-30-20-rule',
        category: 'budgeting',
        title: '50/30/20 Budgeting Method',
        keywords: ['budget', 'rule', '50/30/20', 'divide', 'allocate', 'needs', 'wants', 'savings', 'plan'],
        content: 'The 50/30/20 rule divides net income into three categories: 50% for Needs (rent, groceries, utilities, minimum debt payments), 30% for Wants (dining out, entertainment, hobbies), and 20% for Savings and Debt Payoff (emergency fund, retirement, extra debt payments).'
    },
    {
        id: 'emergency-fund',
        category: 'savings',
        title: 'Emergency Fund Guidelines',
        keywords: ['emergency', 'fund', 'reserve', 'buffer', 'rainy day', 'safety net', 'job loss', 'unexpected'],
        content: 'An emergency fund is liquid cash set aside for unexpected life events like job loss, medical emergencies, or urgent car repairs. The gold standard is 3 to 6 months of essential living expenses kept in an easily accessible high-yield savings account or mobile money wallet.'
    },
    {
        id: 'debt-strategies',
        category: 'debt',
        title: 'Debt Payoff Methods: Snowball vs. Avalanche',
        keywords: ['debt', 'payoff', 'snowball', 'avalanche', 'loan', 'credit', 'interest', 'borrow'],
        content: 'Debt Snowball pays off debts from smallest balance to largest regardless of interest rate for quick psychological wins. Debt Avalanche pays off debts with the highest interest rates first to minimize total interest paid over time.'
    },
    {
        id: 'health-score-metrics',
        category: 'budgeting',
        title: 'Digital+ Financial Health Score Criteria',
        keywords: ['health score', 'score', 'rating', 'grade', 'metrics', 'financial health', 'status'],
        content: 'The Digital+ Financial Health Score (0-100) evaluates four pillars: 1. Liquidity Ratio (wallet balance vs monthly expenses), 2. Savings Rate (target > 20%), 3. Budget Adherence (staying under category limits), and 4. Bill Punctuality (paying bills before due date).'
    },
    {
        id: 'investing-basics',
        category: 'investing',
        title: 'Wealth Growth & Compounding Returns',
        keywords: ['invest', 'investing', 'grow money', 'wealth', 'compound', 'yield', 'returns', 'stocks', 'bonds'],
        content: 'Building long-term wealth requires putting surplus cash flow into income-generating assets or yield accounts. Compound interest accelerates growth over 5-10+ years. First secure a 3-month emergency fund before investing in volatile assets.'
    },
    {
        id: 'receipt-scanner-guide',
        category: 'app_guide',
        title: 'Digital+ AI Receipt OCR Scanner',
        keywords: ['receipt', 'scan', 'ocr', 'camera', 'photo', 'upload', 'camera', 'invoice'],
        content: 'Digital+ AI Receipt Scanner uses computer vision to parse merchant names, dates, itemized subtotals, and total amounts directly from uploaded paper receipts or invoices, auto-populating transaction logs.'
    },
    {
        id: 'wallet-management-guide',
        category: 'app_guide',
        title: 'Multi-Wallet & Currency Management',
        keywords: ['wallet', 'bank', 'mobile money', 'cash', 'currency', 'exchange', 'rwf', 'usd', 'eur'],
        content: 'Digital+ supports unlimited custom wallets (Mobile Money, Bank Accounts, Cash, Investments). Balances are automatically converted into your primary preferred currency using real-time foreign exchange rates.'
    },
    {
        id: 'rag-definition',
        category: 'app_guide',
        title: 'Retrieval-Augmented Generation (RAG)',
        keywords: ['rag', 'retrieval', 'augmented', 'generation', 'meaning', 'definition', 'what is rag', 'rag system'],
        content: 'RAG stands for **Retrieval-Augmented Generation**. It is an advanced AI architecture that retrieves relevant facts from a knowledge base (such as your account transactions, wallet balances, and financial literacy rules) and injects them into the AI prompt before generating an answer. This guarantees accurate, context-aware responses without hallucinating.'
    },
    {
        id: 'statement-export-guide',
        category: 'app_guide',
        title: 'PDF & CSV Financial Statement Exports',
        keywords: ['export', 'statement', 'pdf', 'csv', 'download', 'report', 'print', 'analytics'],
        content: 'In the Analytics tab, you can export executive financial statements in branded PDF or CSV formats covering any custom timeframe (Month, Quarter, Year).'
    }
];

/**
 * Dynamic Account Knowledge Synthesizer (Extracts real live facts from user's data store)
 */
function extractDynamicAccountFacts(data: AppFinancialData, formatAmount: (val: number) => string): RAGKnowledgeChunk[] {
    const facts: RAGKnowledgeChunk[] = [];

    // Fact 1: Spending Analysis
    const categoryTotals: Record<string, number> = {};
    let maxExpenseTx: { title: string; amount: number; category: string } | null = null;

    data.transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const amt = parseFloat(String(t.amount)) || 0;
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
            if (!maxExpenseTx || amt > maxExpenseTx.amount) {
                maxExpenseTx = { title: t.title, amount: amt, category: t.category };
            }
        });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        facts.push({
            id: 'fact-top-spending',
            category: 'account_fact',
            title: 'Top Category Expense',
            keywords: ['spending', 'expense', 'category', 'food', 'most', 'top', 'bought', 'where money went'],
            content: `Your highest spending category is **${topCategory[0]}** with a total of **${formatAmount(topCategory[1])}** spent across recorded transactions.`
        });
    }

    if (maxExpenseTx) {
        facts.push({
            id: 'fact-largest-tx',
            category: 'account_fact',
            title: 'Largest Single Expense',
            keywords: ['largest', 'biggest', 'single', 'most expensive', 'huge', 'costly'],
            content: `Your largest single recorded transaction is **"${(maxExpenseTx as any).title}"** for **${formatAmount((maxExpenseTx as any).amount)}** in ${(maxExpenseTx as any).category}.`
        });
    }

    // Fact 2: Wallet Distribution
    if (data.wallets.length > 0) {
        const sortedWallets = [...data.wallets].sort((a, b) => (parseFloat(String(b.balance)) || 0) - (parseFloat(String(a.balance)) || 0));
        const topWallet = sortedWallets[0];
        facts.push({
            id: 'fact-top-wallet',
            category: 'account_fact',
            title: 'Primary Wallet Liquidity',
            keywords: ['wallet', 'bank', 'mobile money', 'cash', 'account', 'where is money', 'highest balance'],
            content: `Your primary wallet is **${topWallet.name}** containing **${formatAmount(topWallet.balance)}** (out of ${data.wallets.length} total wallets).`
        });
    }

    // Fact 3: Upcoming Bills
    const unpaidBills = data.bills.filter(b => !b.is_paid);
    if (unpaidBills.length > 0) {
        const totalBillsDue = unpaidBills.reduce((acc, b) => acc + (parseFloat(String(b.amount)) || 0), 0);
        facts.push({
            id: 'fact-bills-due',
            category: 'account_fact',
            title: 'Pending Bills Obligations',
            keywords: ['bill', 'bills', 'due', 'unpaid', 'debt', 'pay', 'obligation'],
            content: `You have **${unpaidBills.length} pending bill(s)** totaling **${formatAmount(totalBillsDue)}** (${unpaidBills.map(b => b.title).join(', ')}).`
        });
    }

    return facts;
}

/**
 * RAG Retriever Function:
 * Scores all knowledge chunks against user query keywords + retrieves top-N relevant facts
 */
export function retrieveRAGContext(
    userQuery: string,
    data: AppFinancialData,
    formatAmount: (val: number) => string,
    maxChunks: number = 3
): string {
    const queryTokens = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    if (queryTokens.length === 0) return '';

    const dynamicFacts = extractDynamicAccountFacts(data, formatAmount);
    const allChunks = [...FINANCIAL_KNOWLEDGE_BASE, ...dynamicFacts];

    // Score each chunk based on keyword matches and term occurrences
    const scoredChunks = allChunks.map(chunk => {
        let score = 0;
        const chunkText = (chunk.title + ' ' + chunk.keywords.join(' ') + ' ' + chunk.content).toLowerCase();

        queryTokens.forEach(token => {
            if (token.length < 2) return;
            // Check direct keyword match
            if (chunk.keywords.some(k => k.toLowerCase() === token)) score += 3;
            // Check chunk title match
            if (chunk.title.toLowerCase().includes(token)) score += 2;
            // Check content occurrence
            if (chunkText.includes(token)) score += 1;
        });

        return { chunk, score };
    });

    // Filter chunks with score > 0 and sort by highest score
    const topChunks = scoredChunks
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxChunks)
        .map(item => item.chunk);

    if (topChunks.length === 0) return '';

    // Format retrieved contexts into clean markdown
    return topChunks.map(c => `📌 **${c.title}**:\n${c.content}`).join('\n\n');
}
