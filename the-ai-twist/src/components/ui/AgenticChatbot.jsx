import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Bot, User, Sparkles } from 'lucide-react';

export default function AgenticChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hi! I am your ICONIC Data Agent. I have analyzed the macroeconomic Data Marts. What would you like to know?"
    }
  ]);
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handlePromptClick = (promptText) => {
    // 1. Thêm tin nhắn của User
    setMessages(prev => [...prev, { sender: 'user', text: promptText }]);
    setIsTyping(true);

    // 2. Giả lập AI đang suy nghĩ (2 giây)
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Based on the dbt `mart_comeback_king` model, **Store 14** is the ultimate Comeback King! It achieved a network-high recovery of **+4.37M VND** immediately following a drop in early Feb 2019." 
      }]);
    }, 2000);
  };

  return (
    <>
      {/* Nút Floating Action Button (Mở Chat) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out pl-0 group-hover:pl-2 font-medium">
            Ask AI Agent
          </span>
        </button>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 bg-white border border-slate-200 shadow-2xl rounded-lg flex flex-col z-50 overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="font-bold tracking-wide">ICONIC Data Agent</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-rose-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Khung tin nhắn */}
          <div className="h-80 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  {/* Highlight text bôi đậm đơn giản */}
                  <span dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-emerald-600">$1</code>')}} />
                </div>
              </div>
            ))}
            
            {/* Hiệu ứng AI Thinking */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Khung nhập (Dùng Suggestion Chips thay vì gõ text tự do) */}
          <div className="p-4 bg-white border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Suggested Queries</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handlePromptClick("Which store is the Comeback King?")}
                disabled={isTyping || messages.length > 1}
                className="text-left text-sm px-3 py-2 rounded border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50"
              >
                "Which store is the Comeback King?"
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
