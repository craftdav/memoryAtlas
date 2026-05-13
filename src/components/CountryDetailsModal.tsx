import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Users, Landmark, Calendar, MapPin, Plus, Heart, HeartOff } from 'lucide-react';
import { VisitedLocation } from '../types';
import { cn } from '../lib/utils';

interface CountryDetailsModalProps {
  countryCode: string;
  countryName: string;
  memories: VisitedLocation[];
  onClose: () => void;
  onAddMemory: (countryCode: string) => void;
  onEditMemory: (memory: VisitedLocation) => void;
}

interface CountryInfo {
  flag: string;
  capital: string;
  population: string;
  region: string;
  subregion: string;
}

export default function CountryDetailsModal({ 
  countryCode, 
  countryName, 
  memories, 
  onClose, 
  onAddMemory, 
  onEditMemory 
}: CountryDetailsModalProps) {
  const [info, setInfo] = useState<CountryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCountryInfo() {
      try {
        const res = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const data = await res.json();
        if (data && data[0]) {
          const country = data[0];
          setInfo({
            flag: country.flags.svg || country.flags.png,
            capital: country.capital?.[0] || 'N/A',
            population: new Intl.NumberFormat().format(country.population),
            region: country.region,
            subregion: country.subregion
          });
        }
      } catch (err) {
        console.error('Failed to fetch country info:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCountryInfo();
  }, [countryCode]);

  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memories]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] mt-auto md:mt-0"
      >
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 md:hidden" />

        {/* Header / Flag */}
        <div className="relative min-h-[180px] md:min-h-[220px] bg-gray-50 flex items-center justify-center overflow-hidden">
          {info?.flag ? (
            <img 
              src={info.flag} 
              alt={`${countryName} flag`} 
              className="w-full h-full object-cover opacity-10 blur-xl absolute inset-0 scale-110" 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            {info?.flag ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 md:w-32 aspect-[3/2] rounded-xl shadow-2xl overflow-hidden border-4 border-white"
              >
                <img src={info.flag} alt={countryName} className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <Globe size={64} className="text-black/10" />
            )}
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-center px-6">
              {countryName}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-black z-20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Country Stats */}
        <div className="grid grid-cols-2 border-y border-gray-100 divide-x divide-gray-100">
          <div className="p-6 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
              <Landmark size={12} /> Capital
            </div>
            <p className="font-bold text-lg">{isLoading ? '...' : info?.capital}</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
              <Users size={12} /> Population
            </div>
            <p className="font-bold text-lg">{isLoading ? '...' : info?.population}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-black">Adventure Collection</h3>
              <p className="text-sm opacity-40 font-medium">{memories.length} captured moments in {countryName}</p>
            </div>
            <button
              onClick={() => onAddMemory(countryCode)}
              className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {sortedMemories.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sortedMemories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => onEditMemory(memory)}
                  className="group relative flex items-center gap-5 p-5 bg-gray-50 rounded-[2rem] hover:bg-black hover:text-white transition-all duration-300 text-left"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-200 shrink-0 shadow-sm transition-transform group-hover:scale-95">
                    {memory.images?.[0] ? (
                      <img src={memory.images[0]} alt={memory.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Globe size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-12">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-60">
                          {new Date(memory.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {memory.cityName && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-current opacity-20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-60 flex items-center gap-1">
                              <MapPin size={10} /> {memory.cityName}
                            </span>
                          </>
                        )}
                     </div>
                     <h4 className="font-display font-bold text-xl truncate group-hover:italic transition-all">{memory.name}</h4>
                     <p className="text-sm opacity-40 group-hover:opacity-60 line-clamp-1 mt-1 font-medium">{memory.notes}</p>
                  </div>

                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {memory.isFavorite ? <Heart size={20} fill="currentColor" /> : <Landmark size={20} />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
             <div className="py-20 flex flex-col items-center justify-center text-center gap-6 opacity-20">
                <Globe size={80} strokeWidth={1} />
                <div className="space-y-2">
                  <p className="font-display text-2xl italic">Untitled Territory</p>
                  <p className="text-xs uppercase tracking-[0.2em] font-bold">No memories mapped yet</p>
                </div>
                <button 
                  onClick={() => onAddMemory(countryCode)}
                  className="mt-4 px-8 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] opacity-100 hover:scale-105 transition-transform"
                >
                  First Record
                </button>
             </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex items-center justify-center gap-4">
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-20">
             <Landmark size={12} /> {info?.region || '...'} • {info?.subregion || '...'}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
