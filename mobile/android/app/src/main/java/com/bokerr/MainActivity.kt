package com.bokerr

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            addJavascriptInterface(NativeBridge(), "BokerrNative")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?) =
                    request?.url?.let { assetLoader.shouldInterceptRequest(it) }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return request?.url?.host != "appassets.androidplatform.net"
                }
            }
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.removeJavascriptInterface("BokerrNative")
            webView.destroy()
        }
        super.onDestroy()
    }

    private inner class NativeBridge {
        private val preferences = getSharedPreferences("bokerr_private_session", Context.MODE_PRIVATE)

        @JavascriptInterface
        fun apiBaseUrl(): String = BuildConfig.API_BASE_URL

        @JavascriptInterface
        fun getSessionToken(): String = preferences.getString("session_token", "") ?: ""

        @JavascriptInterface
        fun saveSessionToken(token: String) {
            if (token.matches(Regex("^[a-fA-F0-9]{64}$"))) {
                preferences.edit().putString("session_token", token.lowercase()).apply()
            }
        }

        @JavascriptInterface
        fun clearSessionToken() {
            preferences.edit().remove("session_token").remove("last_table_id").apply()
        }

        @JavascriptInterface
        fun getDisplayName(): String = preferences.getString("display_name", "") ?: ""

        @JavascriptInterface
        fun saveDisplayName(name: String) {
            val clean = name.trim().replace(Regex("\\s+"), " ").take(24)
            preferences.edit().putString("display_name", clean).apply()
        }

        @JavascriptInterface
        fun saveLastTableId(tableId: String) {
            if (tableId == "berlin-9max" || tableId == "london-5max") {
                preferences.edit().putString("last_table_id", tableId).apply()
            }
        }
    }
}
