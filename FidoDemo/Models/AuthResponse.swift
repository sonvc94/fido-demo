import Foundation

struct AuthResponse: Codable {
    let access_token: String
    let token_type: String
    let username: String
    let display_name: String
    let has_passkey: Bool
}

struct User: Codable {
    var username: String
    let displayName: String
    var hasPasskey: Bool

    enum CodingKeys: String, CodingKey {
        case username
        case displayName = "display_name"
        case hasPasskey = "has_passkey"
    }
}

struct UserResponse: Codable {
    let username: String
    let display_name: String
    let has_passkey: Bool
}
