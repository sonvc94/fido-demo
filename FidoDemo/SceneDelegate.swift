import UIKit
import SwiftUI

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session options: UIScene.ConnectionOptions) async {
        guard let windowScene = scene as? UIWindowScene else { return }
        
        window = windowScene.windows.first
        window?.rootViewController = UIHostingController(rootView: ContentView())
    }

    func sceneDidDisconnect(_ scene: UIScene) {
    // Clean up resources
    }
}