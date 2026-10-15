package com.alifbo.tajik

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import java.nio.charset.StandardCharsets

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var speech: SpeechBridge
    private var customView: View? = null
    private var customCallback: WebChromeClient.CustomViewCallback? = null
    private var pendingWebPermission: PermissionRequest? = null
    private var micRequestInFlight = false
    private var splashDismissed = false

    private val micPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        micRequestInFlight = false
        val webRequest = pendingWebPermission
        pendingWebPermission = null
        if (webRequest != null) {
            if (granted) webRequest.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
            else webRequest.deny()
        }
        if (::speech.isInitialized) speech.onMicResult(granted)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isStatusBarContrastEnforced = false
            window.isNavigationBarContrastEnforced = false
        }
        window.statusBarColor = ContextCompat.getColor(this, R.color.splash_sky)
        window.navigationBarColor = Color.TRANSPARENT
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.web)
        val splash = findViewById<View>(R.id.splash)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.root)) { _, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            webView.setPadding(bars.left, bars.top, bars.right, ime.bottom)
            splash.setPadding(bars.left, bars.top, bars.right, 0)
            insets
        }
        speech = SpeechBridge(this, webView)
        speech.attach()

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val response = assetLoader.shouldInterceptRequest(request.url) ?: return null
                val path = request.url.path ?: return response
                if (!path.endsWith(".html") && !path.endsWith(".htm")) return response
                val html = response.data.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
                val tag = "<script src=\"$SPEECH_SCRIPT\"></script>"
                val injected = if (html.contains("<head>", ignoreCase = true)) {
                    html.replaceFirst(Regex("<head>", RegexOption.IGNORE_CASE), "<head>$tag")
                } else {
                    tag + html
                }
                return WebResourceResponse(
                    "text/html",
                    "utf-8",
                    injected.byteInputStream(StandardCharsets.UTF_8)
                )
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                view?.post { dismissSplash() }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) dismissSplash()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (view == null) return
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customCallback = callback
                val decor = window.decorView as FrameLayout
                decor.addView(
                    view,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                )
                webView.visibility = View.GONE
            }

            override fun onHideCustomView() {
                hideCustomView()
            }

            override fun getDefaultVideoPoster(): Bitmap? {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                if (!request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                    request.deny()
                    return
                }
                if (hasMicPermission()) {
                    request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    return
                }
                pendingWebPermission?.deny()
                pendingWebPermission = request
                requestMic()
            }
        }

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.displayZoomControls = false
        settings.allowFileAccess = false
        settings.allowContentAccess = true

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (customView != null) {
                    hideCustomView()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(START_URL)
        }
        webView.postDelayed({ dismissSplash() }, SPLASH_TIMEOUT_MS)
        askMicOnStart()
    }

    private fun dismissSplash() {
        if (splashDismissed) return
        splashDismissed = true
        val splash = findViewById<View>(R.id.splash) ?: return
        window.statusBarColor = ContextCompat.getColor(this, R.color.header)
        splash.animate()
            .alpha(0f)
            .setDuration(280)
            .withEndAction { splash.visibility = View.GONE }
            .start()
    }

    fun requestMic() {
        if (hasMicPermission()) {
            pendingWebPermission?.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
            pendingWebPermission = null
            if (::speech.isInitialized) speech.onMicResult(true)
            return
        }
        if (micRequestInFlight) return
        val asked = micPrefs().getBoolean(KEY_MIC_ASKED, false)
        val canAsk = !asked || shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)
        if (!canAsk) {
            pendingWebPermission?.deny()
            pendingWebPermission = null
            if (::speech.isInitialized) speech.onMicResult(false)
            openMicSettings()
            return
        }
        micPrefs().edit().putBoolean(KEY_MIC_ASKED, true).apply()
        micRequestInFlight = true
        micPermission.launch(Manifest.permission.RECORD_AUDIO)
    }

    private fun askMicOnStart() {
        if (hasMicPermission() || micRequestInFlight) return
        val asked = micPrefs().getBoolean(KEY_MIC_ASKED, false)
        if (asked && !shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)) return
        micPrefs().edit().putBoolean(KEY_MIC_ASKED, true).apply()
        micRequestInFlight = true
        micPermission.launch(Manifest.permission.RECORD_AUDIO)
    }

    private fun hasMicPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun micPrefs() = getSharedPreferences("alifbo", MODE_PRIVATE)

    private fun openMicSettings() {
        Toast.makeText(this, R.string.mic_settings, Toast.LENGTH_LONG).show()
        startActivity(
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            }
        )
    }

    private fun hideCustomView() {
        val view = customView ?: return
        val decor = window.decorView as FrameLayout
        decor.removeView(view)
        customView = null
        webView.visibility = View.VISIBLE
        customCallback?.onCustomViewHidden()
        customCallback = null
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        speech.destroy()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val START_URL = "https://appassets.androidplatform.net/assets/www/index.html"
        private const val SPEECH_SCRIPT = "https://appassets.androidplatform.net/assets/bridge/android-speech.js"
        private const val KEY_MIC_ASKED = "mic_asked"
        private const val SPLASH_TIMEOUT_MS = 4000L
    }
}
