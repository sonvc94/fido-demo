import Foundation
import Security

class KeychainManager {
    static let shared = KeychainManager()

    private let service = Config.keychainService

    private init() {}

    // MARK: - Save Data
    func save(_ data: Data, forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
        ]

        // Delete existing item first
        SecItemDelete(query as CFDictionary)

        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)

        if status != errSecSuccess {
            throw AuthError.invalidResponse
        }
    }

    // MARK: - Retrieve Data
    func retrieve(forKey key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound {
            return nil
        }

        if status != errSecSuccess {
            throw AuthError.invalidResponse
        }

        return result as? Data
    }

    // MARK: - Delete Data
    func delete(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)

        if status != errSecSuccess && status != errSecItemNotFound {
            throw AuthError.invalidResponse
        }
    }

    // MARK: - Save String
    func save(_ string: String, forKey key: String) throws {
        if let data = string.data(using: .utf8) {
            try save(data, forKey: key)
        }
    }

    // MARK: - Retrieve String
    func retrieveString(forKey key: String) throws -> String? {
        guard let data = try retrieve(forKey: key) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
}
