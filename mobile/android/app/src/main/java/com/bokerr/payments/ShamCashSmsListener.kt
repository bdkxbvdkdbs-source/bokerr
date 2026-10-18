package com.bokerr.payments

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.bokerr.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * يرسل بيانات مرجعية أولية فقط. لا يثبت SMS الدفع؛ يجب على الخادم
 * التحقق من المعاملة عبر واجهة المزود الرسمية قبل أي تعديل للرصيد.
 */
class ShamCashSmsListener : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        val body = messages.joinToString(" ") { it.messageBody ?: "" }
        if (!body.contains("Sham Cash", ignoreCase = true) && !body.contains("شام كاش")) return

        val reference = Regex("(?:REF|رقم العملية)[:\\s-]*([A-Za-z0-9-]+)", RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1) ?: return
        val amount = Regex("([0-9][0-9,]*)\\s*(?:ل\\.س|SYP)", RegexOption.IGNORE_CASE).find(body)?.groupValues?.get(1)?.replace(",", "")?.toLongOrNull() ?: return
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val base = BuildConfig.API_BASE_URL.trimEnd('/')
                if (!base.startsWith("https://", ignoreCase = true)) return@launch
                val connection = (URL("$base/api/payments/sms-proof").openConnection() as HttpURLConnection)
                try {
                    connection.connectTimeout = 10_000
                    connection.readTimeout = 10_000
                    connection.requestMethod = "POST"
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    val payload = JSONObject().put("reference", reference).put("amountSyp", amount).toString()
                    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
                    if (connection.responseCode in 200..299) connection.inputStream.close()
                    else connection.errorStream?.close()
                } finally {
                    connection.disconnect()
                }
            } catch (_: Exception) {
                // الفشل لا يغير الرصيد؛ أعد المحاولة من خلال آلية خادم موثوقة.
            } finally {
                pendingResult.finish()
            }
        }
    }
}
