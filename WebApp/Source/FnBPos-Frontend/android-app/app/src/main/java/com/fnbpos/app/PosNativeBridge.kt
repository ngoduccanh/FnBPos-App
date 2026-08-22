package com.fnbpos.app

import android.content.Context
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * 🌉 PosNativeBridge — Cầu nối giữa Javascript Vue 3 Web và mã Native Android Kotlin
 */
class PosNativeBridge(
    private val context: Context,
    private val mainActivity: MainActivity
) {

    @JavascriptInterface
    fun showToast(message: String) {
        mainActivity.runOnUiThread {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun isDualScreenSupported(): Boolean {
        return mainActivity.hasSecondaryDisplay()
    }

    @JavascriptInterface
    fun sendToCustomerDisplay(payloadJson: String) {
        mainActivity.runOnUiThread {
            mainActivity.sendPayloadToCustomer(payloadJson)
        }
    }

    @JavascriptInterface
    fun reloadCustomerScreen() {
        mainActivity.runOnUiThread {
            mainActivity.reloadCustomerDisplay()
        }
    }

    @JavascriptInterface
    fun openCashDrawer() {
        mainActivity.runOnUiThread {
            Toast.makeText(context, "Đã gửi lệnh mở két tiền", Toast.LENGTH_SHORT).show()
        }
    }
}
