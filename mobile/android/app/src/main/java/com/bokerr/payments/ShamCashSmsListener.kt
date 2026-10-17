package com.bokerr.payments

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Base64
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.MessageDigest

/**
 * يستقبل إشعار SMS فقط ويحوّله إلى إثبات للخادم.
 * لا يتم تعديل الرصيد على الهاتف؛ Worker يتحقق من التوقيع والمرجع والتكرار.
 */
class ShamCashSmsListener : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        val body = messages.joinToString(" ") { it.messageBody ?: "" }
        if (!body.contains("Sham Cash", ignoreCase = true) && !body.contains("شام كاش")) return

        val reference = Regex("(?:REF|رقم العملية)[:\\s-]*([A-Za-z0-9-]+)", RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1) ?: return
        val amount = Regex("([0-9][0-9,]*)\\s*(?:ل\\.س|SYP)", RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1)?.replace(",", "")?.toLongOrNull() ?: return
        val payload = "${reference}:${amount}"
        val proof = Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest(payload.toByteArray()), Base64.NO_WRAP)

        CoroutineScope(Dispatchers.IO).launch {
            // استخدم WorkManager في التطبيق الإنتاجي لإعادة المحاولة والقيود على الشبكة.
            val request = java.net.URL("https://api.example.com/api/payments/sms-proof").openConnection() as java.net.HttpURLConnection
            request.requestMethod = "POST"
            request.doOutput = true
            request.setRequestProperty("Content-Type", "application/json")
            request.outputStream.use { it.write("{\"reference\":\"$reference\",\"amountSyp\":$amount,\"proof\":\"$proof\"}".toByteArray()) }
            request.inputStream.close()
            request.disconnect()
        }
    }
}
