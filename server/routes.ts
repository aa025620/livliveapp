import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertUserLocationSchema } from "@shared/schema";
import { seedDatabase } from "./seed";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAppleAuth } from "./appleAuth";
import { addCombinedEventsRoute } from "./routes/events-combined";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  setupAppleAuth(app);

  // Add combined events route
  addCombinedEventsRoute(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Database refresh endpoint for demonstration
  app.post("/api/database/refresh", async (req, res) => {
    try {
      await seedDatabase(true); // Force refresh
      res.json({ message: "Database refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing database:", error);
      res.status(500).json({ error: "Failed to refresh database" });
    }
  });

  // SeatGeek API test endpoint
  app.get("/api/seatgeek/test", async (req, res) => {
    try {
      const { seatGeekAPI } = await import("./seatgeek");
      
      // Test basic API call without complex parameters
      const basicTest = await fetch(`https://api.seatgeek.com/2/events?client_id=${process.env.SEATGEEK_CLIENT_ID}&per_page=5`);
      const basicResponse = await basicTest.text();
      
      console.log('SeatGeek basic test status:', basicTest.status);
      console.log('SeatGeek basic test response:', basicResponse.substring(0, 500));
      
      res.json({
        status: basicTest.status,
        response: basicResponse.substring(0, 500),
        configured: !!(process.env.SEATGEEK_CLIENT_ID && process.env.SEATGEEK_CLIENT_SECRET)
      });
    } catch (error: any) {
      console.error("Error testing SeatGeek API:", error);
      res.status(500).json({ error: "Failed to test SeatGeek API", details: error.message });
    }
  });

  // SeatGeek events API
  app.get("/api/events/seatgeek", async (req, res) => {
    try {
      const { seatGeekAPI } = await import("./seatgeek");
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude as string) : undefined;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;
      const category = req.query.category as string;
      
      console.log("SeatGeek events request:", { userLatitude, userLongitude, radius, category });
      
      let seatGeekEvents;
      if (category && category !== 'all') {
        seatGeekEvents = await seatGeekAPI.getEventsByCategory(category, userLatitude, userLongitude, radius);
      } else if (userLatitude && userLongitude) {
        seatGeekEvents = await seatGeekAPI.getEventsByLocation(userLatitude, userLongitude, radius);
      } else {
        seatGeekEvents = await seatGeekAPI.searchEvents({ per_page: 50 });
      }
      
      console.log("SeatGeek events response:", seatGeekEvents.length, "events");
      res.json(seatGeekEvents);
    } catch (error: any) {
      console.error("Error fetching SeatGeek events:", error);
      res.status(500).json({ error: "Failed to fetch SeatGeek events", details: error.message });
    }
  });

  // Live events from Ticketmaster API
  app.get("/api/events/live", async (req, res) => {
    try {
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude as string) : undefined;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude as string) : undefined;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      
      console.log("Live events request:", { userLatitude, userLongitude, radius });
      
      const liveEvents = await storage.getLiveEvents(userLatitude, userLongitude, radius);
      console.log("Live events response:", liveEvents.length, "events");
      
      res.json(liveEvents);
    } catch (error: any) {
      console.error("Error fetching live events:", error);
      res.status(500).json({ error: "Failed to fetch live events", details: error.message });
    }
  });

  // Events routes (specific routes before parameterized ones)
  app.get("/api/events", async (req, res) => {
    try {
      const category = req.query.category as string;
      const location = req.query.location as string;
      const categories = req.query.categories as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as string;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const showOnlyFree = req.query.showOnlyFree === 'true';
      const showOnlyToday = req.query.showOnlyToday === 'true';
      const showOnlyWeekend = req.query.showOnlyWeekend === 'true';
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      const userLatitude = req.query.userLatitude ? parseFloat(req.query.userLatitude as string) : undefined;
      const userLongitude = req.query.userLongitude ? parseFloat(req.query.userLongitude as string) : undefined;
      
      // Check if any advanced filters are applied (excluding basic location data)
      const hasAdvancedFilters = categories || sortBy || sortOrder || minPrice !== undefined || maxPrice !== undefined || 
                                startDate || endDate || showOnlyFree || showOnlyToday || showOnlyWeekend || radius;
      
      let events;
      if (hasAdvancedFilters) {
        events = await storage.getEventsWithFilters({
          category,
          categories: categories ? categories.split(',') : undefined,
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
        events = await storage.getEvents(category, location);
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Trending and hot events (must be before /api/events/:id)
  app.get("/api/events/trending", async (req, res) => {
    try {
      const events = await storage.getTrendingEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending events" });
    }
  });

  app.get("/api/events/hot", async (req, res) => {
    try {
      const events = await storage.getHotEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hot events" });
    }
  });

  // Location-based events
  app.get("/api/events/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.lat as string);
      const longitude = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      const events = await storage.getEventsByLocation(latitude, longitude, radius);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
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

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
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

  app.delete("/api/events/:id", async (req, res) => {
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

  // Category counts
  app.get("/api/categories/counts", async (req, res) => {
    try {
      const location = req.query.location as string;
      const counts = await storage.getEventCountsByCategory(location);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category counts" });
    }
  });

  // Location routes
  app.get("/api/location/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const location = await storage.getUserLocation(userId);
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user location" });
    }
  });

  app.post("/api/location", async (req, res) => {
    try {
      console.log("Received location data:", req.body);
      const locationData = insertUserLocationSchema.parse(req.body);
      console.log("Parsed location data:", locationData);
      const location = await storage.saveUserLocation(locationData);
      res.json(location);
    } catch (error: any) {
      console.error("Location validation error:", error);
      res.status(400).json({ error: "Invalid location data", details: error.message });
    }
  });





  // Venue events endpoint
  app.get("/api/events/by-venue", async (req, res) => {
    try {
      const { venue } = req.query;
      
      if (!venue) {
        return res.status(400).json({ error: "Venue name is required" });
      }

      console.log(`Searching for events at venue: ${venue}`);

      // Return some sample events for the venue
      const mockVenueEvents = [
        {
          id: Math.floor(Math.random() * 1000000),
          title: `Sample Event at ${venue}`,
          location: venue as string,
          address: `123 Main St, City, State`,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: "7:00 PM",
          category: 'entertainment',
          price: "25",
          ticketUrl: "https://example.com/tickets",
          ticketProvider: "SeatGeek",
          ticketStatus: "available",
          description: `Join us for an amazing event at ${venue}!`,
          imageUrl: null
        },
        {
          id: Math.floor(Math.random() * 1000000),
          title: `Another Event at ${venue}`,
          location: venue as string,
          address: `123 Main St, City, State`,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: "8:00 PM", 
          category: 'entertainment',
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
    } catch (error: any) {
      console.error("Failed to fetch venue events:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
