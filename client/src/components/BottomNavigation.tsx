import { Calendar, Search, User, Navigation, RefreshCw, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface BottomNavigationProps {
  activeTab: string;
  onLocationClick?: () => void;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onRefreshClick?: () => void;
  notificationCount?: number;
}

export function BottomNavigation({ activeTab, onLocationClick, onSearchClick, onNotificationClick, onRefreshClick, notificationCount = 0 }: BottomNavigationProps) {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLocationClick = () => {
    // Simply call the parent's location handler to open the location modal
    if (onLocationClick) {
      onLocationClick();
    }
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      // Call parent's refresh handler if provided
      if (onRefreshClick) {
        await onRefreshClick();
      } else {
        // Fallback to page refresh if no handler provided
        window.location.reload();
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 5 items with refresh in true center (3rd position)
  const navItems = [
    { id: 'location', label: 'Location', icon: Navigation, action: handleLocationClick },
    { id: 'notifications', label: 'Alerts', icon: Bell, action: onNotificationClick, badge: notificationCount },
    { id: 'refresh', label: 'Refresh', icon: RefreshCw, action: handleRefreshClick, isSpinning: isRefreshing, isCenter: true },
    { id: 'search', label: 'Search', icon: Search, action: onSearchClick },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ] as Array<{
    id: string;
    label: string;
    icon: any;
    path?: string;
    action?: () => void;
    badge?: number;
    isSpinning?: boolean;
    isCenter?: boolean;
  }>;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl px-2 sm:px-3 py-2 sm:py-3">
        <div className="grid grid-cols-5 items-center gap-x-1 sm:gap-x-2 overflow-x-auto scrollbar-hide sm:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenter = item.isCenter;
            
            return (
              <button
                key={item.id}
                onClick={() => item.action ? item.action() : (item.path && setLocation(item.path))}
                className={`relative flex items-center justify-center touch-manipulation transition-all duration-200 hover:scale-105 ${
                  isCenter 
                    ? 'min-w-[52px] min-h-[52px] px-3 py-3 text-primary drop-shadow-lg bg-primary/15 rounded-full border border-primary/30 col-span-1 mx-1' 
                    : 'min-w-[44px] min-h-[44px] px-[clamp(6px,1.5vw,10px)] py-[clamp(6px,1.5vw,10px)] col-span-1'
                } ${
                  isActive && !isCenter
                    ? 'text-primary drop-shadow-lg' 
                    : !isCenter ? 'text-white/80 hover:text-white hover:bg-white/10 rounded-xl' : ''
                }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon className={`${
                  isCenter 
                    ? 'h-7 w-7 glow-primary' 
                    : 'h-[clamp(20px,5.5vw,28px)] w-[clamp(20px,5.5vw,28px)]'
                } ${isActive && !isCenter ? 'glow-primary' : ''} ${item.isSpinning ? 'animate-spin' : ''}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 translate-x-1/4 -translate-y-1/4 bg-gradient-urgent text-white text-[9px] sm:text-xs rounded-full w-[16px] h-[16px] sm:w-5 sm:h-5 flex items-center justify-center animate-pulse-slow glow-urgent">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
