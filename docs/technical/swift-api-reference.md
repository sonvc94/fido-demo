# API Reference - Swift App Integration

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-12-31
- **Author:** API Architect
- **Project:** FIDO2 Passkey Authentication - Backend API
- **Base URL:** `http://localhost:8091` (Development)

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Passkey Registration Endpoints](#passkey-registration-endpoints)
3. [Passkey Login Endpoints](#passkey-login-endpoints)
4. [Passkey Management Endpoints](#passkey-management-endpoints)
5. [Error Responses](#error-responses)
6. [Swift Integration Examples](#swift-integration-examples)

---

## API Overview

### Base URLs
- **Development:** `http://localhost:8091`
- **Production:** `https://api.yourdomain.com`

### Authentication
- **Mechanism:** JWT Bearer Token
- **Header Format:** `Authorization: Bearer <access_token>`
- **Token Expiry:** 24 hours

### Response Format
- **Content-Type:** `application/json`
- **Encoding:** UTF-8

---

## Authentication Endpoints

### 1. Password Login

Login with username and password. This is the initial login method for new users.

**Endpoint:** `POST /auth/password/login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "user",
  "password": "user"
}
```

**Swift Request Example:**
```swift
func loginWithPassword(username: String, password: String) async throws -> AuthResponse {
    let url = URL(string: "http://localhost:8091/auth/password/login")!
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

    return try JSONDecoder().decode(AuthResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzY3MTk2NzA2fQ.bVmiL4JJGxEofC33h5sFjlF6GrKxH80Tk6peeSEknpc",
  "token_type": "bearer",
  "username": "user",
  "display_name": "Default User",
  "has_passkey": false
}
```

**Swift Response Model:**
```swift
struct AuthResponse: Codable {
    let access_token: String
    let token_type: String
    let username: String
    let display_name: String
    let has_passkey: Bool
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Invalid username or password"
}
```

---

### 2. Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /auth/me`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Swift Request Example:**
```swift
func getCurrentUser(token: String) async throws -> UserResponse {
    let url = URL(string: "http://localhost:8091/auth/me")!
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(UserResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "username": "user",
  "display_name": "Default User",
  "has_passkey": true
}
```

**Swift Response Model:**
```swift
struct UserResponse: Codable {
    let username: String
    let display_name: String
    let has_passkey: Bool
}
```

---

## Passkey Registration Endpoints

### 3. Start Passkey Registration

Initiate the passkey registration process. Returns WebAuthn challenge options.

**Endpoint:** `POST /auth/register/start`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "user",
  "display_name": "iPhone 14 Pro Face ID"
}
```

**Swift Request Example:**
```swift
func startRegistration(displayName: String, token: String) async throws -> RegistrationStartResponse {
    let url = URL(string: "http://localhost:8091/auth/register/start")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let body = [
        "username": userManager.getCurrentUsername(),
        "display_name": displayName
    ]
    request.httpBody = try JSONEncoder().encode(body)

    let (data, response) = try await URLSession.shared.data(for: request)

    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.registrationFailed
    }

    return try JSONDecoder().decode(RegistrationStartResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "challenge": "bTqvgUdaHcfT7yBdL9dfiwQCTHlTQH2alMozSgHA9cizAku283cvSD-_ikBUAXGn69lm2oK4tpMkkGbxi68Ipw",
  "options": {
    "rp": {
      "name": "FIDO2 Demo"
    },
    "user": {
      "id": "dXNlcg",
      "name": "user",
      "displayName": "Default User"
    },
    "challenge": "bTqvgUdaHcfT7yBdL9dfiwQCTHlTQH2alMozSgHA9cizAku283cvSD-_ikBUAXGn69lm2oK4tpMkkGbxi68Ipw",
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -8},
      {"type": "public-key", "alg": -36},
      {"type": "public-key", "alg": -37},
      {"type": "public-key", "alg": -38},
      {"type": "public-key", "alg": -39},
      {"type": "public-key", "alg": -257},
      {"type": "public-key", "alg": -258},
      {"type": "public-key", "alg": -259}
    ],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {
      "userVerification": "preferred"
    }
  }
}
```

**Swift Response Models:**
```swift
struct RegistrationStartResponse: Codable {
    let challenge: String
    let options: RegistrationOptions
}

struct RegistrationOptions: Codable {
    let rp: RP
    let user: RegistrationUser
    let challenge: String
    let pubKeyCredParams: [PubKeyCredParam]
    let timeout: Int
    let attestation: String
    let authenticatorSelection: AuthenticatorSelection
}

struct RP: Codable {
    let name: String
}

struct RegistrationUser: Codable {
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
```

---

### 4. Finish Passkey Registration

Complete the passkey registration by sending the created credential to the server.

**Endpoint:** `POST /auth/register/finish`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "user",
  "display_name": "iPhone 14 Pro Face ID",
  "credential": {
    "id": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
    "rawId": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
    "response": {
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJiVHF2Z1VkYUhjZlQ3eUJkTDlkaWl3UUNUaGxUUUgyYWxNb3pTZ0hBOXNpekFrdTI4M2N2U0QtaWtCVUFYZ242OWxtMm9LNHRwTW1rR2J4aTY4SXB3In0",
      "attestationObject": "o2NmbXRmcGFja2VkZ2F0dFN0bXSiY2FsZyZjc2lnWEcwRQIhAJpL4oE6iKqD8YFqM2pL3x4P0N7R8wT5H1G3K6L9Q2X8Y4Z1AiA7T6L3oN8qK2Y1P9R8wT5X2Y1M3Q7N6L9P8R1S4T7U2V9W3X6Y2Z4aW90Y2VyZWdlbnRfY2hhbm5lbF4wMgN1bmRlZmluZWRfYXV0aGVudGljYXRvcllmY2hyb21lLXNoYTI1Nl9tZmF1dGg6Y2hhbGxlbmdlLXJlc3BvbnNlX2NvbmZpZ191c2VyX3ZlcmlmaWNhdGlvbl9wcmVmZXJyZWRfcHViY2tleS1jcmVkZW50aWFsc19pZF9hdXRoZW50aWNhdG9yX2RhdGFfYXR0ZXN0YXRpb25fYXV0aGVudGljYXRvcl9kYXRhX2NvZGVfZXJyb3JfZGV0YWlsX21lc3NhZ2U"
    },
    "type": "public-key",
    "clientExtensionResults": {}
  },
  "challenge": "bTqvgUdaHcfT7yBdL9dfiwQCTHlTQH2alMozSgHA9cizAku283cvSD-_ikBUAXGn69lm2oK4tpMkkGbxi68Ipw"
}
```

**Swift Request Example:**
```swift
func finishRegistration(
    credential: ASPasskeyCredential,
    challenge: String,
    token: String
) async throws -> Bool {
    let url = URL(string: "http://localhost:8091/auth/register/finish")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let credentialData = credential.toJSON()

    let body: [String: Any] = [
        "username": userManager.getCurrentUsername(),
        "display_name": "iPhone 14 Pro Face ID",
        "credential": credentialData,
        "challenge": challenge
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (_, response) = try await URLSession.shared.data(for: request)

    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.registrationFailed
    }

    return true
}
```

**Success Response (200 OK):**
```json
{
  "message": "Passkey registered successfully",
  "credential_id": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5"
}
```

**Swift Response Model:**
```swift
struct RegistrationFinishResponse: Codable {
    let message: String
    let credential_id: String
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Registration failed: Invalid credential"
}
```

---

## Passkey Login Endpoints

### 5. Start Usernameless Login

Initiate passwordless login. Returns challenge for all registered passkeys.

**Endpoint:** `POST /auth/login/usernameless/start`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (Empty - no username needed!)

**Swift Request Example:**
```swift
func startUsernamelessLogin() async throws -> LoginStartResponse {
    let url = URL(string: "http://localhost:8091/auth/login/usernameless/start")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let (data, response) = try await URLSession.shared.data(for: request)

    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.loginFailed
    }

    return try JSONDecoder().decode(LoginStartResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "challenge": "aXHyB9L2kP8oR6tN3mQ7wJ4yZ1X5V8sU2T4cF6dE7gH9jK",
  "options": {
    "challenge": "aXHyB9L2kP8oR6tN3mQ7wJ4yZ1X5V8sU2T4cF6dE7gH9jK",
    "rpId": "localhost",
    "timeout": 60000,
    "allowCredentials": [
      {
        "id": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
        "type": "public-key"
      },
      {
        "id": "K8X3Y7Z2B5C9D1E4F7G0H3I6J9K2L5M8N1O4P7Q0R3S6",
        "type": "public-key"
      }
    ],
    "userVerification": "preferred"
  }
}
```

**Swift Response Models:**
```swift
struct LoginStartResponse: Codable {
    let challenge: String
    let options: LoginOptions
}

struct LoginOptions: Codable {
    let challenge: String
    let rpId: String
    let timeout: Int
    let allowCredentials: [AllowCredential]
    let userVerification: String
}

struct AllowCredential: Codable {
    let id: String
    let type: String
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "No passkeys registered yet"
}
```

---

### 6. Finish Usernameless Login

Complete passwordless login by sending the assertion to the server.

**Endpoint:** `POST /auth/login/usernameless/finish`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "assertion": {
    "id": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
    "rawId": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
    "response": {
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOiJhWEh5QjlMMmtQOG9SNnROMG1RN3dKNHlaMVg1VjhzVTJUNGNUZkRFNnZ0haOWoifQ",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFXGB-",
      "signature": "MEUCIQDZ3Y3N3X2Y0Z1W2V3U4T5W6X7Y8Z0A1B2C3D4E5F6G7H8IqAiBgH8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6AA",
      "userHandle": "dXNlcg"
    },
    "type": "public-key"
  },
  "challenge": "aXHyB9L2kP8oR6tN3mQ7wJ4yZ1X5V8sU2T4cF6dE7gH9jK"
}
```

**Swift Request Example:**
```swift
func finishUsernamelessLogin(
    assertion: ASAuthorizationPlatformPublicKeyCredentialAssertion,
    challenge: String
) async throws -> AuthResponse {
    let url = URL(string: "http://localhost:8091/auth/login/usernameless/finish")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let assertionData = assertion.toJSON()

    let body: [String: Any] = [
        "assertion": assertionData,
        "challenge": challenge
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)

    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
        throw AuthError.authenticationFailed
    }

    return try JSONDecoder().decode(AuthResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzY3MTk3MDAwfQ.XYZ123ABC456DEF789GHI012JKL345MNO678PQR",
  "token_type": "bearer",
  "username": "user",
  "display_name": "Default User",
  "has_passkey": true
}
```

**Swift Response Model:**
```swift
struct AuthResponse: Codable {
    let access_token: String
    let token_type: String
    let username: String
    let display_name: String
    let has_passkey: Bool
}
```

**Error Response (401 Unauthorized):**
```json
{
  "detail": "Authentication failed: Invalid signature"
}
```

---

## Passkey Management Endpoints

### 7. List Passkeys

Get all passkeys registered for the current user.

**Endpoint:** `GET /auth/passkeys`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Swift Request Example:**
```swift
func listPasskeys(token: String) async throws -> PasskeysResponse {
    let url = URL(string: "http://localhost:8091/auth/passkeys")!
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(PasskeysResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "username": "user",
  "passkeys": [
    {
      "id": 1,
      "credential_id": "JWSZqNvRqHw8X7L0xP5kM2Q9W4Y6Z3A8B1C7D0E3F4G5",
      "name": "iPhone 14 Pro Face ID",
      "created_at": "2025-12-31T12:00:00Z"
    },
    {
      "id": 2,
      "credential_id": "K8X3Y7Z2B5C9D1E4F7G0H3I6J9K2L5M8N1O4P7Q0R3S6",
      "name": "MacBook Pro Touch ID",
      "created_at": "2025-12-31T14:30:00Z"
    }
  ],
  "has_passkey": true
}
```

**Swift Response Models:**
```swift
struct PasskeysResponse: Codable {
    let username: String
    let passkeys: [PasskeyInfo]
    let has_passkey: Bool
}

struct PasskeyInfo: Codable {
    let id: Int
    let credential_id: String
    let name: String
    let created_at: String
}
```

---

### 8. Delete Passkey

Delete all passkeys for the current user (useful for account recovery).

**Endpoint:** `DELETE /auth/passkeys`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Swift Request Example:**
```swift
func deletePasskeys(token: String) async throws -> DeleteResponse {
    let url = URL(string: "http://localhost:8091/auth/passkeys")!
    var request = URLRequest(url: url)
    request.httpMethod = "DELETE"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(DeleteResponse.self, from: data)
}
```

**Success Response (200 OK):**
```json
{
  "message": "Deleted 2 passkey(s) successfully. You can now login with password."
}
```

**Swift Response Model:**
```swift
struct DeleteResponse: Codable {
    let message: String
}
```

---

## Error Responses

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input, verification failed |
| 401 | Unauthorized | Invalid/expired token, wrong credentials |
| 404 | Not Found | User/passkey not found, session expired |
| 500 | Internal Server Error | Server error |

### Error Response Format

All errors follow this format:
```json
{
  "detail": "Human-readable error message"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid credentials` | Wrong username/password | Check credentials, try again |
| `Token expired` | JWT token expired | Re-authenticate with password |
| `Invalid challenge` | Challenge mismatch/expired | Restart registration/login flow |
| `Passkey not found` | Credential ID not in database | Register passkey again |
| `Registration failed` | WebAuthn verification failed | Check device compatibility |
| `No passkeys registered yet` | User has no passkeys | Register a passkey first |
| `Session not found or expired` | QR code session expired | Generate new QR code |

---

## Swift Integration Examples

### Complete Login Flow

```swift
import SwiftUI
import AuthenticationServices
import LocalAuthentication

class BiometricAuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var showRegistrationPrompt = false

    private let baseURL = "http://localhost:8091"
    private var tokenManager = TokenManager()

    // MARK: - Password Login
    func loginWithPassword(username: String, password: String) async throws {
        let endpoint = "\(baseURL)/auth/password/login"

        var request = URLRequest(url: URL(string: endpoint)!)
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
        try tokenManager.saveToken(authResponse.access_token)

        // Update state
        DispatchQueue.main.async {
            self.isAuthenticated = true
            self.currentUser = User(
                username: authResponse.username,
                displayName: authResponse.display_name
            )

            // Show registration prompt if no passkey
            if !authResponse.has_passkey {
                self.showRegistrationPrompt = true
            }
        }
    }

    // MARK: - Biometric Registration
    func registerBiometric(displayName: String) async throws {
        guard let token = try? tokenManager.getToken() else {
            throw AuthError.notAuthenticated
        }

        // Start registration
        let startEndpoint = "\(baseURL)/auth/register/start"
        var startRequest = URLRequest(url: URL(string: startEndpoint)!)
        startRequest.httpMethod = "POST"
        startRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        startRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let startBody = [
            "username": currentUser?.username ?? "",
            "display_name": displayName
        ]
        startRequest.httpBody = try JSONEncoder().encode(startBody)

        let (startData, _) = try await URLSession.shared.data(for: startRequest)
        let startResponse = try JSONDecoder().decode(RegistrationStartResponse.self, from: startData)

        // Create credential using AuthenticationServices
        let challenge = base64URLDecode(startResponse.challenge)
        let userID = startResponse.options.user.id.data(using: .utf8)!

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: "localhost"
        )

        let registrationRequest = provider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: currentUser?.username ?? "",
            userID: userID
        )

        let controller = ASAuthorizationController(
            authorizationRequests: [registrationRequest]
        )

        let credential = try await performRegistration(controller)

        // Finish registration
        let finishEndpoint = "\(baseURL)/auth/register/finish"
        var finishRequest = URLRequest(url: URL(string: finishEndpoint)!)
        finishRequest.httpMethod = "POST"
        finishRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        finishRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let finishBody: [String: Any] = [
            "username": currentUser?.username ?? "",
            "display_name": displayName,
            "credential": credential.toJSON(),
            "challenge": startResponse.challenge
        ]
        finishRequest.httpBody = try JSONSerialization.data(withJSONObject: finishBody)

        let (_, finishResponse) = try await URLSession.shared.data(for: finishRequest)

        guard (finishResponse as? HTTPURLResponse)?.statusCode == 200 else {
            throw AuthError.registrationFailed
        }

        DispatchQueue.main.async {
            self.showRegistrationPrompt = false
        }
    }

    // MARK: - Biometric Login
    func loginWithBiometric() async throws {
        // Start login
        let startEndpoint = "\(baseURL)/auth/login/usernameless/start"
        var startRequest = URLRequest(url: URL(string: startEndpoint)!)
        startRequest.httpMethod = "POST"
        startRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (startData, _) = try await URLSession.shared.data(for: startRequest)
        let startResponse = try JSONDecoder().decode(LoginStartResponse.self, from: startData)

        // Get assertion
        let challenge = base64URLDecode(startResponse.challenge)

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: "localhost"
        )

        let assertionRequest = provider.createCredentialAssertionRequest(challenge: challenge)

        let controller = ASAuthorizationController(
            authorizationRequests: [assertionRequest]
        )

        let assertion = try await performAssertion(controller)

        // Finish login
        let finishEndpoint = "\(baseURL)/auth/login/usernameless/finish"
        var finishRequest = URLRequest(url: URL(string: finishEndpoint)!)
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

        // Save token
        try tokenManager.saveToken(authResponse.access_token)

        DispatchQueue.main.async {
            self.isAuthenticated = true
            self.currentUser = User(
                username: authResponse.username,
                displayName: authResponse.display_name
            )
        }
    }

    // MARK: - Helper Methods
    private func base64URLDecode(_ string: String) -> Data {
        let padding = String(repeating: "=", count: (4 - string.count % 4) % 4)
        let base64String = string + padding
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        guard let data = Data(base64Encoded: base64String) else {
            return Data()
        }
        return data
    }

    private func performRegistration(_ controller: ASAuthorizationController) async throws -> ASPasskeyCredential {
        try await withCheckedThrowingContinuation { continuation in
            let delegate = RegistrationDelegate(continuation: continuation)
            controller.delegate = delegate
            controller.performRequests()
        }
    }

    private func performAssertion(_ controller: ASAuthorizationController) async throws -> ASAuthorizationPlatformPublicKeyCredentialAssertion {
        try await withCheckedThrowingContinuation { continuation in
            let delegate = AssertionDelegate(continuation: continuation)
            controller.delegate = delegate
            controller.performRequests()
        }
    }
}

