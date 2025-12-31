# Swift iOS App - Technical Implementation Guide

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-31
- **Author:** iOS Lead Developer
- **Project:** FIDO2 Passkey Authentication - Swift Mobile App
- **Platform:** iOS 15+ (Swift 5.7+)

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technical Stack](#technical-stack)
3. [Core Components](#core-components)
4. [Implementation Flows](#implementation-flows)
5. [Security Considerations](#security-considerations)
6. [Code Examples](#code-examples)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      iOS App (Swift)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │ Business     │  │  Data Layer  │      │
│  │  (SwiftUI)   │  │  Logic Layer │  │ (Networking) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ WebAuthn    │                           │
│                    │ Framework   │                           │
│                    └──────┬──────┘                           │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Python Backend (FastAPI)                    │
│  - Password Authentication                                    │
│  - Passkey Registration                                      │
│  - Passkey Authentication (Usernameless)                     │
│  - User Management                                            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Architecture

#### 1. **Presentation Layer (SwiftUI)**
- Login views
- Registration prompt views
- Dashboard views
- Error handling UI

#### 2. **Business Logic Layer**
- Authentication service
- Passkey registration service
- Token management
- User session management

#### 3. **Data Layer**
- HTTP client (URLSession)
- Local storage (Keychain, UserDefaults)
- WebAuthn credential handling

---

## Technical Stack

### Frameworks & Libraries

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **UI Framework** | SwiftUI | iOS 15+ | Declarative UI |
| **Authentication** | AuthenticationServices | iOS 15+ | Native WebAuthn support |
| **Networking** | URLSession | Native | HTTP requests |
| **Security** | CryptoKit | Native | Cryptographic operations |
| **Storage** | Keychain Services | Native | Secure token storage |
| **JSON** | Codable | Native | JSON encoding/decoding |
| **Logging** | OSLog | Native | Structured logging |

### External Dependencies (Swift Package Manager)

```swift
// Package.swift
dependencies: [
    // WebAuthn helper library (optional, for convenience)
    .package(url: "https://github.com/apple/web-authn-swift", from: "1.0.0")
]
```

**Note:** Can also use native `AuthenticationServices` framework without external dependencies.

---

## Core Components

### 1. Authentication Service

**Purpose:** Centralized authentication logic

**Responsibilities:**
- Password login
- Biometric registration
- Biometric login (usernameless)
- Token management
- Session state

**Interface:**
```swift
protocol AuthenticationServiceProtocol {
    func loginWithPassword(username: String, password: String) async throws -> AuthResponse
    func registerBiometric(displayName: String) async throws -> Bool
    func loginWithBiometric() async throws -> AuthResponse
    func logout() async throws
    func getCurrentUser() async throws -> User
}

struct AuthResponse {
    let accessToken: String
    let username: String
    let displayName: String
    let hasPasskey: Bool
}
```

### 2. WebAuthn Manager

**Purpose:** Handle WebAuthn operations

**Responsibilities:**
- Create passkey credentials
- Get passkey assertions
- Base64URL encoding/decoding
- Challenge management

**Implementation:**
```swift
class WebAuthnManager {
    private let authService: AuthenticationServiceProtocol

    func createPasskey(challenge: Data, userID: String, displayName: String) async throws -> Credential

    func signInWithPasskey(challenge: Data) async throws -> Assertion

    func base64URLDecode(_ string: String) -> Data

    func base64URLEncode(_ data: Data) -> String
}
```

### 3. Token Manager

**Purpose:** Securely store and manage JWT tokens

**Storage:**
- **Access Token:** Keychain (secure, persists across app restarts)
- **Refresh Token:** Keychain (future implementation)
- **User Info:** UserDefaults (non-sensitive, display name, etc.)

**Implementation:**
```swift
class TokenManager {
    private let keychain = Keychain(service: "com.fidodemo")

    func saveToken(_ token: String) throws {
        try keychain.set(token, key: "accessToken")
    }

    func getToken() throws -> String {
        return try keychain.get("accessToken") ?? ""
    }

    func deleteToken() throws {
        try keychain.remove("accessToken")
    }

    func tokenExists() -> Bool {
        return (try? getToken()) != nil
    }
}
```

### 4. API Client

**Purpose:** HTTP communication with backend

**Base URL Configuration:**
```swift
enum APIConfiguration {
    static let baseURL = "http://localhost:8091"  // Development
    // static let baseURL = "https://api.yourdomain.com"  // Production

    struct Endpoints {
        static let passwordLogin = "/auth/password/login"
        static let registerStart = "/auth/register/start"
        static let registerFinish = "/auth/register/finish"
        static let loginStart = "/auth/login/usernameless/start"
        static let loginFinish = "/auth/login/usernameless/finish"
        static let currentUser = "/auth/me"
        static let passkeys = "/auth/passkeys"
    }
}
```

---

## Implementation Flows

### Flow 1: Password Login

**Sequence Diagram:**
```
iOS App                Backend API           Database
  │                       │                      │
  ├─ POST /auth/password/login                │
  │  {username, password}  │                      │
  │                       ├─ Verify password    │
  │                       ├─ Check passkeys     │
  │                       ├─ Generate JWT       │
  │                       ├─ Return response    │
  │◄─ {token, user, has_passkey: false}        │
  │                       │                      │
  ├─ Save token to Keychain                     │
  ├─ Show "Set Up Biometric" prompt             │
  │                       │                      │
```

**Swift Implementation:**
```swift
func loginWithPassword(username: String, password: String) async throws -> AuthResponse {
    let url = URL(string: APIConfiguration.baseURL + APIConfiguration.Endpoints.passwordLogin)!

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let body = ["username": username, "password": password]
    request.httpBody = try JSONEncoder().encode(body)

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw AuthError.invalidCredentials
    }

    let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

    // Save token
    try tokenManager.saveToken(authResponse.accessToken)

    // Save passkey status
    UserDefaults.standard.set(authResponse.hasPasskey, forKey: "hasPasskey")

    return authResponse
}
```

### Flow 2: Biometric Registration

**Sequence Diagram:**
```
iOS App                Backend API           Database
  │                       │                      │
  ├─ User taps "Set Up Biometric"              │
  │                       │                      │
  ├─ POST /auth/register/start                 │
  │  Authorization: Bearer <token>              │
  │                       ├─ Verify token       │
  │                       ├─ Generate challenge │
  │                       ├─ Return options     │
  │◄─ {challenge, options}                      │
  │                       │                      │
  ├─ Create credential (Face ID/Touch ID)       │
  │  using AuthenticationServices               │
  │                       │                      │
  ├─ POST /auth/register/finish                │
  │  {credential, challenge}  │                  │
  │                       ├─ Verify registration│
  │                       ├─ Store passkey      │
  │                       ├─ Return success     │
  │◄─ {message: "success"}                      │
  │                       │                      │
  ├─ Update hasPasskey = true                   │
  ├─ Show success message                       │
  │                       │                      │
```

**Swift Implementation:**
```swift
func registerBiometric(displayName: String) async throws -> Bool {
    // 1. Get registration options from backend
    let startURL = URL(string: APIConfiguration.baseURL + APIConfiguration.Endpoints.registerStart)!
    var startRequest = URLRequest(url: startURL)
    startRequest.httpMethod = "POST"
    startRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
    startRequest.setValue("Bearer \(try tokenManager.getToken())", forHTTPHeaderField: "Authorization")

    let startBody = ["username": userManager.getCurrentUsername(), "display_name": displayName]
    startRequest.httpBody = try JSONEncoder().encode(startBody)

    let (startData, _) = try await URLSession.shared.data(for: startRequest)
    let startResponse = try JSONDecoder().decode(RegistrationStartResponse.self, from: startData)

    // 2. Create credential using AuthenticationServices
    let challenge = webAuthnManager.base64URLDecode(startResponse.challenge)

    let credential = try await webAuthnManager.createPasskey(
        challenge: challenge,
        userID: startResponse.options.user.id,
        displayName: displayName
    )

    // 3. Send credential to backend
    let finishURL = URL(string: APIConfiguration.baseURL + APIConfiguration.Endpoints.registerFinish)!
    var finishRequest = URLRequest(url: finishURL)
    finishRequest.httpMethod = "POST"
    finishRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
    finishRequest.setValue("Bearer \(try tokenManager.getToken())", forHTTPHeaderField: "Authorization")

    let finishBody: [String: Any] = [
        "username": userManager.getCurrentUsername(),
        "display_name": displayName,
        "credential": credential.toJSON(),
        "challenge": startResponse.challenge
    ]
    finishRequest.httpBody = try JSONSerialization.data(withJSONObject: finishBody)

    let (_, finishResponse) = try await URLSession.shared.data(for: finishRequest)
    guard (finishResponse as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.registrationFailed
    }

    // 4. Update local state
    UserDefaults.standard.set(true, forKey: "hasPasskey")

    return true
}
```

### Flow 3: Biometric Login (Usernameless)

**Sequence Diagram:**
```
iOS App                Backend API           Database
  │                       │                      │
  ├─ User taps "Login with Face ID"           │
  │                       │                      │
  ├─ POST /auth/login/usernameless/start       │
  │                       ├─ Get all passkeys   │
  │                       ├─ Generate challenge │
  │◄─ {challenge, allowCredentials[]}          │
  │                       │                      │
  ├─ Get assertion (Face ID/Touch ID)          │
  │  using AuthenticationServices               │
  │                       │                      │
  ├─ POST /auth/login/usernameless/finish      │
  │  {assertion, challenge}                     │
  │                       ├─ Verify assertion   │
  │                       ├─ Identify user      │
  │                       ├─ Generate JWT       │
  │◄─ {token, username, display_name}           │
  │                       │                      │
  ├─ Save token to Keychain                     │
  ├─ Navigate to dashboard                      │
  │                       │                      │
```

**Swift Implementation:**
```swift
func loginWithBiometric() async throws -> AuthResponse {
    // 1. Get login challenge from backend
    let startURL = URL(string: APIConfiguration.baseURL + APIConfiguration.Endpoints.loginStart)!
    var startRequest = URLRequest(url: startURL)
    startRequest.httpMethod = "POST"
    startRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let (startData, _) = try await URLSession.shared.data(for: startRequest)
    let startResponse = try JSONDecoder().decode(LoginStartResponse.self, from: startData)

    // 2. Get assertion using AuthenticationServices
    let challenge = webAuthnManager.base64URLDecode(startResponse.challenge)

    let assertion = try await webAuthnManager.signInWithPasskey(challenge: challenge)

    // 3. Send assertion to backend
    let finishURL = URL(string: APIConfiguration.baseURL + APIConfiguration.Endpoints.loginFinish)!
    var finishRequest = URLRequest(url: finishURL)
    finishRequest.httpMethod = "POST"
    finishRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let finishBody: [String: Any] = [
        "assertion": assertion.toJSON(),
        "challenge": startResponse.challenge
    ]
    finishRequest.httpBody = try JSONSerialization.data(withJSONObject: finishBody)

    let (finishData, finishResponse) = try await URLSession.shared.data(for: finishRequest)
    guard (finishResponse as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.authenticationFailed
    }

    let authResponse = try JSONDecoder().decode(AuthResponse.self, from: finishData)

    // 4. Save token
    try tokenManager.saveToken(authResponse.accessToken)

    return authResponse
}
```

---

## Security Considerations

### 1. Token Storage

**Keychain Configuration:**
```swift
import LocalAuthentication

class TokenManager {
    private let keychain: Keychain

    init() {
        keychain = Keychain(service: "com.yourapp.fidodemo")
            .accessibility(.whenPasscodeSetThisDeviceOnly)
            .authenticationPolicy(.userPresence)
    }

    func saveToken(_ token: String) throws {
        // Requires biometric or passcode to access
        try keychain.set(token, key: "accessToken")
    }
}
```

**Why Keychain?**
- Encrypted storage
- Protected by device passcode/biometric
- Persists across app reinstalls (with backup)
- Secure enclave support (on compatible devices)

### 2. HTTPS & Certificate Pinning

**Implement Certificate Pinning:**
```swift
class APIClient {
    static func getPinnedSession() -> URLSession {
        let session = URLSession(configuration: .default, delegate: SessionDelegate(), delegateQueue: nil)
        return session
    }
}

class SessionDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {

        guard let serverTrust = challenge.protectionSpace.serverTrust else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }

        // Certificate pinning logic
        // Compare server certificate hash with expected hash
        let credential = URLCredential(trust: serverTrust)
        completionHandler(.useCredential, credential)
    }
}
```

### 3. Biometric Authentication Policy

**Configure Authentication Policy:**
```swift
import AuthenticationServices

func createPasskey(challenge: Data) async throws -> ASPasskeyCredential {
    let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
        relyingPartyIdentifier: "localhost"  // Your domain
    )

    let registrationRequest = provider.createCredentialRegistrationRequest(
        challenge: challenge,
        name: username,
        userID: userID.data(using: .utf8)!
    )

    let controller = ASAuthorizationController(
        authorizationRequests: [registrationRequest]
    )

    // Configure biometric requirement
    let context = LAContext()
    context.localizedCancelTitle = "Cancel"
    context.localizedFallbackTitle = "Use Password"

    // Perform authorization
    try await controller.performAuthorization()
    // ... handle result
}
```

### 4. Error Handling & User Privacy

**Secure Error Messages:**
```swift
enum AuthError: LocalizedError {
    case invalidCredentials
    case tokenExpired
    case biometricNotAvailable
    case biometricLockedOut
    case networkError

    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Unable to log in. Please check your credentials."
        case .tokenExpired:
            return "Session expired. Please log in again."
        case .biometricNotAvailable:
            return "Face ID/Touch ID is not available on this device."
        case .biometricLockedOut:
            return "Too many attempts. Please try again later or use password."
        case .networkError:
            return "Network error. Please check your connection."
        }
    }
}
```

**Don't Reveal Sensitive Information:**
- Never log tokens or passwords
- Don't show detailed error messages to users
- Sanitize error messages before displaying
- Use OSLog for secure logging

---

## Code Examples

### Example 1: Complete Login View

```swift
import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @State private var username = ""
    @State private var password = ""
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Logo
                Image(systemName: "faceid")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Welcome Back")
                    .font(.title)
                    .fontWeight(.bold)

                // Check if user has passkey
                if viewModel.hasPasskey {
                    // Primary: Biometric login
                    Button(action: {
                        Task {
                            await viewModel.loginWithBiometric()
                        }
                    }) {
                        HStack {
                            Image(systemName: "faceid")
                            Text("Login with Face ID")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }

                    Text("OR")
                        .foregroundColor(.gray)
                }

                // Password login
                VStack(spacing: 15) {
                    TextField("Username", text: $username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)

                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    Button(action: {
                        Task {
                            await viewModel.loginWithPassword(username: username, password: password)
                        }
                    }) {
                        Text("Login with Password")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .cornerRadius(10)
                    }
                }
                .padding()

                Spacer()
            }
            .padding()
            .alert("Error", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .onChange(of: viewModel.errorMessage) { _, newMessage in
                errorMessage = newMessage
                showError = !newMessage.isEmpty
            }
        }
    }
}
```

### Example 2: Registration Prompt Banner

```swift
struct RegistrationPromptView: View {
    let onSetupNow: () -> Void
    let onSkip: () -> Void

    var body: some View {
        VStack(spacing: 15) {
            HStack {
                Image(systemName: "faceid")
                    .font(.system(size: 40))
                    .foregroundColor(.white)

                VStack(alignment: .leading, spacing: 5) {
                    Text("Set Up Biometric Login")
                        .font(.headline)
                        .foregroundColor(.white)

                    Text("Login faster with Face ID. No password needed!")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.9))
                }
            }

            HStack(spacing: 10) {
                Button("Set Up Now", action: onSetupNow)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .foregroundColor(.blue)
                    .cornerRadius(10)

                Button("Skip", action: onSkip)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white.opacity(0.2))
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue, Color.purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(15)
        .padding()
        .shadow(radius: 10)
    }
}
```

### Example 3: Models & Codables

```swift
struct AuthResponse: Codable {
    let access_token: String
    let token_type: String
    let username: String
    let display_name: String
    let has_passkey: Bool
}

struct RegistrationStartResponse: Codable {
    let challenge: String
    let options: RegistrationOptions
}

struct RegistrationOptions: Codable {
    let rp: RP
    let user: User
    let challenge: String
    let pubKeyCredParams: [PubKeyCredParam]
    let timeout: Int
    let attestation: String
    let authenticatorSelection: AuthenticatorSelection
}

struct RP: Codable {
    let name: String
}

struct User: Codable {
    let id: String
    let name: String
    let displayName: String
}

struct PubKeyCredParam: Codable {
    let type: String
    let alg: Int
}

struct AuthenticatorSelection: Codable {
    let userVerification: String
}

struct LoginStartResponse: Codable {
    let challenge: String
    let options: LoginOptions
}

struct LoginOptions: Codable {
    let challenge: String
    let rpId: String
    let timeout: Int
    let allowCredentials: [AllowCredential]?
    let userVerification: String
}

struct AllowCredential: Codable {
    let id: String
    let type: String
}
```

---

## Testing Strategy

### Unit Tests

**Test Authentication Service:**
```swift
class AuthenticationServiceTests: XCTestCase {
    var sut: AuthenticationService!
    var mockAPIClient: MockAPIClient!
    var mockTokenManager: MockTokenManager!

    override func setUp() {
        super.setUp()
        mockAPIClient = MockAPIClient()
        mockTokenManager = MockTokenManager()
        sut = AuthenticationService(apiClient: mockAPIClient, tokenManager: mockTokenManager)
    }

    func testPasswordLogin_Success() async throws {
        // Given
        let expectedResponse = AuthResponse(
            access_token: "test-token",
            token_type: "bearer",
            username: "user",
            display_name: "Test User",
            has_passkey: false
        )
        mockAPIClient.stubResponse(response: expectedResponse)

        // When
        let response = try await sut.loginWithPassword(username: "user", password: "pass")

        // Then
        XCTAssertEqual(response.username, "user")
        XCTAssertTrue(mockTokenManager.saveTokenCalled)
    }

    func testPasswordLogin_InvalidCredentials() async {
        // Given
        mockAPIClient.stubError(error: AuthError.invalidCredentials)

        // When/Then
        do {
            _ = try await sut.loginWithPassword(username: "user", password: "wrong")
            XCTFail("Should throw error")
        } catch AuthError.invalidCredentials {
            // Expected
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }
}
```

### Integration Tests

**Test Full Flow:**
```swift
class BiometricFlowTests: XCTestCase {
    func testCompleteRegistrationFlow() async throws {
        // 1. Login with password
        let authResponse = try await authService.loginWithPassword(
            username: "testuser",
            password: "testpass"
        )

        XCTAssertFalse(authResponse.hasPasskey, "Should not have passkey initially")

        // 2. Register biometric
        let registered = try await authService.registerBiometric(displayName: "iPhone Test")

        XCTAssertTrue(registered, "Registration should succeed")

        // 3. Logout
        try await authService.logout()

        // 4. Login with biometric
        let biometricResponse = try await authService.loginWithBiometric()

        XCTAssertEqual(biometricResponse.username, "testuser")
        XCTAssertTrue(biometricResponse.hasPasskey)
    }
}
```

### UI Tests

**Test Registration Prompt:**
```swift
class RegistrationPromptUITests: XCTestCase {
    func testRegistrationPromptShowsAfterPasswordLogin() {
        let app = XCUIApplication()
        app.launch()

        // Login with password
        app.textFields["username"].tap()
        app.textFields["username"].typeText("testuser")

        app.secureTextFields["password"].tap()
        app.secureTextFields["password"].typeText("testpass")

        app.buttons["Login with Password"].tap()

        // Wait for registration prompt
        let prompt = app.otherElements["registrationPromptBanner"]
        XCTAssertTrue(prompt.waitForExistence(timeout: 5), "Registration prompt should appear")

        // Test "Set Up Now" button
        app.buttons["Set Up Now"].tap()

        // Verify Face ID prompt appears (simulated)
        // In real test, need to mock biometric
    }
}
```

---

## Deployment

### Build Configuration

**Development:**
```swift
// Config.swift
struct Config {
    static let apiBaseURL = "http://localhost:8091"
    static let rpID = "localhost"
    static let enableDebugLogging = true
}
```

**Production:**
```swift
// Config+Production.swift
extension Config {
    static let apiBaseURL = "https://api.yourdomain.com"
    static let rpID = "yourdomain.com"
    static let enableDebugLogging = false
}
```

### App Store Submission

**Info.plist Requirements:**
```xml
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to log in quickly and securely.</string>

<key>NSLocalNetworkUsageDescription</key>
<string>Connect to local server for development.</string>
```

**Privacy - Face ID Usage:**
- Required for apps using Face ID
- Must explain why you need biometric access
- Keep it concise and user-friendly

**App Store Connect Description:**
```
Key Features:
• Passwordless login with Face ID and Touch ID
• Secure FIDO2/WebAuthn standard authentication
• Instant access - no passwords to remember
• Phishing-resistant security

Requirements:
• iOS 15.0 or later
• iPhone X or newer (for Face ID)
• iPhone 8 or newer (for Touch ID)
```

---

## Troubleshooting

### Common Issues

**Issue 1: "Face ID Not Available"**
- **Cause:** Device doesn't support Face ID, or it's disabled
- **Solution:** Show password login option, check `LAContext.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)`

**Issue 2: "Invalid Origin"**
- **Cause:** Backend RP_ID doesn't match app bundle ID
- **Solution:** Ensure `rpID` in backend matches your domain or use localhost for development

**Issue 3: "Challenge Expired"**
- **Cause:** Challenge took too long to complete
- **Solution:** Implement challenge timeout (5 minutes), show retry option

**Issue 4: "Certificate Pinning Failed"**
- **Cause:** Server certificate changed or pinning incorrect
- **Solution:** Implement proper certificate pinning, update pinned certificates

---

*For API specifications, see [API Endpoints Documentation](api-endpoints.md). For business requirements, see [Swift App Business Requirements](../ba/swift-app-biometric-login.md).*
