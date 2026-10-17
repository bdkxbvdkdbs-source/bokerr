package com.bokerr

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private val client = OkHttpClient()
    private lateinit var content: LinearLayout
    private val gold = Color.rgb(232, 199, 94)
    private val dark = Color.rgb(6, 20, 14)
    private val card = Color.rgb(16, 26, 19)

    override fun onCreate(state: Bundle?) { super.onCreate(state); showLobby() }
    private fun base(): LinearLayout { val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 24, 24, 16); setBackgroundColor(dark); layoutDirection = LinearLayout.LAYOUT_DIRECTION_RTL }; val brand = TextView(this).apply { text = "BOKERR"; textSize = 26f; setTextColor(gold); gravity = Gravity.RIGHT; setPadding(0, 0, 0, 20) }; root.addView(brand); content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }; root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f)); val nav = LinearLayout(this).apply { gravity = Gravity.CENTER; setPadding(0, 16, 0, 0) }; listOf("الصالة" to ::showLobby, "المحفظة" to ::showWallet, "الدعم" to ::showSupport, "حسابي" to ::showProfile).forEach { (label, action) -> nav.addView(Button(this).apply { text = label; setOnClickListener { action() } }, LinearLayout.LayoutParams(0, -2, 1f)) }; root.addView(nav); setContentView(root); return root }
    private fun showLobby() { base(); content.removeAllViews(); addText("اختر طاولتك وابدأ اللعب", 18f, gold); addTable("طاولة بوكر تكساس", "Berlin · تكساس هولدم", "Blinds 5/10 · دخول 350 - 5000 ل.س", "6/9", "berlin-9max"); addTable("طاولة بوكر أوماها", "London · أوماها", "Blinds 5/10 · دخول 500 - 5000 ل.س", "3/5", "london-5max") }
    private fun addTable(name: String, subtitle: String, details: String, seats: String, id: String) { addText("$name\n$subtitle\n$details\nالمقاعد: $seats", 16f, Color.WHITE); val button = Button(this).apply { text = "دخول الطاولة"; setOnClickListener { connect(id) } }; content.addView(button) }
    private fun showWallet() { base(); content.removeAllViews(); addText("المحفظة اختيارية", 20f, Color.WHITE); addText("يمكنك تخطي إعداد الدفع والبدء باللعب.", 14f, Color.LTGRAY); content.addView(Button(this).apply { text = "إيداع" }); content.addView(Button(this).apply { text = "سحب" }); content.addView(Button(this).apply { text = "تخطي الآن"; setOnClickListener { showLobby() } }) }
    private fun showSupport() { base(); content.removeAllViews(); addText("الدعم الفني", 20f, Color.WHITE); content.addView(Button(this).apply { text = "فتح واتساب" }) }
    private fun showProfile() { base(); content.removeAllViews(); addText("حسابي\nلاعب_دمشق", 20f, Color.WHITE) }
    private fun addText(value: String, size: Float, color: Int) { content.addView(TextView(this).apply { text = value; textSize = size; setTextColor(color); setPadding(20, 20, 20, 20); setBackgroundColor(card) }) }
    private fun connect(tableId: String) { val request = Request.Builder().url("wss://api.example.com/ws/$tableId").build(); client.newWebSocket(request, object : WebSocketListener() { override fun onMessage(socket: WebSocket, text: String) { val token = Regex("\\\"turnToken\\\":\\\"([^\\\"]+)\\\"").find(text)?.groupValues?.get(1) ?: return; socket.send("{\"type\":\"join\",\"actionId\":\"${UUID.randomUUID()}\",\"turnToken\":\"$token\"}") } }) }
}
