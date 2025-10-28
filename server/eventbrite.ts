import { type Event } from "@shared/schema";

// Map Eventbrite categories to our app categories
export function mapEventbriteCategory(category: string | undefined): string {
  if (!category) return "entertainment";
  
  const categoryLower = category.toLowerCase();
  
  // Arts & Culture
  if (categoryLower.includes("art") || categoryLower.includes("culture") || 
      categoryLower.includes("museum") || categoryLower.includes("theatre") ||
      categoryLower.includes("theater") || categoryLower.includes("film")) {
    return "arts";
  }
  
  // Sports
  if (categoryLower.includes("sport") || categoryLower.includes("fitness") ||
      categoryLower.includes("running") || categoryLower.includes("yoga")) {
    return "sports";
  }
  
  // Community
  if (categoryLower.includes("community") || categoryLower.includes("networking") ||
      categoryLower.includes("meetup") || categoryLower.includes("charity") ||
      categoryLower.includes("volunteer") || categoryLower.includes("fundrais")) {
    return "community";
  }
  
  // Government/Business
  if (categoryLower.includes("business") || categoryLower.includes("conference") ||
      categoryLower.includes("seminar") || categoryLower.includes("professional")) {
    return "government";
  }
  
  // Entertainment (default)
  return "entertainment";
}

// Get best image from Eventbrite event
export function getBestEventbriteImage(logo: any): string | null {
  if (!logo?.url) return null;
  return logo.url;
}

// Fetch events from Eventbrite API
export async function fetchEventbriteEvents(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Event[]> {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  
  if (!apiKey) {
    console.log("Eventbrite API key not configured, skipping...");
    return [];
  }

  try {
    // Use location-based search endpoint
    const params = new URLSearchParams({
      'location.latitude': latitude.toString(),
      'location.longitude': longitude.toString(),
      'location.within': `${radius}mi`,
      'expand': 'venue',
      'sort_by': 'date'
    });
    
    const url = `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`;
    
    console.log('Fetching Eventbrite events with URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });

    if (!response.ok) {
      // Silently skip Eventbrite errors when API key is not configured
      return [];
    }

    const data = await response.json();
    
    if (!data.events || data.events.length === 0) {
      return [];
    }

    const events: Event[] = data.events.map((event: any) => {
      const venue = event.venue || {};
      const category = event.category?.name || "";
      
      const utcDateTime = event.start?.utc ? new Date(event.start.utc) : new Date();
      
      return {
        id: `eb_${event.id}`,
        title: event.name?.text || "Untitled Event",
        description: event.description?.text || event.summary || "No description available",
        category: mapEventbriteCategory(category),
        date: event.start?.utc ? new Date(event.start.utc).toISOString().split('T')[0] : null,
        utcDateTime: utcDateTime,
        endDate: event.end?.utc ? new Date(event.end.utc) : null,
        ticketSaleDate: null,
        time: event.start?.local ? new Date(event.start.local).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : "TBA",
        location: venue.name || "Venue TBA",
        address: venue.address?.address_1 || "",
        city: venue.address?.city || "",
        state: venue.address?.region || "",
        zipCode: venue.address?.postal_code || "",
        latitude: venue.latitude ? parseFloat(venue.latitude) : null,
        longitude: venue.longitude ? parseFloat(venue.longitude) : null,
        price: event.is_free ? "0" : null,
        maxPrice: null,
        imageUrl: getBestEventbriteImage(event.logo),
        ticketUrl: event.url || null,
        ticketProvider: "Eventbrite",
        ticketStatus: event.status === "live" ? "available" : "coming_soon",
        venueUrl: null,
        attendeeCount: 0,
        isHot: false,
        isTrending: false,
        source: "eventbrite",
        createdAt: new Date(),
      };
    });

    // Filter to only future events
    const now = new Date();
    return events.filter(event => {
      return (event as any).utcDateTime > now;
    });

  } catch (error) {
    console.error("Failed to fetch Eventbrite events:", error);
    return [];
  }
}
