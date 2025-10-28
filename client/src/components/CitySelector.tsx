import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const MAJOR_CITIES = [
  { name: "New York, NY", latitude: 40.7128, longitude: -74.0060, state: "NY", country: "USA" },
  { name: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437, state: "CA", country: "USA" },
  { name: "Chicago, IL", latitude: 41.8781, longitude: -87.6298, state: "IL", country: "USA" },
  { name: "Houston, TX", latitude: 29.7604, longitude: -95.3698, state: "TX", country: "USA" },
  { name: "Phoenix, AZ", latitude: 33.4484, longitude: -112.0740, state: "AZ", country: "USA" },
  { name: "Philadelphia, PA", latitude: 39.9526, longitude: -75.1652, state: "PA", country: "USA" },
  { name: "San Antonio, TX", latitude: 29.4241, longitude: -98.4936, state: "TX", country: "USA" },
  { name: "San Diego, CA", latitude: 32.7157, longitude: -117.1611, state: "CA", country: "USA" },
  { name: "Dallas, TX", latitude: 32.7767, longitude: -96.7970, state: "TX", country: "USA" },
  { name: "Austin, TX", latitude: 30.2672, longitude: -97.7431, state: "TX", country: "USA" },
  { name: "San Jose, CA", latitude: 37.3382, longitude: -121.8863, state: "CA", country: "USA" },
  { name: "Fort Worth, TX", latitude: 32.7555, longitude: -97.3308, state: "TX", country: "USA" },
  { name: "Jacksonville, FL", latitude: 30.3322, longitude: -81.6557, state: "FL", country: "USA" },
  { name: "Charlotte, NC", latitude: 35.2271, longitude: -80.8431, state: "NC", country: "USA" },
  { name: "Columbus, OH", latitude: 39.9612, longitude: -82.9988, state: "OH", country: "USA" },
  { name: "Indianapolis, IN", latitude: 39.7684, longitude: -86.1581, state: "IN", country: "USA" },
  { name: "San Francisco, CA", latitude: 37.7749, longitude: -122.4194, state: "CA", country: "USA" },
  { name: "Seattle, WA", latitude: 47.6062, longitude: -122.3321, state: "WA", country: "USA" },
  { name: "Denver, CO", latitude: 39.7392, longitude: -104.9903, state: "CO", country: "USA" },
  { name: "Washington, DC", latitude: 38.9072, longitude: -77.0369, state: "DC", country: "USA" },
  { name: "Boston, MA", latitude: 42.3601, longitude: -71.0589, state: "MA", country: "USA" },
  { name: "Nashville, TN", latitude: 36.1627, longitude: -86.7816, state: "TN", country: "USA" },
  { name: "Baltimore, MD", latitude: 39.2904, longitude: -76.6122, state: "MD", country: "USA" },
  { name: "Oklahoma City, OK", latitude: 35.4676, longitude: -97.5164, state: "OK", country: "USA" },
  { name: "Portland, OR", latitude: 45.5152, longitude: -122.6784, state: "OR", country: "USA" },
  { name: "Las Vegas, NV", latitude: 36.1699, longitude: -115.1398, state: "NV", country: "USA" },
  { name: "Louisville, KY", latitude: 38.2527, longitude: -85.7585, state: "KY", country: "USA" },
  { name: "Milwaukee, WI", latitude: 43.0389, longitude: -87.9065, state: "WI", country: "USA" },
  { name: "Albuquerque, NM", latitude: 35.0844, longitude: -106.6504, state: "NM", country: "USA" },
  { name: "Tucson, AZ", latitude: 32.2226, longitude: -110.9747, state: "AZ", country: "USA" },
  { name: "Fresno, CA", latitude: 36.7378, longitude: -119.7871, state: "CA", country: "USA" },
  { name: "Sacramento, CA", latitude: 38.5816, longitude: -121.4944, state: "CA", country: "USA" },
  { name: "Kansas City, MO", latitude: 39.0997, longitude: -94.5786, state: "MO", country: "USA" },
  { name: "Mesa, AZ", latitude: 33.4152, longitude: -111.8315, state: "AZ", country: "USA" },
  { name: "Atlanta, GA", latitude: 33.7490, longitude: -84.3880, state: "GA", country: "USA" },
  { name: "Miami, FL", latitude: 25.7617, longitude: -80.1918, state: "FL", country: "USA" },
  { name: "Tampa, FL", latitude: 27.9506, longitude: -82.4572, state: "FL", country: "USA" },
  { name: "New Orleans, LA", latitude: 29.9511, longitude: -90.0715, state: "LA", country: "USA" },
  { name: "Cleveland, OH", latitude: 41.4993, longitude: -81.6944, state: "OH", country: "USA" },
  { name: "Minneapolis, MN", latitude: 44.9778, longitude: -93.2650, state: "MN", country: "USA" },
];

interface CitySelectorProps {
  currentCity?: string;
  onCitySelect?: (city: string) => void;
}

export function CitySelector({ currentCity, onCitySelect }: CitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveLocationMutation = useMutation({
    mutationFn: async (city: typeof MAJOR_CITIES[0]) => {
      return await apiRequest("/api/location/user-123", "POST", {
        userId: "user-123",
        city: city.name.split(',')[0],
        state: city.state,
        latitude: city.latitude.toString(),
        longitude: city.longitude.toString(),
        isActive: true
      });
    },
    onSuccess: (data, city) => {
      queryClient.invalidateQueries({ queryKey: ["/api/location"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onCitySelect?.(city.name);
      setOpen(false);
      toast({
        title: "Location Updated",
        description: `Now showing events near ${city.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const filteredCities = MAJOR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    city.state.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleCitySelect = (city: typeof MAJOR_CITIES[0]) => {
    saveLocationMutation.mutate(city);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="glassmorphism text-white border-white/20 hover:bg-white/10"
          size="sm"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {currentCity ? currentCity.split(',')[0] : 'Choose City'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Major City</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput
            placeholder="Search cities..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No cities found.</CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={`${city.name}-${city.state}`}
                  value={city.name}
                  onSelect={() => handleCitySelect(city)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{city.name.split(',')[0]}</div>
                      <div className="text-sm text-muted-foreground">{city.state}</div>
                    </div>
                    {currentCity && currentCity.includes(city.name.split(',')[0]) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}