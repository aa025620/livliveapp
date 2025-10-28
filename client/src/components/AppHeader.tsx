import { MapPin, Bell, Search } from "lucide-react";
import { type UserLocation } from "@shared/schema";

interface AppHeaderProps {
  location?: UserLocation;
  onLocationClick: () => void;
  notificationCount: number;
}

export function AppHeader({ location, onLocationClick, notificationCount }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-gradient-header p-4 shadow-lg glow-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onLocationClick}>
          <MapPin className="text-white text-xl drop-shadow-lg" />
          <div>
            <p className="text-white text-sm font-medium drop-shadow-sm">
              {location ? `${location.city}, ${location.state}` : "Chicago, IL"}
            </p>
            <p className="text-white/80 text-xs drop-shadow-sm">Tap to change location</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell className="text-white text-xl cursor-pointer hover:scale-110 transition-transform drop-shadow-lg" />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-urgent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse-slow glow-urgent">
                {notificationCount}
              </span>
            )}
          </div>
          <Search className="text-white text-xl cursor-pointer hover:scale-110 transition-transform drop-shadow-lg" />
        </div>
      </div>
    </header>
  );
}
