import { Menu } from 'lucide-react';
import { motion } from 'motion/react';

interface TopStatsProps {
  percentage: string;
  countryCount: number;
  cityCount: number;
  totalCountries: number;
  onMenuClick: () => void;
}

export default function TopStats({ percentage, countryCount, cityCount, totalCountries, onMenuClick }: TopStatsProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-28 flex items-center px-6 z-30 pointer-events-none text-[#1A1A1A]">
      {/* Menu Button */}
      <button 
        onClick={onMenuClick}
        className="pointer-events-auto h-12 w-12 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-100 rounded-full transition-all group"
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
          className="flex items-center gap-8 md:gap-14 bg-white/90 backdrop-blur-xl px-10 py-5 rounded-[2rem] shadow-2xl border border-white pointer-events-auto mt-4"
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
