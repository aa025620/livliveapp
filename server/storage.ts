import { events, userLocations, users, type Event, type InsertEvent, type UserLocation, type InsertUserLocation, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, gte, lte, lt } from "drizzle-orm";
import { ticketmasterAPI } from "./ticketmaster";

export interface IStorage {
  // Users (required for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Events
  getEvents(category?: string, location?: string): Promise<Event[]>;
  getEventsWithFilters(filters: FilterParams): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getTrendingEvents(limit?: number): Promise<Event[]>;
  getHotEvents(limit?: number): Promise<Event[]>;
  getEventsByLocation(latitude: number, longitude: number, radiusKm?: number): Promise<Event[]>;
  
  // User Locations
  getUserLocation(userId: string): Promise<UserLocation | undefined>;
  saveUserLocation(location: InsertUserLocation): Promise<UserLocation>;
  
  
  // Categories
  getEventCountsByCategory(location?: string): Promise<Record<string, number>>;
  
  // Live Events
  getLiveEvents(userLatitude?: number, userLongitude?: number, radius?: number): Promise<Event[]>;
}

export interface FilterParams {
  category?: string;
  categories?: string[];
  location?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  showOnlyFree?: boolean;
  showOnlyToday?: boolean;
  showOnlyWeekend?: boolean;
  radius?: number;
  userLatitude?: number;
  userLongitude?: number;
}



export class DatabaseStorage implements IStorage {
  // User operations (required for authentication)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  async getEvents(category?: string, location?: string): Promise<Event[]> {
    const { gte, eq } = await import('drizzle-orm');
    let query = db.select().from(events);
    
    // Always filter out past events by default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let whereConditions = [gte(events.date, today)];
    
    if (category && category !== 'all') {
      whereConditions.push(eq(events.category, category));
    }
    
    if (whereConditions.length > 0) {
      const { and } = await import('drizzle-orm');
      query = query.where(and(...whereConditions));
    }
    
    const allEvents = await query;
    
    // Sort by date, with trending and hot events first
    return allEvents.sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async getEventsWithFilters(filters: FilterParams): Promise<Event[]> {
    let query = db.select().from(events);
    let whereConditions: any[] = [];
    
    // Always filter out past events by default
    const { gte, lte, eq, or } = await import('drizzle-orm');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    whereConditions.push(gte(events.date, today));
    
    // Category filtering
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes('all')) {
      const categoryConditions = filters.categories.map(cat => eq(events.category, cat));
      whereConditions.push(or(...categoryConditions));
    }
    
