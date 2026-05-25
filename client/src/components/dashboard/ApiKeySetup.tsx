import { useState } from 'react';
import { KeyRound, ArrowRight, ExternalLink, Shield } from 'lucide-react';
import { setGroqKey } from '@/lib/groqClient';

export function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSubmit = async () => {
    if (!key.trim().startsWith('gsk_')) {
      setError('Key should start with gsk_');
      return;
    }
    setTesting(true);
    setError('');

    try {
      // Quick validation call
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        setError('Invalid key. Please check and try again.');
        setTesting(false);
        return;
      }

      setGroqKey(key.trim());
      onComplete();
    } catch {
      setError('Connection failed. Check your internet.');
      setTesting(false);
    }
  };

  return (
    <div className="apikey-root">
      <div className="apikey-ambient" aria-hidden="true">
        <div className="apikey-orb" />
      </div>

      <div className="apikey-card">
        <div className="apikey-icon">
          <KeyRound className="w-8 h-8" />
        </div>

        <h1 className="apikey-title">
          Connect Your <span className="text-gradient">AI Engine</span>
        </h1>

        <p className="apikey-desc">
          NutriPro uses Groq's free AI to generate meal plans, recipes, and nutritional insights.
          No credit card needed — 1 million tokens per day, forever free.
        </p>

        <div className="apikey-steps">
          <div className="apikey-step">
            <span className="apikey-step__num">1</span>
            <div>
              <p>Create a free account at Groq Console</p>
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="apikey-step__link"
              >
                console.groq.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="apikey-step">
            <span className="apikey-step__num">2</span>
            <p>Go to API Keys → Create API Key</p>
          </div>
          <div className="apikey-step">
            <span className="apikey-step__num">3</span>
            <p>Paste it below</p>
          </div>
        </div>

        <div className="apikey-input-wrap">
          <input
            type="password"
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="apikey-input"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={testing || !key.trim()}
            className="dash-btn dash-btn--primary apikey-submit"
          >
            {testing ? 'Validating...' : <>Connect <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {error && <p className="apikey-error">{error}</p>}

        <div className="apikey-security">
          <Shield className="w-3.5 h-3.5" />
          <span>Your key is stored locally in your browser. We never see it.</span>
        </div>
      </div>
    </div>
  );
}
