import UIKit
import SwiftUI

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    // Đã xóa 'async' ở đây
    func scene(_ scene: UIScene, willConnectTo session: UIScene.ConnectionOptions) {
        // 1. Kiểm tra và ép kiểu scene
        guard let windowScene = scene as? UIWindowScene else { return }
        
        // 2. Khởi tạo UIWindow mới với windowScene
        let window = UIWindow(windowScene: windowScene)
        
        // 3. Thiết lập Root View Controller với SwiftUI View
        window.rootViewController = UIHostingController(rootView: ContentView())
        
        // 4. Lưu trữ và hiển thị window
        self.window = window
        window.makeKeyAndVisible()
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Dọn dẹp tài nguyên nếu cần
    }
}
