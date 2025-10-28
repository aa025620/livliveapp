import { Event, InsertEvent } from "@shared/schema";

interface TicketmasterEvent {
  id: string;
  name: string;
  description?: string;
  info?: string;
  url?: string;
  locale?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    end?: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
  };
  classifications?: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre?: {
      id: string;
      name: string;
    };
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      state: {
        name: string;
        stateCode: string;
      };
      country: {
        name: string;
        countryCode: string;
      };
      address: {
        line1: string;
      };
      location: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export class TicketmasterAPI {
  private apiKey: string;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getEvents(params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    city?: string;
    stateCode?: string;
    size?: number;
    page?: number;
    sort?: string;
    classificationName?: string;
    startDateTime?: string;
    endDateTime?: string;
  }): Promise<TicketmasterEvent[]> {
    const url = new URL(`${this.baseUrl}/events.json`);
    
    // Add API key
    url.searchParams.append('apikey', this.apiKey);
    
    // Add location parameters
    if (params.latitude && params.longitude) {
      url.searchParams.append('latlong', `${params.latitude},${params.longitude}`);
      if (params.radius) {
        url.searchParams.append('radius', params.radius.toString());
        url.searchParams.append('unit', 'miles');
      }
    } else if (params.city && params.stateCode) {
      url.searchParams.append('city', params.city);
      url.searchParams.append('stateCode', params.stateCode);
    }
    
    // Add other parameters
    if (params.size) url.searchParams.append('size', params.size.toString());
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.sort) url.searchParams.append('sort', params.sort);
    if (params.classificationName) url.searchParams.append('classificationName', params.classificationName);
    if (params.startDateTime) url.searchParams.append('startDateTime', params.startDateTime);
    if (params.endDateTime) url.searchParams.append('endDateTime', params.endDateTime);
    
    // Always include venue details
    url.searchParams.append('embed', 'venues');
    
    try {
      console.log('Fetching Ticketmaster events:', url.toString());
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      }
      
      const data: TicketmasterResponse = await response.json();
      return data._embedded?.events || [];
    } catch (error) {
      console.error('Error fetching Ticketmaster events:', error);
      return [];
    }
  }

  convertToEvent(tmEvent: TicketmasterEvent): InsertEvent {
    const venue = tmEvent._embedded?.venues?.[0];
    const classification = tmEvent.classifications?.[0];
    const priceRange = tmEvent.priceRanges?.[0];
    
    // Map Ticketmaster categories to our categories
    const category = this.mapCategory(classification?.segment?.name || classification?.genre?.name || 'entertainment');
    
    // Build location string
    const location = venue ? `${venue.city.name}, ${venue.state.stateCode}` : 'TBD';
    const address = venue?.address?.line1 || venue?.name || 'Address TBD';
    
    // Parse date
    const startDate = new Date(tmEvent.dates.start.dateTime || 
      `${tmEvent.dates.start.localDate}T${tmEvent.dates.start.localTime || '19:00:00'}`);
    
    const endDate = tmEvent.dates.end ? new Date(tmEvent.dates.end.dateTime || 
      `${tmEvent.dates.end.localDate}T${tmEvent.dates.end.localTime || '23:00:00'}`) : undefined;
    
    // Get best image
    const imageUrl = tmEvent.images?.find(img => img.width >= 640)?.url || 
      tmEvent.images?.[0]?.url || undefined;
    
    return {
      title: tmEvent.name,
      description: tmEvent.description || tmEvent.info || `${tmEvent.name} - Don't miss this amazing event!`,
      category,
      location,
      address,
      latitude: venue?.location?.latitude || null,
      longitude: venue?.location?.longitude || null,
      date: startDate,
      endDate,
      imageUrl,
      price: priceRange?.min?.toString() || '0',
      attendeeCount: Math.floor(Math.random() * 500) + 100, // Estimate since not provided
      isHot: Math.random() > 0.7, // Random hot events
      isTrending: Math.random() > 0.8, // Random trending events
    };
  }

  private mapCategory(tmCategory: string): string {
    const categoryMap: Record<string, string> = {
      'Music': 'entertainment',
      'Sports': 'sports',
      'Arts & Theatre': 'arts',
      'Film': 'arts',
      'Miscellaneous': 'community',
      'Family': 'community',
      'Comedy': 'entertainment',
      'Dance': 'arts',
      'Educational': 'community',
      'Festival': 'entertainment',
      'Government': 'government',
      'Health': 'community',
      'Holiday': 'community',
      'Literary': 'arts',
      'Museum': 'arts',
      'Religious': 'community',
      'Shopping': 'community',
      'Tour': 'entertainment',
    };
    
    return categoryMap[tmCategory] || 'entertainment';
  }
}

export const ticketmasterAPI = new TicketmasterAPI(process.env.TICKETMASTER_API_KEY || '');