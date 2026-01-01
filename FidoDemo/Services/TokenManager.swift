import Foundation

class TokenManager {
    static let shared = TokenManager()

    private let keychain = KeychainManager.shared
    private let tokenKey = "access_token"

    private init() {}

    // MARK: - Save Token
    func saveToken(_ token: String) throws {
        try keychain.save(token, forKey: tokenKey)
    }

    // MARK: - Get Token
    func getToken() throws -> String {
        guard let token = try keychain.retrieveString(forKey: tokenKey) else {
            throw AuthError.tokenExpired
        }
        return token
    }

    // MARK: - Check if Token Exists
    func hasToken() -> Bool {
        return (try? getToken()) != nil
    }

    // MARK: - Delete Token
    func deleteToken() throws {
        try keychain.delete(forKey: tokenKey)
    }

    // MARK: - Get Auth Headers
    func getAuthHeaders() -> [String: String] {
        do {
            let token = try getToken()
            return [
                "Authorization": "Bearer \(token)",
                "Content-Type": "application/json"
            ]
        } catch {
            return [
                "Content-Type": "application/json"
            ]
        }
    }
}
