import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Filter, Settings as SettingsIcon, User, Map as MapIcon, Calendar, Heart, Globe, Plus, X } from 'lucide-react';
import { cn } from './lib/utils';
import { VisitedLocation, UserSettings } from './types';
import { COUNTRIES } from './lib/countries';
import WorldMap from './components/WorldMap';
import Sidebar from './components/Sidebar';
import TopStats from './components/TopStats';
import LocationModal from './components/LocationModal';
import CountryDetailsModal from './components/CountryDetailsModal';

const DEFAULT_SETTINGS: UserSettings = {
  primaryColor: '#3b82f6', // blue-500
  countryShade: '#93c5fd', // blue-300
  cityShade: '#1d4ed8',    // blue-700
  username: 'Globetrotter',
  profileImage: undefined,
  darkMode: false,
};

export default function App() {
  const [visitedLocations, setVisitedLocations] = useState<VisitedLocation[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [initialNewData, setInitialNewData] = useState<Partial<VisitedLocation> | null>(null);

  // Load state from local storage for offline mode/demo
  useEffect(() => {
    const saved = localStorage.getItem('memory_atlas_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisitedLocations(parsed.locations || []);
        setSettings(parsed.settings || DEFAULT_SETTINGS);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem('memory_atlas_data', JSON.stringify({
      locations: visitedLocations,
      settings
    }));
  }, [visitedLocations, settings]);

  const countriesVisitedCount = useMemo(() => {
    const uniqueCountries = new Set(visitedLocations.map(l => l.countryCode));
    return uniqueCountries.size;
  }, [visitedLocations]);

  const citiesVisitedCount = useMemo(() => {
    return visitedLocations.filter(l => l.cityName || l.coordinates).length;
  }, [visitedLocations]);

  const percentageVisited = useMemo(() => {
    return ((countriesVisitedCount / COUNTRIES.length) * 100).toFixed(1);
  }, [countriesVisitedCount]);

  const handleAddLocation = (location: Omit<VisitedLocation, 'id'>) => {
    const newLoc: VisitedLocation = {
      ...location,
      id: Math.random().toString(36).substring(7)
    } as VisitedLocation;
    setVisitedLocations(prev => [...prev, newLoc]);
    setIsAddingNew(false);
    setInitialNewData(null);
  };

  const handleUpdateLocation = (location: VisitedLocation) => {
    setVisitedLocations(prev => prev.map(l => l.id === location.id ? location : l));
    setSelectedLocation(null);
  };

  const handleDeleteLocation = (id: string) => {
    setVisitedLocations(prev => prev.filter(l => l.id !== id));
    setSelectedLocation(null);
  };

  return (
    <div className={cn(
      "relative h-screen w-screen overflow-hidden font-sans selection:bg-black selection:text-white transition-colors duration-500",
      settings.darkMode ? "bg-slate-950 text-white selection:bg-white selection:text-black" : "bg-white text-black"
    )}>
      {/* Header Stats */}
      <TopStats 
        percentage={percentageVisited} 
        countryCount={countriesVisitedCount} 
        cityCount={citiesVisitedCount}
        totalCountries={COUNTRIES.length} 
        onMenuClick={() => setIsSidebarOpen(true)}
        darkMode={settings.darkMode}
      />

      {/* Main Map */}
      <main className="h-full w-full">
        <WorldMap 
          visitedLocations={visitedLocations} 
          settings={settings}
          onCountryClick={(code, name) => {
            setSelectedCountryCode(code);
            setSelectedCountryName(name || null);
          }}
        />
      </main>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            visitedLocations={visitedLocations}
            settings={settings}
            onUpdateSettings={setSettings}
            onImportData={(data) => {
              setVisitedLocations(data.locations);
              setSettings(data.settings);
            }}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              setIsSidebarOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Button */}
      <button 
        onClick={() => setIsAddingNew(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {selectedCountryCode && (
          <CountryDetailsModal 
            countryCode={selectedCountryCode}
            countryName={selectedCountryName || COUNTRIES.find(c => c.id === selectedCountryCode)?.name || 'Unknown'}
            memories={visitedLocations.filter(loc => loc.countryCode === selectedCountryCode)}
            onClose={() => {
              setSelectedCountryCode(null);
              setSelectedCountryName(null);
            }}
            onAddMemory={(code) => {
              setInitialNewData({
                countryCode: code,
                date: new Date().toISOString().split('T')[0]
              });
              setSelectedCountryCode(null);
              setIsAddingNew(true);
            }}
            onEditMemory={(memory) => {
              setSelectedLocation(memory);
              setSelectedCountryCode(null);
            }}
            darkMode={settings.darkMode}
          />
        )}
        {(selectedLocation || isAddingNew) && (
          <LocationModal 
            location={selectedLocation}
            initialData={initialNewData}
            isNew={isAddingNew}
            onClose={() => {
              setSelectedLocation(null);
              setIsAddingNew(false);
              setInitialNewData(null);
            }}
            onSave={isAddingNew ? handleAddLocation : handleUpdateLocation}
            onDelete={handleDeleteLocation}
            darkMode={settings.darkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
