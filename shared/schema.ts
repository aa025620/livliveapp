import { sql } from 'drizzle-orm';
import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // entertainment, government, sports, arts, community
  location: text("location").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  ticketSaleDate: timestamp("ticket_sale_date"), // When tickets go on sale
  time: text("time"), // Event time display
  source: text("source").default("test"), // Data source: test, seatgeek, ticketmaster
  imageUrl: text("image_url"),
  attendeeCount: integer("attendee_count").default(0),
  isHot: boolean("is_hot").default(false),
  isTrending: boolean("is_trending").default(false),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  ticketUrl: text("ticket_url"), // External ticket purchase URL
  ticketProvider: text("ticket_provider"), // e.g., "Ticketmaster", "SeatGeek", "EventBrite"
  ticketStatus: text("ticket_status").default("available"), // available, sold_out, coming_soon
  venueUrl: text("venue_url"), // Venue website URL
  createdAt: timestamp("created_at").defaultNow(),
});

export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  radius: integer("radius").default(50),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  attendeeCount: true,
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({
  id: true,
  createdAt: true,
});


export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const categories = [
  { id: 'all', label: 'All', icon: 'grid', color: 'primary' },
  { id: 'entertainment', label: 'Entertainment', icon: 'music', color: 'entertainment' },
  { id: 'government', label: 'Government', icon: 'landmark', color: 'government' },
  { id: 'sports', label: 'Sports', icon: 'futbol', color: 'sports' },
  { id: 'arts', label: 'Arts', icon: 'palette', color: 'arts' },
  { id: 'community', label: 'Community', icon: 'users', color: 'community' },
] as const;

export type CategoryId = typeof categories[number]['id'];

// Advanced filtering types
export interface EventFilters {
  categories: CategoryId[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  timeRange: {
    start?: string; // HH:MM format
    end?: string;   // HH:MM format
  };
  priceRange: {
    min?: number;
    max?: number;
  };
  ticketProviders: string[]; // e.g., ['Ticketmaster', 'SeatGeek', 'EventBrite']
  radius?: number; // in kilometers
  sortBy: 'date' | 'distance' | 'popularity' | 'price';
  sortOrder: 'asc' | 'desc';
  showOnlyFree?: boolean;
  showOnlyToday?: boolean;
  showOnlyWeekend?: boolean;
}

export const defaultFilters: EventFilters = {
  categories: ['all'],
  dateRange: {
    start: new Date(), // Default to today - no past events
  },
  timeRange: {},
  priceRange: {},
  ticketProviders: [], // Empty array means all providers
  sortBy: 'date',
  sortOrder: 'asc',
};

// Available ticket providers
export const ticketProviders = [
  'Ticketmaster',
  'SeatGeek', 
  'EventBrite',
  'StubHub',
  'Vivid Seats',
  'Other'
] as const;