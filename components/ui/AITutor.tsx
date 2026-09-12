import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Lecture } from '../../types';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  lecture: Lecture;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const AITutor: React.FC<Props> = ({ lecture, isOpen, onClose }) => {
  const { language } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: language === 'ar' 
            ? `مرحباً! أنا المعلم الذكي. أنا هنا لمساعدتك في فهم محاضرة "${lecture.titleAr || lecture.title}". اسألني أي سؤال حول هذا الموضوع!` 
            : `Hello! I'm your AI Tutor. I'm here to help you understand the lecture "${lecture.title}". Ask me any questions about this material!`
        }
      ]);
    }
  }, [isOpen, lecture, language]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Build the system prompt with strict instructions and the lecture context
      const contextData = JSON.stringify({
        title: lecture.title,
        summary: lecture.summary,
        flashcards: lecture.flashcards.map(f => ({ q: f.question, a: f.answer }))
      });

      const systemPrompt = `You are an expert AI Tutor helping a university student learn.
      
CRITICAL RULES:
1. You MUST ONLY answer questions using the lecture context provided below.
2. If the user asks a question that cannot be answered using the provided context (e.g., general knowledge, coding help unrelated to the lecture, unrelated subjects), you MUST politely refuse to answer and remind them you are strictly an AI Tutor for this specific lecture.
3. Be encouraging, concise, and educational. Format your response in Markdown.

LECTURE CONTEXT DATA:
${contextData}
`;

      // Format previous messages for the backend API (excluding welcome message to save tokens)
      const apiMessages = messages.filter(m => m.id !== 'welcome').map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Add the new user message
      apiMessages.push({
        role: 'user',
        content: userMessage.content
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction: systemPrompt,
          temperature: 0.2
        })
      });

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (!response.ok) {
        let errorMessage;
        if (contentType.includes("application/json")) {
            data = await response.json();
            errorMessage = data.error || "AI request failed";
        } else {
            const text = await response.text();
            console.error("AI endpoint returned non-JSON error:", text);
            errorMessage = "AI service is temporarily unavailable or returned an invalid response.";
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but received:", text);
        throw new Error("AI service returned an invalid response.");
      }

      data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch response from AI backend.");
      }

      const botText = data.content || "I'm sorry, I couldn't generate a response.";
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: botText
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("AI Tutor Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `Oops! There was an error connecting to my brain: ${error?.message || error}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-screen w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-l border-white/20 dark:border-slate-700/50 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={20} />
            <h3 className="font-bold">AI Tutor</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'ar' ? 'اسأل المعلم...' : 'Ask your tutor...'}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            AI answers strictly from the lecture material.
          </p>
        </div>
      </div>
    </>
  );
};

export default AITutor;
