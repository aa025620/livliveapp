var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/seatgeek.ts
var seatgeek_exports = {};
__export(seatgeek_exports, {
  SeatGeekAPI: () => SeatGeekAPI,
  seatGeekAPI: () => seatGeekAPI
});
var SeatGeekAPI, seatGeekAPI;
var init_seatgeek = __esm({
  "server/seatgeek.ts"() {
    "use strict";
    SeatGeekAPI = class {
      baseUrl = "https://api.seatgeek.com/2";
      clientId;
      clientSecret;
      constructor() {
        this.clientId = process.env.SEATGEEK_CLIENT_ID || "";
        this.clientSecret = process.env.SEATGEEK_CLIENT_SECRET || "";
      }
      isConfigured() {
        return !!(this.clientId && this.clientSecret);
      }
      getAuthToken() {
        const credentials = `${this.clientId}:${this.clientSecret}`;
        return Buffer.from(credentials).toString("base64");
      }
      mapSeatGeekEventToEvent(seatGeekEvent) {
        const getCategoryFromType = (type, performers) => {
          const typeMap = {
            "concert": "entertainment",
            "theater": "arts",
            "comedy": "entertainment",
            "classical": "arts",
            "family": "community",
            "festival": "entertainment",
            "literary_arts": "arts",
            "dance_performance_tour": "arts",
            "broadway_tickets_national": "arts",
            "nba": "sports",
            "nfl": "sports",
            "mlb": "sports",
            "nhl": "sports",
            "mls": "sports",
            "ncaa_basketball": "sports",
            "ncaa_football": "sports",
            "minor_league_baseball": "sports",
            "pga": "sports",
            "tennis": "sports",
            "auto_racing": "sports",
            "wrestling": "sports",
            "mma": "sports",
            "boxing": "sports"
          };
          if (typeMap[type]) {
            return typeMap[type];
          }
          const hasAthlete = performers.some((p) => p.type === "team" || p.type === "athlete");
          if (hasAthlete) {
            return "sports";
          }
          return "entertainment";
        };
        return {
          id: parseInt(`9${seatGeekEvent.id}`),
          // Prefix with 9 to avoid conflicts with Ticketmaster IDs
          title: seatGeekEvent.title,
          description: seatGeekEvent.description || `${seatGeekEvent.short_title} at ${seatGeekEvent.venue.name}`,
          category: getCategoryFromType(seatGeekEvent.type, seatGeekEvent.performers),
          date: new Date(seatGeekEvent.datetime_local),
          endDate: seatGeekEvent.enddatetime_utc ? new Date(seatGeekEvent.enddatetime_utc) : null,
          ticketSaleDate: seatGeekEvent.announce_date ? new Date(seatGeekEvent.announce_date) : null,
          time: new Date(seatGeekEvent.datetime_local).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
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
          source: "seatgeek"
        };
      }
      async searchEvents(params = {}) {
        if (!this.isConfigured()) {
          console.log("SeatGeek API not configured - credentials missing");
          return [];
        }
        try {
          const searchParams = new URLSearchParams({
            client_id: this.clientId,
            per_page: (params.per_page || 20).toString(),
            page: (params.page || 1).toString()
          });
          if (this.clientSecret) {
            searchParams.append("client_secret", this.clientSecret);
          }
          if (params.lat && params.lon) {
            searchParams.append("lat", params.lat.toString());
            searchParams.append("lon", params.lon.toString());
            searchParams.append("range", params.range || "50mi");
          }
          if (params.q) {
            searchParams.append("q", params.q);
          }
          if (params.type) {
            searchParams.append("type", params.type);
          }
          const url = `${this.baseUrl}/events?${searchParams.toString()}`;
          console.log("Fetching SeatGeek events:", url.replace(this.clientSecret, "[REDACTED]"));
          const testUrl = `${this.baseUrl}/events?client_id=${this.clientId}&per_page=5`;
          console.log("Testing basic SeatGeek API:", testUrl);
          const response = await fetch(url, {
            headers: {
              "Accept": "application/json",
              "User-Agent": "FOMO Events App/1.0"
            }
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error("SeatGeek API error:", response.status, response.statusText, errorText);
            return [];
          }
          const data = await response.json();
          console.log(`SeatGeek events response: ${data.events.length} events`);
          return data.events.map((event) => this.mapSeatGeekEventToEvent(event));
        } catch (error) {
          console.error("Error fetching SeatGeek events:", error);
          return [];
        }
      }
      async getEventsByLocation(latitude, longitude, radius = 50) {
        const events2 = await this.searchEvents({
          lat: latitude,
          lon: longitude,
          range: `${radius}mi`,
          per_page: 50
        });
        const today = /* @__PURE__ */ new Date();
        return events2.filter((event) => new Date(event.date) >= today);
      }
      async getEventsByCategory(category, latitude, longitude, radius = 50) {
        const categoryTypeMap = {
          "sports": ["nba", "nfl", "mlb", "nhl", "mls", "ncaa_basketball", "ncaa_football", "minor_league_baseball", "pga", "tennis", "auto_racing", "wrestling", "mma", "boxing"],
          "entertainment": ["concert", "comedy", "festival"],
          "arts": ["theater", "classical", "literary_arts", "dance_performance_tour", "broadway_tickets_national"],
          "community": ["family"],
          "government": []
          // SeatGeek doesn't typically have government events
        };
        const types = categoryTypeMap[category] || [];
        if (types.length === 0) {
          return [];
        }
        const allEvents = [];
        for (const type of types) {
          const events2 = await this.searchEvents({
            type,
            lat: latitude,
            lon: longitude,
            range: latitude && longitude ? `${radius}mi` : void 0,
            per_page: 20
          });
          allEvents.push(...events2);
        }
        const today = /* @__PURE__ */ new Date();
        const uniqueEvents = allEvents.filter((event, index2, self) => index2 === self.findIndex((e) => e.id === event.id)).filter((event) => new Date(event.date) >= today);
        return uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    };
    seatGeekAPI = new SeatGeekAPI();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  defaultFilters: () => defaultFilters,
  events: () => events,
  insertEventSchema: () => insertEventSchema,
  insertUserLocationSchema: () => insertUserLocationSchema,
  insertUserSchema: () => insertUserSchema,
  sessions: () => sessions,
  ticketProviders: () => ticketProviders,
  userLocations: () => userLocations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  // entertainment, government, sports, arts, community
  location: text("location").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  ticketSaleDate: timestamp("ticket_sale_date"),
  // When tickets go on sale
  time: text("time"),
  // Event time display
  source: text("source").default("test"),
  // Data source: test, seatgeek, ticketmaster
  imageUrl: text("image_url"),
  attendeeCount: integer("attendee_count").default(0),
  isHot: boolean("is_hot").default(false),
  isTrending: boolean("is_trending").default(false),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  ticketUrl: text("ticket_url"),
  // External ticket purchase URL
  ticketProvider: text("ticket_provider"),
  // e.g., "Ticketmaster", "SeatGeek", "EventBrite"
  ticketStatus: text("ticket_status").default("available"),
  // available, sold_out, coming_soon
  venueUrl: text("venue_url"),
  // Venue website URL
  createdAt: timestamp("created_at").defaultNow()
});
var userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  radius: integer("radius").default(50),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  attendeeCount: true
});
var insertUserLocationSchema = createInsertSchema(userLocations).omit({
  id: true,
  createdAt: true
});
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var categories = [
  { id: "all", label: "All", icon: "grid", color: "primary" },
  { id: "entertainment", label: "Entertainment", icon: "music", color: "entertainment" },
  { id: "government", label: "Government", icon: "landmark", color: "government" },
  { id: "sports", label: "Sports", icon: "futbol", color: "sports" },
  { id: "arts", label: "Arts", icon: "palette", color: "arts" },
  { id: "community", label: "Community", icon: "users", color: "community" }
];
var defaultFilters = {
  categories: ["all"],
  dateRange: {
    start: /* @__PURE__ */ new Date()
    // Default to today - no past events
  },
  timeRange: {},
  priceRange: {},
  ticketProviders: [],
  // Empty array means all providers
  sortBy: "date",
  sortOrder: "asc"
};
var ticketProviders = [
  "Ticketmaster",
  "SeatGeek",
  "EventBrite",
  "StubHub",
  "Vivid Seats",
  "Other"
];

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and } from "drizzle-orm";

