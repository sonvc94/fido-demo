# FIDO2 Biometric Authentication - Swift iOS App

## Overview

A modern iOS app that demonstrates passwordless authentication using FIDO2/WebAuthn standards with Face ID and Touch ID.

## Features

- ✅ Password login (initial authentication)
- ✅ Biometric registration after password login
- ✅ Passwordless login with Face ID/Touch ID
- ✅ Registration prompt banner
- ✅ Token management with Keychain
- ✅ Error handling and user feedback
- ✅ Beautiful SwiftUI interface

## Requirements

- iOS 15.0+
- Xcode 14.0+
- Swift 5.7+
- Physical iOS device (iPhone X or newer for Face ID)

## Quick Start

### 1. Create Xcode Project
Follow the guide in `XCODE_SETUP_GUIDE.md`

### 2. Configure Project
- Add Face ID usage description
- Set deployment target to iOS 15.0+
- Copy all Swift files to your Xcode project

### 3. Build and Run
- Select a physical device
- Press Cmd + R to run

## Project Structure

```
FidoDemo/
├── Models/                 # Data models
│   ├── AuthResponse.swift
│   └── WebAuthnModels.swift
├── Services/               # API and authentication
│   ├── AuthenticationService.swift
│   ├── TokenManager.swift
│   └── WebAuthnManager.swift
├── Views/                  # SwiftUI views
│   ├── LoginView.swift
│   └── DashboardView.swift
├── ViewModels/             # MVVM pattern
│   └── AuthViewModel.swift
├── Utils/                  # Utilities
│   └── KeychainManager.swift
├── Config.swift            # App configuration
├── FidoDemoApp.swift       # App entry point
└── Info.plist             # App configuration
```

## Configuration

The app is configured for:
- **API:** https://fido-api.vuongchison.com
- **RP ID:** fido-api.vuongchison.com

To change the API endpoint, modify `Config.swift`:
```swift
static let apiBaseURL = "https://your-api-domain.com"
static let rpID = "your-domain.com"
```

## Security

- Tokens stored securely in Keychain
- HTTPS communication only
- Face ID/Touch ID biometric authentication
- Cryptographic proof of identity
- No passwords stored locally

## Testing

### Test Flows

#### 1. Password Login
```
Username: user
Password: user
```

#### 2. Biometric Registration
1. Login with password
2. Tap "Set Up Now" on registration prompt
3. Approve Face ID/Touch ID
4. Success!

#### 3. Biometric Login
1. Logout
2. Tap "Login with Face ID"
3. Approve Face ID/Touch ID
4. Instant login! ⚡

## Troubleshooting

### Build Issues
- Clean build folder: `Cmd + Shift + K`
- Ensure deployment target is iOS 15.0+
- Check all files are added to target

### Runtime Issues
- Face ID requires physical device (not simulator)
- Device must have passcode set
- Backend must be running and accessible

### Network Issues
- Verify API endpoint in Config.swift
- Check device internet connection
- Ensure backend is accessible

## License

MIT License - See LICENSE file for details
