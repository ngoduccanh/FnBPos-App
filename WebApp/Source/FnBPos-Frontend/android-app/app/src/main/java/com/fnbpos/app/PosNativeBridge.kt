package com.fnbpos.app

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

/**
 * 🌉 PosNativeBridge — Cầu nối giữa Javascript Vue 3 Web và mã Native Android Kotlin
 * Tích hợp đầy đủ tiêu chuẩn KiotViet / Sapo:
 * - Điều khiển màn hình phụ (Dual Screen Customer Facing Display)
 * - Điều khiển toàn bộ máy in USB (Xprinter, Epson, Bixolon, Rongta, Star, Gprinter, Zywell, K80, K58...)
 * - Nhận diện chính xác Tên hãng + Dòng máy in (Brand + Model)
 * - Mở két tiền tự động (Cash Drawer Kick)
 */
class PosNativeBridge(
    private val context: Context,
    private val mainActivity: MainActivity
) {
    companion object {
        private const val TAG = "PosNativeBridge"
        private const val ACTION_USB_PERMISSION = "com.fnbpos.app.USB_PERMISSION"
    }

    @JavascriptInterface
    fun showToast(message: String) {
        mainActivity.runOnUiThread {
            Toast.makeText(mainActivity, message, Toast.LENGTH_SHORT).show()
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
    // 🖨️ QUẢN LÝ MÁY IN USB CHUẨN KIOTVIET / SAPO
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * 🔍 Quét và lấy danh sách tất cả máy in USB đang cắm vào máy POS
     * Tự động nhận diện Tên Hãng, Dòng Máy, Trạng thái Cấp Quyền
     */
    @JavascriptInterface
    fun getConnectedUsbPrinters(): String {
        val result = JSONArray()
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: return result.toString()
            val deviceList = usbManager.deviceList

            for (device in deviceList.values) {
                if (isPrinterDevice(device)) {
                    val displayName = getPrinterModelName(device)
                    val hasPerm = usbManager.hasPermission(device)
                    val obj = JSONObject().apply {
                        put("deviceId", device.deviceId)
                        put("name", displayName)
                        put("vendorId", device.vendorId)
                        put("productId", device.productId)
                        put("hasPermission", hasPerm)
                        put("portName", "USB Cổng ${device.deviceId}")
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
     * 🔐 Yêu cầu Android bật popup cấp quyền cho một máy in cụ thể
     */
    @JavascriptInterface
    fun requestUsbPermission(deviceId: Int): Boolean {
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: return false
            val device = usbManager.deviceList.values.find { it.deviceId == deviceId } ?: return false

            if (!usbManager.hasPermission(device)) {
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
                val permissionIntent = PendingIntent.getBroadcast(
                    context, 0, Intent(ACTION_USB_PERMISSION), flags
                )
                mainActivity.runOnUiThread {
                    Toast.makeText(mainActivity, "🔐 Vui lòng bấm [Cho phép] để kết nối máy in: ${getPrinterModelName(device)}", Toast.LENGTH_LONG).show()
                    usbManager.requestPermission(device, permissionIntent)
                }
                return true
            }
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi xin quyền USB: ${e.message}", e)
            return false
        }
    }

    /**
     * ⚡ In dữ liệu Base64 ESC/POS trực tiếp ra máy in USB (0ms siêu tốc)
     */
    @JavascriptInterface
    fun printUsbBase64(base64Data: String): Boolean {
        return try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            sendBytesToUsbPrinter(bytes, -1)
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi in USB Base64: ${e.message}", e)
            mainActivity.runOnUiThread {
                Toast.makeText(mainActivity, "❌ Lỗi giải mã hóa đơn: ${e.message}", Toast.LENGTH_LONG).show()
            }
            false
        }
    }

    /**
     * ⚡ In trực tiếp tới một máy in cụ thể theo deviceId
     */
    @JavascriptInterface
    fun printUsbBase64ToDevice(deviceId: Int, base64Data: String): Boolean {
        return try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            sendBytesToUsbPrinter(bytes, deviceId)
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi in USB Base64 tới Device $deviceId: ${e.message}", e)
            false
        }
    }

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
            sendBytesToUsbPrinter(drawerKick, -1)
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi mở két tiền: ${e.message}", e)
        }
    }

    /**
     * 🔌 Gửi mảng bytes ESC/POS trực tiếp tới USB Bulk OUT Endpoint của máy in
     */
    private fun sendBytesToUsbPrinter(bytes: ByteArray, targetDeviceId: Int): Boolean {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as? UsbManager ?: run {
            mainActivity.runOnUiThread {
                Toast.makeText(mainActivity, "❌ Không tìm thấy USB Service trên máy POS!", Toast.LENGTH_SHORT).show()
            }
            return false
        }

        val deviceList = usbManager.deviceList
        if (deviceList.isEmpty()) {
            mainActivity.runOnUiThread {
                Toast.makeText(mainActivity, "⚠️ Không tìm thấy thiết bị USB nào cắm vào máy POS!", Toast.LENGTH_LONG).show()
            }
            return false
        }

        // Lọc các thiết bị là máy in
        val printerDevices = deviceList.values.filter { isPrinterDevice(it) }
        val candidateDevices = if (targetDeviceId > 0) {
            deviceList.values.filter { it.deviceId == targetDeviceId }
        } else if (printerDevices.isNotEmpty()) {
            printerDevices
        } else {
            deviceList.values.toList()
        }

        for (device in candidateDevices) {
            val modelName = getPrinterModelName(device)

            // 1. Kiểm tra quyền truy cập USB
            if (!usbManager.hasPermission(device)) {
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
                val permissionIntent = PendingIntent.getBroadcast(
                    context, 0, Intent(ACTION_USB_PERMISSION), flags
                )
                mainActivity.runOnUiThread {
                    Toast.makeText(mainActivity, "🔐 Vui lòng bấm [Cho phép / OK] trên màn hình để cấp quyền máy in: $modelName", Toast.LENGTH_LONG).show()
                    usbManager.requestPermission(device, permissionIntent)
                }
                return false
            }

            // 2. Mở kết nối USB
            var connection: UsbDeviceConnection? = null
            try {
                connection = usbManager.openDevice(device)
                if (connection == null) {
                    Log.w(TAG, "Không thể mở kết nối tới $modelName")
                    continue
                }

                for (i in 0 until device.interfaceCount) {
                    val usbInterface = device.getInterface(i)
                    if (connection.claimInterface(usbInterface, true)) {
                        for (j in 0 until usbInterface.endpointCount) {
                            val endpoint = usbInterface.getEndpoint(j)
                            if (endpoint.direction == UsbConstants.USB_DIR_OUT) {
                                val chunkSize = 4096
                                var offset = 0
                                var allSuccess = true
                                while (offset < bytes.size) {
                                    val length = minOf(chunkSize, bytes.size - offset)
                                    val chunk = bytes.copyOfRange(offset, offset + length)
                                    val transferred = connection.bulkTransfer(endpoint, chunk, chunk.size, 5000)
                                    if (transferred < 0) {
                                        allSuccess = false
                                        break
                                    }
                                    offset += length
                                }

                                connection.releaseInterface(usbInterface)
                                connection.close()

                                if (allSuccess) {
                                    Log.d(TAG, "✅ Đã in thành công ${bytes.size} bytes ra máy in: $modelName")
                                    mainActivity.runOnUiThread {
                                        Toast.makeText(mainActivity, "✅ Đã in ra: $modelName", Toast.LENGTH_SHORT).show()
                                    }
                                    return true
                                }
                            }
                        }
                        connection.releaseInterface(usbInterface)
                    }
                }
                connection.close()
            } catch (e: Exception) {
                Log.w(TAG, "Lỗi kết nối máy in $modelName: ${e.message}")
                try {
                    connection?.close()
                } catch (_: Exception) {}
            }
        }

        mainActivity.runOnUiThread {
            Toast.makeText(mainActivity, "⚠️ Không tìm thấy Endpoint máy in phù hợp trên cổng USB.", Toast.LENGTH_LONG).show()
        }
        return false
    }

    /**
     * 🏷️ Nhận diện Tên Hãng + Model máy in theo chuẩn KiotViet / Sapo
     */
    private fun getPrinterModelName(device: UsbDevice): String {
        // 1. Nếu chip USB có khai báo tên ProductName thực tế
        val rawName = device.productName?.trim()
        val manufacturer = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) device.manufacturerName?.trim() else null

        if (!rawName.isNullOrEmpty() && rawName != "USB Printer" && rawName != "Printer" && rawName != "POS Printer") {
            return if (!manufacturer.isNullOrEmpty() && !rawName.startsWith(manufacturer, ignoreCase = true)) {
                "$manufacturer $rawName"
            } else {
                rawName
            }
        }

        // 2. Tra cứu Cơ sở Dữ liệu Phần cứng VID / PID chuẩn công nghiệp
        val vid = device.vendorId
        val pid = device.productId

        return when (vid) {
            0x0416 -> when (pid) {
                0x5011 -> "Xprinter XP-Q200 / K80"
                0xA888 -> "Xprinter XP-58 / K58"
                0x0503 -> "Xprinter XP-N160M / K80"
                else -> "Xprinter Thermal Printer (K80/K58)"
            }
            0x0471 -> "Xprinter XP Series"
            0x0483 -> when (pid) {
                0x5740 -> "POS-80 / Xprinter Virtual COM"
                0x5720 -> "Gprinter GP-80 / K80"
                0x5750 -> "HPRT / Xprinter Thermal Printer"
                else -> "Xprinter / STMicroelectronics POS Printer"
            }
            0x1fc9 -> "NXP / POS-80 Thermal Printer"
            0x04b8 -> when (pid) {
                0x0202 -> "Epson TM-T88IV"
                0x0e15 -> "Epson TM-T82II / TM-T82III"
                0x0e20 -> "Epson TM-m30"
                0x0e28 -> "Epson TM-T20III"
                else -> "Epson TM Series POS Printer"
            }
            0x0519 -> "Star Micronics TSP Series"
            0x1504 -> "Bixolon SRP Series"
            0x0fe6 -> "Citizen / HPRT POS Printer"
            0x6868 -> "Rongta RP80 / RPP Series"
            0x1a86 -> "QinHeng CH340 / POS-80 Printer"
            0x10c4 -> "Silicon Labs CP210x POS Printer"
            0x067b -> "Prolific PL2303 POS Printer"
            0x0403 -> "FTDI FT232R POS Printer"
            0x20d1 -> "Gprinter GP Series"
            0x28e9 -> "Zijiang POS-58 / POS-80"
            0x8087 -> "Zywell ZY Series Thermal Printer"
            0x0dd4 -> "Custom Engineering POS Printer"
            0x0493 -> "Targus / POS58 Thermal Printer"
            else -> "Máy in USB (${Integer.toHexString(vid).uppercase()}:${Integer.toHexString(pid).uppercase()})"
        }
    }

    /**
     * 🔎 Kiểm tra thiết bị có phải là máy in nhiệt USB không
     */
    private fun isPrinterDevice(device: UsbDevice): Boolean {
        // 1. Kiểm tra Printer Class chuẩn (Class 7)
        if (device.deviceClass == UsbConstants.USB_CLASS_PRINTER || device.deviceClass == 7) return true
        for (i in 0 until device.interfaceCount) {
            val iface = device.getInterface(i)
            if (iface.interfaceClass == UsbConstants.USB_CLASS_PRINTER || iface.interfaceClass == 7) return true
        }

        // 2. Kiểm tra tên thiết bị
        val name = (device.productName ?: "").lowercase()
        if (name.contains("print") || name.contains("pos") || name.contains("xprinter") || name.contains("receipt") || name.contains("thermal") || name.contains("80") || name.contains("58")) {
            return true
        }

        // 3. Tra cứu theo Vendor ID phổ biến của máy in nhiệt POS
        val knownPrinterVids = setOf(0x0416, 0x0471, 0x0483, 0x1fc9, 0x04b8, 0x0519, 0x1504, 0x0fe6, 0x6868, 0x1a86, 0x10c4, 0x067b, 0x0403, 0x20d1, 0x28e9, 0x8087, 0x0dd4, 0x0493)
        if (knownPrinterVids.contains(device.vendorId)) return true

        // 4. Có OUT bulk endpoint và không phải là chuột/bàn phím (HID class 3)
        for (i in 0 until device.interfaceCount) {
            val iface = device.getInterface(i)
            if (iface.interfaceClass != 3) {
                for (j in 0 until iface.endpointCount) {
                    val ep = iface.getEndpoint(j)
                    if (ep.direction == UsbConstants.USB_DIR_OUT) {
                        return true
                    }
                }
            }
        }
        return false
    }
}
