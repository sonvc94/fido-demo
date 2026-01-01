import Foundation
import SwiftUI
import AuthenticationServices

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var showRegistrationPrompt = false
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false

    private let authService = AuthenticationService.shared
    private let webAuthnManager = WebAuthnManager.shared

    // MARK: - Password Login
    func loginWithPassword(username: String, password: String) async {
        isLoading = true
        errorMessage = ""

        do {
            let response = try await authService.loginWithPassword(
                username: username,
                password: password
            )

            isAuthenticated = true
            currentUser = User(
                username: response.username,
                displayName: response.display_name,
                hasPasskey: response.has_passkey
            )

            // Show registration prompt if no passkey
            if !response.has_passkey {
                showRegistrationPrompt = true
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }

        isLoading = false
    }

    // MARK: - Biometric Registration
    func registerBiometric(displayName: String) async {
        isLoading = true
        errorMessage = ""

        do {
            // Check biometric availability
            guard webAuthnManager.canUseBiometrics() else {
                errorMessage = "Biometric authentication is not available on this device."
                showError = true
                isLoading = false
                return
            }

            // Start registration
            let startResponse = try await authService.startBiometricRegistration(
                displayName: displayName
            )

            // Decode challenge
            let _ = webAuthnManager.base64URLDecode(startResponse.challenge)

            // Get user ID
            let userID = webAuthnManager.base64URLDecode(startResponse.options.user.id)

            // Create credential (biometric prompt)
            let credential = try await webAuthnManager.simulatePasskeyCreation()

            // Complete registration
            _ = try await authService.completeBiometricRegistration(
                challenge: startResponse.challenge,
                displayName: displayName
            )

            // Update user state
            currentUser?.hasPasskey = true
            showRegistrationPrompt = false

        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }

        isLoading = false
    }

    // MARK: - Biometric Login
    func loginWithBiometric() async {
        isLoading = true
        errorMessage = ""

        do {
            // Check biometric availability
            guard webAuthnManager.canUseBiometrics() else {
                errorMessage = "Biometric authentication is not available on this device."
                showError = true
                isLoading = false
                return
            }

            // Start login
            let startResponse = try await authService.startUsernamelessLogin()

            // Decode challenge
            let challenge = webAuthnManager.base64URLDecode(startResponse.challenge)

            // Get assertion (biometric prompt)
            let assertion = try await webAuthnManager.simulatePasskeyAssertion()

            // Complete login
            let authResponse = try await authService.completeUsernamelessLogin(
                challenge: startResponse.challenge
            )

            isAuthenticated = true
            currentUser = User(
                username: authResponse.username,
                displayName: authResponse.display_name,
                hasPasskey: authResponse.has_passkey
            )

        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }

        isLoading = false
    }

    // MARK: - Logout
    func logout() {
        authService.logout()
        isAuthenticated = false
        currentUser = nil
        showRegistrationPrompt = false
    }

    // MARK: - Check Authentication Status
    func checkAuthenticationStatus() async {
        if authService.isAuthenticated() {
            do {
                let user = try await authService.getCurrentUser()
                isAuthenticated = true
                currentUser = user
            } catch {
                logout()
            }
        }
    }

    // MARK: - Dismiss Registration Prompt
    func dismissRegistrationPrompt() {
        showRegistrationPrompt = false
    }
}
