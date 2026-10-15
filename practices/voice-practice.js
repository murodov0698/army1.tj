(function () {
    const TAJIK_LANGS = ['ru-RU', 'ru', 'tg-TJ', 'uk-UA'];

    function foldText(s) {
        return String(s || '')
            .toLowerCase()
            .replace(/ҷ/g, 'ч').replace(/ғ/g, 'г').replace(/қ/g, 'к').replace(/ҳ/g, 'х')
            .replace(/ӣ/g, 'и').replace(/ӯ/g, 'у').replace(/ё/g, 'е').replace(/э/g, 'е')
            .replace(/дж/g, 'ч').replace(/гъ/g, 'г').replace(/къ/g, 'к').replace(/хъ/g, 'х')
            .replace(/sh/g, 'ш').replace(/ch/g, 'ч').replace(/kh/g, 'х').replace(/zh/g, 'ж')
            .replace(/ya/g, 'я').replace(/yu/g, 'ю').replace(/yo/g, 'е')
            .replace(/[ъь'ʼ`\-.,!?«»"()]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function toTajikSpeech(s) {
        return String(s || '')
            .replace(/дж/gi, 'ҷ')
            .replace(/гъ/gi, 'ғ')
            .replace(/къ/gi, 'қ')
            .replace(/хъ/gi, 'ҳ')
            .trim();
    }

    function levenshtein(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const row = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let prev = i - 1;
            row[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const tmp = row[j];
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
                prev = tmp;
            }
        }
        return row[b.length];
    }

    function childScore(heard, target) {
        if (!heard || !target) return 0;
        if (heard === target) return 100 + target.length;
        const hParts = heard.split(' ').filter(Boolean);
        const tParts = target.split(' ').filter(Boolean);
        let best = 0;

        function pair(h, t) {
            if (!h || !t) return 0;
            if (h === t) return 100 + t.length;
            const dist = levenshtein(h, t);
            const maxLen = Math.max(h.length, t.length);
            const ratio = maxLen ? 1 - dist / maxLen : 0;
            let s = 0;
            if (ratio >= 0.55) s = Math.round(55 + ratio * 40);
            if (t.length >= 2 && h.length >= 2 && (t.startsWith(h) || h.startsWith(t))) {
                s = Math.max(s, 60 + Math.min(h.length, t.length));
            }
            if (t.length >= 3 && h.length >= 2 && t.includes(h)) s = Math.max(s, 50 + h.length);
            if (h.length >= 3 && t.length >= 3 && h.includes(t)) s = Math.max(s, 50 + t.length);
            return s;
        }

        best = Math.max(best, pair(heard, target));
        hParts.forEach((h) => {
            tParts.forEach((t) => {
                best = Math.max(best, pair(h, t));
            });
        });
        return best;
    }

    function assetBase(root) {
        if (root && root.dataset && typeof root.dataset.asset === 'string') {
            return root.dataset.asset;
        }
        if (/\/lessons(\/|$)/i.test(location.pathname)) return '';
        return '../lessons/';
    }

    function lessonFromPage(root) {
        if (root && root.dataset && root.dataset.lesson) {
            const n = parseInt(root.dataset.lesson, 10);
            if (n) return n;
        }
        const q = new URLSearchParams(location.search).get('lesson');
        if (q === 'all' || q === '0') return 0;
        if (q) {
            const n = parseInt(q, 10);
            if (n) return n;
        }
        const m = location.pathname.match(/lesson(\d+)\.html/i);
        return m ? parseInt(m[1], 10) : 0;
    }

    function picturesForLesson(lesson) {
        const all = (typeof VOICE_WORDS !== 'undefined' ? VOICE_WORDS : []).slice();
        if (!lesson) return all;
        return all.filter((item) => item.lesson === lesson);
    }

    function uniqueLetters(words) {
        const map = new Map();
        words.forEach((w) => {
            if (!map.has(w.lesson)) map.set(w.lesson, w.letters || ('Дарси ' + w.lesson));
        });
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }

    function injectMarkup(root) {
        if (root.querySelector('#voice-img')) return;
        root.innerHTML = `
            <h2 class="vp-title">Амалиёт: сурат, овоз ва голос</h2>
            <p class="vp-hint">Суратро бинед ва калимаро бо овози худ гӯед. Микрофон овози кӯдакро мешунавад.</p>
            <div class="vp-lessons" id="vp-lessons"></div>
            <div class="progress" id="voice-stat"></div>
            <img id="voice-img" class="result-img" alt="Сурати дарс" src="">
            <div class="said-word" id="said-word"></div>
            <div class="under-word" id="under-word"></div>
            <div class="vp-actions">
                <button id="hear-btn" class="opt-btn hear" type="button">🔊 Шунидан</button>
                <button id="mic-btn" class="mic-btn" type="button">🎤</button>
                <button id="next-btn" class="opt-btn" type="button">Навбатӣ ➡️</button>
            </div>
            <div class="heard" id="heard-text">Микрофонро пахш кунед ва калимаро гӯед</div>
            <div id="message"></div>
        `;
    }

    function boot(root) {
        if (!root || root.dataset.vpReady === '1') return;
        root.dataset.vpReady = '1';
        injectMarkup(root);

        const ASSET = assetBase(root);
        let recognition = null;
        let listening = false;
        let voiceAudio = null;
        let speechLangIndex = 0;
        let pictureList = [];
        let pictureIdx = 0;
        let lockedUntil = 0;

        const els = {
            img: root.querySelector('#voice-img'),
            said: root.querySelector('#said-word'),
            under: root.querySelector('#under-word'),
            stat: root.querySelector('#voice-stat'),
            heard: root.querySelector('#heard-text'),
            mic: root.querySelector('#mic-btn'),
            next: root.querySelector('#next-btn'),
            hear: root.querySelector('#hear-btn'),
            msg: root.querySelector('#message'),
            picker: root.querySelector('#vp-lessons')
        };

        function updateMessage(txt, color) {
            if (!els.msg) return;
            els.msg.innerText = txt || '';
            els.msg.style.color = color || '';
        }

        function currentPicture() {
            return pictureList[pictureIdx];
        }

        function playItemAudio(item) {
            if (!item || !item.audio) return;
            if (voiceAudio) {
                try { voiceAudio.pause(); } catch (e) {}
                voiceAudio = null;
            }
            voiceAudio = new Audio(ASSET + item.audio);
            voiceAudio.play().catch(function () {});
        }

        function showCurrentPicture() {
            const item = currentPicture();
            if (!item || !els.img) return;
            els.img.src = ASSET + item.image;
            els.img.alt = item.word;
            els.said.innerText = '';
            els.under.innerText = '';
            els.under.className = 'under-word';
            els.stat.innerText = 'Дарси ' + item.lesson + ' · ' + (item.letters || '') +
                ' · Сурати ' + (pictureIdx + 1) + ' аз ' + pictureList.length;
            updateMessage('Суратро бинед ва калимаро гӯед', '#9b59b6');
        }

        function revealWord(saidText) {
            const item = currentPicture();
            if (!item) return;
            const heard = foldText(toTajikSpeech(saidText || ''));
            const target = foldText(item.word);
            const ok = !saidText || childScore(heard, target) >= 35;
            if (saidText) {
                els.said.innerText = ok
                    ? 'Шумо гуфтед: ' + saidText
                    : 'Шумо гуфтед: ' + saidText + ' — бори дигар кӯшиш кунед';
            } else {
                els.said.innerText = '';
            }
            els.under.innerText = item.word;
            els.under.className = 'under-word' + (saidText && ok ? ' ok' : (saidText && !ok ? ' bad' : ''));
            updateMessage(ok && saidText ? 'Офарин! ✨' : 'Калимаи дуруст: ' + item.word, ok && saidText ? '#27ae60' : '#9b59b6');
            playItemAudio(item);
            if (ok && saidText) {
                lockedUntil = Date.now() + 1600;
                setTimeout(function () {
                    nextPicture();
                }, 1700);
            }
        }

        function nextPicture() {
            if (!pictureList.length) return;
            pictureIdx = (pictureIdx + 1) % pictureList.length;
            showCurrentPicture();
            els.heard.innerText = 'Калимаи суратро гӯед';
        }

        function matchSpoken(raw) {
            if (Date.now() < lockedUntil) return;
            const text = (toTajikSpeech(raw) || raw).trim();
            if (!text) return;
            els.heard.innerText = 'Шунидем: ' + text;
            const item = currentPicture();
            if (!item) return;
            const heard = foldText(toTajikSpeech(text));
            const target = foldText(item.word);
            if (childScore(heard, target) >= 35) {
                revealWord(text);
                return;
            }
            els.said.innerText = 'Шумо гуфтед: ' + text;
            els.under.className = 'under-word';
            updateMessage('Бори дигар, оҳистатар гӯед', '#e67e22');
        }

        function applyGrammar(rec) {
            const List = window.SpeechGrammarList || window.webkitSpeechGrammarList;
            if (!List || !rec) return;
            const words = [...new Set(pictureList.map(function (w) { return w.word.toLowerCase(); }))].slice(0, 80);
            if (!words.length) return;
            const grammar = '#JSGF V1.0; grammar tajik; public <item> = ' + words.join(' | ') + ' ;';
            const list = new List();
            try {
                list.addFromString(grammar, 1);
                rec.grammars = list;
            } catch (e) {}
        }

        function bestTranscript(result) {
            const texts = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] && result[i].transcript) texts.push(result[i].transcript.trim());
            }
            const preferred = texts.find(function (t) { return /[ғқӯҳҷӣъё]/i.test(t); }) || texts[0] || '';
            return toTajikSpeech(preferred) || preferred;
        }

        function stopListening() {
            listening = false;
            if (els.mic) els.mic.classList.remove('listening');
            if (recognition) {
                try { recognition.onend = null; recognition.stop(); } catch (e) {}
            }
        }

        function startRecognitionEngine() {
            const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!Speech) return;
            if (recognition) {
                try { recognition.onend = null; recognition.stop(); } catch (e) {}
                recognition = null;
            }
            recognition = new Speech();
            recognition.lang = TAJIK_LANGS[speechLangIndex % TAJIK_LANGS.length];
            recognition.interimResults = false;
            recognition.continuous = true;
            recognition.maxAlternatives = 8;
            applyGrammar(recognition);
            recognition.onresult = function (event) {
                const last = event.results[event.results.length - 1];
                if (!last || !last.isFinal) return;
                const text = bestTranscript(last);
                if (text) matchSpoken(text);
            };
            recognition.onerror = function (event) {
                if (event.error === 'not-allowed') {
                    updateMessage('Иҷозати микрофон лозим аст. Allow-ро пахш кунед.', '#e74c3c');
                    stopListening();
                    return;
                }
                if (event.error === 'language-not-supported' || event.error === 'network') {
                    speechLangIndex += 1;
                }
            };
            recognition.onend = function () {
                if (!listening) return;
                try { recognition.start(); } catch (e) {}
            };
            listening = true;
            if (els.mic) els.mic.classList.add('listening');
            try { recognition.start(); } catch (e) {}
        }

        function toggleListening() {
            const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!Speech) {
                updateMessage('Микрофон дар ин браузер кор намекунад. Chrome ё Edge кушоед.', '#e67e22');
                return;
            }
            if (listening) {
                stopListening();
                els.heard.innerText = 'Микрофон хомӯш. Бори дигар пахш кунед.';
                return;
            }
            els.heard.innerText = 'Гӯш мекунам... калимаро гӯед';
            updateMessage('Микрофон кушода аст — кӯдак метавонад гӯяд', '#9b59b6');
            startRecognitionEngine();
        }

        function startLesson(lesson, autoMic) {
            pictureList = picturesForLesson(lesson);
            pictureIdx = 0;
            if (!pictureList.length) {
                updateMessage('Барои ин дарс сурат ёфт нашуд.', '#e74c3c');
                return;
            }
            showCurrentPicture();
            highlightLesson(lesson);
            if (autoMic !== false) startRecognitionEngine();
        }

        function highlightLesson(lesson) {
            if (!els.picker) return;
            els.picker.querySelectorAll('button').forEach(function (btn) {
                btn.classList.toggle('on', Number(btn.dataset.lesson) === Number(lesson || 0));
            });
        }

        function buildPicker() {
            if (!els.picker) return;
            const all = typeof VOICE_WORDS !== 'undefined' ? VOICE_WORDS : [];
            const letters = uniqueLetters(all);
            els.picker.innerHTML = '';
            const allBtn = document.createElement('button');
            allBtn.type = 'button';
            allBtn.className = 'vp-lesson-btn';
            allBtn.dataset.lesson = '0';
            allBtn.textContent = 'Ҳама 35 дарс';
            allBtn.onclick = function () { startLesson(0); };
            els.picker.appendChild(allBtn);
            letters.forEach(function (entry) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'vp-lesson-btn';
                btn.dataset.lesson = String(entry[0]);
                btn.textContent = entry[0] + ' · ' + entry[1];
                btn.onclick = function () { startLesson(entry[0]); };
                els.picker.appendChild(btn);
            });
        }

        els.mic.addEventListener('click', toggleListening);
        els.next.addEventListener('click', nextPicture);
        els.hear.addEventListener('click', function () {
            const item = currentPicture();
            playItemAudio(item);
            if (item) els.under.innerText = item.word;
        });
        els.img.addEventListener('click', function () {
            const item = currentPicture();
            playItemAudio(item);
        });

        buildPicker();
        const startLessonNum = lessonFromPage(root);
        const inLessonPage = /lesson(\d+)\.html/i.test(location.pathname) || !!root.dataset.lesson;
        if (inLessonPage && startLessonNum && els.picker) els.picker.style.display = 'none';
        startLesson(startLessonNum, !inLessonPage);
        if (inLessonPage) {
            els.heard.innerText = '🎤-ро пахш кунед, баъд калимаро гӯед';
        }
    }

    function start() {
        const nodes = document.querySelectorAll('.voice-practice, #voice-game');
        if (!nodes.length) return;
        nodes.forEach(boot);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.AlifboVoicePractice = { start: start };
})();
