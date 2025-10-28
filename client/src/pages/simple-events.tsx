import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/EventCard";
import { type Event, categories, type CategoryId } from "@shared/schema";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "@/hooks/use-location";
import { LocationModal } from "@/components/LocationModal";
import { SearchModal } from "@/components/SearchModal";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CategoryFilter } from "@/components/CategoryFilter";

export default function SimpleEventsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>(["all"]);
  const [searchFilters, setSearchFilters] = useState({
    query: "",
    category: "",
    priceRange: "",
    dateRange: ""
  });
  const { location, updateLocation } = useLocation("simple-user-001");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: allEvents = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ["/api/events/combined", location?.latitude, location?.longitude, location?.radius, activeCategories],
    queryFn: async () => {
      // Use user's location or Dallas as fallback
      const userLat = location?.latitude ? parseFloat(location.latitude) : 32.7767;
      const userLng = location?.longitude ? parseFloat(location.longitude) : -96.7970;
      const radius = location?.radius?.toString() || '50';
      
      const params = new URLSearchParams({
        userLatitude: userLat.toString(),
        userLongitude: userLng.toString(),
        radius: radius
      });
      
      // Add category filtering if not "all"
      if (activeCategories.length > 0 && !activeCategories.includes('all')) {
        params.append('categories', activeCategories.join(','));
      }
      
      const response = await fetch(`/api/events/combined?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch live events");
      }
      return response.json();
    },
  });

  // Category counts for display
  const categoryCounts = {
    all: allEvents.length,
    entertainment: allEvents.filter(e => e.category === 'entertainment').length,
    sports: allEvents.filter(e => e.category === 'sports').length,
    arts: allEvents.filter(e => e.category === 'arts').length,
    community: allEvents.filter(e => e.category === 'community').length,
    government: allEvents.filter(e => e.category === 'government').length,
  };
  
  const handleCategoryChange = (categories: CategoryId[]) => {
    setActiveCategories(categories);
    // Also update searchFilters for consistency
    setSearchFilters(prev => ({
      ...prev,
      category: categories.includes('all') ? '' : categories[0] || ''
    }));
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchFilters.query) count++;
    if (searchFilters.category) count++;
    if (searchFilters.priceRange) count++;
    if (searchFilters.dateRange) count++;
    return count;
  };

  // Apply search filters to the events
  const events = allEvents.filter((event) => {
    // Search query filter
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      const matchesQuery = 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.address?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    // Category filter
    if (searchFilters.category) {
      const eventCategory = event.category?.toLowerCase() || '';
      const filterCategory = searchFilters.category.toLowerCase();
      if (eventCategory !== filterCategory) return false;
    }

    // Price range filter
    if (searchFilters.priceRange) {
      const price = typeof event.price === 'string' ? parseFloat(event.price) || 0 : (event.price || 0);
      switch (searchFilters.priceRange) {
        case 'free':
          if (price > 0) return false;
          break;
        case '0-50':
          if (price < 0 || price > 50) return false;
          break;
        case '50-100':
          if (price < 50 || price > 100) return false;
          break;
        case '100-200':
          if (price < 100 || price > 200) return false;
          break;
        case '200+':
          if (price < 200) return false;
          break;
      }
    }

    // Date range filter
    if (searchFilters.dateRange) {
      const eventDate = new Date(event.date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      switch (searchFilters.dateRange) {
        case 'today':
          if (eventDate < today || eventDate >= tomorrow) return false;
          break;
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
          if (eventDate < tomorrow || eventDate >= dayAfterTomorrow) return false;
          break;
        case 'this-week':
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
          endOfWeek.setHours(23, 59, 59, 999); // End of Saturday
          if (eventDate < today || eventDate > endOfWeek) return false;
          break;
        case 'this-weekend':
          const saturday = new Date(today);
          saturday.setDate(today.getDate() + (6 - today.getDay()));
          const sunday = new Date(saturday);
          sunday.setDate(saturday.getDate() + 1);
          const mondayAfter = new Date(sunday);
          mondayAfter.setDate(sunday.getDate() + 1);
          if (eventDate < saturday || eventDate >= mondayAfter) return false;
          break;
        case 'next-week':
          const nextMonday = new Date(today);
          // Calculate days until next Monday (1 = Monday)
          const daysUntilNextMonday = today.getDay() === 0 ? 1 : (8 - today.getDay());
          nextMonday.setDate(today.getDate() + daysUntilNextMonday);
          const nextSunday = new Date(nextMonday);
          nextSunday.setDate(nextMonday.getDate() + 6);
          nextSunday.setHours(23, 59, 59, 999); // End of Sunday
          if (eventDate < nextMonday || eventDate > nextSunday) return false;
          break;
        case 'this-month':
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999); // End of last day of month
          if (eventDate < today || eventDate > endOfMonth) return false;
          break;
      }
    }

    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      // Scroll to top after refresh
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Show spinner for at least 1 second
    }
  };

  // Pull-to-refresh functionality
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setCurrentY(touch.clientY);
    
    // Only trigger pull-to-refresh if we're at the top and pulling down
    const element = e.currentTarget as HTMLElement;
    if (element.scrollTop === 0 && touch.clientY > startY + 50) {
      setIsPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && currentY > startY + 100) {
      handleRefresh();
    }
    setIsPulling(false);
    setStartY(0);
    setCurrentY(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-white">Loading live events...</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black safe-area-top overflow-hidden relative">
      
      {/* Category Filter */}
      <CategoryFilter
        activeCategories={activeCategories}
        onCategoryChange={handleCategoryChange}
        categoryCounts={categoryCounts}
        onAdvancedFiltersClick={() => setIsSearchModalOpen(true)}
        onSearchClick={() => setIsSearchModalOpen(true)}
        activeFiltersCount={getActiveFiltersCount()}
        location={location ? { city: location.city, state: location.state } : undefined}
        onLocationClick={() => setIsLocationModalOpen(true)}
      />

      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-4">
          <div className="bg-black/70 backdrop-blur rounded-full px-4 py-2 text-white text-sm">
            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
            Release to refresh
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">No live events available</p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="bg-transparent border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              data-testid="button-refresh-no-events"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Live Events
            </Button>
          </div>
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide smooth-scroll pb-24"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onShare={() => {
                if (navigator.share) {
                  navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(
                    `${event.title}\n${event.description}\n${window.location.href}`
                  );
                }
              }}
              onVenueClick={(venueName) => console.log('Venue:', venueName)}
            />
          ))}
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={(locationData) => {
          updateLocation(locationData);
          setIsLocationModalOpen(false);
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onApplyFilters={(filters) => {
          setSearchFilters(filters);
          setIsSearchModalOpen(false);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab=""
        onLocationClick={() => setIsLocationModalOpen(true)}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onRefreshClick={handleRefresh}
      />
    </div>
  );
}