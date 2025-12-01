
import React from 'react';

export const TaxAgentLoader = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-white border border-indigo-100 rounded-2xl shadow-lg shadow-indigo-100 animate-in fade-in zoom-in-95 duration-300">
       <div className="relative w-40 h-40 mb-2">
         {/* Custom SVG Illustration */}
         <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            {/* Background Aura */}
            <circle cx="100" cy="100" r="85" fill="#EEF2FF" className="animate-pulse" style={{animationDuration: '3s'}} />
            
            {/* Character Body */}
            <path d="M60 180 C60 140, 140 140, 140 180 L140 200 L60 200 Z" fill="#3730A3" />
            
            {/* Head */}
            <circle cx="100" cy="110" r="35" fill="#E0E7FF" />
            <circle cx="100" cy="110" r="35" fill="url(#faceGradient)" />
            <defs>
              <linearGradient id="faceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5F3FF" />
                <stop offset="100%" stopColor="#C7D2FE" />
              </linearGradient>
            </defs>

            {/* Glasses (Spects) - Animated */}
            <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                <circle cx="88" cy="108" r="9" fill="white" fillOpacity="0.4" stroke="#3730A3" strokeWidth="2.5" />
                <circle cx="112" cy="108" r="9" fill="white" fillOpacity="0.4" stroke="#3730A3" strokeWidth="2.5" />
                <line x1="97" y1="108" x2="103" y2="108" stroke="#3730A3" strokeWidth="2.5" />
                <path d="M79 108 L70 105" stroke="#3730A3" strokeWidth="2" />
                <path d="M121 108 L130 105" stroke="#3730A3" strokeWidth="2" />
            </g>

            {/* Hair */}
            <path d="M65 110 C65 80, 135 80, 135 110 C135 90, 65 90, 65 110" fill="#1E1B4B" />

            {/* Calculator Floating - Animated */}
            <g transform="translate(135, 60) rotate(15)" className="animate-pulse" style={{animationDuration: '1.5s'}}>
               <rect x="0" y="0" width="45" height="60" rx="6" fill="#4338CA" stroke="#312E81" strokeWidth="2" />
               <rect x="5" y="6" width="35" height="15" rx="2" fill="#C7D2FE" />
               <circle cx="11" cy="35" r="3" fill="#818CF8" />
               <circle cx="22" cy="35" r="3" fill="#818CF8" />
               <circle cx="33" cy="35" r="3" fill="#818CF8" />
               <circle cx="11" cy="45" r="3" fill="#818CF8" />
               <circle cx="22" cy="45" r="3" fill="#818CF8" />
               <circle cx="33" cy="45" r="3" fill="#818CF8" />
            </g>
            
            {/* Floating Math Symbols */}
            <text x="40" y="80" fill="#6366F1" fontSize="24" fontWeight="bold" className="animate-bounce" style={{animationDelay: '0.2s', animationDuration: '3s'}}>%</text>
            <text x="160" y="140" fill="#6366F1" fontSize="24" fontWeight="bold" className="animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2.5s'}}>+</text>
            <text x="40" y="150" fill="#6366F1" fontSize="20" fontWeight="bold" className="animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}>$</text>

         </svg>
       </div>
       <div className="text-center space-y-2">
         <h3 className="text-indigo-900 font-bold text-lg">Tax Agent is calculating...</h3>
         <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
           <span>Verifying Treaties</span>
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
           <span>Checking Brackets</span>
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
         </div>
       </div>
    </div>
  );
};
