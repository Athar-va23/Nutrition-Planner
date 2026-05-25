/**
 * MacroRing — SVG donut chart showing calorie progress + macro breakdown.
 * No dependencies. Pure CSS animation on mount.
 */

import { useEffect, useState } from 'react';

interface Props {
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroRing({ calories, target, protein, carbs, fat }: Props) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setAnimate(true)); }, []);

  const percent = Math.min(100, Math.round((calories / target) * 100));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * (animate ? percent : 0)) / 100;
  const remaining = Math.max(0, target - calories);

  const totalMacro = protein + carbs + fat || 1;
  const pPct = Math.round((protein / totalMacro) * 100);
  const cPct = Math.round((carbs / totalMacro) * 100);
  const fPct = 100 - pPct - cPct;

  return (
    <div className="macro-ring">
      <div className="macro-ring__svg-wrap">
        <svg viewBox="0 0 180 180" className="macro-ring__svg">
          {/* Background track */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke="hsla(152, 20%, 20%, 0.3)"
            strokeWidth="12"
          />
          {/* Progress arc */}
          <circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 90 90)"
            className="macro-ring__progress"
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(152, 60%, 48%)" />
              <stop offset="100%" stopColor="hsl(80, 65%, 55%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="macro-ring__center">
          <span className="macro-ring__pct">{percent}%</span>
          <span className="macro-ring__remain">{remaining.toLocaleString()} left</span>
        </div>
      </div>

      {/* Macro bars */}
      <div className="macro-ring__bars">
        <MacroBar label="Protein" value={protein} pct={pPct} color="var(--clr-protein)" animate={animate} />
        <MacroBar label="Carbs" value={carbs} pct={cPct} color="var(--clr-carbs)" animate={animate} />
        <MacroBar label="Fat" value={fat} pct={fPct} color="var(--clr-fat)" animate={animate} />
      </div>
    </div>
  );
}

function MacroBar({ label, value, pct, color, animate }: {
  label: string; value: number; pct: number; color: string; animate: boolean;
}) {
  return (
    <div className="macro-bar">
      <div className="macro-bar__top">
        <span className="macro-bar__dot" style={{ background: color }} />
        <span className="macro-bar__label">{label}</span>
        <span className="macro-bar__value">{value}g</span>
      </div>
      <div className="macro-bar__track">
        <div
          className="macro-bar__fill"
          style={{ width: animate ? `${pct}%` : '0%', background: color }}
        />
      </div>
    </div>
  );
}