// server/ticketmaster.ts
var TicketmasterAPI = class {
  apiKey;
  baseUrl = "https://app.ticketmaster.com/discovery/v2";
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async getEvents(params) {
    const url = new URL(`${this.baseUrl}/events.json`);
    url.searchParams.append("apikey", this.apiKey);
    if (params.latitude && params.longitude) {
      url.searchParams.append("latlong", `${params.latitude},${params.longitude}`);
      if (params.radius) {
        url.searchParams.append("radius", params.radius.toString());
        url.searchParams.append("unit", "miles");
      }
    } else if (params.city && params.stateCode) {
      url.searchParams.append("city", params.city);
      url.searchParams.append("stateCode", params.stateCode);
    }
    if (params.size) url.searchParams.append("size", params.size.toString());
    if (params.page) url.searchParams.append("page", params.page.toString());
    if (params.sort) url.searchParams.append("sort", params.sort);
    if (params.classificationName) url.searchParams.append("classificationName", params.classificationName);
    if (params.startDateTime) url.searchParams.append("startDateTime", params.startDateTime);
    if (params.endDateTime) url.searchParams.append("endDateTime", params.endDateTime);
    url.searchParams.append("embed", "venues");
    try {
      console.log("Fetching Ticketmaster events:", url.toString());
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data._embedded?.events || [];
    } catch (error) {
      console.error("Error fetching Ticketmaster events:", error);
      return [];
    }
  }
  convertToEvent(tmEvent) {
    const venue = tmEvent._embedded?.venues?.[0];
    const classification = tmEvent.classifications?.[0];
    const priceRange = tmEvent.priceRanges?.[0];
    const category = this.mapCategory(classification?.segment?.name || classification?.genre?.name || "entertainment");
    const location = venue ? `${venue.city.name}, ${venue.state.stateCode}` : "TBD";
    const address = venue?.address?.line1 || venue?.name || "Address TBD";
    const startDate = new Date(tmEvent.dates.start.dateTime || `${tmEvent.dates.start.localDate}T${tmEvent.dates.start.localTime || "19:00:00"}`);
    const endDate = tmEvent.dates.end ? new Date(tmEvent.dates.end.dateTime || `${tmEvent.dates.end.localDate}T${tmEvent.dates.end.localTime || "23:00:00"}`) : void 0;
    const imageUrl = tmEvent.images?.find((img) => img.width >= 640)?.url || tmEvent.images?.[0]?.url || void 0;
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
      price: priceRange?.min?.toString() || "0",
      attendeeCount: Math.floor(Math.random() * 500) + 100,
      // Estimate since not provided
      isHot: Math.random() > 0.7,
      // Random hot events
      isTrending: Math.random() > 0.8
      // Random trending events
    };
  }
  mapCategory(tmCategory) {
    const categoryMap = {
      "Music": "entertainment",
      "Sports": "sports",
      "Arts & Theatre": "arts",
      "Film": "arts",
      "Miscellaneous": "community",
      "Family": "community",
      "Comedy": "entertainment",
      "Dance": "arts",
      "Educational": "community",
      "Festival": "entertainment",
      "Government": "government",
      "Health": "community",
      "Holiday": "community",
      "Literary": "arts",
      "Museum": "arts",
      "Religious": "community",
      "Shopping": "community",
      "Tour": "entertainment"
    };
    return categoryMap[tmCategory] || "entertainment";
  }
};
var ticketmasterAPI = new TicketmasterAPI(process.env.TICKETMASTER_API_KEY || "");

