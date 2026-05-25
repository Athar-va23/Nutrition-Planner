import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import { chatWithAI, hasGroqKey } from '@/lib/groqClient';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function NutriAI() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm NutriAI. Ask me about nutrition, meal ideas, or calorie tracking." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (!hasGroqKey()) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Please set up your Groq API key first — go to Dashboard settings." }]);
        return;
      }

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithAI(userMessage, history);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      const msg = error.message === 'RATE_LIMITED'
        ? "I'm being rate-limited. Please wait a moment and try again."
        : "Sorry, I couldn't connect. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Minimized FAB
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="nutri-fab"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
        <div className="nutri-fab__pulse" />
      </button>
    );
  }

  return (
    <div className="nutri-chat">
      {/* Header */}
      <div className="nutri-chat__header">
        <div className="nutri-chat__avatar">
          <Bot className="w-4 h-4" />
        </div>
        <div className="nutri-chat__title-wrap">
          <span className="nutri-chat__title">NutriAI</span>
          <span className="nutri-chat__status">
            <span className="nutri-chat__dot" />
            Online
          </span>
        </div>
        <button className="nutri-chat__minimize" onClick={() => setIsOpen(false)}>
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="nutri-chat__body">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'nutri-chat__msg',
              m.role === 'user' ? 'nutri-chat__msg--user' : 'nutri-chat__msg--ai'
            )}
          >
            <div className={cn(
              'nutri-chat__msg-avatar',
              m.role === 'user' ? 'nutri-chat__msg-avatar--user' : 'nutri-chat__msg-avatar--ai'
            )}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={cn(
              'nutri-chat__bubble',
              m.role === 'user' ? 'nutri-chat__bubble--user' : 'nutri-chat__bubble--ai'
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="nutri-chat__typing">
            <Sparkles className="w-3 h-3" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="nutri-chat__footer">
        <input
          placeholder="Ask about nutrition..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="nutri-chat__input"
          disabled={isLoading}
        />
        <button
          className="nutri-chat__send"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
