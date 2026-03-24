import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, User, Play } from 'lucide-react';

const ChatWidget = ({ role, userId, extraContext = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: `Hello! I am your ${role.replace('_', ' ')} AI Assistant. How can I help you today?`, sender: 'bot', actions: [] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user', actions: [] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Note: In production, the API URL should point to your backend/gateway that proxies to the agent service
            // For local docker-compose, assuming frontend maps to localhost:8000 for the agents
            const API_URL = import.meta.env.VITE_AGENTS_URL || 'http://localhost:8000';
            
            // Map the frontend role to the corresponding agent endpoint
            let endpoint = 'citizen';
            if (role === 'ward_officer') endpoint = 'ward';
            if (role === 'admin') endpoint = 'admin';

            const response = await axios.post(`${API_URL}/chat/${endpoint}`, {
                message: userMessage.text,
                user_id: String(userId || 'anonymous'),
                context: extraContext
            });

            const botMessage = { 
                id: Date.now() + 1, 
                text: response.data.response, 
                sender: 'bot',
                actions: response.data.actions_taken || []
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                id: Date.now(), 
                text: "I'm having trouble connecting to my neural network right now. Please make sure the Agent Service is running on port 8000.", 
                sender: 'bot',
                actions: [] 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-[#1B3A6F] hover:bg-[#122850] text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all transform hover:scale-105"
                >
                    <MessageSquare size={28} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col border border-gray-200 overflow-hidden" style={{ height: '500px' }}>
                    
                    {/* Header */}
                    <div className="bg-[#1B3A6F] text-white p-4 flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-2">
                            <Bot size={24} />
                            <div>
                                <h3 className="font-bold text-sm lg:text-base capitalize">{role.replace('_', ' ')} Agent</h3>
                                <p className="text-xs text-blue-200">Powered by LangGraph AL</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm lg:text-base ${
                                    msg.sender === 'user' 
                                        ? 'bg-[#1B3A6F] text-white rounded-tr-none' 
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    
                                    {/* Action Chips */}
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                                            {msg.actions.map((act, i) => (
                                                <div key={i} className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                                                    <Play size={10} />
                                                    {act}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-200 z-10">
                        <form onSubmit={handleSend} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Command your agent..."
                                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6F] transition"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim() || isLoading}
                                className="bg-[#FF9933] hover:bg-[#E68A2E] disabled:bg-gray-300 text-white rounded-full p-2 transition flex items-center justify-center shadow-md"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
