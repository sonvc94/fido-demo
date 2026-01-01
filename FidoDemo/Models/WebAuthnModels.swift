import Foundation

// MARK: - Registration Models

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

struct RegistrationFinishResponse: Codable {
    let message: String
    let credential_id: String
}

// MARK: - Login Models

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

    enum CodingKeys: String, CodingKey {
        case challenge
        case rpId = "rpId"
        case timeout
        case allowCredentials = "allowCredentials"
        case userVerification = "userVerification"
    }
}

struct AllowCredential: Codable {
    let id: String
    let type: String
}

// MARK: - Passkey Management Models

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

struct DeleteResponse: Codable {
    let message: String
}

// MARK: - Error Models

struct APIError: Codable {
    let detail: String
}

enum AuthError: LocalizedError {
    case invalidCredentials
    case tokenExpired
    case biometricNotAvailable
    case biometricLockedOut
    case networkError
    case registrationFailed
    case authenticationFailed
    case invalidResponse
    case notAuthenticated

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
        case .registrationFailed:
            return "Registration failed. Please try again."
        case .authenticationFailed:
            return "Authentication failed. Please try again."
        case .invalidResponse:
            return "Invalid response from server."
        case .notAuthenticated:
            return "Please log in first."
        }
    }
}
