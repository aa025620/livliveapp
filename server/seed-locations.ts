import { db } from "./db";
import { events } from "@shared/schema";

export async function seedLocationBasedEvents() {
  console.log("Seeding location-based events...");
  
  // Delete existing events first
  await db.delete(events);
  
  // Add Dallas area events
  const dallasEvents = [
    {
      title: "Dallas Art Fair",
      description: "Premier contemporary art fair featuring galleries from around the world",
      category: "arts",
      location: "Dallas, TX",
      address: "Fashion Industry Gallery, 1807 Ross Ave, Dallas, TX 75201",
      latitude: "32.7876",
      longitude: "-96.7994",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      price: "25.00",
      attendeeCount: 890,
      isHot: true,
    },
    {
      title: "Fort Worth Stock Show",
      description: "World's largest livestock show and rodeo",
      category: "entertainment",
      location: "Fort Worth, TX",
      address: "Will Rogers Memorial Center, 3401 W Lancaster Ave, Fort Worth, TX 76107",
      latitude: "32.7313",
      longitude: "-97.3584",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      price: "15.00",
      attendeeCount: 1250,
      isTrending: true,
    },
    {
      title: "Arlington Music Festival",
      description: "Three-day outdoor music festival featuring local and national acts",
      category: "entertainment",
      location: "Arlington, TX",
      address: "Levitt Pavilion, 100 W Abram St, Arlington, TX 76010",
      latitude: "32.7357",
      longitude: "-97.1081",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      price: "0.00",
      attendeeCount: 2100,
      isHot: true,
    },
    {
      title: "Plano Food Truck Festival",
      description: "Family-friendly festival with food trucks, live music, and activities",
      category: "community",
      location: "Plano, TX",
      address: "Haggard Park, 901 E 15th St, Plano, TX 75074",
      latitude: "33.0198",
      longitude: "-96.6989",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      price: "0.00",
      attendeeCount: 850,
    },
  ];

  // Add Austin area events (100+ miles from Dallas)
  const austinEvents = [
    {
      title: "Austin City Limits Music Festival",
      description: "Annual music festival featuring diverse lineup of artists",
      category: "entertainment",
      location: "Austin, TX",
      address: "Zilker Park, 2100 Barton Springs Rd, Austin, TX 78746",
      latitude: "30.2672",
      longitude: "-97.7431",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      price: "275.00",
      attendeeCount: 75000,
      isHot: true,
      isTrending: true,
    },
    {
      title: "South by Southwest (SXSW)",
      description: "Interactive, film, and music festival",
      category: "arts",
      location: "Austin, TX",
      address: "Downtown Austin, TX",
      latitude: "30.2672",
      longitude: "-97.7431",
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      price: "150.00",
      attendeeCount: 42000,
      isTrending: true,
    },
  ];

  // Add Houston area events (200+ miles from Dallas)
  const houstonEvents = [
    {
      title: "Houston Livestock Show and Rodeo",
      description: "World's largest livestock exhibition and rodeo",
      category: "entertainment",
      location: "Houston, TX",
      address: "NRG Stadium, 1 NRG Pkwy, Houston, TX 77054",
      latitude: "29.7604",
      longitude: "-95.3698",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      price: "45.00",
      attendeeCount: 2500000,
      isHot: true,
    },
  ];

  // Insert all events
  const allEvents = [...dallasEvents, ...austinEvents, ...houstonEvents];
  
  for (const event of allEvents) {
    await db.insert(events).values(event);
  }

  console.log(`Seeded ${allEvents.length} location-based events`);
}