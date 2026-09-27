'use client';

import { useState } from 'react';
import { RevenueDay } from '@/data/mockData';

interface BarChartProps {
  data: RevenueDay[];
  height?: number;
}

export default function BarChart({ data, height = 200 }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const padding = { top: 20, bottom: 40, left: 60, right: 20 };
  const chartW = 560;
  const chartH = height;
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const barWidth = innerW / data.length;
  const barPad = barWidth * 0.25;

  const formatRevenue = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return String(v);
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: maxRevenue * pct,
    y: padding.top + innerH * (1 - pct),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        style={{ minWidth: 320, height }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick.y}>
            <line
              x1={padding.left} y1={tick.y}
              x2={chartW - padding.right} y2={tick.y}
              stroke="#404040" strokeWidth="1" strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8} y={tick.y + 4}
              textAnchor="end" fontSize="11" fill="#B3B3B3"
            >
              {formatRevenue(tick.value)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.revenue / maxRevenue) * innerH;
          const x = padding.left + i * barWidth + barPad;
          const y = padding.top + innerH - barH;
          const w = barWidth - barPad * 2;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.day}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x} y={y} width={w} height={barH}
                fill={isHovered ? '#FFB703' : '#E63946'}
                rx="4"
                style={{ transition: 'fill 0.15s ease' }}
              />
              {isHovered && (
                <text
                  x={x + w / 2} y={y - 6}
                  textAnchor="middle" fontSize="11" fill="#FFB703" fontWeight="600"
                >
                  {formatRevenue(d.revenue)}đ
                </text>
              )}
              <text
                x={x + w / 2} y={chartH - padding.bottom + 16}
                textAnchor="middle" fontSize="12" fill="#B3B3B3"
              >
                {d.day}
              </text>
              <text
                x={x + w / 2} y={chartH - padding.bottom + 30}
                textAnchor="middle" fontSize="10" fill="#525252"
              >
                {d.tickets}vé
              </text>
            </g>
          );
        })}

        {/* X axis */}
        <line
          x1={padding.left} y1={padding.top + innerH}
          x2={chartW - padding.right} y2={padding.top + innerH}
          stroke="#404040" strokeWidth="1"
        />
      </svg>
    </div>
  );
}
