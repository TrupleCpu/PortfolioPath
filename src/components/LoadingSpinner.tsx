import React from 'react';
import { motion } from 'motion/react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8">
      <div className="relative w-32 h-32">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-emerald-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner rotating ring (reverse) */}
        <motion.div
          className="absolute inset-4 border-4 border-transparent border-b-blue-500 border-l-blue-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center pulsing core */}
        <motion.div
          className="absolute inset-10 bg-emerald-500/20 rounded-full blur-md"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-1 bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="text-center space-y-2">
        <motion.h3 
          className="text-xl font-mono font-bold text-emerald-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ANALYZING CODE ARCHITECTURE
        </motion.h3>
        <p className="text-slate-400 text-sm font-mono">
          Evaluating complexity metrics...
        </p>
      </div>
    </div>
  );
}
