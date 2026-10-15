(function () {
    if (!window.AlifboSpeech || typeof window.AlifboSpeech.postMessage !== "function") return;

    var sessions = {};
    var seq = 0;

    function emit(rec, name, event) {
        var fn = rec && rec[name];
        if (typeof fn === "function") {
            try { fn.call(rec, event || {}); } catch (e) {}
        }
    }

    function SpeechRecognition() {
        this.lang = "ru-RU";
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
        this.grammars = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.onstart = null;
        this._id = 0;
    }

    SpeechRecognition.prototype.start = function () {
        this._id = ++seq;
        sessions[this._id] = this;
        window.AlifboSpeech.postMessage(JSON.stringify({
            cmd: "start",
            id: this._id,
            lang: this.lang || "ru-RU",
            interim: !!this.interimResults,
            maxAlternatives: this.maxAlternatives || 1
        }));
        emit(this, "onstart");
    };

    SpeechRecognition.prototype.stop = function () {
        window.AlifboSpeech.postMessage(JSON.stringify({ cmd: "stop", id: this._id }));
    };

    SpeechRecognition.prototype.abort = function () {
        window.AlifboSpeech.postMessage(JSON.stringify({ cmd: "abort", id: this._id }));
    };

    window.__alifboOnSpeech = function (data) {
        var msg = typeof data === "string" ? JSON.parse(data) : data;
        if (!msg) return;
        var rec = sessions[msg.id];
        if (!rec) return;
        if (msg.type === "result") {
            var alternatives = [];
            var texts = msg.texts || [];
            for (var i = 0; i < texts.length; i++) {
                alternatives.push({ transcript: texts[i], confidence: 0.9 });
            }
            alternatives.isFinal = !!msg.final;
            var results = [alternatives];
            emit(rec, "onresult", { resultIndex: 0, results: results });
        } else if (msg.type === "error") {
            emit(rec, "onerror", { error: msg.error || "network" });
        } else if (msg.type === "end") {
            delete sessions[msg.id];
            emit(rec, "onend");
        }
    };

    window.SpeechRecognition = SpeechRecognition;
    window.webkitSpeechRecognition = SpeechRecognition;
})();
