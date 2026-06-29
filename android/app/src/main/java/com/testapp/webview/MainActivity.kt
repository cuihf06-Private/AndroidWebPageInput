package com.testapp.webview

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.ActionMode
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: SelectionWebView
    private lateinit var progressBar: ProgressBar

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Resize layout when soft keyboard appears (fixes input field hidden behind keyboard)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        setupWebView()

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            // Load the login page bundled in the APK's assets.
            // This makes the APK self-contained — no dependency on a remote server
            // (which might still be running an older branch's code).
            webView.loadUrl(ASSET_INDEX_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings

        // JavaScript — required for the login/register page
        settings.javaScriptEnabled = true

        // DOM storage — needed for localStorage / sessionStorage
        settings.domStorageEnabled = true

        // Database storage
        settings.databaseEnabled = true

        // Allow mixed content on older Android versions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        // Disable zoom controls — prevents accidental zoom that can break input focus
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        // Keep text at 100% to avoid layout/input issues caused by font scaling
        settings.textZoom = 100

        // User agent — keep default (do not spoof as desktop; mobile UA is needed for
        // the viewport meta tag to work correctly on Huawei)
        // settings.userAgentString = settings.userAgentString  // keep default

        // Cache mode
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Enable file access (not strictly needed for remote URLs)
        settings.allowFileAccess = true

        // Needed for some JS-heavy pages
        settings.javaScriptCanOpenWindowsAutomatically = false
        settings.setSupportMultipleWindows(false)

        // Hardware acceleration is set at Activity level in AndroidManifest.xml,
        // but we also ensure it here for the WebView layer.
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // Ensure the WebView receives proper focus for IME
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

        // Long-press text selection: enabled by default; do NOT suppress it.
        // We deliberately do NOT install a setOnLongClickListener that returns
        // true — that would consume the long-click and prevent the system
        // "Select text" menu from appearing at all.
        webView.isLongClickable = true
        webView.isHapticFeedbackEnabled = true

        // Observe the (forced-floating) selection ActionMode so we can verify
        // at runtime that the framework is using TYPE_FLOATING — useful when
        // diagnosing the "highlight appears but no handles" symptom.
        webView.onSelectionActionMode = { mode ->
            Log.d(TAG, "Selection ActionMode created: type=${mode.type} (TYPE_FLOATING=${ActionMode.TYPE_FLOATING})")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView, url: String) {
                progressBar.visibility = View.GONE
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                // Let the WebView handle all navigation within the app
                val url = request.url.toString()
                return if (url.startsWith("http://") ||
                           url.startsWith("https://") ||
                           url.startsWith("file:///android_asset/")) {
                    view.loadUrl(url)
                    true
                } else {
                    false
                }
            }

            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(
                view: WebView,
                handler: SslErrorHandler,
                error: SslError
            ) {
                // Proceed for dev/test; tighten this in production
                handler.proceed()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "MainActivity"
        // Self-contained: load HTML bundled inside the APK.
        private const val ASSET_INDEX_URL = "file:///android_asset/index.html"
    }
}
