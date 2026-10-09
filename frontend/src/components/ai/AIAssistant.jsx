import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Check, Minimize2, Send, Sparkles, Trash2, X } from 'lucide-react';
import { cancelAiComplaint, confirmAiComplaint, sendAiMessage } from '../../services/aiService';

const greeting = `Hi! 👋 I'm your Hostel AI Assistant.

You can ask me about your room, mess, payments, complaints, notifications and other hostel services.

How can I help you today?`;

const AIAssistant = ({ userId, userName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const inputRef = useRef(null);
    const messageListRef = useRef(null);

    useEffect(() => {
        if (!userId) {
            setShowWelcome(false);
            return;
        }

        const storageKey = `aiWelcomeShown_${userId}`;
        setShowWelcome(localStorage.getItem(storageKey) !== 'true');
    }, [userId]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', content: greeting }]);
        }
        if (isOpen) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const markWelcomeSeen = () => {
        if (userId) {
            localStorage.setItem(`aiWelcomeShown_${userId}`, 'true');
        }
        setShowWelcome(false);
    };

    const openChat = () => {
        markWelcomeSeen();
        setIsOpen(true);
    };

    const closeChat = () => setIsOpen(false);

    const clearChat = () => {
        setMessages([{ role: 'assistant', content: greeting }]);
        setConversationId(null);
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        const message = input.trim();
        if (!message || loading) return;

        setMessages((current) => [...current, { role: 'user', content: message }]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendAiMessage(message, conversationId);
            if (!response?.success || !response?.response) {
                throw new Error('The AI endpoint returned no response.');
            }
            setConversationId(response.conversationId || conversationId);
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content: response.response,
                    actionToken: response.actionToken,
                },
            ]);
        } catch (error) {
            console.error('AI chat request failed:', error);
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content: "Sorry, I couldn't process that request right now. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    };

    const handleComplaintConfirmation = async (actionToken, confirm) => {
        setLoading(true);
        try {
            const result = confirm
                ? await confirmAiComplaint(actionToken)
                : await cancelAiComplaint(actionToken);
            setMessages((current) => current.map((message) => (
                message.actionToken === actionToken ? { ...message, actionToken: null } : message
            )));
            setMessages((current) => [
                ...current,
                { role: 'assistant', content: result.response },
            ]);
        } catch (error) {
            console.error('Complaint confirmation failed:', error);
            setMessages((current) => [
                ...current,
                { role: 'assistant', content: 'Sorry, I could not process that action. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onInputKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            {showWelcome && !isOpen && (
                <aside style={styles.welcome} aria-label="AI assistant introduction">
                    <div style={styles.welcomeHeader}>
                        <div style={styles.welcomeTitle}><Sparkles size={18} /> Meet Your Hostel AI Assistant!</div>
                        <button type="button" onClick={markWelcomeSeen} style={styles.iconButton} aria-label="Dismiss introduction">
                            <X size={19} />
                        </button>
                    </div>
                    <p style={styles.welcomeHi}>Hi{userName ? ` ${userName}` : ''}! 👋</p>
                    <p style={styles.welcomeText}>
                        Ask me about food, your room, payments, complaints, notifications and more.
                    </p>
                    <p style={styles.example}>Try asking: “What is the food today?”</p>
                    <button type="button" onClick={openChat} style={styles.tryButton}>Try AI Assistant</button>
                </aside>
            )}

            {isOpen && (
                <section style={styles.chat} role="dialog" aria-modal="false" aria-label="Hostel AI Assistant">
                    <header style={styles.chatHeader}>
                        <div style={styles.chatTitle}><span style={styles.botIcon}><Bot size={20} /></span> Hostel AI Assistant</div>
                        <div style={styles.headerActions}>
                            <button type="button" onClick={clearChat} style={styles.headerButton} aria-label="Clear chat" title="Clear chat">
                                <Trash2 size={17} />
                            </button>
                            <button type="button" onClick={closeChat} style={styles.headerButton} aria-label="Minimize chat" title="Minimize">
                                <Minimize2 size={17} />
                            </button>
                            <button type="button" onClick={closeChat} style={styles.headerButton} aria-label="Close chat" title="Close">
                                <X size={19} />
                            </button>
                        </div>
                    </header>

                    <div ref={messageListRef} style={styles.messageList} aria-live="polite">
                        {messages.map((message, index) => (
                            <div key={`${index}-${message.role}`} style={{
                                ...styles.messageRow,
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                                <div style={{
                                    ...styles.messageBubble,
                                    ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
                                }}>
                                    {message.content}
                                    {message.actionToken && (
                                        <div style={styles.confirmActions}>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => handleComplaintConfirmation(message.actionToken, true)}
                                                style={styles.confirmButton}
                                            >
                                                <Check size={15} /> Confirm
                                            </button>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => handleComplaintConfirmation(message.actionToken, false)}
                                                style={styles.cancelButton}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && <div style={styles.thinking}>AI is thinking...</div>}
                    </div>

                    <form onSubmit={sendMessage} style={styles.composer}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={onInputKeyDown}
                            placeholder="Ask anything..."
                            aria-label="Message the AI assistant"
                            rows={1}
                            style={styles.textarea}
                        />
                        <button type="submit" disabled={!input.trim() || loading} style={styles.sendButton} aria-label="Send message">
                            <Send size={18} />
                        </button>
                    </form>
                    <div style={styles.enterHint}>Enter to send · Shift+Enter for a new line</div>
                </section>
            )}

            <button
                type="button"
                onClick={isOpen ? closeChat : openChat}
                aria-label={isOpen ? 'Close Hostel AI Assistant' : 'Open Hostel AI Assistant'}
                title="Ask Hostel AI"
                style={styles.floatingButton}
            >
                <Sparkles size={18} /> AI
            </button>
        </>,
        document.body,
    );
};

const styles = {
    floatingButton: {
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 64,
        height: 64,
        borderRadius: 999,
        border: 'none',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        background: 'linear-gradient(135deg, #4f46e5, #a855f7)',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(79, 70, 229, .4)',
        fontWeight: 800,
        fontSize: 16,
        cursor: 'pointer',
    },
    welcome: {
        position: 'fixed',
        right: 24,
        bottom: 102,
        width: 'min(360px, calc(100vw - 56px))',
        maxHeight: 'calc(100dvh - 120px)',
        overflowY: 'auto',
        boxSizing: 'border-box',
        zIndex: 2147483646,
        padding: 18,
        borderRadius: 18,
        background: '#fff',
        color: '#0f172a',
        boxShadow: '0 16px 48px rgba(15, 23, 42, .22)',
        border: '1px solid #e2e8f0',
        fontFamily: 'inherit',
    },
    welcomeHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    welcomeTitle: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#4338ca' },
    welcomeHi: { margin: '16px 0 6px', fontWeight: 700 },
    welcomeText: { margin: '0 0 10px', lineHeight: 1.5, color: '#475569' },
    example: { margin: '0 0 14px', padding: 10, borderRadius: 10, background: '#f1f5f9', color: '#334155', fontSize: 13 },
    tryButton: { width: '100%', border: 0, borderRadius: 10, padding: '11px 14px', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' },
    iconButton: { border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 5, display: 'flex' },
    chat: {
        position: 'fixed',
        right: 24,
        bottom: 102,
        zIndex: 2147483646,
        width: 'min(400px, calc(100vw - 56px))',
        height: 'min(600px, calc(100dvh - 130px))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 18,
        background: '#fff',
        color: '#0f172a',
        boxShadow: '0 18px 55px rgba(15, 23, 42, .25)',
        border: '1px solid #e2e8f0',
        fontFamily: 'inherit',
    },
    chatHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 16px', background: 'linear-gradient(135deg, #4338ca, #7c3aed)', color: '#fff' },
    chatTitle: { display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800 },
    botIcon: { width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'rgba(255,255,255,.18)' },
    headerActions: { display: 'flex', gap: 4 },
    headerButton: { display: 'grid', placeItems: 'center', border: 0, borderRadius: 8, padding: 7, background: 'transparent', color: '#fff', cursor: 'pointer' },
    messageList: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, background: '#f8fafc' },
    messageRow: { display: 'flex', marginBottom: 12 },
    messageBubble: { maxWidth: '85%', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '11px 13px', borderRadius: 14, fontSize: 14, lineHeight: 1.5 },
    assistantBubble: { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderTopLeftRadius: 4 },
    userBubble: { background: '#4f46e5', color: '#fff', borderTopRightRadius: 4 },
    confirmActions: { display: 'flex', gap: 8, marginTop: 12 },
    confirmButton: { display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, borderRadius: 8, padding: '8px 10px', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer' },
    cancelButton: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' },
    thinking: { color: '#64748b', fontSize: 13, padding: '4px 8px' },
    composer: { display: 'flex', alignItems: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0', background: '#fff' },
    textarea: { flex: 1, maxHeight: 110, resize: 'none', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px', outlineColor: '#6366f1', font: 'inherit', fontSize: 14 },
    sendButton: { width: 42, height: 42, flex: '0 0 42px', display: 'grid', placeItems: 'center', border: 0, borderRadius: 12, background: '#4f46e5', color: '#fff', cursor: 'pointer' },
    enterHint: { padding: '0 14px 10px', background: '#fff', color: '#94a3b8', fontSize: 11 },
};

export default AIAssistant;