    // Price filtering
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      if (filters.minPrice !== undefined) {
        whereConditions.push(gte(events.price, filters.minPrice));
      }
      if (filters.maxPrice !== undefined) {
        whereConditions.push(lte(events.price, filters.maxPrice));
      }
    }
    
    // Free events only
    if (filters.showOnlyFree) {
      whereConditions.push(eq(events.price, 0));
    }
    
    // Date filtering (additional to the default future-only filter)
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        // Use the later of the provided start date or today
        const filterStartDate = filters.startDate > today ? filters.startDate : today;
        whereConditions.push(gte(events.date, filterStartDate));
      }
      if (filters.endDate) {
        whereConditions.push(lte(events.date, filters.endDate));
      }
    }
    
    // Today only
    if (filters.showOnlyToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { gte, lt } = await import('drizzle-orm');
      whereConditions.push(gte(events.date, today));
      whereConditions.push(lt(events.date, tomorrow));
    }
    
    // Apply conditions
    if (whereConditions.length > 0) {
      const { and } = await import('drizzle-orm');
      query = query.where(and(...whereConditions));
    }
    
    const allEvents = await query;
    
    // Post-process for weekend filtering (if needed)
    let filteredEvents = allEvents;
    if (filters.showOnlyWeekend) {
      filteredEvents = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        const dayOfWeek = eventDate.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      });
    }
    
    // Apply radius-based location filtering
    if (filters.userLatitude && filters.userLongitude && filters.radius) {
      filteredEvents = filteredEvents.filter(event => {
        if (event.latitude && event.longitude) {
          const distance = this.calculateDistance(
            filters.userLatitude!,
            filters.userLongitude!,
            event.latitude,
            event.longitude
          );
          return distance <= filters.radius!;
        }
        return true; // Keep events without location data
      });
    }
    
    // Apply sorting
    return filteredEvents.sort((a, b) => {
      if (filters.sortBy) {
        const isDescending = filters.sortOrder === 'desc';
        
        switch (filters.sortBy) {
          case 'date':
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return isDescending ? dateB - dateA : dateA - dateB;
          case 'popularity':
            const popA = a.attendeeCount || 0;
            const popB = b.attendeeCount || 0;
            return isDescending ? popB - popA : popA - popB;
          case 'price':
            const priceA = a.price || 0;
            const priceB = b.price || 0;
            return isDescending ? priceB - priceA : priceA - priceB;
          default:
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
      }
      
      // Default sorting: trending and hot events first, then by date
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount > 0;
  }

  async getTrendingEvents(limit = 5): Promise<Event[]> {
    const allEvents = await db.select().from(events).where(eq(events.isTrending, true));
    return allEvents
      .sort((a, b) => (b.attendeeCount || 0) - (a.attendeeCount || 0))
      .slice(0, limit);
  }

  async getHotEvents(limit = 5): Promise<Event[]> {
    const allEvents = await db.select().from(events).where(eq(events.isHot, true));
    return allEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }

  async getEventsByLocation(latitude: number, longitude: number, radiusKm = 10): Promise<Event[]> {
    // For now, return all events - in production you'd use PostGIS for geospatial queries
    const allEvents = await db.select().from(events);
    return allEvents.filter(event => {
      if (!event.latitude || !event.longitude) return true;
      
      const eventLat = parseFloat(event.latitude);
      const eventLng = parseFloat(event.longitude);
      
      const distance = this.calculateDistance(latitude, longitude, eventLat, eventLng);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number | string, lon2: number | string): number {
    const R = 3959; // Earth's radius in miles
    const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const lon2Num = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
    
    const dLat = (lat2Num - lat1) * Math.PI / 180;
    const dLon = (lon2Num - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getUserLocation(userId: string): Promise<UserLocation | undefined> {
    const [location] = await db.select().from(userLocations)
      .where(and(
        eq(userLocations.userId, userId),
        eq(userLocations.isActive, true)
      ));
    return location || undefined;
  }

  async saveUserLocation(location: InsertUserLocation): Promise<UserLocation> {
    // First, deactivate existing locations for this user
    await db.update(userLocations)
      .set({ isActive: false })
      .where(eq(userLocations.userId, location.userId));

    // Then insert the new location
    const [userLocation] = await db
      .insert(userLocations)
      .values({ ...location, isActive: true })
      .returning();
    return userLocation;
  }


  async getEventCountsByCategory(location?: string): Promise<Record<string, number>> {
    const allEvents = await db.select().from(events);
    const counts: Record<string, number> = {
      all: allEvents.length,
      entertainment: 0,
      government: 0,
      sports: 0,
      arts: 0,
      community: 0,
    };

    allEvents.forEach(event => {
      if (counts[event.category] !== undefined) {
        counts[event.category]++;
      }
    });

    return counts;
  }

  async getLiveEvents(userLatitude?: number, userLongitude?: number, radius?: number): Promise<Event[]> {
    try {
      // Get current date for filtering
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get live events from Ticketmaster API
      const tmEvents = await ticketmasterAPI.getEvents({
        latitude: userLatitude,
        longitude: userLongitude,
        radius: radius || 50,
        size: 20,
        sort: 'date,asc',
        startDateTime: todayString + 'T00:00:00Z' // Only get events from today onwards
      });

      // Convert Ticketmaster events to our format
      const liveEvents: Event[] = [];
      for (const tmEvent of tmEvents) {
        const convertedEvent = ticketmasterAPI.convertToEvent(tmEvent);
        
        // Additional filter to remove any past events that slipped through
        const eventDate = new Date(convertedEvent.date);
        if (eventDate < today) {
          continue; // Skip past events
        }
        
        // Create a temporary event with an ID for the response
        const eventWithId: Event = {
          id: parseInt(tmEvent.id.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 1000000),
          ...convertedEvent,
          createdAt: new Date(),
          latitude: convertedEvent.latitude || null,
          longitude: convertedEvent.longitude || null,
          price: convertedEvent.price || "0",
          attendeeCount: convertedEvent.attendeeCount || 0,
          isHot: convertedEvent.isHot || false,
          isTrending: convertedEvent.isTrending || false,
          endDate: convertedEvent.endDate || null,
          imageUrl: convertedEvent.imageUrl || null,
        };
        
        liveEvents.push(eventWithId);
      }

      return liveEvents;
    } catch (error) {
      console.error('Error fetching live events:', error);
      return [];
    }
  }


}

export const storage = new DatabaseStorage();
