"use client";

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/currency';

interface ChartPoint {
  label: string;
  sales: number;
}

interface TrendChartProps {
  data: ChartPoint[];
  height?: number;
}

export function TrendChart({ data, height = 300 }: TrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; label: string; val: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary)', borderRadius: '8px', color: 'var(--muted-foreground)' }}>
        No chart data available.
      </div>
    );
  }

  // Settings
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = 760; // Base width for coordinates mapping

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Find boundaries
  const salesValues = data.map(p => p.sales);
  const maxSales = Math.max(...salesValues, 1000); // Minimum scale floor of 1000 to look natural
  const minSales = 0;

  // Helper to map index & value to canvas coordinates
  const getCoordinates = (index: number, sales: number) => {
    const x = paddingLeft + (index / Math.max(1, data.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - (sales / maxSales) * graphHeight;
    return { x, y };
  };

  // Build grid lines
  const gridSteps = 4;
  const gridLines = [];
  for (let i = 0; i <= gridSteps; i++) {
    const val = minSales + (i / gridSteps) * (maxSales - minSales);
    const { y } = getCoordinates(0, val);
    gridLines.push({ y, val });
  }

  // Compile path coordinate string
  let pathD = "";
  const points = data.map((point, index) => {
    const coords = getCoordinates(index, point.sales);
    if (index === 0) {
      pathD = `M ${coords.x} ${coords.y}`;
    } else {
      pathD += ` L ${coords.x} ${coords.y}`;
    }
    return { ...coords, label: point.label, val: point.sales, index };
  });

  // Compile fill path for gradient fill below line
  let fillD = "";
  if (points.length > 0) {
    const first = points[0];
    const last = points[points.length - 1];
    fillD = `${pathD} L ${last.x} ${paddingTop + graphHeight} L ${first.x} ${paddingTop + graphHeight} Z`;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'relative', width: `${chartWidth}px`, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height} style={{ overflow: 'visible', fontFamily: 'inherit' }}>
          
          {/* Gradients fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={chartWidth - paddingRight} 
                y2={line.y} 
                stroke="var(--border)" 
                strokeWidth="1" 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 10} 
                y={line.y + 4} 
                textAnchor="end" 
                fontSize="10px" 
                fill="var(--muted-foreground)"
              >
                {formatCurrency(line.val).replace('₹', 'Rs ')}
              </text>
            </g>
          ))}

          {/* Shaded Area fill */}
          {fillD && (
            <path d={fillD} fill="url(#chartGradient)" />
          )}

          {/* Connected trend line path */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          )}

          {/* Circle dots */}
          {points.map((point) => (
            <circle 
              key={point.index}
              cx={point.x}
              cy={point.y}
              r={hoveredPoint?.index === point.index ? "6" : "4.5"}
              fill="var(--background)"
              stroke="var(--primary)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Date Labels on X-Axis */}
          {data.map((point, index) => {
            // Render only a subset of dates to avoid crowded labels
            const skipCount = Math.ceil(data.length / 8);
            if (index % skipCount !== 0 && index !== data.length - 1) return null;

            const { x } = getCoordinates(index, 0);
            const labelStr = point.label.slice(5); // Show MM-DD or month label cleanly

            return (
              <text 
                key={index}
                x={x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                fontSize="10px"
                fill="var(--muted-foreground)"
              >
                {labelStr}
              </text>
            );
          })}

        </svg>

        {/* Hover Tooltip Overlay card */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y - 65}px`,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            padding: '0.4rem 0.75rem',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.1rem',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.65rem' }}>{hoveredPoint.label}</span>
            <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{formatCurrency(hoveredPoint.val)}</span>
          </div>
        )}

      </div>
    </div>
  );
}
