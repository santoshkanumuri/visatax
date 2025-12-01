
import React from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="group relative flex items-center ml-2 z-20 hover:z-50">
      <Info size={15} className="text-slate-400 hover:text-blue-600 transition-colors cursor-help shrink-0" />
      
      <div className="
        opacity-0 invisible group-hover:opacity-100 group-hover:visible 
        transition-all duration-200 
        bg-slate-800 text-white text-xs leading-relaxed rounded-lg shadow-xl 
        pointer-events-none z-[100] p-3
        
        /* Mobile: Fixed Snackbar at bottom */
        fixed left-4 right-4 bottom-6 w-auto text-center
        
        /* Desktop: Absolute positioned bubble */
        md:absolute md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-2 md:w-64 md:text-left
      ">
        {text}
        
        {/* Triangle pointer (Desktop only) */}
        <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 border-8 border-t-slate-800 border-x-transparent border-b-transparent"></div>
      </div>
    </div>
  );
};
