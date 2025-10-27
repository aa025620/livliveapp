# Complete iOS App Build Instructions for Xcode & App Store

## Current Status
✅ Web app compiled and running  
✅ Capacitor partially configured (App ID: `com.fourfs.livlive`, Name: "Liv'Live")  
❌ Source files removed (but available in git history)  
❌ Xcode project not generated  
❌ App Store assets not prepared  

---

## 🚪 GATE 1: Restore Source Files

### Why This Matters
Your TypeScript/React source files were compiled and removed. We need them to rebuild the iOS app properly.

### Steps:
1. **Restore source files from git:**
   ```bash
   git checkout 8feb3bb -- client/ server/ shared/ package.json tsconfig.json vite.config.ts capacitor.config.ts drizzle.config.ts
   ```

2. **Verify restoration:**
   ```bash
   ls -la package.json
   ls -la client/src/
   ls -la server/
   ```

### ✓ Gate 1 Checkpoint
- [ ] `package.json` exists in root
- [ ] `client/src/` directory exists with `.tsx` files
- [ ] `server/` directory exists with `.ts` files

**Do not proceed until all checkboxes are checked.**

---

## 🚪 GATE 2: Install Dependencies & Build

### Why This Matters
We need all npm packages and a fresh build before generating the iOS project.

### Steps:
1. **Install all dependencies:**
   ```bash
   npm install
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Verify build outputs:**
   ```bash
   ls -la dist/index.js
   ls -la dist/public/index.html
   ```

### ✓ Gate 2 Checkpoint
- [ ] `npm install` completed without errors
- [ ] `dist/index.js` exists (backend)
- [ ] `dist/public/index.html` exists (frontend)
- [ ] `dist/public/assets/` contains JS/CSS files

**Do not proceed until all checkboxes are checked.**

---

## 🚪 GATE 3: Generate Xcode Project with Capacitor

### Why This Matters
This creates the actual Xcode project files needed to build the iOS app.

### Steps:
1. **Run Capacitor doctor to check setup:**
   ```bash
   npx cap doctor
   ```

2. **Sync Capacitor with iOS:**
   ```bash
   npx cap sync ios
   ```

3. **Verify Xcode project created:**
   ```bash
   ls -la ios/App/App.xcodeproj/
   ls -la ios/App/App.xcworkspace/
   ```

### ✓ Gate 3 Checkpoint
- [ ] `npx cap doctor` shows iOS is ready
- [ ] `ios/App/App.xcworkspace/` directory exists
- [ ] `ios/App/Podfile` exists
- [ ] No error messages from `cap sync`

**Do not proceed until all checkboxes are checked.**

---

## 🚪 GATE 4: Configure Xcode Project

### Why This Matters
Xcode needs proper signing, versioning, and permissions before you can build.

### Steps:
1. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **Configure in Xcode (do these in order):**

   a. **Select App target** (in left sidebar)
   
   b. **General tab:**
      - Display Name: `Liv'Live`
      - Bundle Identifier: `com.fourfs.livlive`
      - Version: `1.0.0`
      - Build: `1`
      - Deployment Target: `iOS 15.0` (or higher)
   
   c. **Signing & Capabilities tab:**
      - ✅ Automatically manage signing
      - Team: Select your Apple Developer team
      - Note: You MUST have an Apple Developer account ($99/year)
   
   d. **Info tab (or Info.plist):**
      Add required permissions if your app uses:
      - Camera: `Privacy - Camera Usage Description`
      - Location: `Privacy - Location When In Use Usage Description`
      - Photo Library: `Privacy - Photo Library Usage Description`

3. **Test build on simulator:**
   - Select iPhone 15 Pro (or any simulator)
   - Click ▶️ Run button
   - App should launch in simulator

### ✓ Gate 4 Checkpoint
- [ ] Xcode opened without errors
- [ ] Signing configured with valid team
- [ ] App builds successfully (⌘+B)
- [ ] App runs in simulator without crashes

**Do not proceed until all checkboxes are checked.**

---

## 🚪 GATE 5: Prepare App Store Assets

### Why This Matters
App Store requires specific assets and metadata before you can submit.

### Required Assets Checklist:

#### App Icons (all required sizes):
- [ ] 1024×1024 (App Store)
- [ ] 180×180 (iPhone)
- [ ] 167×167 (iPad Pro)
- [ ] 152×152 (iPad)
- [ ] 120×120 (iPhone)
- [ ] 87×87 (iPhone notification)
- [ ] 80×80 (iPad spotlight)
- [ ] 76×76 (iPad)
- [ ] 60×60 (iPhone spotlight)
- [ ] 58×58 (iPhone notification)
- [ ] 40×40 (spotlight)
- [ ] 29×29 (settings)
- [ ] 20×20 (notification)

**Tool to generate icons:** https://appicon.co/

#### Screenshots (required for each device):
- [ ] 6.7" iPhone (1290 × 2796 pixels) - at least 3 screenshots
- [ ] 6.5" iPhone (1284 × 2778 pixels) - at least 3 screenshots
- [ ] 12.9" iPad Pro (2048 × 2732 pixels) - at least 3 screenshots

**How to capture:** Run app on simulators and use ⌘+S

