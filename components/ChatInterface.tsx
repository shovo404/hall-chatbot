
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, KnowledgeItem } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  knowledge: KnowledgeItem[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ knowledge }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '### WELCOME\nWelcome to the **DIU Hall Info Bot**. I am here to provide structured information regarding:\n- Hall Facilities\n- Admission Policies\n- Fee Structures\n- General Rules\n\nHow may I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponseContent = await generateChatResponse([...messages, userMessage], knowledge);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponseContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-wider">DIU Hall Info Bot</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[10px] text-slate-400 font-bold uppercase">Public Records Terminal</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
          <Info size={14} />
          <span>STRUCTURED DATA MODE</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full animate-fade-in ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
              <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-blue-600 border-blue-500'
              }`}>
                {msg.role === 'user' ? <User size={18} className="text-slate-600" /> : <Bot size={18} className="text-white" />}
              </div>
              <div
                className={`p-5 rounded-3xl shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-black rounded-tl-none'
                }`}
              >
                <div className={`text-sm prose ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-3 text-[10px] font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-slate-500' : 'text-slate-400'}`}>
                   <span>{msg.role === 'user' ? 'Student' : 'Official Bot'}</span>
                   <span>•</span>
                   <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-4 max-w-[85%]">
              <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center border border-blue-500">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-3xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                </div>
                <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Formatting Records...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for hall info (e.g. 'What are the canteen hours?')"
            className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-slate-900 hover:bg-blue-600 disabled:bg-slate-200 text-white p-4 rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center group"
          >
            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
        <div className="flex justify-between items-center mt-4 px-2">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">DIU HALL INFO TERMINAL</p>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Response formatted for clarity</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;