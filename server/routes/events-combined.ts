import type { Express } from "express";
import { storage } from "../storage";
import { type Event } from "@shared/schema";
import { fetchEventbriteEvents } from "../eventbrite";


// Helper function to get the best quality image from Ticketmaster
function getBestTicketmasterImage(images: any[]): string | null {
  if (!images || images.length === 0) return null;
  
  // Sort by resolution (width * height) and get the largest
  const sortedImages = images
    .filter(img => img.width && img.height)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
  if (sortedImages.length > 0) {
    // Return the highest resolution image
    return sortedImages[0].url;
  }
  
  // If no dimensions found, just return the first image
  return images[0]?.url || null;
}

// Helper function to get the best quality image from SeatGeek
function getBestSeatGeekImage(performers: any[]): string | null {
  if (!performers || performers.length === 0) return null;
  
  // Look for the main performer's image
  const mainPerformer = performers.find(p => p.primary === true) || performers[0];
  return mainPerformer?.image || null;
}


// Add combined events route that fetches from all sources
export function addCombinedEventsRoute(app: Express) {
  app.get("/api/events/combined", async (req, res) => {
    try {
      const { userLatitude, userLongitude, radius = "50", categories, minPrice, maxPrice, ticketProviders } = req.query;
      
      const allEvents: Event[] = [];
      
      // Fetch from test/database events
      try {
        const params = new URLSearchParams();
        if (categories) params.append("categories", categories as string);
        if (userLatitude && userLongitude) {
          params.append("userLatitude", userLatitude as string);
          params.append("userLongitude", userLongitude as string);
          params.append("radius", radius as string);
        }
        if (minPrice) params.append("minPrice", minPrice as string);
        if (maxPrice) params.append("maxPrice", maxPrice as string);
        
        const testEvents = await storage.getEventsWithFilters({
          categories: categories ? (categories as string).split(",") : undefined,
          userLatitude: userLatitude ? parseFloat(userLatitude as string) : undefined,
          userLongitude: userLongitude ? parseFloat(userLongitude as string) : undefined,
          radius: radius ? parseInt(radius as string) : undefined,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        });
        
        allEvents.push(...testEvents);
      } catch (error) {
        console.error("Failed to fetch test events:", error);
      }
      
      // Fetch from Ticketmaster if location is available
      if (userLatitude && userLongitude) {
        try {
          const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&latlong=${userLatitude},${userLongitude}&radius=${radius}&unit=miles&size=20&sort=date,asc&startDateTime=${new Date().toISOString().split('T')[0]}T00:00:00Z&embed=venues`;
          
          const response = await fetch(ticketmasterUrl);
          if (response.ok) {
            const data = await response.json();
            
            if (data._embedded?.events) {
              let ticketmasterEvents = data._embedded.events.map((event: any) => {
                const venue = event._embedded?.venues?.[0];
                const location = venue?.location || {};
                
                return {
                  id: `tm_${event.id}` || Math.random() * 1000000,
                  title: event.name,
                  description: event.info || event.pleaseNote || "No description available",
                  category: mapTicketmasterCategory(event.classifications?.[0]?.segment?.name || event.classifications?.[0]?.genre?.name),
                  date: event.dates?.start?.dateTime 
                    ? new Date(event.dates.start.dateTime).toISOString().split('T')[0]
                    : event.dates?.start?.localDate || null,
                  utcDateTime: event.dates?.start?.dateTime 
                    ? new Date(event.dates.start.dateTime)
                    : event.dates?.start?.localDate 
                      ? new Date(`${event.dates.start.localDate}T${event.dates?.start?.localTime || '19:00:00'}`)
                      : new Date(),
                  time: event.dates?.start?.localTime ? 
                    new Date(`1970-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
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
                  ticketStatus: event.dates?.status?.code === "onsale" ? "available" : 
                             event.dates?.status?.code === "offsale" ? "sold_out" : "available",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  source: "ticketmaster" as const
                };
              });
              
              // Apply category filtering to Ticketmaster events if specified
              if (categories) {
                const categoryList = (categories as string).split(",");
                ticketmasterEvents = ticketmasterEvents.filter((event: any) => 
                  categoryList.includes(event.category)
                );
              }

              // Apply ticket provider filtering if specified  
              if (ticketProviders) {
                const providerList = (ticketProviders as string).split(",");
                ticketmasterEvents = ticketmasterEvents.filter((event: any) => 
                  providerList.includes(event.ticketProvider)
                );
              }
              
              allEvents.push(...ticketmasterEvents);
            }
          }
        } catch (error) {
          console.error("Failed to fetch Ticketmaster events:", error);
        }
        
        // Fetch from SeatGeek
        try {
          const seatgeekUrl = `https://api.seatgeek.com/2/events?client_id=${process.env.SEATGEEK_CLIENT_ID}&per_page=50&page=1&client_secret=${process.env.SEATGEEK_CLIENT_SECRET}&lat=${userLatitude}&lon=${userLongitude}&range=${radius}mi`;
          
          const response = await fetch(seatgeekUrl);
          if (response.ok) {
            const data = await response.json();
            
            if (data.events) {
              let seatgeekEvents = data.events.map((event: any) => ({
                  id: event.id,
                  title: event.title,
                  description: event.description || "No description available",
                  category: mapSeatGeekCategory(event.type),
                  date: event.datetime_utc 
                    ? new Date(event.datetime_utc).toISOString().split('T')[0]
                    : event.datetime_local 
                      ? new Date(event.datetime_local).toISOString().split('T')[0]
                      : null,
                  utcDateTime: event.datetime_utc 
                    ? new Date(event.datetime_utc)
                    : event.datetime_local 
                      ? new Date(event.datetime_local)
                      : null,
                  endDate: event.enddatetime_utc ? new Date(event.enddatetime_utc) : null,
                  ticketSaleDate: event.announce_date ? new Date(event.announce_date) : null,
                  time: event.datetime_local ? new Date(event.datetime_local).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
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
                ticketStatus: (event.url || event.venue?.url) ? "available" : "coming_soon",
                createdAt: new Date(),
                updatedAt: new Date(),
                source: "seatgeek" as const
              }));
              
              // Apply category filtering to SeatGeek events if specified
              if (categories) {
                const categoryList = (categories as string).split(",");
                seatgeekEvents = seatgeekEvents.filter((event: any) => 
                  categoryList.includes(event.category)
                );
              }

              // Apply ticket provider filtering if specified  
              if (ticketProviders) {
                const providerList = (ticketProviders as string).split(",");
                seatgeekEvents = seatgeekEvents.filter((event: any) => 
                  providerList.includes(event.ticketProvider)
                );
              }
              
              allEvents.push(...seatgeekEvents);
            }
          }
        } catch (error) {
          console.error("Failed to fetch SeatGeek events:", error);
        }

        // Fetch from Eventbrite
        try {
          let eventbriteEvents = await fetchEventbriteEvents(
            parseFloat(userLatitude as string),
            parseFloat(userLongitude as string),
            parseInt(radius as string)
          );

          // Apply category filtering to Eventbrite events if specified
          if (categories) {
            const categoryList = (categories as string).split(",");
            eventbriteEvents = eventbriteEvents.filter((event: Event) => 
              categoryList.includes(event.category)
            );
          }

          // Apply ticket provider filtering if specified  
          if (ticketProviders) {
            const providerList = (ticketProviders as string).split(",");
            eventbriteEvents = eventbriteEvents.filter((event: Event) => 
              providerList.includes(event.ticketProvider || "")
            );
          }

          allEvents.push(...eventbriteEvents);
        } catch (error) {
          console.error("Failed to fetch Eventbrite events:", error);
        }
      }
      
      // Filter out past/expired events using UTC timestamps
      const nowMs = Date.now();
      
      const futureEvents = allEvents.filter(event => {
        if (!event.date) return true; // Keep events without dates
        
        let endMs: number;
        
        // Use UTC datetime if available (from API providers)
        if ((event as any).utcDateTime) {
          endMs = new Date((event as any).utcDateTime).getTime();
        }
        // Use explicit end date if available (SeatGeek)
        else if (event.endDate) {
          endMs = new Date(event.endDate).getTime();
        }
        // Parse event date and time
        else if (event.time && event.time !== "TBA") {
          const eventDate = new Date(event.date);
          const timeMatch = event.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            const [, hours, minutes, period] = timeMatch;
            let hour24 = parseInt(hours);
            if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
            if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
            
            eventDate.setUTCHours(hour24, parseInt(minutes), 0, 0);
          }
          endMs = eventDate.getTime();
        }
        // For events without specific times, assume they end at 11:59 PM UTC on the event date
        else {
          const eventDate = new Date(event.date);
          eventDate.setUTCHours(23, 59, 59, 999);
          endMs = eventDate.getTime();
        }
        
        
        return endMs > nowMs;
      });
      
      // Improved deduplication with normalized titles and consistent date comparison
      const normalizeTitle = (title: string): string => {
        return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      };
      
      const getDayKey = (event: any): string => {
        return event.utcDateTime ? new Date(event.utcDateTime).toISOString().slice(0, 10) : (event.date || "");
      };
      
      const getEventScore = (event: any): number => {
        let score = 0;
        if (event.ticketUrl) score += 4;
        if (event.ticketStatus === "available") score += 2;
        if (event.source === "ticketmaster") score += 3;
        else if (event.source === "seatgeek") score += 2;
        else score += 1; // test events
        if (event.imageUrl) score += 1;
        return score;
      };
      
      const uniqueEvents = futureEvents.filter((event, index, self) => {
        const eventDayKey = getDayKey(event);
        const eventTitle = normalizeTitle(event.title);
        const eventVenue = event.location?.toLowerCase() || "";
        
        const duplicateIndex = self.findIndex(e => {
          const eDayKey = getDayKey(e);
          const eTitle = normalizeTitle(e.title);
          const eVenue = e.location?.toLowerCase() || "";
          
          // Same day and (same venue or similar titles)
          const sameDay = eventDayKey === eDayKey;
          const sameVenue = eventVenue && eVenue && (eventVenue === eVenue || eventVenue.includes(eVenue) || eVenue.includes(eventVenue));
          const similarTitle = eventTitle.includes(eTitle) || eTitle.includes(eventTitle) || eventTitle === eTitle;
          
          return sameDay && (sameVenue || similarTitle);
        });
        
        if (duplicateIndex === index) return true;
        
        // Keep the event with higher score
        const duplicate = self[duplicateIndex];
        return getEventScore(event) > getEventScore(duplicate);
      });
      
      // Sort by date and popularity
      uniqueEvents.sort((a, b) => {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return dateA - dateB;
      });
      
      // Limit results to avoid overwhelming the UI
      const limitedEvents = uniqueEvents.slice(0, 100);
      
      res.json(limitedEvents);
      
    } catch (error) {
      console.error("Combined events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
}

function mapTicketmasterCategory(category: string): string {
  if (!category) return "entertainment";
  
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("music")) return "entertainment";
  if (categoryLower.includes("sport")) return "sports";
  if (categoryLower.includes("art") || categoryLower.includes("theatre")) return "arts";
  if (categoryLower.includes("family")) return "community";
  
  return "entertainment";
}

function mapSeatGeekCategory(category: string): string {
  if (!category) return "entertainment";
  
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("concert") || categoryLower.includes("music")) return "entertainment";
  if (categoryLower.includes("sports")) return "sports";
  if (categoryLower.includes("theater") || categoryLower.includes("broadway")) return "arts";
  if (categoryLower.includes("comedy")) return "entertainment";
  
  return "entertainment";
}