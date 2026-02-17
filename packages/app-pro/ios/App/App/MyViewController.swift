import UIKit
import WebKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Sfondo bianco immediato
        view.backgroundColor = .white
        
        // WebView sotto la status bar senza inset
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.backgroundColor = .white
        webView?.isOpaque = false
        webView?.scrollView.backgroundColor = .white
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }
}