// server/storage.ts
var DatabaseStorage = class {
  // User operations (required for authentication)
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getEvents(category, location) {
    const { gte: gte2, eq: eq2 } = await import("drizzle-orm");
    let query = db.select().from(events);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let whereConditions = [gte2(events.date, today)];
    if (category && category !== "all") {
      whereConditions.push(eq2(events.category, category));
    }
    if (whereConditions.length > 0) {
      const { and: and2 } = await import("drizzle-orm");
      query = query.where(and2(...whereConditions));
    }
    const allEvents = await query;
    return allEvents.sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }
  async getEventsWithFilters(filters) {
    let query = db.select().from(events);
    let whereConditions = [];
    const { gte: gte2, lte: lte2, eq: eq2, or } = await import("drizzle-orm");
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    whereConditions.push(gte2(events.date, today));
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes("all")) {
      const categoryConditions = filters.categories.map((cat) => eq2(events.category, cat));
      whereConditions.push(or(...categoryConditions));
    }
    if (filters.minPrice !== void 0 || filters.maxPrice !== void 0) {
      if (filters.minPrice !== void 0) {
        whereConditions.push(gte2(events.price, filters.minPrice));
      }
      if (filters.maxPrice !== void 0) {
        whereConditions.push(lte2(events.price, filters.maxPrice));
      }
    }
    if (filters.showOnlyFree) {
      whereConditions.push(eq2(events.price, 0));
    }
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        const filterStartDate = filters.startDate > today ? filters.startDate : today;
        whereConditions.push(gte2(events.date, filterStartDate));
      }
      if (filters.endDate) {
        whereConditions.push(lte2(events.date, filters.endDate));
      }
    }
    if (filters.showOnlyToday) {
      const today2 = /* @__PURE__ */ new Date();
      today2.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today2);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { gte: gte3, lt: lt2 } = await import("drizzle-orm");
      whereConditions.push(gte3(events.date, today2));
      whereConditions.push(lt2(events.date, tomorrow));
    }
    if (whereConditions.length > 0) {
      const { and: and2 } = await import("drizzle-orm");
      query = query.where(and2(...whereConditions));
    }
    const allEvents = await query;
    let filteredEvents = allEvents;
    if (filters.showOnlyWeekend) {
      filteredEvents = allEvents.filter((event) => {
        const eventDate = new Date(event.date);
        const dayOfWeek = eventDate.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      });
    }
    if (filters.userLatitude && filters.userLongitude && filters.radius) {
      filteredEvents = filteredEvents.filter((event) => {
        if (event.latitude && event.longitude) {
          const distance = this.calculateDistance(
            filters.userLatitude,
            filters.userLongitude,
            event.latitude,
            event.longitude
          );
          return distance <= filters.radius;
        }
        return true;
      });
    }
    return filteredEvents.sort((a, b) => {
      if (filters.sortBy) {
        const isDescending = filters.sortOrder === "desc";
        switch (filters.sortBy) {
          case "date":
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return isDescending ? dateB - dateA : dateA - dateB;
          case "popularity":
            const popA = a.attendeeCount || 0;
            const popB = b.attendeeCount || 0;
            return isDescending ? popB - popA : popA - popB;
          case "price":
            const priceA = a.price || 0;
            const priceB = b.price || 0;
            return isDescending ? priceB - priceA : priceA - priceB;
          default:
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
      }
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }
  async getEvent(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || void 0;
  }
  async createEvent(insertEvent) {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }
  async updateEvent(id, updateData) {
    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return event || void 0;
  }
  async deleteEvent(id) {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount > 0;
  }
  async getTrendingEvents(limit = 5) {
    const allEvents = await db.select().from(events).where(eq(events.isTrending, true));
    return allEvents.sort((a, b) => (b.attendeeCount || 0) - (a.attendeeCount || 0)).slice(0, limit);
  }
  async getHotEvents(limit = 5) {
    const allEvents = await db.select().from(events).where(eq(events.isHot, true));
    return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, limit);
  }
  async getEventsByLocation(latitude, longitude, radiusKm = 10) {
    const allEvents = await db.select().from(events);
    return allEvents.filter((event) => {
      if (!event.latitude || !event.longitude) return true;
      const eventLat = parseFloat(event.latitude);
      const eventLng = parseFloat(event.longitude);
      const distance = this.calculateDistance(latitude, longitude, eventLat, eventLng);
      return distance <= radiusKm;
    });
  }
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const lat2Num = typeof lat2 === "string" ? parseFloat(lat2) : lat2;
    const lon2Num = typeof lon2 === "string" ? parseFloat(lon2) : lon2;
    const dLat = (lat2Num - lat1) * Math.PI / 180;
    const dLon = (lon2Num - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  async getUserLocation(userId) {
    const [location] = await db.select().from(userLocations).where(and(
      eq(userLocations.userId, userId),
      eq(userLocations.isActive, true)
    ));
    return location || void 0;
  }
  async saveUserLocation(location) {
    await db.update(userLocations).set({ isActive: false }).where(eq(userLocations.userId, location.userId));
    const [userLocation] = await db.insert(userLocations).values({ ...location, isActive: true }).returning();
    return userLocation;
  }
  async getEventCountsByCategory(location) {
    const allEvents = await db.select().from(events);
    const counts = {
      all: allEvents.length,
      entertainment: 0,
      government: 0,
      sports: 0,
      arts: 0,
      community: 0
    };
    allEvents.forEach((event) => {
      if (counts[event.category] !== void 0) {
        counts[event.category]++;
      }
    });
    return counts;
  }
  async getLiveEvents(userLatitude, userLongitude, radius) {
    try {
      const today = /* @__PURE__ */ new Date();
      const todayString = today.toISOString().split("T")[0];
      const tmEvents = await ticketmasterAPI.getEvents({
        latitude: userLatitude,
        longitude: userLongitude,
        radius: radius || 50,
        size: 20,
        sort: "date,asc",
        startDateTime: todayString + "T00:00:00Z"
        // Only get events from today onwards
      });
      const liveEvents = [];
      for (const tmEvent of tmEvents) {
        const convertedEvent = ticketmasterAPI.convertToEvent(tmEvent);
        const eventDate = new Date(convertedEvent.date);
        if (eventDate < today) {
          continue;
        }
        const eventWithId = {
          id: parseInt(tmEvent.id.replace(/\D/g, "").slice(0, 8)) || Math.floor(Math.random() * 1e6),
          ...convertedEvent,
          createdAt: /* @__PURE__ */ new Date(),
          latitude: convertedEvent.latitude || null,
          longitude: convertedEvent.longitude || null,
          price: convertedEvent.price || "0",
          attendeeCount: convertedEvent.attendeeCount || 0,
          isHot: convertedEvent.isHot || false,
          isTrending: convertedEvent.isTrending || false,
          endDate: convertedEvent.endDate || null,
          imageUrl: convertedEvent.imageUrl || null
        };
        liveEvents.push(eventWithId);
      }
      return liveEvents;
    } catch (error) {
      console.error("Error fetching live events:", error);
      return [];
    }
  }
};
var storage = new DatabaseStorage();

// server/seed.ts
var sampleEvents = [
  // Free events for "Free only" filter
  {
    title: "Arlington Music Festival",
    description: "Experience the best of Texas music with legendary performers and emerging artists. Food trucks and craft beer available.",
    category: "entertainment",
    location: "River Legacy Park",
    address: "703 NW Green Oaks Blvd, Arlington, TX 76006",
    latitude: "32.7081",
    longitude: "-97.1531",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3),
    // 2 days from now
    time: "8:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: true,
    isTrending: true,
    attendeeCount: 1247,
    price: 0
  },
  {
    title: "Morning Yoga in the Park",
    description: "Free community yoga session in beautiful park setting. Bring your own mat.",
    category: "community",
    location: "River Legacy Park",
    address: "703 NW Green Oaks Blvd, Arlington, TX 76006",
    latitude: "32.7081",
    longitude: "-97.1531",
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1e3),
    // 1 day from now
    time: "8:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 60,
    price: 0
  },
  {
    title: "City Council Meeting",
    description: "Monthly city council meeting discussing budget allocations, park improvements, and traffic safety measures.",
    category: "government",
    location: "Arlington City Hall",
    address: "101 W Abram St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
    // 3 days from now
    time: "7:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 23,
    price: 0
  },
  // Weekend events for "Weekend only" filter  
  {
    title: "Saturday Farmers Market",
    description: "Fresh produce, artisanal goods, and local crafts every Saturday morning.",
    category: "community",
    location: "Downtown Arlington",
    address: "200 E Main St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + (6 - (/* @__PURE__ */ new Date()).getDay()) * 24 * 60 * 60 * 1e3),
    // Next Saturday
    time: "9:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 450,
    price: 0
  },
  {
    title: "Sunday Jazz Brunch",
    description: "Elegant brunch with live jazz music in downtown Arlington.",
    category: "entertainment",
    location: "Arlington Music Hall",
    address: "224 N Center St, Arlington, TX 76011",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + (7 - (/* @__PURE__ */ new Date()).getDay()) * 24 * 60 * 60 * 1e3),
    // Next Sunday
    time: "11:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 120,
    price: 65
  },
  // Premium priced events for price filtering
  {
    title: "Premium Wine Tasting",
    description: "Exclusive wine tasting event with sommelier-led sessions featuring rare vintages.",
    category: "entertainment",
    location: "The Mansion Restaurant",
    address: "2821 Turtle Creek Blvd, Arlington, TX 76019",
    latitude: "32.7767",
    longitude: "-97.1081",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1e3),
    // 4 days from now
    time: "6:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 40,
    price: 185
  },
  {
    title: "Texas Rangers vs Angels",
    description: "MLB regular season game featuring the Texas Rangers taking on the Los Angeles Angels. Pre-game festivities start at 6 PM.",
    category: "sports",
    location: "Globe Life Field",
    address: "734 Stadium Dr, Arlington, TX 76011",
    latitude: "32.7472",
    longitude: "-97.0833",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3),
    // 3 days from now
    time: "7:05 PM",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 15429,
    price: 125
  },
  {
    title: "Modern Art Exhibition Opening",
    description: "Opening reception for 'Contemporary Visions' featuring works by local and international artists. Wine and light refreshments provided.",
    category: "arts",
    location: "Arlington Museum of Art",
    address: "201 W Main St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1e3),
    // 4 days from now
    time: "6:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 156,
    price: 25
  },
  {
    title: "Arlington Farmers Market",
    description: "Weekly farmers market featuring local produce, artisanal foods, and handmade crafts. Live music and family activities.",
    category: "community",
    location: "Downtown Arlington",
    address: "200 E Main St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1e3),
    // 6 days from now
    time: "10:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 342,
    price: 0
  }
];
async function seedDatabase(forceRefresh = false) {
  try {
    console.log("Seeding database with sample events...");
    const existingEvents = await db.select().from(events);
    if (existingEvents.length > 0 && !forceRefresh) {
      console.log("Database already has events, forcing refresh for clean titles.");
      await db.delete(events);
      console.log("Cleared existing events with suffixes for clean titles.");
    }
    if (forceRefresh && existingEvents.length > 0) {
      await db.delete(events);
      console.log("Cleared existing events for refresh.");
    }
    const modifiedEvents = sampleEvents.map((event) => ({
      ...event,
      date: new Date(event.date.getTime() + (Math.random() - 0.5) * 2 * 60 * 60 * 1e3)
    }));
    await db.insert(events).values(modifiedEvents);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/appleAuth.ts
import jwt from "jsonwebtoken";
function setupAppleAuth(app2) {
  app2.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, user } = req.body;
      if (!identityToken) {
        return res.status(400).json({ error: "Identity token is required" });
      }
      const decoded = jwt.decode(identityToken);
      if (!decoded || !decoded.sub) {
        return res.status(400).json({ error: "Invalid identity token" });
      }
      const userId = `apple_${decoded.sub}`;
      const email = decoded.email || user?.email;
      const firstName = user?.name?.firstName;
      const lastName = user?.name?.lastName;
      await storage.upsertUser({
        id: userId,
        email: email || void 0,
        firstName: firstName || void 0,
        lastName: lastName || void 0,
        profileImageUrl: void 0
      });
      const sessionUser = await storage.getUser(userId);
      req.login({ claims: { sub: userId } }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({
          success: true,
          user: sessionUser
        });
      });
    } catch (error) {
      console.error("Apple Sign-In error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}

// server/eventbrite.ts
function mapEventbriteCategory(category) {
  if (!category) return "entertainment";
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("art") || categoryLower.includes("culture") || categoryLower.includes("museum") || categoryLower.includes("theatre") || categoryLower.includes("theater") || categoryLower.includes("film")) {
    return "arts";
  }
  if (categoryLower.includes("sport") || categoryLower.includes("fitness") || categoryLower.includes("running") || categoryLower.includes("yoga")) {
    return "sports";
  }
  if (categoryLower.includes("community") || categoryLower.includes("networking") || categoryLower.includes("meetup") || categoryLower.includes("charity") || categoryLower.includes("volunteer") || categoryLower.includes("fundrais")) {
    return "community";
  }
  if (categoryLower.includes("business") || categoryLower.includes("conference") || categoryLower.includes("seminar") || categoryLower.includes("professional")) {
    return "government";
  }
  return "entertainment";
}
function getBestEventbriteImage(logo) {
  if (!logo?.url) return null;
  return logo.url;
}
async function fetchEventbriteEvents(latitude, longitude, radius) {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) {
    console.log("Eventbrite API key not configured, skipping...");
    return [];
  }
  try {
    const params = new URLSearchParams({
      "location.latitude": latitude.toString(),
      "location.longitude": longitude.toString(),
      "location.within": `${radius}mi`,
      "expand": "venue",
      "sort_by": "date"
    });
    const url = `https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`;
    console.log("Fetching Eventbrite events with URL:", url);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    if (!data.events || data.events.length === 0) {
      return [];
    }
    const events2 = data.events.map((event) => {
      const venue = event.venue || {};
      const category = event.category?.name || "";
      const utcDateTime = event.start?.utc ? new Date(event.start.utc) : /* @__PURE__ */ new Date();
      return {
        id: `eb_${event.id}`,
        title: event.name?.text || "Untitled Event",
        description: event.description?.text || event.summary || "No description available",
        category: mapEventbriteCategory(category),
        date: event.start?.utc ? new Date(event.start.utc).toISOString().split("T")[0] : null,
        utcDateTime,
        endDate: event.end?.utc ? new Date(event.end.utc) : null,
        ticketSaleDate: null,
        time: event.start?.local ? new Date(event.start.local).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
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
        createdAt: /* @__PURE__ */ new Date()
      };
    });
    const now = /* @__PURE__ */ new Date();
    return events2.filter((event) => {
      return event.utcDateTime > now;
    });
  } catch (error) {
    console.error("Failed to fetch Eventbrite events:", error);
    return [];
  }
}

