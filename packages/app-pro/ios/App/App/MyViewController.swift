import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        print("✅ MyViewController is being used!")

        self.view.backgroundColor = UIColor.white

        if let webView = self.webView {
            webView.backgroundColor = UIColor.white
            webView.isOpaque = true
            webView.scrollView.backgroundColor = UIColor.white
            webView.scrollView.contentInsetAdjustmentBehavior = .never
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        self.view.backgroundColor = UIColor.white
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }
}
