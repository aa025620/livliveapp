# Liv'Live Events App

## Overview

Liv'Live is a mobile-first progressive web application (PWA) for discovering local events. The app aggregates events from multiple sources (SeatGeek, Ticketmaster, Eventbrite) and presents them in a TikTok-style scrolling interface optimized for mobile devices. The application is built with React/TypeScript on the frontend, Express on the backend, and includes **Capacitor integration for iOS native deployment**.

## 🎯 Current Status (Updated: October 28, 2025)

### ✅ iOS Build Complete - Ready for Xcode!

The iOS app has been **fully built and is ready to open in Xcode**:

- ✅ Source files restored from git history
- ✅ All dependencies installed (888 npm packages)
- ✅ Application built for production (frontend + backend)
- ✅ Xcode project generated with Capacitor
- ✅ Web app running successfully on port 5000

### 📂 Current Project Structure

```
/home/runner/workspace/
├── client/                    # React frontend source
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.tsx
├── server/                    # Express backend source
│   ├── index.ts
│   ├── routes.ts
│   └── ...
├── shared/                    # Shared TypeScript types
│   └── schema.ts
├── dist/                      # Compiled production build
│   ├── index.js              # Backend (70.7 KB)
│   └── public/               # Frontend (459 KB)
├── ios/                       # iOS native project
│   └── App/
│       ├── App.xcodeproj/    # Xcode project
│       ├── App.xcworkspace/  # ← Open this in Xcode!
│       └── Podfile           # CocoaPods config
├── package.json               # Dependencies
├── capacitor.config.ts        # Capacitor config
└── BUILD_COMPLETE.md          # ⭐ Next steps guide
```

### 📱 iOS App Details

- **App ID:** `com.fourfs.livlive`
- **App Name:** Liv'Live
- **Platform:** iOS (via Capacitor)
- **Xcode Project:** `ios/App/App.xcworkspace`
- **Status:** Ready for Mac/Xcode configuration

### 📚 Documentation

- **BUILD_COMPLETE.md** - Main guide for Mac/Xcode steps
- **START_HERE.md** - Overview and roadmap
- **IOS_BUILD_INSTRUCTIONS.md** - Detailed 7-gate guide
- **GITHUB_SETUP.md** - Git/GitHub instructions
- **QUICK_START.md** - Command reference

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety and component-based architecture
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Radix UI primitives for accessible, unstyled UI components
- Tailwind CSS for utility-first styling with custom gradients and animations

**Mobile-First Design Decisions**
- TikTok-style vertical scrolling interface (`snap-y` with scroll-snap-type)
- Progressive Web App (PWA) with service worker for offline capability
- **Capacitor integration for iOS native app deployment**
- Safe area insets for devices with notches
- Touch-optimized interactions with disabled text selection and tap highlights
- High-quality image loading with responsive parameters

**State Management Strategy**
- React Query for server state (events, user location, authentication)
- Local React state for UI state (modals, filters, active tabs)
- Query invalidation on location changes to refresh event data
- Optimistic updates for better perceived performance

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API endpoints
- Middleware stack: JSON parsing, URL encoding, request logging with duration tracking

**Database Layer**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries
- Schema includes: events, users, user_locations, sessions (for auth)
- Connection pooling with @neondatabase/serverless

**Authentication System**
- Dual authentication: Replit OIDC for web + Apple Sign-In for iOS
- Passport.js for OIDC strategy implementation
- Session-based auth with connect-pg-simple for PostgreSQL session storage
- Session TTL: 1 week with secure, httpOnly cookies

**Event Aggregation Architecture**
- Combined events endpoint (`/api/events/combined`) that merges data from:
  - Local database (test/seeded events)
  - SeatGeek API (sports, concerts, theater)
  - Ticketmaster API (major events, concerts)
  - Eventbrite API (community events)
- Category mapping logic to normalize categories across sources
- Image quality optimization for each provider (requesting high-res versions)
- Geolocation filtering with radius-based queries

**API Design Patterns**
- RESTful endpoints with consistent error handling
- Query parameter filtering (categories, location, price, date ranges)
- Combined data source endpoint to reduce client requests
- Response transformation to normalize data structure across providers

### Data Storage Solutions

**Primary Database**
- PostgreSQL hosted on Neon (serverless)
- Tables: events, users, user_locations, sessions
- Decimal type for coordinates (latitude/longitude) and prices
- Timestamp fields with timezone support
- Text/varchar for flexible string storage

