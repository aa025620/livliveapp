import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, MapPin, Calendar, Clock, ExternalLink, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { type Event } from "@shared/schema";

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  venueAddress?: string;
  venueUrl?: string;
  latitude?: number;
  longitude?: number;
  onEventShare: (eventId: number) => void;
}

export function VenueModal({ 
  isOpen, 
  onClose, 
  venueName, 
  venueAddress,
  venueUrl,
  latitude, 
  longitude,
  onEventShare 
}: VenueModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch all events at this venue
  const { data: venueEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/by-venue", venueName],
    queryFn: async () => {
      const response = await fetch(`/api/events/by-venue?venue=${encodeURIComponent(venueName)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch venue events");
      }
      return response.json();
    },
    enabled: isOpen && !!venueName,
  });

  const openMapsLocation = () => {
    if (latitude && longitude) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank');
    } else if (venueAddress || venueName) {
      const query = encodeURIComponent(venueAddress || venueName);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <MapPin className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <div className="font-bold">{venueName}</div>
              {venueAddress && (
                <div className="text-sm text-muted-foreground font-normal mt-1">
                  {venueAddress}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {venueUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(venueUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={openMapsLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Maps
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Events ({venueEvents.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : venueEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No upcoming events found</p>
              <p className="text-sm">Check back later for future events at this venue.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {venueEvents.map((event) => (
                <div key={event.id} className="transform scale-95">
                  <EventCard
                    event={event}
                    onShare={() => onEventShare(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}