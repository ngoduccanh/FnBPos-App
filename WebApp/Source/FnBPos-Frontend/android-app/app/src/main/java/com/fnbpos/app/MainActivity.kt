package com.fnbpos.app

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.content.SharedPreferences
import android.hardware.display.DisplayManager
import android.net.http.SslError
import android.os.Bundle
import android.view.Display
import android.view.View
import android.view.WindowManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * 🖥️ MainActivity — Màn hình chính Thu ngân của máy POS Android
 */
class MainActivity : AppCompatActivity() {

    private lateinit var mainWebView: WebView
    private var customerPresentation: CustomerPresentation? = null
    private lateinit var displayManager: DisplayManager
    private lateinit var prefs: SharedPreferences

    companion object {
        private const val PREFS_NAME = "PosAppPrefs"
        private const val KEY_BASE_URL = "base_url"
        // IP mặc định của máy tính phát triển trong mạng LAN
        private const val DEFAULT_BASE_URL = "http://192.168.2.185:5173"
    }

    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {
            setupSecondaryDisplay()
        }

        override fun onDisplayRemoved(displayId: Int) {
            customerPresentation?.dismiss()
            customerPresentation = null
        }

        override fun onDisplayChanged(displayId: Int) {}
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Chế độ Toàn màn hình Kiosk (Immersive Sticky Fullscreen)
        hideSystemUI()

        // 2. Giữ màn hình luôn sáng không bao giờ tự tắt
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        displayManager = getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
        displayManager.registerDisplayListener(displayListener, null)

        // 3. Khởi tạo WebView Màn hình chính (Thu ngân)
        mainWebView = findViewById(R.id.mainWebView)
        val settings: WebSettings = mainWebView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Cầu nối Javascript Native Bridge
        mainWebView.addJavascriptInterface(PosNativeBridge(this, this), "PosNativeBridge")

        mainWebView.webViewClient = object : WebViewClient() {
            @SuppressLint("WebViewClientOnReceivedSslError")
            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                // Cho phép chạy local HTTPS / Self-signed certificate
                handler?.proceed()
            }
        }
        mainWebView.webChromeClient = WebChromeClient()

        // Nhấn giữ lâu trên màn hình để mở hộp thoại đổi IP/URL máy chủ
        mainWebView.setOnLongClickListener {
            showConfigServerDialog()
            true
        }

        loadPosScreens()

        // 4. Tự động tìm và khởi động Màn hình phụ (Customer Display)
        setupSecondaryDisplay()
    }

    private fun getBaseUrl(): String {
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    private fun loadPosScreens() {
        val baseUrl = getBaseUrl().trimEnd('/')
        val posUrl = "$baseUrl/pos"
        val customerUrl = "$baseUrl/customer-display"

        mainWebView.loadUrl(posUrl)
        customerPresentation?.loadUrl(customerUrl)
    }

    /**
     * ⚙️ Hộp thoại đổi IP / Domain máy chủ POS (Nhấn giữ 2 giây ở bất cứ đâu để mở)
     */
    fun showConfigServerDialog() {
        val currentUrl = getBaseUrl()
        val input = EditText(this)
        input.setText(currentUrl)
        input.hint = "Ví dụ: http://192.168.2.185:5173"
        input.setSingleLine(true)

        AlertDialog.Builder(this)
            .setTitle("⚙️ Cài đặt Địa chỉ Máy chủ POS")
            .setMessage("Nhập địa chỉ IP hoặc tên miền đang chạy Web POS:")
            .setView(input)
            .setPositiveButton("Lưu & Tải lại") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    prefs.edit().putString(KEY_BASE_URL, newUrl).apply()
                    Toast.makeText(this, "Đã lưu địa chỉ mới!", Toast.LENGTH_SHORT).show()
                    loadPosScreens()
                }
            }
            .setNegativeButton("Hủy", null)
            .show()
    }

    private fun setupSecondaryDisplay() {
        val presentationDisplays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)

        if (presentationDisplays.isNotEmpty()) {
            val secondaryDisplay: Display = presentationDisplays[0]
            val baseUrl = getBaseUrl().trimEnd('/')
            val customerUrl = "$baseUrl/customer-display"

            if (customerPresentation == null) {
                customerPresentation = CustomerPresentation(this, secondaryDisplay, customerUrl)
                customerPresentation?.show()
            }
        }
    }

    fun hasSecondaryDisplay(): Boolean {
        val displays = displayManager.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
        return displays.isNotEmpty()
    }

    fun reloadCustomerDisplay() {
        val baseUrl = getBaseUrl().trimEnd('/')
        customerPresentation?.loadUrl("$baseUrl/customer-display")
    }

    override fun onResume() {
        super.onResume()
        hideSystemUI()
    }

    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        displayManager.unregisterDisplayListener(displayListener)
        customerPresentation?.dismiss()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (mainWebView.canGoBack()) {
            mainWebView.goBack()
        }
    }
}
