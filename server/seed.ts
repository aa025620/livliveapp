import { db } from "./db";
import { events } from "@shared/schema";

const sampleEvents = [
  // Free events for "Free only" filter
  {
    title: "Arlington Music Festival",
    description: "Experience the best of Texas music with legendary performers and emerging artists. Food trucks and craft beer available.",
    category: "entertainment",
    location: "River Legacy Park",
    address: "703 NW Green Oaks Blvd, Arlington, TX 76006",
    latitude: "32.7081",
    longitude: "-97.1531",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    time: "8:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: true,
    isTrending: true,
    attendeeCount: 1247,
    price: 0,
  },
  {
    title: "Morning Yoga in the Park",
    description: "Free community yoga session in beautiful park setting. Bring your own mat.",
    category: "community",
    location: "River Legacy Park",
    address: "703 NW Green Oaks Blvd, Arlington, TX 76006",
    latitude: "32.7081",
    longitude: "-97.1531",
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    time: "8:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 60,
    price: 0,
  },
  {
    title: "City Council Meeting",
    description: "Monthly city council meeting discussing budget allocations, park improvements, and traffic safety measures.",
    category: "government",
    location: "Arlington City Hall",
    address: "101 W Abram St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: "7:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 23,
    price: 0,
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
    date: new Date(Date.now() + (6 - new Date().getDay()) * 24 * 60 * 60 * 1000), // Next Saturday
    time: "9:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 450,
    price: 0,
  },
  {
    title: "Sunday Jazz Brunch",
    description: "Elegant brunch with live jazz music in downtown Arlington.",
    category: "entertainment",
    location: "Arlington Music Hall",
    address: "224 N Center St, Arlington, TX 76011",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + (7 - new Date().getDay()) * 24 * 60 * 60 * 1000), // Next Sunday
    time: "11:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 120,
    price: 65,
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
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    time: "6:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 40,
    price: 185,
  },
  {
    title: "Texas Rangers vs Angels",
    description: "MLB regular season game featuring the Texas Rangers taking on the Los Angeles Angels. Pre-game festivities start at 6 PM.",
    category: "sports",
    location: "Globe Life Field",
    address: "734 Stadium Dr, Arlington, TX 76011",
    latitude: "32.7472",
    longitude: "-97.0833",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: "7:05 PM",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 15429,
    price: 125,
  },
  {
    title: "Modern Art Exhibition Opening",
    description: "Opening reception for 'Contemporary Visions' featuring works by local and international artists. Wine and light refreshments provided.",
    category: "arts",
    location: "Arlington Museum of Art",
    address: "201 W Main St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    time: "6:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 156,
    price: 25,
  },
  {
    title: "Arlington Farmers Market",
    description: "Weekly farmers market featuring local produce, artisanal foods, and handmade crafts. Live music and family activities.",
    category: "community",
    location: "Downtown Arlington",
    address: "200 E Main St, Arlington, TX 76010",
    latitude: "32.7357",
    longitude: "-97.1081",
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    time: "10:00 AM",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    isHot: false,
    isTrending: false,
    attendeeCount: 342,
    price: 0,
  },
];

export async function seedDatabase(forceRefresh = false) {
  try {
    console.log("Seeding database with sample events...");
    
    // Check if we already have events
    const existingEvents = await db.select().from(events);
    if (existingEvents.length > 0 && !forceRefresh) {
      console.log("Database already has events, forcing refresh for clean titles.");
      await db.delete(events);
      console.log("Cleared existing events with suffixes for clean titles.");
    }
    
    // If forcing refresh, clear existing events first
    if (forceRefresh && existingEvents.length > 0) {
      await db.delete(events);
      console.log("Cleared existing events for refresh.");
    }
    
    // Use clean sample events without variations for MVP
    const modifiedEvents = sampleEvents.map(event => ({
      ...event,
      date: new Date(event.date.getTime() + (Math.random() - 0.5) * 2 * 60 * 60 * 1000)
    }));
    
    // Insert sample events
    await db.insert(events).values(modifiedEvents);
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}