**Session Storage**
- PostgreSQL table managed by connect-pg-simple
- Automatic session cleanup based on TTL
- No manual session management required

**Caching Strategy**
- React Query cache on frontend (staleTime: Infinity, no auto-refetch)
- Service worker caching for static assets (PWA)
- Memoization of OIDC config (3600s cache)

### iOS Native Integration

**Capacitor Configuration**
- App ID: `com.fourfs.livlive`
- App Name: Liv'Live
- Web directory: `dist/public`
- iOS content inset: always
- Apple Sign-In plugin configured

**Build Process**
1. Source TypeScript/React compiled with Vite
2. Backend compiled with esbuild
3. Web assets copied to `ios/App/App/public/`
4. Xcode project generated with CocoaPods

**Next Steps (Requires Mac)**
- Install CocoaPods: `sudo gem install cocoapods`
- Run `pod install` in `ios/App/`
- Open `ios/App/App.xcworkspace` in Xcode
- Configure signing with Apple Developer account
- Test in iOS simulator
- Archive and upload to App Store

### External Dependencies

**Third-Party Event APIs**
- **SeatGeek**: Sports events, concerts, theater performances (requires client_id)
- **Ticketmaster**: Major events, concerts (requires API key)
- **Eventbrite**: Community events, meetups (requires OAuth token)

**Geolocation Services**
- **BigDataCloud**: Reverse geocoding (free, no API key required)
- Browser Geolocation API for user position
- Fallback chain: BigDataCloud → other providers → manual input

**Authentication Providers**
- **Replit OIDC**: Web authentication via replit.com/oidc
- **Apple Sign-In**: iOS native authentication via @capacitor-community/apple-sign-in
- JWT token verification for Apple tokens

**Payment Integration**
- **Stripe**: Payment processing infrastructure (React Stripe.js)
- Elements integration for card inputs
- Currently integrated but not actively used in event flows

**Development Tools**
- **Replit**: Development environment and hosting platform
- **Capacitor**: Native app bridge for iOS deployment
- iOS-specific dependencies: Xcode project files, CocoaPods

**Image Hosting**
- **Unsplash**: Fallback/placeholder event images with quality parameters
- Provider-specific CDNs: Ticketmaster, SeatGeek image URLs

**Database & Infrastructure**
- **Neon**: Serverless PostgreSQL with WebSocket support
- **Drizzle Kit**: Schema migrations and database push

**UI Component Libraries**
- **Radix UI**: Accessible primitives (40+ component packages)
- **Lucide React**: Icon library
- **React Day Picker**: Calendar component

**Map Integration** (Prepared but not fully implemented)
- Latitude/longitude storage for events and venues
- Venue modal with Google Maps integration
- Distance-based event filtering with radius parameter

## Development Workflow

### Running the Web App
```bash
npm run dev          # Development server (Vite + Express)
npm run build        # Production build
npm start            # Run production build
```

### iOS Development
```bash
npm run build        # Build web assets first
npx cap sync ios     # Sync to iOS project
npx cap open ios     # Open in Xcode (Mac only)
```

### Database
```bash
npm run db:push      # Push schema changes to database
```

## Recent Changes (October 28, 2025)

1. **iOS Build Completed**
   - Restored all source files from git history
   - Generated complete Xcode project
   - Created comprehensive documentation for Mac setup
   - Project ready for App Store submission

2. **Project Structure Organized**
   - Source code in proper directories (`client/`, `server/`, `shared/`)
   - Build outputs in `dist/`
   - iOS project in `ios/`
   - Documentation in root directory

3. **Documentation Created**
   - BUILD_COMPLETE.md - Primary iOS setup guide
   - Detailed instructions for Xcode configuration
   - App Store submission checklist
   - GitHub push instructions

## Next Steps

### For iOS App Store Submission:
1. Transfer project to Mac
2. Install CocoaPods
3. Run `pod install` in `ios/App/`
4. Open in Xcode
5. Configure signing (requires Apple Developer account - $99/year)
6. Create app icons and screenshots
7. Archive and upload to App Store Connect
8. Submit for review (24-48 hour review time)

### For GitHub:
1. Run `git add .`
2. Commit: `git commit -m "iOS app ready for Xcode"`
3. Push to GitHub repository

See **BUILD_COMPLETE.md** for complete step-by-step instructions.
