import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse, AiResponse } from '../services/geminiService';
import { ChatMessage, Consultant } from '../types';
import { MOCK_CONSULTANTS } from '../constants';
import ConsultantCard from './ConsultantCard';
import LiveSession from './LiveSession';

interface ChatWidgetProps {
  onViewExpert: (id: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onViewExpert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Tattaunawa360 assistant. Tell me what kind of expert you need (e.g., 'I need a React developer' or 'I need a heart specialist').",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Toggle for Live API
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isVoiceMode]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build simple history string
      const history = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const response: AiResponse = await getGeminiResponse(userMsg.content, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        suggestedExperts: response.recommendedConsultantIds
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const getConsultantById = (id: string) => MOCK_CONSULTANTS.find(c => c.id === id);

  return (
    <div className={`fixed z-50 transition-all duration-300 flex flex-col items-end 
      ${isOpen 
        ? 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-auto sm:h-auto' // Full screen on mobile, bottom-right on desktop
        : 'bottom-6 right-6'
      }
    `}>
      {isOpen && (
        <div className={`bg-white shadow-2xl border-slate-200 flex flex-col overflow-hidden relative transition-all
          w-full h-full sm:w-[450px] sm:h-[500px] sm:rounded-2xl sm:border sm:mb-4
        `}>
          
          {isVoiceMode ? (
            <LiveSession onClose={() => setIsVoiceMode(false)} />
          ) : (
            <>
              {/* Header */}
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <h3 className="font-bold">Smart Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsVoiceMode(true)} 
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-blue-200 hover:text-white"
                    title="Start Voice Call"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                     </svg>
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    
                    {/* Expert Suggestions */}
                    {msg.suggestedExperts && msg.suggestedExperts.length > 0 && (
                      <div className="mt-3 w-full pl-2">
                        <p className="text-xs text-slate-500 mb-2 font-medium">Recommended Experts:</p>
                        <div className="space-y-2">
                          {msg.suggestedExperts.map(id => {
                            const expert = getConsultantById(id);
                            if (!expert) return null;
                            return (
                              <div key={id} className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm flex items-center gap-3 hover:bg-slate-50 cursor-pointer" onClick={() => onViewExpert(id)}>
                                <img src={expert.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-slate-900 truncate">{expert.name}</p>
                                  <p className="text-xs text-blue-600 truncate">{expert.title}</p>
                                </div>
                                <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">View</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 p-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0 safe-area-bottom">
                <button 
                  onClick={startListening}
                  className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title="Speak (Text Mode)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Button - Only visible when closed or on larger screens */}
      {(!isOpen) && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-semibold hidden md:inline">Ask AI Matcher</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;