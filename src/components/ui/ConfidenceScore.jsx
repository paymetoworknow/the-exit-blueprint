import React from 'react';
import { cn } from '@/lib/utils';

export default function ConfidenceScore({ score, size = 'md', showLabel = true }) {
  const radius = size === 'lg' ? 70 : size === 'md' ? 50 : 35;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return { gradient: 'from-emerald-400 to-teal-500', text: 'text-emerald-400', stroke: 'stroke-emerald-400' };
    if (score >= 50) return { gradient: 'from-amber-400 to-orange-500', text: 'text-amber-400', stroke: 'stroke-amber-400' };
    if (score >= 25) return { gradient: 'from-orange-400 to-red-500', text: 'text-orange-400', stroke: 'stroke-orange-400' };
    return { gradient: 'from-red-400 to-rose-500', text: 'text-red-400', stroke: 'stroke-red-400' };
  };

  const color = getColor();
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            className={cn(color.stroke, "transition-stroke-dash")}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-bold",
            color.text,
            size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'
          )}>
            {Math.round(score)}
          </span>
          <span className="text-zinc-500 text-xs">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn("font-medium text-sm", color.text)}>
            {score >= 75 ? 'High Viability' : 
             score >= 50 ? 'Moderate Viability' : 
             score >= 25 ? 'Needs Work' : 'Low Viability'}
          </p>
          <p className="text-zinc-500 text-xs">Confidence Score</p>
        </div>
      )}
    </div>
  );
}