// MARK: - Delegates
class RegistrationDelegate: NSObject, ASAuthorizationControllerDelegate {
    let continuation: CheckedContinuation<ASPasskeyCredential, Error>

    init(continuation: CheckedContinuation<ASPasskeyCredential, Error>) {
        self.continuation = continuation
    }

    func authorizationController(
        _ controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASPasskeyCredential else {
            continuation.resume(throwing: AuthError.invalidCredential)
            return
        }
        continuation.resume(returning: credential)
    }

    func authorizationController(
        _ controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        continuation.resume(throwing: error)
    }
}

class AssertionDelegate: NSObject, ASAuthorizationControllerDelegate {
    let continuation: CheckedContinuation<ASAuthorizationPlatformPublicKeyCredentialAssertion, Error>

    init(continuation: CheckedContinuation<ASAuthorizationPlatformPublicKeyCredentialAssertion, Error>) {
        self.continuation = continuation
    }

    func authorizationController(
        _ controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let assertion = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            continuation.resume(throwing: AuthError.invalidAssertion)
            return
        }
        continuation.resume(returning: assertion)
    }

    func authorizationController(
        _ controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        continuation.resume(throwing: error)
    }
}

// MARK: - Extensions
extension ASPasskeyCredential {
    func toJSON() -> [String: Any] {
        return [
            "id": self.credentialID,
            "rawId": self.credentialID.base64EncodedString(),
            "response": [
                "clientDataJSON": self.rawClientDataJSON.base64EncodedString(),
                "attestationObject": self.rawAttestationObject.base64EncodedString()
            ],
            "type": "public-key"
        ]
    }
}

extension ASAuthorizationPlatformPublicKeyCredentialAssertion {
    func toJSON() -> [String: Any] {
        return [
            "id": self.credentialID,
            "rawId": self.credentialID.base64EncodedString(),
            "response": [
                "clientDataJSON": self.rawClientDataJSON.base64EncodedString(),
                "authenticatorData": self.rawAuthenticatorData.base64EncodedString(),
                "signature": self.signature.base64EncodedString(),
                "userHandle": self.userID?.base64EncodedString() ?? ""
            ],
            "type": "public-key"
        ]
    }
}
```

---

## Testing with cURL

### Test Password Login
```bash
curl -X POST http://localhost:8091/auth/password/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "password": "user"
  }'
```

### Test Start Registration
```bash
curl -X POST http://localhost:8091/auth/register/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "username": "user",
    "display_name": "Test Device"
  }'
```

### Test Usernameless Login Start
```bash
curl -X POST http://localhost:8091/auth/login/usernameless/start \
  -H "Content-Type: application/json"
```

---

*For backend implementation details, see [architecture.md](architecture.md). For business requirements, see [Swift App Business Requirements](../ba/swift-app-biometric-login.md).*
