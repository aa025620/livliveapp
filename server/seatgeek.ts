import { Event } from "@shared/schema";

interface SeatGeekEvent {
  id: number;
  title: string;
  url: string;
  datetime_local: string;
  datetime_utc: string;
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    url?: string; // Venue website
    location: {
      lat: number;
      lon: number;
    };
  };
  performers: Array<{
    id: number;
    name: string;
    short_name: string;
    type: string;
    image: string;
    slug: string;
  }>;
  type: string;
  stats?: {
    listing_count: number;
    average_price: number;
    lowest_price?: number;
    highest_price?: number;
  };
  short_title: string;
  general_admission: boolean;
  description?: string;
  enddatetime_utc?: string;
  announce_date?: string;
}

interface SeatGeekResponse {
  events: SeatGeekEvent[];
  meta: {
    total: number;
    took: number;
    page: number;
    per_page: number;
  };
}

export class SeatGeekAPI {
  private baseUrl = 'https://api.seatgeek.com/2';
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.SEATGEEK_CLIENT_ID || '';
    this.clientSecret = process.env.SEATGEEK_CLIENT_SECRET || '';
  }

  private isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private getAuthToken(): string {
    const credentials = `${this.clientId}:${this.clientSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  private mapSeatGeekEventToEvent(seatGeekEvent: SeatGeekEvent): Event {
    // Map SeatGeek event types to our categories
    const getCategoryFromType = (type: string, performers: any[]): string => {
      const typeMap: Record<string, string> = {
        'concert': 'entertainment',
        'theater': 'arts',
        'comedy': 'entertainment',
        'classical': 'arts',
        'family': 'community',
        'festival': 'entertainment',
        'literary_arts': 'arts',
        'dance_performance_tour': 'arts',
        'broadway_tickets_national': 'arts',
        'nba': 'sports',
        'nfl': 'sports',
        'mlb': 'sports',
        'nhl': 'sports',
        'mls': 'sports',
        'ncaa_basketball': 'sports',
        'ncaa_football': 'sports',
        'minor_league_baseball': 'sports',
        'pga': 'sports',
        'tennis': 'sports',
        'auto_racing': 'sports',
        'wrestling': 'sports',
        'mma': 'sports',
        'boxing': 'sports'
      };

      // Check direct type mapping first
      if (typeMap[type]) {
        return typeMap[type];
      }

      // Check performer types for sports
      const hasAthlete = performers.some(p => p.type === 'team' || p.type === 'athlete');
      if (hasAthlete) {
        return 'sports';
      }

      // Default to entertainment
      return 'entertainment';
    };

    return {
      id: parseInt(`9${seatGeekEvent.id}`), // Prefix with 9 to avoid conflicts with Ticketmaster IDs
      title: seatGeekEvent.title,
      description: seatGeekEvent.description || `${seatGeekEvent.short_title} at ${seatGeekEvent.venue.name}`,
      category: getCategoryFromType(seatGeekEvent.type, seatGeekEvent.performers),
      date: new Date(seatGeekEvent.datetime_local),
      endDate: seatGeekEvent.enddatetime_utc ? new Date(seatGeekEvent.enddatetime_utc) : null,
      ticketSaleDate: seatGeekEvent.announce_date ? new Date(seatGeekEvent.announce_date) : null,
      time: new Date(seatGeekEvent.datetime_local).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      location: `${seatGeekEvent.venue.city}, ${seatGeekEvent.venue.state}`,
      address: seatGeekEvent.venue.address || `${seatGeekEvent.venue.name}, ${seatGeekEvent.venue.city}, ${seatGeekEvent.venue.state}`,
      latitude: seatGeekEvent.venue.location.lat.toString(),
      longitude: seatGeekEvent.venue.location.lon.toString(),
      imageUrl: seatGeekEvent.performers[0]?.image || null,
      attendeeCount: 0,
      isHot: false,
      isTrending: false,
      price: seatGeekEvent.stats?.lowest_price ? seatGeekEvent.stats.lowest_price.toString() : null,
      maxPrice: seatGeekEvent.stats?.highest_price ? seatGeekEvent.stats.highest_price.toString() : null,
      ticketUrl: seatGeekEvent.url,
      ticketProvider: "SeatGeek",
      ticketStatus: (seatGeekEvent.stats?.listing_count ?? 0) > 0 ? "available" : "sold_out",
      venueUrl: seatGeekEvent.venue.url || null,
      createdAt: null,
      source: "seatgeek" as const
    };
  }

  async searchEvents(params: {
    lat?: number;
    lon?: number;
    range?: string;
    q?: string;
    type?: string;
    per_page?: number;
    page?: number;
    datetime_gte?: string;
    datetime_lte?: string;
  } = {}): Promise<Event[]> {
    if (!this.isConfigured()) {
      console.log('SeatGeek API not configured - credentials missing');
      return [];
    }

    try {
      const searchParams = new URLSearchParams({
        client_id: this.clientId,
        per_page: (params.per_page || 20).toString(),
        page: (params.page || 1).toString(),
      });

      // Only add client_secret if it exists (it's optional for read operations)
      if (this.clientSecret) {
        searchParams.append('client_secret', this.clientSecret);
      }

      // Add location-based search
      if (params.lat && params.lon) {
        searchParams.append('lat', params.lat.toString());
        searchParams.append('lon', params.lon.toString());
        searchParams.append('range', params.range || '50mi');
      }

      // Add query search
      if (params.q) {
        searchParams.append('q', params.q);
      }

      // Add event type filter
      if (params.type) {
        searchParams.append('type', params.type);
      }

      // SeatGeek doesn't support datetime_gte/datetime_lte parameters
      // We'll filter future events on the client side

      const url = `${this.baseUrl}/events?${searchParams.toString()}`;
      console.log('Fetching SeatGeek events:', url.replace(this.clientSecret, '[REDACTED]'));

      // Test basic URL first
      const testUrl = `${this.baseUrl}/events?client_id=${this.clientId}&per_page=5`;
      console.log('Testing basic SeatGeek API:', testUrl);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FOMO Events App/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SeatGeek API error:', response.status, response.statusText, errorText);
        return [];
      }

      const data: SeatGeekResponse = await response.json();
      console.log(`SeatGeek events response: ${data.events.length} events`);

      return data.events.map(event => this.mapSeatGeekEventToEvent(event));

    } catch (error) {
      console.error('Error fetching SeatGeek events:', error);
      return [];
    }
  }

  async getEventsByLocation(
    latitude: number,
    longitude: number,
    radius: number = 50
  ): Promise<Event[]> {
    const events = await this.searchEvents({
      lat: latitude,
      lon: longitude,
      range: `${radius}mi`,
      per_page: 50
    });

    // Filter future events client-side
    const today = new Date();
    return events.filter(event => new Date(event.date) >= today);
  }

  async getEventsByCategory(
    category: string,
    latitude?: number,
    longitude?: number,
    radius: number = 50
  ): Promise<Event[]> {
    // Map our categories to SeatGeek types
    const categoryTypeMap: Record<string, string[]> = {
      'sports': ['nba', 'nfl', 'mlb', 'nhl', 'mls', 'ncaa_basketball', 'ncaa_football', 'minor_league_baseball', 'pga', 'tennis', 'auto_racing', 'wrestling', 'mma', 'boxing'],
      'entertainment': ['concert', 'comedy', 'festival'],
      'arts': ['theater', 'classical', 'literary_arts', 'dance_performance_tour', 'broadway_tickets_national'],
      'community': ['family'],
      'government': [] // SeatGeek doesn't typically have government events
    };

    const types = categoryTypeMap[category] || [];
    if (types.length === 0) {
      return [];
    }

    // Fetch events for each type in the category
    const allEvents: Event[] = [];
    for (const type of types) {
      const events = await this.searchEvents({
        type,
        lat: latitude,
        lon: longitude,
        range: latitude && longitude ? `${radius}mi` : undefined,
        per_page: 20
      });
      allEvents.push(...events);
    }

    // Filter future events client-side
    const today = new Date();

    // Remove duplicates, filter future events, and sort by date
    const uniqueEvents = allEvents
      .filter((event, index, self) => index === self.findIndex(e => e.id === event.id))
      .filter(event => new Date(event.date) >= today);

    return uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const seatGeekAPI = new SeatGeekAPI();