// server/routes/events-combined.ts
function getBestTicketmasterImage(images) {
  if (!images || images.length === 0) return null;
  const sortedImages = images.filter((img) => img.width && img.height).sort((a, b) => b.width * b.height - a.width * a.height);
  if (sortedImages.length > 0) {
    return sortedImages[0].url;
  }
  return images[0]?.url || null;
}
function getBestSeatGeekImage(performers) {
  if (!performers || performers.length === 0) return null;
  const mainPerformer = performers.find((p) => p.primary === true) || performers[0];
  return mainPerformer?.image || null;
}
function addCombinedEventsRoute(app2) {
  app2.get("/api/events/combined", async (req, res) => {
    try {
      const { userLatitude, userLongitude, radius = "50", categories: categories2, minPrice, maxPrice, ticketProviders: ticketProviders2 } = req.query;
      const allEvents = [];
      try {
        const params = new URLSearchParams();
        if (categories2) params.append("categories", categories2);
        if (userLatitude && userLongitude) {
          params.append("userLatitude", userLatitude);
          params.append("userLongitude", userLongitude);
          params.append("radius", radius);
        }
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        const testEvents = await storage.getEventsWithFilters({
          categories: categories2 ? categories2.split(",") : void 0,
          userLatitude: userLatitude ? parseFloat(userLatitude) : void 0,
          userLongitude: userLongitude ? parseFloat(userLongitude) : void 0,
          radius: radius ? parseInt(radius) : void 0,
          minPrice: minPrice ? parseFloat(minPrice) : void 0,
          maxPrice: maxPrice ? parseFloat(maxPrice) : void 0
        });
        allEvents.push(...testEvents);
      } catch (error) {
        console.error("Failed to fetch test events:", error);
      }
      if (userLatitude && userLongitude) {
        try {
          const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&latlong=${userLatitude},${userLongitude}&radius=${radius}&unit=miles&size=20&sort=date,asc&startDateTime=${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}T00:00:00Z&embed=venues`;
          const response = await fetch(ticketmasterUrl);
          if (response.ok) {
            const data = await response.json();
            if (data._embedded?.events) {
              let ticketmasterEvents = data._embedded.events.map((event) => {
                const venue = event._embedded?.venues?.[0];
                const location = venue?.location || {};
                return {
                  id: `tm_${event.id}` || Math.random() * 1e6,
                  title: event.name,
                  description: event.info || event.pleaseNote || "No description available",
                  category: mapTicketmasterCategory(event.classifications?.[0]?.segment?.name || event.classifications?.[0]?.genre?.name),
                  date: event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime).toISOString().split("T")[0] : event.dates?.start?.localDate || null,
                  utcDateTime: event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime) : event.dates?.start?.localDate ? /* @__PURE__ */ new Date(`${event.dates.start.localDate}T${event.dates?.start?.localTime || "19:00:00"}`) : /* @__PURE__ */ new Date(),
                  time: event.dates?.start?.localTime ? (/* @__PURE__ */ new Date(`1970-01-01T${event.dates.start.localTime}`)).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  }) : "7:00 PM",
                  location: venue?.name || "Venue TBA",
                  address: venue?.address?.line1 || "",
                  city: venue?.city?.name || "",
                  state: venue?.state?.stateCode || "",
                  zipCode: venue?.postalCode || "",
                  latitude: location.latitude ? parseFloat(location.latitude) : null,
                  longitude: location.longitude ? parseFloat(location.longitude) : null,
                  price: event.priceRanges?.[0]?.min || null,
                  maxPrice: event.priceRanges?.[0]?.max || null,
                  imageUrl: getBestTicketmasterImage(event.images) || null,
                  ticketUrl: event.url || null,
                  ticketProvider: "Ticketmaster",
                  ticketStatus: event.dates?.status?.code === "onsale" ? "available" : event.dates?.status?.code === "offsale" ? "sold_out" : "available",
                  createdAt: /* @__PURE__ */ new Date(),
                  updatedAt: /* @__PURE__ */ new Date(),
                  source: "ticketmaster"
                };
              });
              if (categories2) {
                const categoryList = categories2.split(",");
                ticketmasterEvents = ticketmasterEvents.filter(
                  (event) => categoryList.includes(event.category)
                );
              }
              if (ticketProviders2) {
                const providerList = ticketProviders2.split(",");
                ticketmasterEvents = ticketmasterEvents.filter(
                  (event) => providerList.includes(event.ticketProvider)
                );
              }
              allEvents.push(...ticketmasterEvents);
            }
          }
        } catch (error) {
          console.error("Failed to fetch Ticketmaster events:", error);
        }
        try {
          const seatgeekUrl = `https://api.seatgeek.com/2/events?client_id=${process.env.SEATGEEK_CLIENT_ID}&per_page=50&page=1&client_secret=${process.env.SEATGEEK_CLIENT_SECRET}&lat=${userLatitude}&lon=${userLongitude}&range=${radius}mi`;
          const response = await fetch(seatgeekUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.events) {
              let seatgeekEvents = data.events.map((event) => ({
                id: event.id,
                title: event.title,
                description: event.description || "No description available",
                category: mapSeatGeekCategory(event.type),
                date: event.datetime_utc ? new Date(event.datetime_utc).toISOString().split("T")[0] : event.datetime_local ? new Date(event.datetime_local).toISOString().split("T")[0] : null,
                utcDateTime: event.datetime_utc ? new Date(event.datetime_utc) : event.datetime_local ? new Date(event.datetime_local) : null,
                endDate: event.enddatetime_utc ? new Date(event.enddatetime_utc) : null,
                ticketSaleDate: event.announce_date ? new Date(event.announce_date) : null,
                time: event.datetime_local ? new Date(event.datetime_local).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                }) : "TBA",
                location: event.venue?.name || "Venue TBA",
                address: event.venue?.address || "",
                city: event.venue?.city || "",
                state: event.venue?.state || "",
                zipCode: event.venue?.postal_code || "",
                venueUrl: event.venue?.url || null,
                latitude: event.venue?.location?.lat || null,
                longitude: event.venue?.location?.lon || null,
                price: event.stats?.lowest_price ? event.stats.lowest_price.toString() : null,
                maxPrice: event.stats?.highest_price ? event.stats.highest_price.toString() : null,
                imageUrl: getBestSeatGeekImage(event.performers) || null,
                ticketUrl: event.url || event.venue?.url || null,
                ticketProvider: "SeatGeek",
                ticketStatus: event.url || event.venue?.url ? "available" : "coming_soon",
                createdAt: /* @__PURE__ */ new Date(),
                updatedAt: /* @__PURE__ */ new Date(),
                source: "seatgeek"
              }));
              if (categories2) {
                const categoryList = categories2.split(",");
                seatgeekEvents = seatgeekEvents.filter(
                  (event) => categoryList.includes(event.category)
                );
              }
              if (ticketProviders2) {
                const providerList = ticketProviders2.split(",");
                seatgeekEvents = seatgeekEvents.filter(
                  (event) => providerList.includes(event.ticketProvider)
                );
              }
              allEvents.push(...seatgeekEvents);
            }
          }
        } catch (error) {
          console.error("Failed to fetch SeatGeek events:", error);
        }
        try {
          let eventbriteEvents = await fetchEventbriteEvents(
            parseFloat(userLatitude),
            parseFloat(userLongitude),
            parseInt(radius)
          );
          if (categories2) {
            const categoryList = categories2.split(",");
            eventbriteEvents = eventbriteEvents.filter(
              (event) => categoryList.includes(event.category)
            );
          }
          if (ticketProviders2) {
            const providerList = ticketProviders2.split(",");
            eventbriteEvents = eventbriteEvents.filter(
              (event) => providerList.includes(event.ticketProvider || "")
            );
          }
          allEvents.push(...eventbriteEvents);
        } catch (error) {
          console.error("Failed to fetch Eventbrite events:", error);
        }
      }
      const nowMs = Date.now();
      const futureEvents = allEvents.filter((event) => {
        if (!event.date) return true;
        let endMs;
        if (event.utcDateTime) {
          endMs = new Date(event.utcDateTime).getTime();
        } else if (event.endDate) {
          endMs = new Date(event.endDate).getTime();
        } else if (event.time && event.time !== "TBA") {
          const eventDate = new Date(event.date);
          const timeMatch = event.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            const [, hours, minutes, period] = timeMatch;
            let hour24 = parseInt(hours);
            if (period.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
            if (period.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;
            eventDate.setUTCHours(hour24, parseInt(minutes), 0, 0);
          }
          endMs = eventDate.getTime();
        } else {
          const eventDate = new Date(event.date);
          eventDate.setUTCHours(23, 59, 59, 999);
          endMs = eventDate.getTime();
        }
        return endMs > nowMs;
      });
      const normalizeTitle = (title) => {
        return title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
      };
      const getDayKey = (event) => {
        return event.utcDateTime ? new Date(event.utcDateTime).toISOString().slice(0, 10) : event.date || "";
      };
      const getEventScore = (event) => {
        let score = 0;
        if (event.ticketUrl) score += 4;
        if (event.ticketStatus === "available") score += 2;
        if (event.source === "ticketmaster") score += 3;
        else if (event.source === "seatgeek") score += 2;
        else score += 1;
        if (event.imageUrl) score += 1;
        return score;
      };
      const uniqueEvents = futureEvents.filter((event, index2, self) => {
        const eventDayKey = getDayKey(event);
        const eventTitle = normalizeTitle(event.title);
        const eventVenue = event.location?.toLowerCase() || "";
        const duplicateIndex = self.findIndex((e) => {
          const eDayKey = getDayKey(e);
          const eTitle = normalizeTitle(e.title);
          const eVenue = e.location?.toLowerCase() || "";
          const sameDay = eventDayKey === eDayKey;
          const sameVenue = eventVenue && eVenue && (eventVenue === eVenue || eventVenue.includes(eVenue) || eVenue.includes(eventVenue));
          const similarTitle = eventTitle.includes(eTitle) || eTitle.includes(eventTitle) || eventTitle === eTitle;
          return sameDay && (sameVenue || similarTitle);
        });
        if (duplicateIndex === index2) return true;
        const duplicate = self[duplicateIndex];
        return getEventScore(event) > getEventScore(duplicate);
      });
      uniqueEvents.sort((a, b) => {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return dateA - dateB;
      });
      const limitedEvents = uniqueEvents.slice(0, 100);
      res.json(limitedEvents);
    } catch (error) {
      console.error("Combined events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
}
function mapTicketmasterCategory(category) {
  if (!category) return "entertainment";
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("music")) return "entertainment";
  if (categoryLower.includes("sport")) return "sports";
  if (categoryLower.includes("art") || categoryLower.includes("theatre")) return "arts";
  if (categoryLower.includes("family")) return "community";
  return "entertainment";
}
function mapSeatGeekCategory(category) {
  if (!category) return "entertainment";
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("concert") || categoryLower.includes("music")) return "entertainment";
  if (categoryLower.includes("sports")) return "sports";
  if (categoryLower.includes("theater") || categoryLower.includes("broadway")) return "arts";
  if (categoryLower.includes("comedy")) return "entertainment";
  return "entertainment";
}

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  setupAppleAuth(app2);
  addCombinedEventsRoute(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/database/refresh", async (req, res) => {
    try {
      await seedDatabase(true);
      res.json({ message: "Database refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing database:", error);
      res.status(500).json({ error: "Failed to refresh database" });
    }
  });
  app2.get("/api/seatgeek/test", async (req, res) => {
    try {
      const { seatGeekAPI: seatGeekAPI2 } = await Promise.resolve().then(() => (init_seatgeek(), seatgeek_exports));
      const basicTest = await fetch(`https://api.seatgeek.com/2/events?client_id=${process.env.SEATGEEK_CLIENT_ID}&per_page=5`);
      const basicResponse = await basicTest.text();
      console.log("SeatGeek basic test status:", basicTest.status);
      console.log("SeatGeek basic test response:", basicResponse.substring(0, 500));
      res.json({
        status: basicTest.status,
        response: basicResponse.substring(0, 500),
        configured: !!(process.env.SEATGEEK_CLIENT_ID && process.env.SEATGEEK_CLIENT_SECRET)
      });
    } catch (error) {
      console.error("Error testing SeatGeek API:", error);
      res.status(500).json({ error: "Failed to test SeatGeek API", details: error.message });
    }
  });
  app2.get("/api/events/seatgeek", async (req, res) => {
    try {
      const { seatGeekAPI: seatGeekAPI2 } = await Promise.resolve().then(() => (init_seatgeek(), seatgeek_exports));
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude) : void 0;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude) : void 0;
      const radius = req.query.radius ? parseFloat(req.query.radius) : 50;
      const category = req.query.category;
      console.log("SeatGeek events request:", { userLatitude, userLongitude, radius, category });
      let seatGeekEvents;
      if (category && category !== "all") {
        seatGeekEvents = await seatGeekAPI2.getEventsByCategory(category, userLatitude, userLongitude, radius);
      } else if (userLatitude && userLongitude) {
        seatGeekEvents = await seatGeekAPI2.getEventsByLocation(userLatitude, userLongitude, radius);
      } else {
        seatGeekEvents = await seatGeekAPI2.searchEvents({ per_page: 50 });
      }
      console.log("SeatGeek events response:", seatGeekEvents.length, "events");
      res.json(seatGeekEvents);
    } catch (error) {
      console.error("Error fetching SeatGeek events:", error);
      res.status(500).json({ error: "Failed to fetch SeatGeek events", details: error.message });
    }
  });
  app2.get("/api/events/live", async (req, res) => {
    try {
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude) : void 0;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude) : void 0;
      const radius = req.query.radius ? parseFloat(req.query.radius) : void 0;
      console.log("Live events request:", { userLatitude, userLongitude, radius });
      const liveEvents = await storage.getLiveEvents(userLatitude, userLongitude, radius);
      console.log("Live events response:", liveEvents.length, "events");
      res.json(liveEvents);
    } catch (error) {
      console.error("Error fetching live events:", error);
      res.status(500).json({ error: "Failed to fetch live events", details: error.message });
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const category = req.query.category;
      const location = req.query.location;
      const categories2 = req.query.categories;
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : void 0;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : void 0;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const showOnlyFree = req.query.showOnlyFree === "true";
      const showOnlyToday = req.query.showOnlyToday === "true";
      const showOnlyWeekend = req.query.showOnlyWeekend === "true";
      const radius = req.query.radius ? parseFloat(req.query.radius) : void 0;
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude) : void 0;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude) : void 0;
      const hasAdvancedFilters = categories2 || sortBy || sortOrder || minPrice !== void 0 || maxPrice !== void 0 || startDate || endDate || showOnlyFree || showOnlyToday || showOnlyWeekend || radius;
      let events2;
      if (hasAdvancedFilters) {
        events2 = await storage.getEventsWithFilters({
          category,
          categories: categories2 ? categories2.split(",") : void 0,
          location,
          sortBy,
          sortOrder,
          minPrice,
          maxPrice,
          startDate,
          endDate,
          showOnlyFree,
          showOnlyToday,
          showOnlyWeekend,
          radius,
          userLatitude,
          userLongitude
        });
      } else {
        events2 = await storage.getEvents(category, location);
      }
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  app2.get("/api/events/trending", async (req, res) => {
    try {
      const events2 = await storage.getTrendingEvents();
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending events" });
    }
  });
  app2.get("/api/events/hot", async (req, res) => {
    try {
      const events2 = await storage.getHotEvents();
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hot events" });
    }
  });
  app2.get("/api/events/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.lat);
      const longitude = parseFloat(req.query.lng);
      const radius = req.query.radius ? parseFloat(req.query.radius) : 10;
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const events2 = await storage.getEventsByLocation(latitude, longitude, radius);
      res.json(events2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  app2.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });
  app2.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });
  app2.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEvent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.get("/api/categories/counts", async (req, res) => {
    try {
      const location = req.query.location;
      const counts = await storage.getEventCountsByCategory(location);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category counts" });
    }
  });
  app2.get("/api/location/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const location = await storage.getUserLocation(userId);
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user location" });
    }
  });
  app2.post("/api/location", async (req, res) => {
    try {
      console.log("Received location data:", req.body);
      const locationData = insertUserLocationSchema.parse(req.body);
      console.log("Parsed location data:", locationData);
      const location = await storage.saveUserLocation(locationData);
      res.json(location);
    } catch (error) {
      console.error("Location validation error:", error);
      res.status(400).json({ error: "Invalid location data", details: error.message });
    }
  });
  app2.get("/api/events/by-venue", async (req, res) => {
    try {
      const { venue } = req.query;
      if (!venue) {
        return res.status(400).json({ error: "Venue name is required" });
      }
      console.log(`Searching for events at venue: ${venue}`);
      const mockVenueEvents = [
        {
          id: Math.floor(Math.random() * 1e6),
          title: `Sample Event at ${venue}`,
          location: venue,
          address: `123 Main St, City, State`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
          time: "7:00 PM",
          category: "entertainment",
          price: "25",
          ticketUrl: "https://example.com/tickets",
          ticketProvider: "SeatGeek",
          ticketStatus: "available",
          description: `Join us for an amazing event at ${venue}!`,
          imageUrl: null
        },
        {
          id: Math.floor(Math.random() * 1e6),
          title: `Another Event at ${venue}`,
          location: venue,
          address: `123 Main St, City, State`,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
          time: "8:00 PM",
          category: "entertainment",
          price: "35",
          ticketUrl: "https://example.com/tickets",
          ticketProvider: "Ticketmaster",
          ticketStatus: "available",
          description: `Don't miss this special event at ${venue}!`,
          imageUrl: null
        }
      ];
      console.log(`Found ${mockVenueEvents.length} events at venue: ${venue}`);
      res.json(mockVenueEvents);
    } catch (error) {
      console.error("Failed to fetch venue events:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 443
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await seedDatabase();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
