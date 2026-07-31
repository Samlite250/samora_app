import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS, SIZES } from '../src/core/theme';

import { generateAIResponse } from '../src/services/aiService';
import { useAppDataStore } from '../src/store/useAppDataStore';
import { useCurrencyStore } from '../src/store/useCurrencyStore';

const SUGGESTIONS = [
    'Analyze my spending',
    'Suggest budget for me',
    'How can I save more?',
    'Create a financial plan'
];

export default function AssistantScreen() {
    const router = useRouter();
    const { wallets, transactions, bills, budgets, goals, getHealthScore } = useAppDataStore();
    const { formatAmount } = useCurrencyStore();

    const [messages, setMessages] = useState<{ id: string; text: string; sender: 'user' | 'ai' }[]>([
        { id: '1', text: 'Hi Sam!\nI am your Digital+ AI Financial Advisor. Ask me anything about your balance, expenses, savings goals, or budgets!', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [tempKey, setTempKey] = useState('');

    const handleSend = async (text: string) => {
        if (!text.trim() || isAnalyzing) return;
        const userMsg = { id: Date.now().toString(), text, sender: 'user' as const };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsAnalyzing(true);

        // Call Real AI Financial Reasoning Engine with live user account context
        const responseText = await generateAIResponse(text, {
            wallets,
            transactions,
            bills,
            budgets,
            goals,
            healthScore: getHealthScore(),
            userApiKey: apiKey,
        }, formatAmount);

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'ai'
        }]);
        setIsAnalyzing(false);
    };

    const handleSaveKey = () => {
        setApiKey(tempKey.trim());
        setShowKeyModal(false);
        if (tempKey.trim()) {
            Alert.alert('API Key Saved', 'Connected to real AI LLM completions successfully!');
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Digital+ AI Assistant</Text>
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: COLORS.success }}>
                        ● Active Neural Engine
                    </Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.chatArea} showsVerticalScrollIndicator={false}>
                {messages.map(msg => (
                    <View key={msg.id} style={[
                        styles.messageBubble,
                        msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                    ]}>
                        <Text style={[
                            styles.messageText,
                            msg.sender === 'user' ? styles.userText : styles.aiText
                        ]}>{msg.text}</Text>
                    </View>
                ))}

                {isAnalyzing && (
                    <View style={[styles.messageBubble, styles.aiBubble, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                        <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                        <Text style={[styles.messageText, styles.aiText, { fontStyle: 'italic', color: COLORS.secondaryText }]}>
                            Digital+ AI is typing...
                        </Text>
                    </View>
                )}

                {messages.length === 1 && !isAnalyzing && (
                    <View style={styles.suggestionsList}>
                        {SUGGESTIONS.map((item, idx) => (
                            <TouchableOpacity key={idx} style={styles.suggestionBtn} onPress={() => handleSend(item)}>
                                <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.suggestionText}>{item}</Text>
                                <Ionicons name="chevron-forward" size={14} color={COLORS.secondaryText} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ask anything about your finances..."
                    placeholderTextColor={COLORS.secondaryText}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => handleSend(input)}
                    returnKeyType="send"
                />
                <TouchableOpacity style={[styles.sendBtn, isAnalyzing && { opacity: 0.6 }]} onPress={() => handleSend(input)} disabled={isAnalyzing}>
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingTop: 52, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF1F7' },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FB' },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    chatArea: { flex: 1 },
    scrollContent: { padding: SIZES.lg, paddingBottom: 40, flexGrow: 1 },
    messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 16, marginBottom: 12 },
    aiBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EEF1F7' },
    userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    messageText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
    aiText: { color: COLORS.text },
    userText: { color: '#FFFFFF' },
    suggestionsList: { marginTop: SIZES.xl, gap: 8 },
    suggestionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEF1F7', padding: 12, borderRadius: 12 },
    suggestionText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
    inputContainer: { flexDirection: 'row', padding: SIZES.md, paddingBottom: Platform.OS === 'ios' ? SIZES.lg : SIZES.md, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEF1F7', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#F4F7FB', height: 44, borderRadius: 22, paddingHorizontal: 16, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: '#EEF1F7' },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
