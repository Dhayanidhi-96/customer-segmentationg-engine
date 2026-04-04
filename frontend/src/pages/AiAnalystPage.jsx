import { useState } from 'react';
import { segmentationAPI } from '../services/api';
import toast from 'react-hot-toast';

const starterPrompts = [
    'Which segment should we prioritize this month and why?',
    'What campaign strategy should we use for at-risk customers?',
    'Suggest a 30-day plan to improve customer frequency.',
    'How can we increase revenue without increasing churn?',
];

export default function AiAnalystPage() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Ask me about your segmentation data, campaign priorities, retention strategy, or revenue growth. I can answer with Groq AI when configured and local fallback analytics otherwise.',
            usedGroq: null,
        },
    ]);

    const sendMessage = async (messageText) => {
        const text = messageText.trim();
        if (!text || loading) return;

        setMessages((prev) => [...prev, { role: 'user', text }]);
        setInput('');
        setLoading(true);

        try {
            const res = await segmentationAPI.chatWithAI(text);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: res.data.answer,
                    usedGroq: res.data.used_groq,
                    fallbackReason: res.data.fallback_reason || null,
                },
            ]);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="hero-panel">
                <p className="eyebrow">AI Analyst</p>
                <h2 className="hero-title">Talk With Your Segmentation Brain</h2>
                <p className="hero-subtitle">
                    Ask strategic questions and get practical actions for growth, retention, and campaign optimization.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="panel lg:col-span-1">
                    <h3 className="panel-title">Quick Prompts</h3>
                    <div className="space-y-2 mt-4">
                        {starterPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() => sendMessage(prompt)}
                                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition-colors text-sm font-medium"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="panel lg:col-span-2 flex flex-col min-h-[560px]">
                    <h3 className="panel-title">Conversation</h3>
                    <div className="mt-4 flex-1 overflow-auto pr-2 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={`${msg.role}-${idx}`}
                                className={msg.role === 'user' ? 'chat-row chat-user' : 'chat-row chat-assistant'}
                            >
                                <div className="chat-bubble">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                    {msg.role === 'assistant' && msg.usedGroq !== null && (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Mode: {msg.usedGroq ? 'Groq AI' : 'Local analytics fallback'}
                                        </p>
                                    )}
                                    {msg.role === 'assistant' && msg.fallbackReason && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            Reason: {msg.fallbackReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-row chat-assistant">
                                <div className="chat-bubble">
                                    <p className="text-sm">Thinking...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <form
                        className="mt-4 flex gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage(input);
                        }}
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about segments, churn risk, and campaign strategy..."
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                        />
                        <button type="submit" className="btn-elite" disabled={loading}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
