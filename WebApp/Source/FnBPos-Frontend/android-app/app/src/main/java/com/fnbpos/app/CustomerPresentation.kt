package com.fnbpos.app

import android.annotation.SuppressLint
import android.app.Presentation
import android.content.Context
import android.net.http.SslError
import android.os.Bundle
import android.view.Display
import android.view.WindowManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * 📺 CustomerPresentation — Hiển thị toàn màn hình trên Màn hình phụ hướng về khách hàng
 */
class CustomerPresentation(
    context: Context,
    display: Display,
    private var targetUrl: String
) : Presentation(context, display) {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.presentation_customer)

        // Giữ sáng màn hình phụ liên tục
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = findViewById(R.id.customerWebView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // Bỏ qua lỗi chứng chỉ SSL khi chạy trên mạng LAN / IP nội bộ
                handler?.proceed()
            }
        }
        webView.webChromeClient = WebChromeClient()

        // Nạp trang màn hình phụ
        webView.loadUrl(targetUrl)
    }

    fun reload() {
        if (::webView.isInitialized) {
            webView.reload()
        }
    }

    fun loadUrl(url: String) {
        targetUrl = url
        if (::webView.isInitialized) {
            webView.loadUrl(url)
        }
    }
}
