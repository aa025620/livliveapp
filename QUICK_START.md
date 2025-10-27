# Quick Start - Restore Source Files

## Step 1: Restore Source Files from Git

Run this command in the Replit Shell:

```bash
git checkout 8feb3bb -- client/ server/ shared/ package.json tsconfig.json vite.config.ts capacitor.config.ts drizzle.config.ts
```

This will restore all your TypeScript/React source files.

## Step 2: Verify Files Restored

```bash
ls -la package.json
ls -la client/src/
ls -la server/
```

You should see:
- ✅ `package.json` in the root
- ✅ `client/src/` directory with `.tsx` files
- ✅ `server/` directory with `.ts` files

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Build the Application

```bash
npm run build
```

## Step 5: Generate Xcode Project

```bash
npx cap sync ios
```

## Step 6: Open in Xcode

```bash
npx cap open ios
```

---

## After This, Follow the Complete Guide

See `IOS_BUILD_INSTRUCTIONS.md` for the full gated instructions including:
- Xcode configuration
- App Store asset preparation
- Upload to App Store Connect
- Push to GitHub

---

## Troubleshooting

If `git checkout` doesn't work, you may need to:
1. Clone your GitHub repository to a local machine
2. Copy the source files back to this Replit
3. Or contact support if files are permanently lost

If you get merge conflicts:
```bash
git reset --hard HEAD
git checkout 8feb3bb -- client/ server/ shared/ package.json tsconfig.json vite.config.ts capacitor.config.ts drizzle.config.ts
```
