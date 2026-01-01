import SwiftUI

@main
struct FidoDemoApp: SwiftUI.App {
    @StateObject private var viewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(viewModel)
                .task {
                    await viewModel.checkAuthenticationStatus()
                }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var viewModel: AuthViewModel

    var body: some View {
        Group {
            if viewModel.isAuthenticated {
                DashboardView()
                    .environmentObject(viewModel)
            } else {
                LoginView()
            }
        }
    }
}
