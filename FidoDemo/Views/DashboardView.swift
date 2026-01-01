import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var viewModel: AuthViewModel

    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 30) {
                        Spacer()
                            .frame(height: 20)

                        // Welcome header
                        VStack(spacing: 10) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.green)

                            Text("Welcome, \(viewModel.currentUser?.displayName ?? "User")!")
                                .font(.title)
                                .fontWeight(.bold)

                            Text("You are securely authenticated")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        // User info card
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Account Information")
                                .font(.headline)
                                .foregroundColor(.primary)

                            UserInfoRow(label: "Username", value: viewModel.currentUser?.username ?? "")
                            UserInfoRow(label: "Display Name", value: viewModel.currentUser?.displayName ?? "")

                            HStack {
                                Text("Passkey Status")
                                    .foregroundColor(.secondary)
                                Spacer()
                                if viewModel.currentUser?.hasPasskey == true {
                                    HStack(spacing: 5) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                        Text("Registered")
                                            .foregroundColor(.green)
                                            .fontWeight(.semibold)
                                    }
                                } else {
                                    HStack(spacing: 5) {
                                        Image(systemName: "xmark.circle.fill")
                                            .foregroundColor(.red)
                                        Text("Not Registered")
                                            .foregroundColor(.red)
                                    }
                                }
                            }
                        }
                        .padding(20)
                        .background(Color.white)
                        .cornerRadius(15)
                        .shadow(color: .black.opacity(0.05), radius: 5)

                        // Quick actions
                        VStack(spacing: 15) {
                            Text("Quick Actions")
                                .font(.headline)
                                .foregroundColor(.primary)

                            if viewModel.currentUser?.hasPasskey == true {
                                ActionRow(
                                    icon: "faceid",
                                    title: "Biometric Login Enabled",
                                    description: "You can login with Face ID",
                                    color: .green
                                )
                            } else {
                                ActionRow(
                                    icon: "exclamationmark.triangle",
                                    title: "Set Up Biometric Login",
                                    description: "Register Face ID for faster access",
                                    color: .orange
                                )
                            }

                            ActionRow(
                                icon: "lock.shield",
                                title: "Secure Authentication",
                                description: "Protected by FIDO2/WebAuthn",
                                color: .blue
                            )

                            ActionRow(
                                icon: "key",
                                title: "Passwordless",
                                description: "No passwords to remember",
                                color: .purple
                            )
                        }
                        .padding(20)
                        .background(Color.white)
                        .cornerRadius(15)
                        .shadow(color: .black.opacity(0.05), radius: 5)

                        // Logout button
                        Button(action: {
                            viewModel.logout()
                        }) {
                            HStack {
                                Image(systemName: "arrow.right.square")
                                    .font(.title2)
                                Text("Logout")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .foregroundColor(.red)
                            .cornerRadius(15)
                        }
                        .padding(.horizontal, 20)

                        Spacer()
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

struct UserInfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
        }
    }
}

struct ActionRow: View {
    let icon: String
    let title: String
    let description: String
    let color: Color

    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 10)
    }
}

#Preview {
    let viewModel = AuthViewModel()
    viewModel.currentUser = User(
        username: "testuser",
        displayName: "Test User",
        hasPasskey: true
    )

    return DashboardView()
        .environmentObject(viewModel)
}
