# GitHub Repository Setup Guide

## Overview
This guide will help you push your iOS app source code to GitHub after completing the build.

---

## Prerequisites
- [ ] GitHub account created
- [ ] GitHub repository created (empty is fine)
- [ ] Repository URL ready (e.g., `https://github.com/YOUR_USERNAME/livlive-app.git`)

---

## Files Already Prepared
✅ `.gitignore` - Configured to exclude build files and secrets  
✅ Source files will be restored in Gate 1  
✅ iOS project will be generated in Gate 3  

---

## What Will Be Committed to GitHub

### ✅ Source Code (INCLUDE)
```
client/              # React frontend source
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── App.tsx
└── index.html

server/              # Express backend source
├── index.ts
├── routes.ts
├── storage.ts
├── seed.ts
├── seatgeek.ts
├── ticketmaster.ts
└── eventbrite.ts

shared/              # Shared TypeScript types
└── schema.ts

ios/                 # iOS native project
├── App/
│   ├── App.xcodeproj/    # Xcode project
│   ├── Podfile           # CocoaPods dependencies
│   └── App/
│       ├── Info.plist
│       └── capacitor.config.json
└── capacitor-cordova-ios-plugins/

Configuration Files:
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts
├── drizzle.config.ts
└── tailwind.config.ts
```

### ❌ Build Outputs (EXCLUDED by .gitignore)
```
node_modules/        # npm packages (100+ MB)
dist/                # Compiled code
ios/App/App/public/  # Generated web assets
.cache/              # Build cache
.local/              # Local config
.config/             # System config
.env                 # API keys and secrets
```

---

## Step-by-Step GitHub Push

### 1. Prepare Local Repository

After completing Gates 1-6 in `IOS_BUILD_INSTRUCTIONS.md`, run:

```bash
# Make sure you're in the project root
cd /home/runner/workspace

# Check current git status
git status
```

### 2. Stage All Files

```bash
# Add all files (respecting .gitignore)
git add .

# Review what will be committed
git status
```

You should see GREEN files like:
- ✅ client/src/
- ✅ server/
- ✅ shared/
- ✅ package.json
- ✅ ios/App/App.xcodeproj/

You should NOT see:
- ❌ node_modules/
- ❌ dist/
- ❌ .env

### 3. Commit Your Changes

```bash
git commit -m "Complete iOS app source code - ready for Xcode build"
```

### 4. Add GitHub Remote

Replace with YOUR repository URL:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 5. Push to GitHub

```bash
# First time push
git push -u origin main
```

If you get an error about branch name, try:
```bash
git branch -M main
git push -u origin main
```

### 6. Verify on GitHub

1. Go to your GitHub repository
2. You should see all your source files
3. Check that `node_modules/` is NOT there (should be ~50-100 files, not thousands)

---

## Future Updates

After making changes to your code:

```bash
# See what changed
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "Describe your changes here"

# Push to GitHub
git push
```

---

## Recommended Repository Structure

```
YOUR_REPO/
├── README.md                      # Project description
├── LICENSE                        # License file (MIT recommended)
├── .gitignore                     # Already created ✅
├── IOS_BUILD_INSTRUCTIONS.md      # Build guide ✅
├── client/                        # Frontend
├── server/                        # Backend
├── shared/                        # Shared code
├── ios/                           # iOS native
└── package.json                   # Dependencies
```

---

## Create a Good README.md

```markdown
# Liv'Live - Local Events Discovery App

## Description
Liv'Live helps users discover local events and activities through a mobile-first interface with real-time event data from SeatGeek, Ticketmaster, and Eventbrite.

## Features
- 🎉 Real-time event discovery
- 📍 Location-based search
- 🎭 Multiple event categories
- 🔥 Trending events
- 💾 Save favorite events
- 📱 Native iOS app

## Technology Stack
- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon)
- **Mobile:** Capacitor (iOS)
- **APIs:** SeatGeek, Ticketmaster, Eventbrite

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. Build the application:
   ```bash
   npm run build
   ```

5. Generate iOS project:
   ```bash
   npx cap sync ios
   ```

6. Open in Xcode:
   ```bash
   npx cap open ios
   ```

## Environment Variables

Required API keys:
- `SEATGEEK_CLIENT_ID`
- `SEATGEEK_CLIENT_SECRET`
- `TICKETMASTER_API_KEY`
- `EVENTBRITE_PRIVATE_TOKEN`
- `DATABASE_URL`

## Development

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run check      # Type check
npm run db:push    # Push database schema
```

## iOS Build

See [IOS_BUILD_INSTRUCTIONS.md](IOS_BUILD_INSTRUCTIONS.md) for complete iOS build and App Store submission guide.

## License
MIT

## Contact
Your Name - your.email@example.com
```

---

## Security Checklist Before Pushing

- [ ] No API keys in source code
- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded passwords
- [ ] No sensitive user data
- [ ] Database credentials using environment variables

---

## Common Issues

### "Permission denied (publickey)"
→ Set up SSH keys or use HTTPS with personal access token

### "Repository not found"
→ Check repository URL is correct and you have access

### "Failed to push some refs"
→ Pull first: `git pull origin main --rebase`

### Too many files
→ Check `.gitignore` is working: `git status` should show ~50-100 files

---

## Useful Git Commands

```bash
# See what's changed
git status
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo changes to a file
git checkout -- filename

# See commit history
git log --oneline

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

---

## Next Steps After Push

1. ✅ Add repository description on GitHub
2. ✅ Add topics/tags (iOS, React, TypeScript, etc.)
3. ✅ Enable Issues for bug tracking
4. ✅ Add collaborators if working with a team
5. ✅ Set up GitHub Actions for CI/CD (optional)
6. ✅ Add shields/badges to README (optional)

---

**Your code is now safely backed up on GitHub! 🎉**
