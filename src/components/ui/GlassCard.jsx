import React from 'react';
import { cn } from '@/lib/utils';

export default function GlassCard({ 
  children, 
  className, 
  hover = false,
  gradient = false,
  gradientFrom = 'from-violet-500/10',
  gradientTo = 'to-purple-600/10',
  ...props 
}) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-white/5 backdrop-blur-sm",
        gradient 
          ? `bg-gradient-to-br ${gradientFrom} ${gradientTo}` 
          : "bg-[#12121a]/80",
        hover && "hover:border-white/10 hover:bg-[#1a1a24]/80 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}