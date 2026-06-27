package com.testapp.webview

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
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
            webView.loadUrl(TARGET_URL)
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
        webView.isLongClickable = true
        webView.isHapticFeedbackEnabled = true

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
                return if (url.startsWith("http://") || url.startsWith("https://")) {
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

        // ============================================================
        // 文件下载监听 — 把 WebView 的下载请求转交给系统 DownloadManager
        // 这正是华为/原生 Android 浏览器中"另存为 / 下载"通知的入口
        // ============================================================
        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            handleDownload(url, userAgent, contentDisposition, mimetype, contentLength)
        }
    }

    /**
     * 使用系统 DownloadManager 触发文件下载。下载完成后会发系统通知，
     * 点击通知即可在文件管理器中打开 / 分享。
     */
    private fun handleDownload(
        url: String,
        userAgent: String?,
        contentDisposition: String?,
        mimetype: String?,
        contentLength: Long
    ) {
        try {
            val filename = guessFileName(url, contentDisposition, mimetype)
            Log.i(TAG, "Download start: url=$url, filename=$filename, mime=$mimetype, length=$contentLength")

            val request = DownloadManager.Request(Uri.parse(url))

            // 透传 UA，便于服务端识别客户端
            if (!userAgent.isNullOrEmpty()) {
                request.addRequestHeader("User-Agent", userAgent)
            }

            // 设置下载描述与标题（系统通知里会显示）
            request.setDescription("正在下载：$filename")
            request.setTitle(filename)

            // 允许漫游 / 计费网络下也下载；按需调整
            request.setAllowedOverMetered(true)
            request.setAllowedOverRoaming(true)

            // 关键：让下载在通知栏里可见，并完成后自动从列表移除
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            request.setMimeType(mimetype)

            // 关键：目标路径 — 公共下载目录 / Download
            // Android 10+ 会自动 scope 到应用私有目录以满足 scoped storage；
            // 用户仍可在系统"下载"应用里看到。
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = dm.enqueue(request)

            Toast.makeText(this, "开始下载：$filename", Toast.LENGTH_SHORT).show()

            // 监听下载完成
            registerDownloadReceiver(downloadId, filename)
        } catch (e: Exception) {
            Log.e(TAG, "Download failed to enqueue", e)
            Toast.makeText(this, "下载失败：${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private var downloadReceiver: BroadcastReceiver? = null

    private fun registerDownloadReceiver(downloadId: Long, filename: String) {
        // 清理旧的 receiver
        downloadReceiver?.let { unregisterReceiver(it) }

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                if (id != downloadId) return

                val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                val query = DownloadManager.Query().setFilterById(id)
                val cursor: Cursor? = dm.query(query)
                if (cursor != null && cursor.moveToFirst()) {
                    val statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                    val status = if (statusIdx >= 0) cursor.getInt(statusIdx) else -1
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        Toast.makeText(
                            context,
                            "下载完成：$filename（请在系统「下载」或通知中查看）",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        val reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)
                        val reason = if (reasonIdx >= 0) cursor.getInt(reasonIdx) else -1
                        Log.w(TAG, "Download failed. status=$status, reason=$reason")
                        Toast.makeText(context, "下载失败，请重试", Toast.LENGTH_SHORT).show()
                    }
                    cursor.close()
                }
                try {
                    unregisterReceiver(this)
                } catch (_: IllegalArgumentException) { /* already unregistered */ }
                downloadReceiver = null
            }
        }
        downloadReceiver = receiver
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
        }
    }

    /**
     * 简单提取文件名（参考系统实现）。
     * 优先从 Content-Disposition 中找 filename=，否则用 URL 末段，
     * 再不行就用 URL 的 hash + mime 扩展名。
     */
    private fun guessFileName(url: String, contentDisposition: String?, mimetype: String?): String {
        // 1) 从 Content-Disposition 取 filename
        if (!contentDisposition.isNullOrEmpty()) {
            val match = Regex("""filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?""", RegexOption.IGNORE_CASE)
                .find(contentDisposition)
            if (match != null) {
                var name = match.groupValues[1]
                try {
                    name = java.net.URLDecoder.decode(name, "UTF-8")
                } catch (_: Exception) { /* keep raw */ }
                if (name.isNotBlank()) return name
            }
        }
        // 2) 从 URL 末段
        try {
            val path = Uri.parse(url).lastPathSegment
            if (!path.isNullOrBlank() && path != "/") {
                return path
            }
        } catch (_: Exception) { /* fallthrough */ }
        // 3) 根据 mime 拼一个
        val ext = when {
            mimetype == null -> "bin"
            mimetype.contains("json") -> "json"
            mimetype.contains("text/plain") -> "txt"
            mimetype.contains("text/") -> "txt"
            else -> mimetype.substringAfterLast('/').takeIf { it.isNotBlank() } ?: "bin"
        }
        return "download-${System.currentTimeMillis()}.$ext"
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    @Suppress("MissingSuperCall", "DEPRECATION")
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
        downloadReceiver?.let {
            try { unregisterReceiver(it) } catch (_: IllegalArgumentException) { /* already unregistered */ }
        }
        downloadReceiver = null
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "TestAppWebView"
        private const val TARGET_URL = "https://test.tinybot.cloud"
    }
}
