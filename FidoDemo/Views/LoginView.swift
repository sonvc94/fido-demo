// Handle successful login
                let success = await viewModel.loginWithPassword(username: username, password: password)
                if success {
                    print("✅ Login successful!")
                    // Navigate to dashboard after a short delay to show it was successful
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        viewModel.isAuthenticated = true
                    }
                } else {
                    // Show error message
                    let errorMessage = viewModel.errorMessage
                    if !errorMessage.isEmpty {
                        print("❌ Login failed: \(errorMessage)")
                    }
                }
