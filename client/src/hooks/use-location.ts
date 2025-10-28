import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type UserLocation } from "@shared/schema";

export function useLocation(userId: string) {
  const queryClient = useQueryClient();
  
  const { data: location } = useQuery<UserLocation>({
    queryKey: ["/api/location", userId],
    queryFn: async () => {
      const response = await fetch(`/api/location/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch location");
      }
      return response.json();
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { city: string; state: string; zipCode?: string; latitude?: number; longitude?: number; radius?: number }) => {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          city: locationData.city,
          state: locationData.state,
          zipCode: locationData.zipCode,
          latitude: locationData.latitude?.toString(),
          longitude: locationData.longitude?.toString(),
          radius: locationData.radius,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update location");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/combined"] });
    },
  });

  const updateLocation = (locationData: { city: string; state: string; zipCode?: string; latitude?: number; longitude?: number; radius?: number }) => {
    updateLocationMutation.mutate(locationData);
  };

  return {
    location,
    updateLocation,
    isUpdating: updateLocationMutation.isPending,
  };
}
