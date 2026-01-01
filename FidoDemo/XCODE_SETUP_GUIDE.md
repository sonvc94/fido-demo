# Xcode Project Setup Guide for FIDO2 iOS App

## Quick Start

### Step 1: Create Xcode Project
1. Open Xcode
2. **File** → **New** → **Project**
3. **iOS** → **App**
4. Product Name: `FidoDemo`
5. Team: Select your development team
6. Organization Identifier: `com.fidodemo`
7. Bundle Identifier: `com.fidodemo.FidoDemo`
8. Interface: **SwiftUI**
9. Language: **Swift**
10. Uncheck "Use Core Data"
11. Save in: Current directory (replace if prompted)

### Step 2: Add Face ID Permission
1. Select your project → **FidoDemo** target
2. Go to **Info** tab
3. Click **+** under "Custom iOS Target Properties"
4. Add: **Privacy - Face ID Usage Description**
   - Key: `NSFaceIDUsageDescription`
   - Value: `Use Face ID to log in quickly and securely.`
   - Type: String

### Step 3: Replace Default Files
1. In Project Navigator, delete:
   - `ContentView.swift` (Move to Trash)
   - `FidoDemoApp.swift` (Move to Trash)

### Step 4: Copy Our Swift Files
```bash
# Copy all files to your Xcode project
cp -r FidoDemo/* /path/to/your/Xcode/project/
```

In Xcode:
1. Right-click on your project
2. **Add Files to "FidoDemo"...**
3. Select all Swift files
4. ✅ Check "Copy items if needed"
5. ✅ Check "Create groups"
6. Add to target: **FidoDemo**

### Step 5: Build & Run
1. Select a physical iOS device (iPhone X or newer)
2. Product → Clean Build Folder (Cmd + Shift + K)
3. Product → Run (Cmd + R)

## Configuration

### API Endpoint
The app is configured to use:
```
API: https://fido-api.vuongchison.com
RP ID: fido-api.vuongchison.com
```

To change, edit `Config.swift`

### Deployment Target
- iOS 15.0 or higher

### Device Requirements
- Physical iOS device (Face ID or Touch ID)
- iOS 15.0+
- Passcode enabled
- Face ID/Touch ID enabled in Settings

## Testing

### Test Password Login
1. Username: `user`
2. Password: `user`
3. Tap "Login with Password"

### Test Biometric Registration
1. After password login, see "Set Up Biometric Login" banner
2. Tap "Set Up Now"
3. Approve Face ID/Touch ID
4. Wait for success message

### Test Biometric Login
1. Logout
2. Tap "Login with Face ID"
3. Approve Face ID/Touch ID
4. Get logged in automatically!

## Troubleshooting

### "Build Target Not Found"
- Project wasn't created yet - follow Step 1 above

### "No such module 'AuthenticationServices'"
- Deployment target must be iOS 15.0+
- Clean and rebuild

### "Face ID Not Available"
- Requires physical device (not simulator)
- Device must support Face ID/Touch ID
- Face ID must be enabled in Settings
- Passcode must be set

### "Cannot connect to server"
- Check internet connection
- Verify API URL in Config.swift
- Ensure backend is running

### "Invalid Origin"
- RP ID must match backend configuration
- Backend must have your domain in allowed origins

## Success Criteria

✅ Build succeeds without errors
✅ App launches on device
✅ Login page appears
✅ Password login works
✅ Face ID button visible
✅ Registration prompt appears after password login
✅ Face ID registration works
✅ Biometric login works

## Need Help?

Check the main README.md or review the documentation in docs/
