import { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, Scan, ChefHat, ShoppingCart, AlertCircle,
  Sparkles, RefreshCcw, X, CheckCircle2, Lightbulb,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { hasGroqKey, scanFridgeImage, type FridgeScanResult } from '@/lib/groqClient';
import '@/styles/fridge-scanner.css';

type ScanState = 'idle' | 'preview' | 'scanning' | 'results' | 'error';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  produce: '🥬',
  dairy: '🥛',
  protein: '🥩',
  grain: '🌾',
  condiment: '🧂',
  beverage: '🥤',
  frozen: '🧊',
  other: '📦',
};

export function ImageUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<FridgeScanResult | null>(null);
  const [error, setError] = useState<string>('');

  const processFile = useCallback((file: File) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please upload an image file.' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max size is 20MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setScanState('preview');
      setResults(null);
      setError('');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleScan = async () => {
    if (!imagePreview) return;
    if (!hasGroqKey()) {
      setError('Groq API key not configured. Please set it up in the dashboard.');
      setScanState('error');
      return;
    }

    setScanState('scanning');
    try {
      const result = await scanFridgeImage(imagePreview);
      setResults(result);
      setScanState('results');

      if (result.ingredients.length > 0) {
        toast({
          title: `🎉 Found ${result.ingredients.length} ingredients!`,
          description: `Plus ${result.recipes.length} recipe suggestions.`,
        });
      }
    } catch (err: any) {
      const msg = err.message === 'GROQ_KEY_MISSING'
        ? 'Groq API key not configured.'
        : err.message === 'RATE_LIMITED'
        ? 'Rate limited. Please wait a moment and try again.'
        : err.message || 'Scan failed. Please try again.';
      setError(msg);
      setScanState('error');
    }
  };

  const reset = () => {
    setScanState('idle');
    setImagePreview(null);
    setResults(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ── Render: Idle state ──
  const renderIdle = () => (
    <div
      className="fridge-dropzone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="fridge-dropzone__icon">
        <Scan size={40} />
      </div>
      <h2 className="fridge-dropzone__title">Scan Your Fridge</h2>
      <p className="fridge-dropzone__desc">
        Take a photo of your fridge or ingredients and our AI will identify everything
        and suggest recipes you can make right now.
      </p>
      <div className="fridge-dropzone__actions">
        <button
          className="fridge-btn fridge-btn--primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} /> Upload Photo
        </button>
        <button
          className="fridge-btn fridge-btn--secondary"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={18} /> Take Photo
        </button>
      </div>
      <p className="fridge-dropzone__hint">or drag & drop an image here</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="fridge-hidden-input"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="fridge-hidden-input"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
    </div>
  );

  // ── Render: Preview state ──
  const renderPreview = () => (
    <div className="fridge-preview">
      <div className="fridge-preview__image-wrap">
        <img src={imagePreview!} alt="Food to scan" className="fridge-preview__image" />
        <button className="fridge-preview__close" onClick={reset}>
          <X size={16} />
        </button>
      </div>
      <div className="fridge-preview__actions">
        <button className="fridge-btn fridge-btn--primary fridge-btn--lg" onClick={handleScan}>
          <Sparkles size={18} /> Scan with AI
        </button>
        <button className="fridge-btn fridge-btn--ghost" onClick={reset}>
          Choose Different Photo
        </button>
      </div>
    </div>
  );

  // ── Render: Scanning state ──
  const renderScanning = () => (
    <div className="fridge-scanning">
      <div className="fridge-scanning__image-wrap">
        <img src={imagePreview!} alt="Scanning" className="fridge-scanning__image" />
        <div className="fridge-scanning__overlay">
          <div className="fridge-scanning__laser" />
        </div>
      </div>
      <div className="fridge-scanning__status">
        <div className="fridge-scanning__spinner" />
        <span>AI is analyzing your ingredients…</span>
      </div>
    </div>
  );

  // ── Render: Error state ──
  const renderError = () => (
    <div className="fridge-error">
      <AlertCircle size={40} />
      <h3>Scan Failed</h3>
      <p>{error}</p>
      <div className="fridge-error__actions">
        <button className="fridge-btn fridge-btn--primary" onClick={() => { setScanState('preview'); setError(''); }}>
          <RefreshCcw size={16} /> Try Again
        </button>
        <button className="fridge-btn fridge-btn--ghost" onClick={reset}>
          Upload New Photo
        </button>
      </div>
    </div>
  );

  // ── Render: Results state ──
  const renderResults = () => {
    if (!results) return null;

    const grouped = results.ingredients.reduce<Record<string, typeof results.ingredients>>((acc, item) => {
      const cat = item.category || 'other';
      (acc[cat] = acc[cat] || []).push(item);
      return acc;
    }, {});

    return (
      <div className="fridge-results">
        {/* Image + Summary */}
        <div className="fridge-results__top">
          <div className="fridge-results__image-small">
            <img src={imagePreview!} alt="Scanned" />
          </div>
          <div className="fridge-results__summary">
            <h3>
              <CheckCircle2 size={18} />
              Found {results.ingredients.length} Ingredient{results.ingredients.length !== 1 ? 's' : ''}
            </h3>
            <p>{results.recipes.length} recipe suggestions ready</p>
            <button className="fridge-btn fridge-btn--ghost fridge-btn--sm" onClick={reset}>
              <RefreshCcw size={14} /> Scan Again
            </button>
          </div>
        </div>

        {/* Ingredients by category */}
        {results.ingredients.length > 0 && (
          <div className="fridge-section">
            <h4 className="fridge-section__title">
              <ShoppingCart size={16} /> Detected Ingredients
            </h4>
            <div className="fridge-ingredients">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="fridge-ingredient-group">
                  <span className="fridge-ingredient-group__label">
                    {CATEGORY_ICONS[cat] || '📦'} {cat}
                  </span>
                  <div className="fridge-ingredient-group__items">
                    {items.map((item, i) => (
                      <div key={i} className="fridge-ingredient-chip">
                        <span
                          className="fridge-ingredient-chip__dot"
                          style={{ background: CONFIDENCE_COLORS[item.confidence] }}
                          title={`${item.confidence} confidence`}
                        />
                        <span className="fridge-ingredient-chip__name">{item.name}</span>
                        <span className="fridge-ingredient-chip__qty">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipe suggestions */}
        {results.recipes.length > 0 && (
          <div className="fridge-section">
            <h4 className="fridge-section__title">
              <ChefHat size={16} /> Recipe Suggestions
            </h4>
            <div className="fridge-recipes">
              {results.recipes.map((recipe, i) => (
                <div key={i} className="fridge-recipe-card">
                  <div className="fridge-recipe-card__header">
                    <h5>{recipe.name}</h5>
                    <div className="fridge-recipe-card__meta">
                      <span>⏱ {recipe.prepTime} min</span>
                      <span className="fridge-recipe-card__diff">{recipe.difficulty}</span>
                    </div>
                  </div>
                  <p className="fridge-recipe-card__desc">{recipe.description}</p>
                  <div className="fridge-recipe-card__ingredients">
                    {recipe.ingredients.map((ing, j) => (
                      <span key={j} className="fridge-recipe-card__ing-chip">{ing}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {results.tips.length > 0 && (
          <div className="fridge-section">
            <h4 className="fridge-section__title">
              <Lightbulb size={16} /> Tips
            </h4>
            <div className="fridge-tips">
              {results.tips.map((tip, i) => (
                <div key={i} className="fridge-tip">{tip}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fridge-root">
      <div className="fridge-ambient">
        <div className="fridge-orb fridge-orb--1" />
        <div className="fridge-orb fridge-orb--2" />
      </div>

      <div className="fridge-container">
        <div className="fridge-page-header">
          <h1 className="fridge-page-header__title">
            <Scan size={24} /> Fridge Scanner
          </h1>
          <p className="fridge-page-header__desc">
            AI-powered ingredient detection with instant recipe suggestions
          </p>
        </div>

        <div className="fridge-card">
          {scanState === 'idle' && renderIdle()}
          {scanState === 'preview' && renderPreview()}
          {scanState === 'scanning' && renderScanning()}
          {scanState === 'error' && renderError()}
          {scanState === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
}
