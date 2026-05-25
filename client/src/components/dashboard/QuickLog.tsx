/**
 * QuickLog — Fast meal logging widget with AI photo analysis.
 * Supports: preset meals, custom entry, and camera-based AI scanning.
 */

import { useState, useRef } from 'react';
import { Plus, Utensils, Coffee, Pizza, Cookie, Salad, X, Camera, Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { localStore } from '@/lib/localStore';
import { analyzeMealPhoto, hasGroqKey, type MealPhotoAnalysis } from '@/lib/groqClient';

const PRESETS = [
  { name: 'Light Breakfast', cal: 350, p: 20, c: 45, f: 10, icon: Coffee },
  { name: 'Protein Meal', cal: 550, p: 45, c: 35, f: 20, icon: Salad },
  { name: 'Standard Lunch', cal: 650, p: 30, c: 60, f: 25, icon: Pizza },
  { name: 'Quick Snack', cal: 200, p: 8, c: 25, f: 8, icon: Cookie },
];

const CONFIDENCE_BADGE: Record<string, { label: string; cls: string }> = {
  high: { label: '●  High', cls: 'quick-log__conf--high' },
  medium: { label: '●  Medium', cls: 'quick-log__conf--med' },
  low: { label: '●  Low', cls: 'quick-log__conf--low' },
};

export function QuickLog({ onLog }: { onLog: () => void }) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: '', cal: '', p: '', c: '', f: '' });
  const [feedback, setFeedback] = useState('');

  // Photo scan states
  const [scanMode, setScanMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MealPhotoAnalysis | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const logMeal = (name: string, cal: number, p: number, c: number, f: number, source: 'photo' | 'preset' | 'manual' | 'plan' = 'preset') => {
    localStore.updateTodayLog({
      calories: (localStore.getTodayLog()?.calories || 0) + cal,
      protein: (localStore.getTodayLog()?.protein || 0) + p,
      carbs: (localStore.getTodayLog()?.carbs || 0) + c,
      fat: (localStore.getTodayLog()?.fat || 0) + f,
      meals: [
        ...(localStore.getTodayLog()?.meals || []),
        { name, calories: cal, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source },
      ],
    });
    setFeedback(`✓ ${name} logged`);
    setTimeout(() => setFeedback(''), 2000);
    onLog();
  };

  const handleCustomSubmit = () => {
    const cal = parseInt(custom.cal) || 0;
    if (!custom.name.trim() || cal <= 0) return;
    logMeal(
      custom.name.trim(),
      cal,
      parseInt(custom.p) || 0,
      parseInt(custom.c) || 0,
      parseInt(custom.f) || 0,
      'manual',
    );
    setCustom({ name: '', cal: '', p: '', c: '', f: '' });
    setShowCustom(false);
  };

  // ── Photo scan handlers ──
  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 20 * 1024 * 1024) {
      setScanError('Image too large (max 20MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setScanPreview(base64);
      setScanError('');
      setScanning(true);
      setScanResult(null);

      try {
        const result = await analyzeMealPhoto(base64);
        setScanResult(result);
        // Auto-fill custom form with AI results
        setCustom({
          name: result.name,
          cal: String(result.calories),
          p: String(result.protein),
          c: String(result.carbs),
          f: String(result.fat),
        });
      } catch (err: any) {
        setScanError(err.message || 'Could not analyze photo');
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogScannedMeal = () => {
    // Log using current form values (which may have been edited by user after AI fill)
    const cal = parseInt(custom.cal) || 0;
    const name = custom.name.trim();
    if (!name || cal <= 0) return;

    logMeal(
      name,
      cal,
      parseInt(custom.p) || 0,
      parseInt(custom.c) || 0,
      parseInt(custom.f) || 0,
      'photo',
    );

    // Reset
    resetScan();
  };

  const resetScan = () => {
    setScanMode(false);
    setScanning(false);
    setScanResult(null);
    setScanPreview(null);
    setScanError('');
    setCustom({ name: '', cal: '', p: '', c: '', f: '' });
    if (fileRef.current) fileRef.current.value = '';
    if (camRef.current) camRef.current.value = '';
  };

  // ── Scan Mode UI ──
  if (scanMode) {
    return (
      <div className="quick-log">
        {feedback && <div className="quick-log__feedback">{feedback}</div>}

        <div className="quick-log__custom">
          <div className="quick-log__custom-header">
            <span className="quick-log__scan-title">
              <Camera className="w-3.5 h-3.5" /> Snap & Log
            </span>
            <button onClick={resetScan} className="quick-log__close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Photo upload area */}
          {!scanPreview && !scanning && (
            <div className="quick-log__snap-zone">
              <div className="quick-log__snap-btns">
                <button
                  className="quick-log__snap-btn"
                  onClick={() => camRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  <span>Take Photo</span>
                </button>
                <button
                  className="quick-log__snap-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Upload</span>
                </button>
              </div>
              <p className="quick-log__snap-hint">
                AI will estimate the macros from your meal photo
              </p>
            </div>
          )}

          {/* Scanning spinner */}
          {scanning && (
            <div className="quick-log__scanning">
              {scanPreview && (
                <img src={scanPreview} alt="Meal" className="quick-log__scan-thumb" />
              )}
              <div className="quick-log__scanning-status">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is analyzing your meal…</span>
              </div>
            </div>
          )}

          {/* Error */}
          {scanError && (
            <div className="quick-log__scan-error">
              <p>{scanError}</p>
              <button
                className="quick-log__retry"
                onClick={() => { setScanError(''); setScanPreview(null); }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {scanResult && !scanning && (
            <div className="quick-log__scan-result">
              {scanPreview && (
                <img src={scanPreview} alt={scanResult.name} className="quick-log__scan-thumb" />
              )}
              <div className="quick-log__scan-info">
                <div className="quick-log__scan-name">
                  <Sparkles className="w-3 h-3" />
                  {scanResult.name}
                </div>
                {scanResult.description && (
                  <p className="quick-log__scan-desc">{scanResult.description}</p>
                )}
                <div className="quick-log__scan-meta">
                  <span className={CONFIDENCE_BADGE[scanResult.confidence]?.cls}>
                    {CONFIDENCE_BADGE[scanResult.confidence]?.label || 'Medium'}
                  </span>
                  {scanResult.portionSize && (
                    <span className="quick-log__portion">{scanResult.portionSize}</span>
                  )}
                </div>
              </div>

              {/* Editable macro fields */}
              <div className="quick-log__scan-fields">
                <input
                  placeholder="Meal name"
                  value={custom.name}
                  onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                  className="quick-log__input"
                />
                <div className="quick-log__row">
                  <input placeholder="Kcal" value={custom.cal} onChange={(e) => setCustom({ ...custom, cal: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
                  <input placeholder="P (g)" value={custom.p} onChange={(e) => setCustom({ ...custom, p: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
                  <input placeholder="C (g)" value={custom.c} onChange={(e) => setCustom({ ...custom, c: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
                  <input placeholder="F (g)" value={custom.f} onChange={(e) => setCustom({ ...custom, f: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
                </div>
                <p className="quick-log__edit-hint">Values are AI estimates — feel free to adjust</p>
              </div>

              <button className="dash-btn dash-btn--primary dash-btn--sm quick-log__submit" onClick={handleLogScannedMeal}>
                <Plus className="w-3 h-3" /> Log This Meal
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="quick-log__hidden" onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="quick-log__hidden" onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
        </div>
      </div>
    );
  }

  // ── Default UI ──
  return (
    <div className="quick-log">
      {feedback && (
        <div className="quick-log__feedback">{feedback}</div>
      )}

      <div className="quick-log__presets">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            className="quick-log__preset"
            onClick={() => logMeal(p.name, p.cal, p.p, p.c, p.f)}
          >
            <p.icon className="w-4 h-4" />
            <span className="quick-log__preset-name">{p.name}</span>
            <span className="quick-log__preset-cal">{p.cal}</span>
          </button>
        ))}
      </div>

      {showCustom ? (
        <div className="quick-log__custom">
          <div className="quick-log__custom-header">
            <span>Custom Entry</span>
            <button onClick={() => setShowCustom(false)} className="quick-log__close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            placeholder="Meal name"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            className="quick-log__input"
            autoFocus
          />
          <div className="quick-log__row">
            <input placeholder="Kcal" value={custom.cal} onChange={(e) => setCustom({ ...custom, cal: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
            <input placeholder="P (g)" value={custom.p} onChange={(e) => setCustom({ ...custom, p: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
            <input placeholder="C (g)" value={custom.c} onChange={(e) => setCustom({ ...custom, c: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
            <input placeholder="F (g)" value={custom.f} onChange={(e) => setCustom({ ...custom, f: e.target.value })} className="quick-log__input quick-log__input--sm" type="number" />
          </div>
          <button className="dash-btn dash-btn--primary dash-btn--sm quick-log__submit" onClick={handleCustomSubmit}>
            <Plus className="w-3 h-3" /> Log Meal
          </button>
        </div>
      ) : (
        <div className="quick-log__bottom-actions">
          <button className="quick-log__add" onClick={() => setShowCustom(true)}>
            <Utensils className="w-3.5 h-3.5" />
            Custom meal
          </button>
          {hasGroqKey() && (
            <button className="quick-log__add quick-log__add--photo" onClick={() => setScanMode(true)}>
              <Camera className="w-3.5 h-3.5" />
              Snap meal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
