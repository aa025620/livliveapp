import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EventCard } from "@/components/EventCard";
import { BottomNavigation } from "@/components/BottomNavigation";
import { LocationModal } from "@/components/LocationModal";
import { AdvancedFiltersModal } from "@/components/AdvancedFiltersModal";
import { VenueModal } from "@/components/VenueModal";
import { CitySelector } from "@/components/CitySelector";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "@/hooks/use-location";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { type Event, type CategoryId, type EventFilters, defaultFilters } from "@shared/schema";
import { MapPin, Zap } from "lucide-react";

export default function EventsPage() {
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>(["all"]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<{
    name: string;
    address?: string;
    venueUrl?: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  // Removed data source selector - now using combined endpoint
  const { user } = useAuth();
  const { location, updateLocation } = useLocation(user?.id || "simple-user-001");
  const { toast } = useToast();
  const userId = user?.id || "simple-user-001";
  const queryClient = useQueryClient();

  // Auto-detect location on first visit if no location is set
  useEffect(() => {
    if ((user?.id || "simple-user-001") && !location) {
      // Attempt automatic location detection
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              
              // Try to reverse geocode the coordinates
              const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              if (response.ok) {
                const data = await response.json();
                const locationData = {
                  city: data.city || data.locality || "Current Location",
                  state: data.principalSubdivisionCode || data.countryCode || "",
                  latitude,
                  longitude,
                };
                
                updateLocation(locationData);
                toast({
                  title: "Location detected!",
                  description: `Found events near ${locationData.city}`,
                });
              }
            } catch (error) {
              console.error("Auto-location detection failed:", error);
            }
          },
          (error) => {
            console.log("User denied location or geolocation failed", error);
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      }
    }
  }, [user?.id || "simple-user-001", location, updateLocation, toast]);

  const { data: allEvents = [], isLoading, refetch: refetchEvents } = useQuery<Event[]>({
    queryKey: ["/api/events/combined", activeCategories, filters, location],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Handle categories
      if (activeCategories.length > 0 && !activeCategories.includes("all")) {
        params.append("categories", activeCategories.join(","));
      }
      
      // Handle ticket providers
      if (filters.ticketProviders.length > 0) {
        params.append("ticketProviders", filters.ticketProviders.join(","));
      }
      
      // Handle location-based filtering
      if (location?.latitude && location?.longitude) {
        params.append("userLatitude", location.latitude.toString());
        params.append("userLongitude", location.longitude.toString());
        params.append("radius", (filters.radius || 50).toString());
      }
      
      // Handle other filters
      if (filters.priceRange.min !== undefined) params.append("minPrice", filters.priceRange.min.toString());
      if (filters.priceRange.max !== undefined) params.append("maxPrice", filters.priceRange.max.toString());
      if (filters.dateRange.start) params.append("startDate", filters.dateRange.start.toISOString());
      if (filters.dateRange.end) params.append("endDate", filters.dateRange.end.toISOString());
      if (filters.showOnlyFree) params.append("showOnlyFree", "true");
      if (filters.showOnlyToday) params.append("showOnlyToday", "true");
      if (filters.showOnlyWeekend) params.append("showOnlyWeekend", "true");
      if (filters.radius) params.append("radius", filters.radius.toString());
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      
      const queryString = params.toString();
      const response = await fetch(`/api/events/combined${queryString ? `?${queryString}` : ""}`);
      if (!response.ok) {
        throw new Error("Failed to fetch combined events");
      }
      return response.json();
    },
  });

  // Use combined events directly (filtering happens server-side)
  const events = allEvents;

  const { data: categoryCounts = {}, refetch: refetchCategoryCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/categories/counts/combined", allEvents],
    queryFn: async () => {
      // Calculate counts client-side from combined events
      const counts: Record<string, number> = {
        all: allEvents.length,
        entertainment: 0,
        sports: 0,
        arts: 0,
        community: 0,
        government: 0,
      };
      
      allEvents.forEach(event => {
        if (counts[event.category] !== undefined) {
          counts[event.category]++;
        }
      });
      
      return counts;
    },
    enabled: allEvents.length > 0,
  });

  const handleCategoryChange = (categories: CategoryId[]) => {
    setActiveCategories(categories);
    setFilters(prev => ({ ...prev, categories }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (!filters.categories.includes('all')) count++; // Single category selection
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.timeRange.start || filters.timeRange.end) count++;
    if (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) count++;
    if (filters.radius !== undefined) count++;
    if (filters.showOnlyFree) count++;
    if (filters.showOnlyToday) count++;
    if (filters.showOnlyWeekend) count++;
    return count;
  };

  const handleLocationChange = (newLocation: { city: string; state: string; zipCode?: string; latitude?: number; longitude?: number }) => {
    updateLocation(newLocation);
    setIsLocationModalOpen(false);
    refetchEvents();
    
    // Show success toast
    toast({
      title: "Location updated",
      description: `Now showing events near ${newLocation.city}, ${newLocation.state}`,
      duration: 3000,
    });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Refresh the database with new events
      await fetch("/api/database/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      // Clear ALL query caches completely
      queryClient.clear();
      
      // Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch data
      await Promise.all([
        refetchEvents(),
        refetchCategoryCounts(),
      ]);
      
      setIsRefreshing(false);
    } catch (error) {
      console.error("Failed to refresh events:", error);
      setIsRefreshing(false);
    }
  };

  const handleSearch = () => {
    // Implement simple search by opening advanced filters
    setIsAdvancedFiltersOpen(true);
  };

  const handleNotifications = () => {
    // TODO: Implement notifications panel
    console.log("Notifications clicked");
  };


  const handleShare = (event: Event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleVenueClick = (venueName: string, venueAddress?: string, venueUrl?: string, latitude?: number, longitude?: number) => {
    setSelectedVenue({
      name: venueName,
      address: venueAddress,
      venueUrl,
      latitude,
      longitude,
    });
    setIsVenueModalOpen(true);
  };

  useEffect(() => {
    // Pull to refresh functionality
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100 && window.scrollY === 0) {
        handleRefresh();
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    // Intersection observer for card blur effect
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardContainer = entry.target as HTMLElement;
          const blurOverlay = cardContainer.querySelector('.blur-overlay') as HTMLElement;
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            cardContainer.classList.add('active');
            if (blurOverlay) {
              blurOverlay.style.opacity = '0';
            }
          } else {
            cardContainer.classList.remove('active');
            if (blurOverlay) {
              blurOverlay.style.opacity = '1';
            }
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '-130px 0px -88px 0px' // Account for top and bottom navigation
      }
    );

    // Small delay to ensure DOM is ready after refresh
    const timeoutId = setTimeout(() => {
      const cardContainers = document.querySelectorAll('.card-container');
      cardContainers.forEach((container) => observer.observe(container));
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      const cardContainers = document.querySelectorAll('.card-container');
      cardContainers.forEach((container) => observer.unobserve(container));
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <CategoryFilter
        activeCategories={activeCategories}
        onCategoryChange={handleCategoryChange}
        categoryCounts={categoryCounts}
        onAdvancedFiltersClick={() => setIsAdvancedFiltersOpen(true)}
        onSearchClick={handleSearch}
        activeFiltersCount={getActiveFiltersCount()}
        location={location}
        onLocationClick={() => setIsLocationModalOpen(true)}
      />

      <main className="overflow-y-auto snap-y snap-mandatory tiktok-scroll relative" style={{height: '100vh'}}>
        {isLoading || isRefreshing ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">
              {isRefreshing ? "Refreshing events..." : "Loading events..."}
            </span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center h-full flex items-center justify-center">
            <p className="text-muted-foreground">No events found for this category.</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div key={`${event.id}-${index}`} className="snap-start snap-always relative card-container" style={{height: '100vh'}}>
              <div className="absolute inset-0 px-4" style={{paddingTop: '130px', paddingBottom: '88px'}}>
                <div className="w-full h-full flex items-center justify-center">
                  <EventCard
                    event={event}
                    onShare={() => handleShare(event)}
                    onVenueClick={handleVenueClick}
                  />
                </div>
              </div>
              {/* Blur overlay for non-active cards */}
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-100 transition-opacity duration-300 pointer-events-none blur-overlay" />
            </div>
          ))
        )}
      </main>

      <BottomNavigation 
        activeTab="events" 
        onLocationClick={() => {
          // Try automatic location detection first
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                try {
                  const { latitude, longitude } = position.coords;
                  
                  // Try to reverse geocode
                  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                  if (response.ok) {
                    const data = await response.json();
                    const locationData = {
                      city: data.city || data.locality || "Current Location",
                      state: data.principalSubdivisionCode || data.countryCode || "",
                      latitude,
                      longitude,
                    };
                    
                    updateLocation(locationData);
                    toast({
                      title: "Location updated!",
                      description: `Updated to ${locationData.city}`,
                    });
                  } else {
                    // Fallback to manual selection
                    setIsLocationModalOpen(true);
                  }
                } catch (error) {
                  console.error("Location detection failed:", error);
                  setIsLocationModalOpen(true);
                }
              },
              (error) => {
                console.log("Location access denied, opening manual selector", error);
                setIsLocationModalOpen(true);
              },
              { timeout: 10000, enableHighAccuracy: true }
            );
          } else {
            setIsLocationModalOpen(true);
          }
        }}
        onSearchClick={handleSearch}
        onNotificationClick={handleNotifications}
        onRefreshClick={handleRefresh}
        notificationCount={3}
      />

      
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={handleLocationChange}
      />
      
      <AdvancedFiltersModal
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={() => refetchEvents()}
      />

      {selectedVenue && (
        <VenueModal
          isOpen={isVenueModalOpen}
          onClose={() => {
            setIsVenueModalOpen(false);
            setSelectedVenue(null);
          }}
          venueName={selectedVenue.name}
          venueAddress={selectedVenue.address}
          venueUrl={selectedVenue.venueUrl}
          latitude={selectedVenue.latitude}
          longitude={selectedVenue.longitude}
          onEventShare={(eventId) => {
            const event = events.find(e => e.id === eventId);
            if (event) handleShare(event);
          }}
        />
      )}
    </div>
  );
}
