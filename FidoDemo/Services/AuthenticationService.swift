import Foundation

class AuthenticationService {
    static let shared = AuthenticationService()

    private let session = URLSession.shared
    private let tokenManager = TokenManager.shared
    private let webAuthnManager = WebAuthnManager.shared

    private var baseURL: String {
        return Config.apiBaseURL
    }

    private init() {}

    // MARK: - Password Login
    func loginWithPassword(username: String, password: String) async throws -> AuthResponse {
        let endpoint = "\(baseURL)/auth/password/login"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = Config.requestTimeout

        let body = ["username": username, "password": password]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.networkError
        }

        if httpResponse.statusCode == 401 {
            throw AuthError.invalidCredentials
        }

        guard httpResponse.statusCode == 200 else {
            if !data.isEmpty,
               let apiError = try? JSONDecoder().decode(APIError.self, from: data) {
                print("API Error: \(apiError.detail)")
            }
            throw AuthError.invalidCredentials
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

        // Save token
        try tokenManager.saveToken(authResponse.access_token)

        return authResponse
    }

    // MARK: - Get Current User
    func getCurrentUser() async throws -> User {
        guard tokenManager.hasToken() else {
            throw AuthError.notAuthenticated
        }

        let endpoint = "\(baseURL)/auth/me"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try tokenManager.getToken())", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = Config.requestTimeout

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.tokenExpired
        }

        let userResponse = try JSONDecoder().decode(UserResponse.self, from: data)

        return User(
            username: userResponse.username,
            displayName: userResponse.display_name,
            hasPasskey: userResponse.has_passkey
        )
    }

    // MARK: - Start Biometric Registration
    func startBiometricRegistration(displayName: String) async throws -> RegistrationStartResponse {
        guard tokenManager.hasToken() else {
            throw AuthError.notAuthenticated
        }

        let endpoint = "\(baseURL)/auth/register/start"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try tokenManager.getToken())", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = Config.requestTimeout

        // Get current username
        let currentUser = try await getCurrentUser()

        let body = [
            "username": currentUser.username,
            "display_name": displayName
        ]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.registrationFailed
        }

        return try JSONDecoder().decode(RegistrationStartResponse.self, from: data)
    }

    // MARK: - Complete Biometric Registration (Simplified)
    func completeBiometricRegistration(
        challenge: String,
        displayName: String
    ) async throws -> Bool {
        guard tokenManager.hasToken() else {
            throw AuthError.notAuthenticated
        }

        let endpoint = "\(baseURL)/auth/register/finish"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try tokenManager.getToken())", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = Config.requestTimeout

        let currentUser = try await getCurrentUser()
        
        // Use the simulated passkey creation
        let credentialData = try await webAuthnManager.simulatePasskeyCreation()

        let body: [String: Any] = [
            "username": currentUser.username,
            "display_name": displayName,
            "credential": credentialData,
            "challenge": challenge
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (_, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.registrationFailed
        }

        return true
    }

    // MARK: - Start Usernameless Login
    func startUsernamelessLogin() async throws -> LoginStartResponse {
        let endpoint = "\(baseURL)/auth/login/usernameless/start"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = Config.requestTimeout

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.networkError
        }

        if httpResponse.statusCode == 400 {
            throw AuthError.biometricNotAvailable
        }

        guard httpResponse.statusCode == 200 else {
            throw AuthError.authenticationFailed
        }

        return try JSONDecoder().decode(LoginStartResponse.self, from: data)
    }

    // MARK: - Complete Usernameless Login (Simplified)
    func completeUsernamelessLogin(
        challenge: String
    ) async throws -> AuthResponse {
        let endpoint = "\(baseURL)/auth/login/usernameless/finish"

        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = Config.requestTimeout

        // Use the simulated passkey assertion
        let assertionData = try await webAuthnManager.simulatePasskeyAssertion()

        let body: [String: Any] = [
            "assertion": assertionData,
            "challenge": challenge
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.networkError
        }

        guard httpResponse.statusCode == 200 else {
            throw AuthError.authenticationFailed
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

        // Save token
        try tokenManager.saveToken(authResponse.access_token)

        return authResponse
    }

    // MARK: - Logout
    func logout() {
        try? tokenManager.deleteToken()
    }

    // MARK: - Check Authentication Status
    func isAuthenticated() -> Bool {
        return tokenManager.hasToken()
    }
}
