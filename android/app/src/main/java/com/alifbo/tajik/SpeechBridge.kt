package com.alifbo.tajik

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONArray
import org.json.JSONObject

class SpeechBridge(
    private val activity: MainActivity,
    private val webView: WebView
) {
    private var recognizer: SpeechRecognizer? = null
    private var session = 0
    private var pending: JSONObject? = null

    fun attach() {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(
                webView,
                "AlifboSpeech",
                setOf("https://appassets.androidplatform.net")
            ) { _, message, _, _, _ ->
                handle(message.data ?: return@addWebMessageListener)
            }
        } else {
            webView.addJavascriptInterface(LegacyInterface(), "AlifboSpeech")
        }
    }

    fun onMicResult(granted: Boolean) {
        val request = pending
        pending = null
        if (request == null) return
        if (!granted) {
            val id = request.optInt("id")
            sendError(id, "not-allowed")
            sendEnd(id)
            return
        }
        activity.runOnUiThread { begin(request) }
    }

    fun destroy() {
        session += 1
        stopRecognizer()
    }

    private fun handle(body: String) {
        val json = try {
            JSONObject(body)
        } catch (_: Exception) {
            return
        }
        activity.runOnUiThread {
            when (json.optString("cmd")) {
                "start" -> {
                    if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED
                    ) {
                        pending = json
                        activity.requestMic()
                    } else {
                        begin(json)
                    }
                }
                "stop", "abort" -> {
                    val id = json.optInt("id")
                    session += 1
                    stopRecognizer()
                    sendEnd(id)
                }
            }
        }
    }

    private fun begin(json: JSONObject) {
        session += 1
        val token = session
        stopRecognizer()
        val id = json.optInt("id")
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            sendError(id, "network")
            sendEnd(id)
            return
        }
        val rec = SpeechRecognizer.createSpeechRecognizer(activity)
        recognizer = rec
        rec.setRecognitionListener(SessionListener(token, id, json.optBoolean("interim", false)))
        var lang = json.optString("lang", "ru-RU")
        if (lang.equals("ru", ignoreCase = true)) lang = "ru-RU"
        val max = json.optInt("maxAlternatives", 3).coerceIn(1, 5)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, json.optBoolean("interim", false))
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, max)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, activity.packageName)
        }
        rec.startListening(intent)
    }

    private fun stopRecognizer() {
        val current = recognizer
        recognizer = null
        try {
            current?.cancel()
        } catch (_: Exception) {
        }
        try {
            current?.destroy()
        } catch (_: Exception) {
        }
    }

    private fun textsFrom(results: Bundle?): JSONArray {
        val arr = JSONArray()
        val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return arr
        list.forEach { arr.put(it) }
        return arr
    }

    private fun sendResult(id: Int, texts: JSONArray, final: Boolean) {
        if (texts.length() == 0) return
        post(JSONObject().put("type", "result").put("id", id).put("final", final).put("texts", texts))
    }

    private fun sendError(id: Int, error: String) {
        post(JSONObject().put("type", "error").put("id", id).put("error", error))
    }

    private fun sendEnd(id: Int) {
        post(JSONObject().put("type", "end").put("id", id))
    }

    private fun post(payload: JSONObject) {
        val quoted = JSONObject.quote(payload.toString())
        webView.post {
            webView.evaluateJavascript("window.__alifboOnSpeech&&window.__alifboOnSpeech($quoted)", null)
        }
    }

    private inner class SessionListener(
        private val token: Int,
        private val id: Int,
        private val interim: Boolean
    ) : RecognitionListener {
        private var finished = false

        private fun live(): Boolean = token == session && !finished

        private fun finish(beforeEnd: () -> Unit) {
            if (!live()) return
            finished = true
            beforeEnd()
            sendEnd(id)
            if (token == session) stopRecognizer()
        }

        override fun onResults(results: Bundle?) {
            finish { sendResult(id, textsFrom(results), true) }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            if (!live() || !interim) return
            sendResult(id, textsFrom(partialResults), false)
        }

        override fun onError(error: Int) {
            val name = when (error) {
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed"
                SpeechRecognizer.ERROR_NETWORK,
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT,
                SpeechRecognizer.ERROR_SERVER -> "network"
                SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED,
                SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "language-not-supported"
                SpeechRecognizer.ERROR_NO_MATCH,
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                SpeechRecognizer.ERROR_CLIENT -> "aborted"
                else -> "network"
            }
            finish {
                if (name != "aborted") sendError(id, name)
            }
        }

        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    private inner class LegacyInterface {
        @JavascriptInterface
        fun postMessage(body: String) {
            handle(body)
        }
    }
}
