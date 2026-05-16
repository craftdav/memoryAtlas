import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { X, Calendar, MapPin, Heart, Image as ImageIcon, Trash2, Globe, Save, Plus, Search, Loader2, User, Maximize2, GripVertical } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { VisitedLocation } from '../types';
import { COUNTRIES } from '../lib/countries';
import { cn } from '../lib/utils';

interface LocationModalProps {
  location: VisitedLocation | null;
  initialData?: Partial<VisitedLocation> | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (location: any) => void;
  onDelete?: (id: string) => void;
  darkMode?: boolean;
}

interface CityResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  population?: number;
  feature_code?: string;
}

export default function LocationModal({ location, initialData, isNew, onClose, onSave, onDelete, darkMode }: LocationModalProps) {
  const [formData, setFormData] = useState<Partial<VisitedLocation>>(
    location || initialData || {
      name: '',
      countryCode: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      images: [],
      isFavorite: false,
    }
  );

  const [citySearch, setCitySearch] = useState(location?.cityName || '');
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [countrySearch, setCountrySearch] = useState(() => {
    if (location?.countryCode) {
      return COUNTRIES.find(c => c.id === location.countryCode)?.name || '';
    }
    if (initialData?.countryCode) {
      return COUNTRIES.find(c => c.id === initialData.countryCode)?.name || '';
    }
    return '';
  });
  const [showCountryResults, setShowCountryResults] = useState(false);
  const countryContainerRef = useRef<HTMLDivElement>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isDraggingToTrash, setIsDraggingToTrash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-slide effect
  useEffect(() => {
    if (!formData.images || formData.images.length <= 1 || showGallery || fullScreenImage) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % formData.images!.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [formData.images, showGallery, fullScreenImage]);

  // Sync scroll with currentImageIndex
  useEffect(() => {
    if (scrollRef.current && !showGallery) {
      const width = scrollRef.current.offsetWidth;
      const targetScroll = currentImageIndex * width;
      // Only scroll if we are not already at the target position (with some margin)
      if (Math.abs(scrollRef.current.scrollLeft - targetScroll) > 10) {
        scrollRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentImageIndex, showGallery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    if (index !== currentImageIndex) {
      setCurrentImageIndex(index);
    }
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (countryContainerRef.current && !countryContainerRef.current.contains(event.target as Node)) {
        setShowCountryResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Countries (Alphabetical)
  const filteredCountries = useMemo(() => {
    return COUNTRIES
      .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countrySearch]);

  // Debounced city search (Alphabetical)
  useEffect(() => {
    if (citySearch.length < 3) {
      setCityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearch)}&count=15&language=en&format=json`);
        const data = await res.json();
        
        if (data.results) {
          // Sort: Capitals (PPLC) first, then others. Both groups sorted alphabetically.
          const sorted = data.results.sort((a: any, b: any) => {
            const isACapital = a.feature_code === 'PPLC';
            const isBCapital = b.feature_code === 'PPLC';
            
            if (isACapital && !isBCapital) return -1;
            if (!isACapital && isBCapital) return 1;
            
            return a.name.localeCompare(b.name);
          });
          setCityResults(sorted);
        } else {
          setCityResults([]);
        }
      } catch (err) {
        console.error("City search failed:", err);
      } finally {
        setIsSearching(false);
        setShowResults(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [citySearch]);

  const handleSelectCity = (city: CityResult) => {
    setCitySearch(city.name);
    setFormData(prev => ({
      ...prev,
      cityName: city.name,
      coordinates: [city.longitude, city.latitude]
    }));
    setShowResults(false);
  };

  const handleSelectCountry = (country: { id: string, name: string }) => {
    setCountrySearch(country.name);
    setFormData(prev => ({ ...prev, countryCode: country.id }));
    setShowCountryResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryCode) {
      alert("Please select a country");
      return;
    }
    onSave(formData);
  };

  const handleImageAdd = async () => {
    try {
      const result = await Camera.pickImages({
        quality: 90,
      });

      if (result.photos && result.photos.length > 0) {
        const newImages = result.photos.map(p => p.webPath).filter(Boolean) as string[];
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
      }
    } catch (error) {
      console.error('Error picking images:', error);
    }
  };

  const setImages = (newImages: string[]) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] mt-auto md:mt-0 transition-colors duration-500",
          darkMode ? "bg-slate-900 text-white" : "bg-white text-black"
        )}
      >
        {/* Mobile Handle */}
        <div className={cn(
          "w-12 h-1.5 rounded-full mx-auto mt-4 mb-2 md:hidden",
          darkMode ? "bg-white/20" : "bg-gray-200"
        )} />

        {/* Header Photo */}
        <div className={cn(
          "relative group h-[200px] md:h-[280px] overflow-hidden transition-colors duration-500",
          darkMode ? "bg-slate-950" : "bg-[#F7F7F7]"
        )}>
          {formData.images && formData.images.length > 0 ? (
            <div
              ref={scrollRef}
              onClick={() => setShowGallery(true)}
              onScroll={handleScroll}
              className="flex h-full overflow-x-auto no-scrollbar snap-x snap-mandatory cursor-pointer touch-pan-x"
            >
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative min-w-full h-full snap-start">
                  <img
                    src={img}
                    alt={`${formData.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                  {formData.images!.length > 1 && (
                    <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest z-30">
                      {idx + 1} / {formData.images!.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-10">
              <ImageIcon size={64} strokeWidth={1} />
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Visual Memory</p>
            </div>
          )}
          
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
             <button 
                type="button" 
                onClick={onClose}
                className={cn(
                  "w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform",
                  darkMode ? "bg-black/50 text-white" : "bg-white/90 text-black"
                )}
             >
               <X size={20} />
             </button>
             
             <button 
                type="button"
                onClick={() => setFormData(p => ({ ...p, isFavorite: !p.isFavorite }))}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105",
                  formData.isFavorite
                    ? "bg-red-500 text-white"
                    : (darkMode ? "bg-black/50 backdrop-blur text-white/40 hover:text-red-500" : "bg-white/90 backdrop-blur text-black/40 hover:text-red-500")
                )}
              >
                <Heart size={20} fill={formData.isFavorite ? "currentColor" : "none"} />
              </button>
          </div>

          <button 
            type="button"
            onClick={handleImageAdd}
            className={cn(
              "absolute bottom-6 right-6 px-5 py-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold z-20",
              darkMode ? "bg-white text-slate-900" : "bg-black text-white"
            )}
          >
            <Plus size={16} />
            Photo
          </button>
        </div>

        <div className="p-8 md:p-10 space-y-8 overflow-y-auto no-scrollbar">
          {/* Adventure Name Input - BIG */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Adventure Label</label>
            <input 
              autoFocus
              placeholder="Island Hopping / The Hidden Alley..."
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              className="font-display text-4xl md:text-5xl font-extrabold tracking-tight focus:outline-none w-full bg-transparent border-none p-0 placeholder:opacity-10"
            />
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Country Field - Searchable */}
            <div className="space-y-3 relative" ref={countryContainerRef}>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                <Globe size={14} /> Nation Visited
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                  <Globe size={18} />
                </div>
                <input 
                  required
                  type="text"
                  placeholder="Select a country..."
                  value={countrySearch}
                  onFocus={() => setShowCountryResults(true)}
                  onChange={e => {
                    setCountrySearch(e.target.value);
                    setFormData(prev => ({ ...prev, countryCode: undefined }));
                    setShowCountryResults(true);
                  }}
                  className={cn(
                    "w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:outline-none border-2 border-transparent transition-all",
                    darkMode
                      ? "bg-white/5 focus:border-white text-white"
                      : "bg-gray-50 focus:border-black text-black"
                  )}
                />

                <AnimatePresence>
                  {showCountryResults && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "absolute z-20 top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border max-h-60 overflow-y-auto no-scrollbar overscroll-contain",
                        darkMode ? "bg-slate-800 border-white/10" : "bg-white border-gray-100"
                      )}
                    >
                      {filteredCountries.length > 0 ? filteredCountries.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 transition-colors border-b last:border-none text-left",
                            darkMode
                              ? "hover:bg-white/5 border-white/5"
                              : "hover:bg-gray-50 border-gray-50"
                          )}
                        >
                          <span className="text-sm font-bold">{c.name}</span>
                          <span className="text-[9px] font-mono opacity-20">{c.id}</span>
                        </button>
                      )) : (
                        <div className="p-4 text-center text-xs opacity-40">No nation found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Date Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                <Calendar size={14} /> Timeline
              </label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className={cn(
                  "w-full p-4 rounded-2xl text-sm font-bold focus:outline-none border-2 border-transparent transition-all",
                  darkMode
                    ? "bg-white/5 focus:border-white text-white color-scheme-dark"
                    : "bg-gray-50 focus:border-black text-black"
                )}
              />
            </div>
          </div>

          {/* City Search - Unified & Optional */}
          <div className="space-y-3 relative" ref={searchContainerRef}>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
              <MapPin size={14} /> Specific City (Optional)
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </div>
              <input 
                type="text"
                placeholder="Search for a city..."
                value={citySearch}
                onFocus={() => cityResults.length > 0 && setShowResults(true)}
                onChange={e => {
                  setCitySearch(e.target.value);
                  if (e.target.value === '') {
                    setFormData(p => ({ ...p, cityName: undefined, coordinates: undefined }));
                  }
                }}
                className={cn(
                  "w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:outline-none border-2 border-transparent transition-all",
                  darkMode
                    ? "bg-white/5 focus:border-white text-white"
                    : "bg-gray-50 focus:border-black text-black"
                )}
              />
              
              <AnimatePresence>
                {showResults && cityResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "absolute z-10 top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border max-h-60 overflow-y-auto no-scrollbar overscroll-contain",
                      darkMode ? "bg-slate-800 border-white/10" : "bg-white border-gray-100"
                    )}
                  >
                    {cityResults.map((city, idx) => (
                      <button
                        key={`${city.name}-${idx}`}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 transition-colors border-b last:border-none text-left",
                          darkMode
                            ? "hover:bg-white/5 border-white/5"
                            : "hover:bg-gray-50 border-gray-50"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold">{city.name}</p>
                          <p className="text-[10px] opacity-40 uppercase tracking-wider font-mono">{city.country}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-20">
                             {city.feature_code === 'PPLC' && <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded mr-1">Capital</span>}
                             <MapPin size={12} />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">The Narrative</label>
            <textarea 
              rows={4}
              placeholder="What made this place unforgettable?"
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              className={cn(
                "w-full p-6 rounded-[2rem] text-sm font-medium focus:outline-none border-2 border-transparent transition-all resize-none leading-relaxed placeholder:opacity-20",
                darkMode
                  ? "bg-white/5 focus:border-white text-white"
                  : "bg-gray-50 focus:border-black text-black"
              )}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className={cn(
          "p-8 md:p-10 border-t flex items-center justify-between pt-6 transition-colors duration-500",
          darkMode ? "bg-slate-900 border-white/5" : "bg-white border-gray-100"
        )}>
          {!isNew && onDelete && (
            <button 
              type="button" 
              onClick={() => location && onDelete(location.id)}
              className={cn(
                "w-14 h-14 flex items-center justify-center rounded-2xl transition-all group",
                darkMode ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-500 hover:bg-red-100"
              )}
            >
              <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
          <div className={cn("flex items-center gap-4", isNew ? "w-full" : "")}>
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
            >
              Discard
            </button>
            <button 
              type="submit"
              className={cn(
                "flex-1 min-w-[200px] px-10 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]",
                darkMode
                  ? "bg-white text-slate-900 hover:bg-gray-100"
                  : "bg-black text-white hover:bg-[#1A1A1A]"
              )}
            >
              <Save size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{isNew ? 'Archive Entry' : 'Update Log'}</span>
            </button>
          </div>
        </div>
      </motion.form>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white font-display text-2xl font-black uppercase tracking-tighter">Photo Gallery</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <Reorder.Group
                axis="y"
                values={formData.images || []}
                onReorder={setImages}
                className="flex flex-col gap-4"
              >
                {formData.images?.map((img) => (
                  <GalleryItem
                    key={img}
                    img={img}
                    onOpen={() => setFullScreenImage(img)}
                    onDelete={() => setImages(formData.images!.filter(i => i !== img))}
                  />
                ))}
              </Reorder.Group>
            </div>

            <button
              onClick={handleImageAdd}
              className="mt-6 bg-white text-black font-bold uppercase tracking-widest py-6 rounded-3xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={20} /> Add New Moment
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen View */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          >
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-8 right-8 w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center z-50 hover:bg-white/20"
            >
              <X size={32} />
            </button>
            <img
              src={fullScreenImage}
              className="max-w-full max-h-full object-contain shadow-2xl"
              alt="Fullscreen"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GalleryItem({ img, onOpen, onDelete }: {
  img: string,
  onOpen: () => void,
  onDelete: () => void
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={img}
      dragControls={controls}
      dragListener={false}
      className="relative w-full aspect-video rounded-[2rem] overflow-hidden bg-white/5 flex items-center justify-center group touch-none"
    >
      <img src={img} className="w-full h-full object-cover" alt="Gallery item" />

      {/* Permanent Controls for Mobile */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 flex flex-col justify-between p-4">
        <div className="flex justify-between items-start">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Trash2 size={18} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Drag Handle - Clearer and more reliable on mobile */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center gap-3 cursor-grab active:cursor-grabbing active:bg-white/20 transition-colors"
        >
          <GripVertical size={20} className="text-white/70" />
          <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Hold to Reorder</span>
        </div>
      </div>
    </Reorder.Item>
  );
}
