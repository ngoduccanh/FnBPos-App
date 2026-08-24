package com.fnbpos.app

import android.content.Context
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

/**
 * 🌉 PosNativeBridge — Cầu nối giữa Javascript Vue 3 Web và mã Native Android Kotlin
 * Tích hợp đầy đủ:
 * - Điều khiển màn hình phụ (Dual Screen Customer Facing Display)
 * - Điều khiển máy in USB trực tiếp (Direct USB ESC/POS Printer — Chuẩn KiotViet / Sapo)
 * - Mở két tiền (Cash Drawer)
 */
class PosNativeBridge(
    private val context: Context,
    private val mainActivity: MainActivity
) {
    companion object {
        private const val TAG = "PosNativeBridge"
    }

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

    // ─────────────────────────────────────────────────────────────────────────────
    // 🖨️ MÁY IN USB NATIVE (DIRECT USB ESC/POS PRINTER — CHUẨN KIOTVIET / SAPO)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * 🔍 Quét và lấy danh sách máy in USB đang cắm vào máy POS
     */
    @JavascriptInterface
    fun getConnectedUsbPrinters(): String {
        val result = JSONArray()
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: return result.toString()
            val deviceList = usbManager.deviceList

            for (device in deviceList.values) {
                if (isPrinterDevice(device)) {
                    val obj = JSONObject().apply {
                        put("name", device.productName ?: "USB Printer (${device.vendorId}:${device.productId})")
                        put("vendorId", device.vendorId)
                        put("productId", device.productId)
                        put("deviceId", device.deviceId)
                    }
                    result.put(obj)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi lấy danh sách máy in USB: ${e.message}", e)
        }
        return result.toString()
    }

    /**
     * ⚡ In dữ liệu Base64 ESC/POS trực tiếp ra máy in USB (0ms siêu tốc)
     */
    @JavascriptInterface
    fun printUsbBase64(base64Data: String): Boolean {
        return try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            sendBytesToUsbPrinter(bytes)
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi in USB Base64: ${e.message}", e)
            false
        }
    }

    /**
     * ⚡ Alias tương thích các chuẩn gọi in khác nhau
     */
    @JavascriptInterface
    fun printReceipt(base64Data: String): Boolean = printUsbBase64(base64Data)

    @JavascriptInterface
    fun printBill(base64Data: String): Boolean = printUsbBase64(base64Data)

    @JavascriptInterface
    fun printEscPos(base64Data: String): Boolean = printUsbBase64(base64Data)

    @JavascriptInterface
    fun print(base64Data: String): Boolean = printUsbBase64(base64Data)

    /**
     * 💵 Mở két tiền (Gửi mã ESC/POS mở két: 27, 112, 0, 25, 250)
     */
    @JavascriptInterface
    fun openCashDrawer() {
        try {
            val drawerKick = byteArrayOf(27, 112, 0, 25, 250.toByte())
            sendBytesToUsbPrinter(drawerKick)
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi mở két tiền: ${e.message}", e)
        }
    }

    /**
     * 🔌 Gửi mảng bytes ESC/POS trực tiếp tới USB Endpoint Out của máy in
     */
    private fun sendBytesToUsbPrinter(bytes: ByteArray): Boolean {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: return false
        val deviceList = usbManager.deviceList

        for (device in deviceList.values) {
            for (i in 0 until device.interfaceCount) {
                val usbInterface = device.getInterface(i)
                val isPrinter = usbInterface.interfaceClass == UsbConstants.USB_CLASS_PRINTER ||
                        usbInterface.interfaceClass == 7 ||
                        isPrinterDevice(device)

                if (isPrinter) {
                    var connection: UsbDeviceConnection? = null
                    try {
                        connection = usbManager.openDevice(device)
                        if (connection != null) {
                            connection.claimInterface(usbInterface, true)

                            for (j in 0 until usbInterface.endpointCount) {
                                val endpoint = usbInterface.getEndpoint(j)
                                if (endpoint.direction == UsbConstants.USB_DIR_OUT) {
                                    val chunkSize = 4096
                                    var offset = 0
                                    while (offset < bytes.size) {
                                        val length = minOf(chunkSize, bytes.size - offset)
                                        val chunk = bytes.copyOfRange(offset, offset + length)
                                        connection.bulkTransfer(endpoint, chunk, chunk.size, 5000)
                                        offset += length
                                    }

                                    connection.releaseInterface(usbInterface)
                                    connection.close()
                                    Log.d(TAG, "✅ Đã in thành công ${bytes.size} bytes ra máy in USB: ${device.productName}")
                                    return true
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Thử gửi máy in ${device.productName} thất bại: ${e.message}")
                        try {
                            connection?.close()
                        } catch (_: Exception) {}
                    }
                }
            }
        }
        return false
    }

    private fun isPrinterDevice(device: UsbDevice): Boolean {
        if (device.deviceClass == UsbConstants.USB_CLASS_PRINTER || device.deviceClass == 7) return true
        for (i in 0 until device.interfaceCount) {
            val iface = device.getInterface(i)
            if (iface.interfaceClass == UsbConstants.USB_CLASS_PRINTER || iface.interfaceClass == 7) return true
        }
        val name = (device.productName ?: "").lowercase()
        return name.contains("print") || name.contains("pos") || name.contains("xprinter") || name.contains("receipt")
    }
}
