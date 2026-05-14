import { Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface TopStatsProps {
  percentage: string;
  countryCount: number;
  cityCount: number;
  totalCountries: number;
  onMenuClick: () => void;
  darkMode?: boolean;
}

export default function TopStats({ percentage, countryCount, cityCount, totalCountries, onMenuClick, darkMode }: TopStatsProps) {
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 h-28 flex items-center px-6 z-30 pointer-events-none transition-colors duration-500",
      darkMode ? "text-white" : "text-[#1A1A1A]"
    )}>
      {/* Menu Button */}
      <button 
        onClick={onMenuClick}
        className={cn(
          "pointer-events-auto h-12 w-12 flex flex-col items-center justify-center gap-1.5 rounded-full transition-all group",
          darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
        )}
      >
        <div className="w-5 h-0.5 bg-current transition-all group-hover:w-6" />
        <div className="w-5 h-0.5 bg-current transition-all group-hover:w-4" />
        <div className="w-5 h-0.5 bg-current" />
      </button>

      {/* Stats Display */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-8 md:gap-14 backdrop-blur-xl px-10 py-5 rounded-[2rem] shadow-2xl pointer-events-auto mt-4 transition-all duration-500",
            darkMode
              ? "bg-slate-900/90 border-white/10 text-white"
              : "bg-white/90 border-white text-black shadow-black/5"
          )}
        >
          {/* Cities */}
          <div className="flex flex-col items-center opacity-40">
            <span className="font-display text-base font-bold tracking-tight">{cityCount}</span>
            <span className="font-mono text-[6px] uppercase tracking-[0.2em]">Cities</span>
          </div>
          
          {/* Countries - MAIN BIG */}
          <div className="flex flex-col items-center">
            <span className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter leading-[0.8]">{countryCount}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] mt-1 opacity-30">Countries</span>
          </div>

          {/* Percentage */}
          <div className="flex flex-col items-center opacity-40">
            <span className="font-display text-base font-bold tracking-tight">{percentage}%</span>
            <span className="font-mono text-[6px] uppercase tracking-[0.2em]">Global</span>
          </div>
        </motion.div>
      </div>

      {/* Placeholder to balance the layout */}
      <div className="w-12 h-12" />
    </div>
  );
}
