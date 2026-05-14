import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, User, X, ChevronRight, Heart, Calendar, Globe, Plus, Pencil, Image as ImageIcon, Check, Download, Upload, Moon, Sun } from 'lucide-react';
import { VisitedLocation, UserSettings } from '../types';
import { COUNTRIES } from '../lib/countries';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  visitedLocations: VisitedLocation[];
  onSelectLocation: (location: VisitedLocation) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onImportData: (data: { locations: VisitedLocation[], settings: UserSettings }) => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  visitedLocations, 
  onSelectLocation,
  settings,
  onUpdateSettings,
  onImportData
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'settings' | 'profile' | null>('timeline');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUsername, setTempUsername] = useState(settings.username || '');

  // Sync temp username when editing starts
  React.useEffect(() => {
    if (isEditingProfile) {
      setTempUsername(settings.username || '');
    }
  }, [isEditingProfile, settings.username]);

  const countriesVisitedCount = useMemo(() => {
    const uniqueCountries = new Set(visitedLocations.map(l => l.countryCode));
    return uniqueCountries.size;
  }, [visitedLocations]);

  const citiesCount = useMemo(() => {
    return visitedLocations.filter(l => l.cityName).length;
  }, [visitedLocations]);

  const worldPercentage = useMemo(() => {
    return ((countriesVisitedCount / COUNTRIES.length) * 100).toFixed(1);
  }, [countriesVisitedCount]);

  const timelineItems = useMemo(() => {
    return [...visitedLocations]
      .filter(l => l.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visitedLocations]);

  const colorOptions = [
    { name: 'Classic Blue', primary: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8' },
    { name: 'Royal Purple', primary: '#8b5cf6', light: '#c4b5fd', dark: '#6d28d9' },
    { name: 'Emerald', primary: '#10b981', light: '#6ee7b7', dark: '#047857' },
    { name: 'Sunset', primary: '#f97316', light: '#fdba74', dark: '#c2410c' },
    { name: 'Midnight', primary: '#334155', light: '#94a3b8', dark: '#0f172a' },
  ];

  const handleExport = () => {
    const data = JSON.stringify({ locations: visitedLocations, settings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory_atlas_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.locations && parsed.settings) {
          onImportData(parsed);
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        console.error('Failed to import data:', err);
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const menuItems = [
    { id: 'timeline', icon: Calendar, label: 'Logs' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "fixed inset-y-0 left-0 w-full md:w-[420px] z-50 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col transition-colors duration-300",
        settings.darkMode ? "bg-slate-900 text-white" : "bg-white text-black"
      )}
    >
      {/* Header */}
      <div className="pt-10 pb-6 px-8 flex items-center justify-between">
        <h2 className="font-display text-4xl font-extrabold tracking-tighter">Memory Atlas</h2>
        <button onClick={onClose} className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full transition-colors group",
          settings.darkMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
        )}>
          <X size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Vertical Menu Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4">
        {menuItems.map((item) => (
          <div key={item.id} className="space-y-2">
            <button
              onClick={() => setActiveTab(activeTab === item.id ? null : item.id)}
              className={cn(
                "w-full flex items-center justify-between p-6 rounded-3xl transition-all",
                activeTab === item.id 
                  ? (settings.darkMode ? "bg-white text-slate-950 shadow-xl scale-[1.02]" : "bg-black text-white shadow-xl scale-[1.02]")
                  : (settings.darkMode ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-50 text-black/60 hover:bg-gray-100")
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon size={22} strokeWidth={2.5} />
                <span className="text-lg font-black uppercase tracking-widest">{item.label}</span>
              </div>
              <motion.div
                animate={{ rotate: activeTab === item.id ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronRight size={20} className={activeTab === item.id ? "opacity-100" : "opacity-20"} />
              </motion.div>
            </button>

            <AnimatePresence>
              {activeTab === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-2">
                    {/* TIMELINE SUB-MENU */}
                    {item.id === 'timeline' && (
                      <div className="space-y-4 py-4 relative ml-4 before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                        {timelineItems.length > 0 ? timelineItems.map((item) => (
                          <button 
                            key={item.id} 
                            onClick={() => onSelectLocation(item)}
                            className="relative pl-8 w-full text-left group"
                          >
                            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-black group-hover:bg-black transition-all" />
                            <div className={cn(
                              "p-5 rounded-3xl transition-all border border-transparent shadow-sm",
                              settings.darkMode
                                ? "bg-white/5 group-hover:bg-white group-hover:text-slate-900"
                                : "bg-gray-50 group-hover:bg-black group-hover:text-white"
                            )}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mb-1 group-hover:opacity-60">
                                    {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </p>
                                  <h4 className="font-display text-xl font-extrabold tracking-tight">{item.name || 'Untitled Adventure'}</h4>
                                </div>
                                {item.isFavorite && <Heart size={16} className="text-red-500 fill-current mt-1" />}
                              </div>
                              {item.notes && <p className="text-xs font-medium line-clamp-2 mt-2 leading-relaxed opacity-60">{item.notes}</p>}
                            </div>
                          </button>
                        )) : (
                          <div className="py-10 text-center space-y-4">
                            <Plus className="opacity-10 mx-auto" size={40} />
                            <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Map your first adventure</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SETTINGS SUB-MENU */}
                    {item.id === 'settings' && (
                      <div className="space-y-8 py-6">
                        <section>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">
                            <Moon size={12} /> Mode Shift
                          </div>
                          <button
                            onClick={() => onUpdateSettings({ ...settings, darkMode: !settings.darkMode })}
                            className={cn(
                              "w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all",
                              settings.darkMode
                                ? "border-white/20 bg-white/5"
                                : "border-transparent bg-gray-50 hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                                settings.darkMode ? "bg-white text-slate-900" : "bg-black text-white"
                              )}>
                                {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                              </div>
                              <span className="text-base font-bold tracking-tight">
                                {settings.darkMode ? 'Luminous Day' : 'Shadow Night'}
                              </span>
                            </div>
                            <div className={cn(
                              "w-12 h-6 rounded-full relative transition-colors duration-300",
                              settings.darkMode ? "bg-blue-500" : "bg-gray-300"
                            )}>
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                                settings.darkMode ? "left-7" : "left-1"
                              )} />
                            </div>
                          </button>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">
                            <Globe size={12} /> Visual Universe
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {colorOptions.map(option => (
                              <button
                                key={option.name}
                                onClick={() => onUpdateSettings({
                                  ...settings,
                                  primaryColor: option.primary,
                                  countryShade: option.light,
                                  cityShade: option.dark
                                })}
                                className={cn(
                                  "flex items-center p-5 rounded-3xl border-2 transition-all",
                                  settings.primaryColor === option.primary 
                                    ? (settings.darkMode ? "border-white bg-white/10" : "border-black bg-black/5 shadow-inner")
                                    : (settings.darkMode ? "border-transparent bg-white/5 hover:bg-white/10" : "border-transparent bg-gray-50 hover:bg-gray-100")
                                )}
                              >
                                <div className="flex -space-x-2 mr-6 scale-110">
                                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-xl" style={{ backgroundColor: option.light }} />
                                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-xl" style={{ backgroundColor: option.dark }} />
                                </div>
                                <span className={cn("text-base font-bold tracking-tight", settings.primaryColor === option.primary ? "italic" : "")}>
                                  {option.name}
                                </span>
                                {settings.primaryColor === option.primary && (
                                  <div className={cn("ml-auto w-2 h-2 rounded-full animate-pulse", settings.darkMode ? "bg-white" : "bg-black")} />
                                )}
                              </button>
                            ))}
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6">
                            <Download size={12} /> Data Mastery
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={handleExport}
                              className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-3xl transition-all group",
                                settings.darkMode ? "bg-white/5 hover:bg-white hover:text-slate-900" : "bg-gray-50 hover:bg-black hover:text-white"
                              )}
                            >
                              <Download size={24} className="mb-2 opacity-40 group-hover:opacity-100" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                            </button>
                            <label className={cn(
                              "flex flex-col items-center justify-center p-6 rounded-3xl transition-all group cursor-pointer",
                              settings.darkMode ? "bg-white/5 hover:bg-white hover:text-slate-900" : "bg-gray-50 hover:bg-black hover:text-white"
                            )}>
                              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                              <Upload size={24} className="mb-2 opacity-40 group-hover:opacity-100" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Import</span>
                            </label>
                          </div>
                        </section>
                      </div>
                    )}

                    {/* PROFILE SUB-MENU */}
                    {item.id === 'profile' && (
                      <div className={cn(
                        "flex flex-col items-center text-center space-y-8 py-10 rounded-[3rem] mt-4 relative transition-colors duration-500",
                        settings.darkMode ? "bg-white/5" : "bg-gray-50"
                      )}>
                        {/* Edit Button - Bottom Left, moved even lower */}
                        <div className="absolute bottom-2 left-6 z-10">
                          <button
                            onClick={() => {
                              if (isEditingProfile) {
                                onUpdateSettings({ ...settings, username: tempUsername });
                              }
                              setIsEditingProfile(!isEditingProfile);
                            }}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95",
                              isEditingProfile
                                ? (settings.darkMode ? "bg-white text-slate-900" : "bg-black text-white")
                                : (settings.darkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-black hover:bg-gray-100")
                            )}
                          >
                            {isEditingProfile ? <Check size={14} /> : <Pencil size={14} />}
                          </button>
                        </div>

                        <div className="relative group">
                          {isEditingProfile ? (
                            <label className="cursor-pointer">
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      onUpdateSettings({ ...settings, profileImage: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <div className={cn(
                                "w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 shadow-2xl overflow-hidden relative transition-colors duration-500",
                                settings.darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-white"
                              )}>
                                {settings.profileImage ? (
                                  <img src={settings.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <User size={64} className="opacity-10" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon size={24} className="text-white" />
                                </div>
                              </div>
                            </label>
                          ) : (
                            <div className={cn(
                                "w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 shadow-2xl overflow-hidden transition-colors duration-500",
                                settings.darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-white"
                              )}>
                              {settings.profileImage ? (
                                <img src={settings.profileImage} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <User size={64} className="opacity-10" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="px-6 w-full">
                          {isEditingProfile ? (
                            <input 
                              type="text"
                              value={tempUsername}
                              onChange={(e) => setTempUsername(e.target.value)}
                              className={cn(
                                "w-full text-center font-display text-4xl font-extrabold tracking-tighter bg-transparent border-b-2 outline-none pb-1",
                                settings.darkMode ? "border-white/10 focus:border-white" : "border-black/10 focus:border-black"
                              )}
                              autoFocus
                            />
                          ) : (
                            <h3 className="font-display text-4xl font-extrabold tracking-tighter">
                              {settings.username || 'Globetrotter'}
                            </h3>
                          )}
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">Personal Travel Index</p>
                        </div>
                        
                        <div className="w-full grid grid-cols-2 gap-3 px-6 pb-12">
                          {[
                            { label: 'Memories', value: visitedLocations.length },
                            { label: 'Nations', value: countriesVisitedCount },
                            { label: 'Cities', value: citiesCount },
                            { label: 'World Cover', value: `${worldPercentage}%` }
                          ].map((stat) => (
                            <div key={stat.label} className={cn(
                              "p-4 rounded-3xl shadow-sm text-left group transition-colors duration-500",
                              settings.darkMode ? "bg-slate-800" : "bg-white"
                            )}>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-20 group-hover:opacity-100 transition-opacity">{stat.label}</p>
                              <p className="text-2xl font-display font-extrabold mt-1 tracking-tighter">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}


