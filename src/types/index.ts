export interface UserSettings {
  primaryColor: string;
  countryShade: string; // Lighter shade
  cityShade: string;    // Darker shade
  username?: string;
  profileImage?: string;
  darkMode: boolean;
}

export interface VisitedLocation {
  id: string;
  name: string; // The Adventure name
  countryCode: string; // ISO Alpha-3 for countries
  cityName?: string; // Optional city name
  coordinates?: [number, number]; // [longitude, latitude] for cities
  date: string;
  notes: string;
  images: string[];
  isFavorite: boolean;
}

export interface AppState {
  visitedLocations: VisitedLocation[];
  settings: UserSettings;
}
