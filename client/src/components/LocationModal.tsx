import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crosshair, Search, MapPin } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChange: (location: { city: string; state: string; zipCode?: string; latitude?: number; longitude?: number; radius?: number }) => void;
}

export function LocationModal({ isOpen, onClose, onLocationChange }: LocationModalProps) {
  const [locationInput, setLocationInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState("50");

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log(`Got coordinates: ${latitude}, ${longitude}`);
          
          // Try multiple geocoding services for better reliability
          let locationData = null;
          
          // First try: BigDataCloud (free, no API key required)
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (response.ok) {
              const data = await response.json();
              console.log("BigDataCloud response:", data);
              locationData = {
                city: data.city || data.locality || data.principalSubdivision || "Current Location",
                state: data.principalSubdivisionCode || data.countryCode || "",
                latitude,
                longitude,
              };
            }
          } catch (error) {
            console.error("BigDataCloud failed:", error);
          }
          
          // Second try: OpenStreetMap Nominatim (free, no API key required)
          if (!locationData) {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
              if (response.ok) {
                const data = await response.json();
                console.log("Nominatim response:", data);
                const address = data.address || {};
                locationData = {
                  city: address.city || address.town || address.village || address.county || "Current Location",
                  state: address.state || address.region || data.display_name?.split(',')[1]?.trim() || "",
                  latitude,
                  longitude,
                };
              }
            } catch (error) {
              console.error("Nominatim failed:", error);
            }
          }
          
          // Fallback to coordinates if all services fail
          if (!locationData) {
            locationData = {
              city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              state: "GPS",
              latitude,
              longitude,
            };
          }
          
          console.log("Final location data:", locationData);
          onLocationChange({
            ...locationData,
            radius: parseInt(selectedRadius)
          });
          onClose();
        } catch (error) {
          console.error("Failed to get location:", error);
          onLocationChange({
            city: "Current Location",
            state: "GPS",
          });
          onClose();
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
        
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        
        alert(errorMessage + " Please enter your location manually.");
      },
      options
    );
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;

    setIsLoading(true);
    try {
      // Geocode the manual input to get coordinates
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`;
      
      const response = await fetch(geocodeUrl);
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const latitude = parseFloat(result.lat);
          const longitude = parseFloat(result.lon);
          
          // Extract city and state from display_name
          const displayParts = result.display_name.split(',');
          const city = displayParts[0]?.trim() || locationInput;
          const state = displayParts[displayParts.length - 2]?.trim() || "";
          
          onLocationChange({
            city,
            state,
            latitude,
            longitude,
            zipCode: "", // Could be parsed if needed
            radius: parseInt(selectedRadius)
          });
          
          setLocationInput("");
          onClose();
        } else {
          alert("Location not found. Please try a different search term.");
        }
      } else {
        throw new Error("Geocoding service unavailable");
      }
    } catch (error) {
      console.error("Failed to geocode location:", error);
      alert("Failed to find location. Please try again or use current location.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-full w-full max-w-none m-0 rounded-none bg-black/95 backdrop-blur-md border-none p-6 overflow-y-auto" aria-describedby="location-description">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Set Your Location
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Radius</label>
            <Select value={selectedRadius} onValueChange={setSelectedRadius}>
              <SelectTrigger>
                <SelectValue placeholder="Select radius" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="75">75 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
                <SelectItem value="200">200 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => {
              console.log("🔥 BUTTON CLICKED! Starting location process...");
              handleUseCurrentLocation();
            }}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
            data-testid="button-use-current-location"
          >
            <Crosshair className="w-4 h-4 mr-2" />
            {isLoading ? "Getting location..." : "Use Current Location"}
          </Button>
          
          <form onSubmit={handleLocationSubmit} className="relative">
            <Input
              type="text"
              placeholder="Enter zip code or city, state"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="pr-10"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              variant="ghost"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground" id="location-description">
            <MapPin className="w-4 h-4" />
            <span>Events within {selectedRadius} miles of your location</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
