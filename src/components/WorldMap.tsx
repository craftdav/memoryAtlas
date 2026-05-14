import React, { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { VisitedLocation, UserSettings } from '../types';
import { COUNTRIES } from '../lib/countries';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface WorldMapProps {
  visitedLocations: VisitedLocation[];
  settings: UserSettings;
  onCountryClick: (countryCode: string, countryName?: string) => void;
}

export default function WorldMap({ visitedLocations, settings, onCountryClick }: WorldMapProps) {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visitedCountryCodes = useMemo(() => {
    return new Set(
      visitedLocations
        .map(loc => loc.countryCode)
    );
  }, [visitedLocations]);

  const countryCodeToOfficialName = useMemo(() => {
    const map = new Map<string, string>();
    COUNTRIES.forEach(c => map.set(c.id, c.name.toLowerCase()));
    return map;
  }, []);

  const locationMarkers = useMemo(() => {
    return visitedLocations.filter(loc => loc.coordinates);
  }, [visitedLocations]);

  return (
    <div className="h-full w-full bg-white flex items-center justify-center">
      <ComposableMap 
        projectionConfig={{ scale: isMobile ? 140 : 180 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup 
          center={isMobile ? [15, 15] : [20, 0]} 
          zoom={isMobile ? 3 : 1} 
          minZoom={1} 
          maxZoom={100}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName = (geo.properties?.name || geo.properties?.NAME || "").toLowerCase();
                const geoId = geo.id; // Could be Alpha-3 or Numeric
                
                // Matches if any visited country's Alpha-3 OR official name matches the geometry
                const isVisited = Array.from(visitedCountryCodes).some(code => {
                  if (!code) return false;
                  const officialName = countryCodeToOfficialName.get(code);
                  return code === geoId || officialName === geoName;
                });
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      // Find the best code for this geography
                      const countryData = COUNTRIES.find(c => 
                        c.id === geoId || c.name.toLowerCase() === geoName
                      );
                      const finalCode = countryData?.id || geoId;
                      const finalName = countryData?.name || geo.properties?.name || geo.properties?.NAME || "Unknown Country";

                      if (finalCode) {
                        onCountryClick(finalCode, finalName);
                      }
                    }}
                    style={{
                      default: {
                        fill: isVisited ? settings.countryShade : "#FAFAFA",
                        stroke: "#E5E7EB",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: isVisited ? settings.countryShade : "#F3F4F6",
                        stroke: "#9CA3AF",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: "pointer"
                      },
                      pressed: {
                        fill: settings.countryShade,
                        stroke: "#4B5563",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {locationMarkers.map((loc) => (
            <Marker 
              key={loc.id} 
              coordinates={loc.coordinates || [0, 0]}
            >
              <g className="pointer-events-none">
                {/* Visual marker */}
                <circle 
                  r={1.2} 
                  fill={settings.cityShade} 
                  stroke="#fff" 
                  strokeWidth={0.2}
                  className="origin-center"
                />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