#### App Store Connect Information:
- [ ] App name (30 characters max)
- [ ] Subtitle (30 characters max)
- [ ] Keywords (100 characters, comma separated)
- [ ] Description (4000 characters max)
- [ ] Promotional text (170 characters)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Age rating questionnaire completed
- [ ] App category (Primary & Secondary)

### Steps to Add Icons in Xcode:
1. Open Xcode project
2. Click `Assets.xcassets` in left sidebar
3. Click `AppIcon`
4. Drag & drop each icon size into corresponding slot
5. Save (⌘+S)

### ✓ Gate 5 Checkpoint
- [ ] All app icon sizes added to Xcode
- [ ] Screenshots captured for required devices
- [ ] App Store metadata prepared in document

**Do not proceed until all checkboxes are checked.**

---

## 🚪 GATE 6: Archive & Upload to App Store

### Why This Matters
This creates the final build and uploads it to Apple for review.

### Prerequisites:
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect app created
- [ ] Distribution certificate installed
- [ ] App Store provisioning profile created

### Steps:

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Click ➕ "New App"
   - Bundle ID: `com.fourfs.livlive`
   - SKU: `livlive-001` (any unique identifier)
   - Full Access: Yes

2. **Archive in Xcode:**
   - Select "Any iOS Device (arm64)" as build target
   - Menu: Product → Archive
   - Wait for archive to complete (5-10 minutes)

3. **Upload to App Store:**
   - Organizer window will open automatically
   - Select your archive
   - Click "Distribute App"
   - Select "App Store Connect"
   - Select "Upload"
   - Follow prompts to upload

4. **Complete App Store Connect:**
   - Go to App Store Connect
   - Select your app
   - Fill in all required metadata
   - Upload screenshots
   - Set pricing ($0 for free)
   - Submit for review

### ✓ Gate 6 Checkpoint
- [ ] Archive created successfully in Xcode
- [ ] Upload to App Store completed
- [ ] Build appears in App Store Connect under TestFlight
- [ ] App metadata completed
- [ ] Submitted for review

**Estimated review time: 24-48 hours**

---

## 🚪 GATE 7: Push to GitHub

### Why This Matters
Version control and backup of your source code.

### Steps:

1. **Create .gitignore (if not exists):**
   ```bash
   cat > .gitignore << 'EOF'
   # Dependencies
   node_modules/
   .npm
   .pnp
   .pnp.js
   
   # Build outputs
   dist/
   build/
   
   # Capacitor
   ios/App/App/public/
   ios/App/Pods/
   ios/App/App.xcworkspace/xcuserdata/
   .DS_Store
   
   # Environment
   .env
   .env.local
   .env.*.local
   
   # Logs
   *.log
   npm-debug.log*
   
   # IDE
   .vscode/
   .idea/
   *.swp
   *.swo
   
   # Cache
   .cache/
   .local/
   .config/
   EOF
   ```

2. **Initialize git (if needed):**
   ```bash
   git init
   git branch -M main
   ```

3. **Add files:**
   ```bash
   git add .
   git commit -m "Complete iOS app source code"
   ```

4. **Add GitHub remote (replace with your repo):**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```

5. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

### Files that WILL be committed:
✅ Source code (`client/`, `server/`, `shared/`)  
✅ Config files (`package.json`, `capacitor.config.ts`, etc.)  
✅ iOS native config (`ios/App/App.xcodeproj/`, `ios/App/Podfile`)  
✅ Documentation (`README.md`, this file)  

### Files that will NOT be committed (per .gitignore):
❌ `node_modules/`  
❌ `dist/`  
❌ `ios/App/App/public/` (generated)  
❌ `.env` files  
❌ Build artifacts  

### ✓ Gate 7 Checkpoint
- [ ] `.gitignore` created
- [ ] All source files committed
- [ ] Pushed to GitHub successfully
- [ ] GitHub repository shows all files

---

## 🎯 Success Criteria

You've successfully completed the iOS build when:
- ✅ App runs in Xcode simulator
- ✅ Archive created without errors
- ✅ Build uploaded to App Store Connect
- ✅ App appears in TestFlight
- ✅ Source code on GitHub

---

## 🆘 Troubleshooting

### "No signing identity found"
→ Add your Apple Developer account in Xcode → Settings → Accounts

### "Provisioning profile doesn't match"
→ Enable "Automatically manage signing" in Xcode

### "Module not found" errors
→ Run `npm install` and `npx cap sync ios` again

### "Build failed" in Xcode
→ Clean build folder (⌘+Shift+K) and rebuild

### Capacitor plugin errors
→ Run `npx cap sync ios` to update native code

---

## 📞 Next Steps After Approval

1. **Monitor App Store Connect** for review status
2. **Respond to rejections** if any (usually metadata issues)
3. **Test via TestFlight** before public release
4. **Set release date** when approved
5. **Monitor crash reports** in App Store Connect

---

## 📋 Useful Commands Reference

```bash
# Rebuild everything from scratch
npm run build && npx cap sync ios

# Open iOS project in Xcode
npx cap open ios

# Update native code after dependency changes
npx cap sync ios

# Check Capacitor setup
npx cap doctor

# Clean Capacitor cache
npx cap sync ios --force
```

---

**Estimated Total Time:** 4-8 hours (first time)  
**Cost:** $99/year Apple Developer Program  
**Review Time:** 24-48 hours (Apple's review)
