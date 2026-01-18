import React from 'react';
import { cn } from '@/lib/utils';

export default function StageHeader({ 
  stageNumber, 
  title, 
  subtitle, 
  icon: Icon, 
  gradient = 'from-violet-500 to-purple-600',
  children 
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            gradient
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Stage {stageNumber}
              </span>
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-xs text-zinc-500">of 5</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-zinc-400 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}