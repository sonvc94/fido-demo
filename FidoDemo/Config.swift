import Foundation

struct Config {
    // MARK: - API Configuration
    static let apiBaseURL = "https://fido-api.vuongchison.com"
    static let rpID = "fido-api.vuongchison.com"

    // MARK: - App Configuration
    static let appName = "FIDO2 Demo"
    static let keychainService = "com.fidodemo"

    // MARK: - Timeouts
    static let requestTimeout: TimeInterval = 30.0
    static let biometricTimeout: TimeInterval = 60.0

    // MARK: - Feature Flags
    static let isDebugModeEnabled = false
    static let allowBiometricRetry = true
    static let maxBiometricRetries = 3
}
