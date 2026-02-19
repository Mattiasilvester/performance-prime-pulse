import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Sfondo bianco per eliminare buco nero (primo frame prima che il WebView sia pronto)
        self.window?.backgroundColor = UIColor.white
        self.window?.rootViewController?.view.backgroundColor = UIColor.white
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Ripristina sfondo bianco (alcuni device riapplicano default dopo background)
        self.window?.backgroundColor = UIColor.white
        self.window?.rootViewController?.view.backgroundColor = UIColor.white
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }
}
