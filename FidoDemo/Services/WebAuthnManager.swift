import Foundation
import AuthenticationServices
import LocalAuthentication

class WebAuthnManager: NSObject {
    static let shared = WebAuthnManager()

    private override init() {
        super.init()
    }

    // MARK: - Helper Methods

    func base64URLDecode(_ string: String) -> Data {
        let padding = String(repeating: "=", count: (4 - string.count % 4) % 4)
        let base64String = string + padding
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        guard let data = Data(base64Encoded: base64String) else {
            return Data()
        }
        return data
    }

    func base64URLEncode(_ data: Data) -> String {
        return data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    // MARK: - Check Biometric Availability
    func canUseBiometrics() -> Bool {
        let context = LAContext()
        var error: NSError?

        return context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )
    }

    // MARK: - Simple methods for testing
    func simulatePasskeyCreation() async throws -> [String: Any] {
        // Simulate a successful passkey creation for testing
        return [
            "id": "mock-credential-id",
            "rawId": base64URLEncode("mock-credential-id".data(using: .utf8) ?? Data()),
            "response": [
                "clientDataJSON": base64URLEncode("{\"type\":\"webauthn.create\",\"challenge\":\"mock\"}".data(using: .utf8) ?? Data()),
                "attestationObject": base64URLEncode("mock-attestation".data(using: .utf8) ?? Data())
            ],
            "type": "public-key"
        ]
    }

    func simulatePasskeyAssertion() async throws -> [String: Any] {
        // Simulate a successful passkey assertion for testing
        return [
            "id": "mock-credential-id",
            "rawId": base64URLEncode("mock-credential-id".data(using: .utf8) ?? Data()),
            "response": [
                "clientDataJSON": base64URLEncode("{\"type\":\"webauthn.get\",\"challenge\":\"mock\"}".data(using: .utf8) ?? Data()),
                "authenticatorData": base64URLEncode("mock-authenticator-data".data(using: .utf8) ?? Data()),
                "signature": base64URLEncode("mock-signature".data(using: .utf8) ?? Data()),
                "userHandle": base64URLEncode("mock-user-id".data(using: .utf8) ?? Data())
            ],
            "type": "public-key"
        ]
    }
}
