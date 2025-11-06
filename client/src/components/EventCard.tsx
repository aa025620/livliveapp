import { Calendar, MapPin, Users, Clock, Share2, ExternalLink, Ticket, CalendarPlus, Map, Eye } from "lucide-react";
import { type Event } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: Event;
  onShare: () => void;
  onVenueClick?: (venueName: string, venueAddress?: string, venueUrl?: string, latitude?: number, longitude?: number) => void;
}

export function EventCard({ event, onShare, onVenueClick }: EventCardProps) {
  // Function to get high-quality image URLs
  const getHighQualityImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) {
      // High-quality fallback image for mobile screens (1080x1920 - typical phone ratio)
      return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=90";
    }

    // Handle Ticketmaster images - request higher resolution
    if (imageUrl.includes('ticketmaster') || imageUrl.includes('livenation')) {
      // Try to replace small image dimensions with larger ones
      return imageUrl
        .replace(/(\d+)x(\d+)/, '1080x1920')  // Replace dimensions
        .replace(/w_\d+/, 'w_1080')           // Replace width parameter
        .replace(/h_\d+/, 'h_1920')           // Replace height parameter
        .replace(/c_thumb/, 'c_fill')         // Change crop mode for better quality
        .replace(/q_\d+/, 'q_90');            // Increase quality to 90%
    }

    // Handle Unsplash images - ensure high quality parameters
    if (imageUrl.includes('unsplash')) {
      const url = new URL(imageUrl);
      url.searchParams.set('w', '1080');
      url.searchParams.set('h', '1920');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', '90');
      url.searchParams.set('auto', 'format');
      return url.toString();
    }

    // For other image sources, try to append quality parameters if it's a URL
    try {
      const url = new URL(imageUrl);
      // Add quality parameters if the service supports them
      if (!url.searchParams.has('q') && !url.searchParams.has('quality')) {
        url.searchParams.set('q', '90');
      }
      return url.toString();
    } catch {
      // If not a valid URL, return as-is
      return imageUrl;
    }
  };
  const getCategoryColor = (category: string) => {
    const colors = {
      entertainment: 'category-entertainment',
      government: 'category-government',
      sports: 'category-sports',
      arts: 'category-arts',
      community: 'category-community',
    };
    return colors[category as keyof typeof colors] || 'bg-muted';
  };

  const getTimeUntilEvent = (date: string | Date) => {
    const eventDate = new Date(date);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    // If event is in the past but less than 24 hours, show as "Now"
    if (diff < 0 && diff > -24 * 60 * 60 * 1000) return "Now";
    if (diff < 0) return "Past";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatEventDate = (date: string | Date, time?: string) => {
    const eventDate = new Date(date);
    const now = new Date();
    const isToday = eventDate.toDateString() === now.toDateString();
    const isTomorrow = eventDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    // Use the pre-calculated time from backend to avoid timezone conversion issues
    if (isToday) return `Today, ${time || '8:00 PM'}`;
    if (isTomorrow) return `Tomorrow, ${time || '8:00 PM'}`;
    
    return eventDate.toLocaleDateString([], { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }) + `, ${time || '8:00 PM'}`;
  };

  return (
    <div className="w-full h-screen bg-black snap-start flex flex-col">
      <div className="relative flex-1">
        <img 
          src={getHighQualityImageUrl(event.imageUrl)} 
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover bg-black/5"
          style={{ imageRendering: 'optimizeQuality' as any }}
        />
        
        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pb-6 pt-16 safe-area-bottom z-40">
          <div className="px-6 pb-28">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">{event.title}</h3>
              <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{event.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <button 
                    onClick={() => {
                      // First try venue URL, then fall back to Google Maps search
                      if (event.venueUrl) {
                        window.open(event.venueUrl, '_blank');
                      } else if (event.location.toLowerCase().includes('house of blues dallas')) {
                        window.open('https://www.houseofblues.com/dallas/', '_blank');
                      } else {
                        // Fall back to Google Maps search for venue
                        const query = encodeURIComponent(`${event.location} ${event.address || ''}`);
                        window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
                      }
                    }}
                    className="text-sm font-bold text-white hover:text-primary transition-colors duration-200 cursor-pointer text-left underline underline-offset-2"
                    title={`View ${event.location} information and location`}
                    data-testid={`button-venue-${event.id}`}
                  >
                    {event.location}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-white">
                    {formatEventDate(event.date, event.time || undefined)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="text-xl font-bold text-primary">
                  {(event.price && parseFloat(event.price.toString()) > 0) ? (
                    event.maxPrice && parseFloat(event.maxPrice.toString()) !== parseFloat(event.price.toString()) ? 
                      `$${parseFloat(event.price.toString())} - $${parseFloat(event.maxPrice.toString())}` : 
                      `$${parseFloat(event.price.toString())}`
                  ) : event.price === null ? '' : 'Free'}
                </div>
              </div>
              
                <div className="space-y-3 relative z-50">
                  {/* Primary action button with gradient */}
                  {event.ticketUrl && (
                    <Button
                      onClick={() => event.ticketUrl && window.open(event.ticketUrl, '_blank')}
                      size="lg"
                      disabled={event.ticketStatus === 'sold_out'}
                      className="w-full touch-target px-6 py-4 text-base font-bold rounded-2xl relative z-50 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg transition-all duration-200 disabled:opacity-50"
                      title="Get Tickets"
                      data-testid={`button-tickets-${event.id}`}
                    >
                      <Ticket className="w-5 h-5 mr-2" />
                      {event.ticketStatus === 'sold_out' ? 'Sold Out' : 'Get Tickets'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                  
                  {/* Secondary action buttons with labels */}
                  <div className="grid grid-cols-2 gap-2 relative z-50">
                    <Button
                      onClick={() => {
                        const eventDate = new Date(event.date);
                        const endDate = event.endDate ? new Date(event.endDate) : eventDate;
                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
                        window.open(url, '_blank');
                      }}
                      variant="outline"
                      className="touch-target px-4 py-3 text-sm font-medium rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 relative z-50"
                      title="Add to Calendar"
                      data-testid={`button-calendar-${event.id}`}
                    >
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Calendar
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const query = encodeURIComponent(`${event.location} ${event.address || ''}`);
                        window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
                      }}
                      variant="outline"
                      className="touch-target px-4 py-3 text-sm font-medium rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 relative z-50"
                      title="Get Directions"
                      data-testid={`button-directions-${event.id}`}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Directions
                    </Button>
                    
                    <Button
                      onClick={() => {
                        alert(`Event Details:\n\nTitle: ${event.title}\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\nDescription: ${event.description}`);
                      }}
                      variant="outline"
                      className="touch-target px-4 py-3 text-sm font-medium rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 relative z-50"
                      title="View Details"
                      data-testid={`button-details-${event.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    
                    <Button
                      onClick={onShare}
                      variant="outline"
                      className="touch-target px-4 py-3 text-sm font-medium rounded-xl bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200 relative z-50"
                      title="Share"
                      data-testid={`button-share-${event.id}`}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
