/**
 * WeekChart — 7-day calorie trend bar chart.
 * Pure SVG, no charting library. Reads from localStorage.
 */

import { useMemo } from 'react';
import { localStore } from '@/lib/localStore';
import { useAuthStore } from '@/stores/authStore';

export function WeekChart({ target }: { target: number }) {
  const userId = useAuthStore((s) => s.user?.id);

  const data = useMemo(() => {
    const log = localStore.getNutritionLog();
    const days: { label: string; value: number; date: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = log.find(e => e.date === dateStr);
      days.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        value: entry?.calories || 0,
        date: dateStr,
      });
    }
    return days;
  }, [userId]);

  const maxVal = Math.max(target, ...data.map(d => d.value)) * 1.1;
  const barWidth = 32;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap) - gap;
  const chartHeight = 140;

  return (
    <div className="week-chart">
      <svg
        viewBox={`0 0 ${chartWidth + 20} ${chartHeight + 40}`}
        className="week-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Target line */}
        <line
          x1="0"
          y1={chartHeight - (target / maxVal) * chartHeight}
          x2={chartWidth + 20}
          y2={chartHeight - (target / maxVal) * chartHeight}
          stroke="hsl(152, 60%, 48%)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.35"
        />
        <text
          x={chartWidth + 16}
          y={chartHeight - (target / maxVal) * chartHeight - 4}
          fill="hsl(152, 60%, 48%)"
          fontSize="8"
          textAnchor="end"
          opacity="0.6"
        >
          {target}
        </text>

        {data.map((d, i) => {
          const x = i * (barWidth + gap) + 10;
          const barH = d.value > 0 ? Math.max(4, (d.value / maxVal) * chartHeight) : 4;
          const y = chartHeight - barH;
          const isToday = i === data.length - 1;
          const overTarget = d.value > target;

          return (
            <g key={d.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="6"
                fill={
                  d.value === 0
                    ? 'hsla(152, 20%, 20%, 0.3)'
                    : overTarget
                    ? 'url(#barGradientWarn)'
                    : 'url(#barGradient)'
                }
                opacity={isToday ? 1 : 0.7}
                className="week-chart__bar"
              >
                <animate
                  attributeName="height"
                  from="0"
                  to={barH}
                  dur="0.6s"
                  fill="freeze"
                  begin={`${i * 0.06}s`}
                />
                <animate
                  attributeName="y"
                  from={chartHeight}
                  to={y}
                  dur="0.6s"
                  fill="freeze"
                  begin={`${i * 0.06}s`}
                />
              </rect>

              {/* Value label */}
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="hsl(150, 20%, 70%)"
                  fontSize="9"
                  fontWeight="600"
                  opacity="0.8"
                >
                  {d.value}
                </text>
              )}

              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                fill={isToday ? 'hsl(152, 60%, 48%)' : 'hsl(150, 15%, 45%)'}
                fontSize="10"
                fontWeight={isToday ? '700' : '400'}
              >
                {d.label}
              </text>

              {/* Today dot */}
              {isToday && (
                <circle
                  cx={x + barWidth / 2}
                  cy={chartHeight + 26}
                  r="2"
                  fill="hsl(152, 60%, 48%)"
                />
              )}
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(152, 60%, 48%)" />
            <stop offset="100%" stopColor="hsl(152, 50%, 30%)" />
          </linearGradient>
          <linearGradient id="barGradientWarn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(30, 90%, 55%)" />
            <stop offset="100%" stopColor="hsl(30, 70%, 35%)" />
          </linearGradient>
        </defs>
      </svg>

      {data.every(d => d.value === 0) && (
        <div className="week-chart__empty">
          <p>No data yet — log meals to see your trend</p>
        </div>
      )}
    </div>
  );
}
