(function () {
    const NS = "http://www.w3.org/2000/svg";
    const HIT = 26;
    const STEP = 8;
    const PASS = 0.78;

    const letters = window.TRACE_LETTERS || [];
    const svg = document.getElementById("board");
    const rules = document.getElementById("rules");
    const progressG = document.getElementById("progress");
    const guidesG = document.getElementById("guides");
    const arrowsG = document.getElementById("arrows");
    const numbersG = document.getElementById("numbers");
    const inkG = document.getElementById("ink");
    const demoLayer = document.getElementById("demo-layer");
    const picker = document.getElementById("letters");
    const statusEl = document.getElementById("status");
    const meter = document.getElementById("meter-fill");
    const bravo = document.getElementById("bravo");
    const nextBtn = document.getElementById("next");
    const caseUpper = document.getElementById("case-upper");
    const caseLower = document.getElementById("case-lower");

    const params = new URLSearchParams(location.search);
    let index = 0;
    const lessonParam = parseInt(params.get("lesson"), 10);
    if (lessonParam >= 1 && lessonParam <= 35) {
        const found = letters.findIndex(item => item.lesson === lessonParam);
        if (found >= 0) index = found;
    }
    let upper = params.get("case") !== "lower";

    const backLesson = document.getElementById("back-lesson");
    if (lessonParam >= 1 && lessonParam <= 35 && backLesson) {
        backLesson.hidden = false;
        backLesson.href = "../lessons/lesson" + lessonParam + ".html";
    }

    let strokes = [];
    let inkPath = null;
    let lastPoint = null;
    let activePointer = null;
    let celebrated = false;
    let demoToken = 0;
    let audioCtx = null;

    function el(name, attrs) {
        const node = document.createElementNS(NS, name);
        if (attrs) {
            Object.keys(attrs).forEach(key => node.setAttribute(key, attrs[key]));
        }
        return node;
    }

    function clearGroup(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function drawRules() {
        clearGroup(rules);
        const lines = [
            ["rule-top", 46],
            ["rule-mid", 128],
            ["rule-base", 210],
            ["rule-desc", 262]
        ];
        lines.forEach(item => {
            rules.appendChild(el("line", {
                x1: 14, y1: item[1], x2: 206, y2: item[1], class: item[0]
            }));
        });
    }

    function samplePath(path) {
        const len = path.getTotalLength();
        const pts = [];
        if (!len) return pts;
        for (let d = 0; d <= len; d += STEP) pts.push(at(path, d, len));
        if (pts[pts.length - 1].d < len - 0.4) pts.push(at(path, len, len));
        return pts;
    }

    function at(path, d, len) {
        const p = path.getPointAtLength(Math.min(d, len));
        const p2 = path.getPointAtLength(Math.min(len, d + 6));
        return {
            x: p.x,
            y: p.y,
            d: Math.min(d, len),
            hit: false,
            ang: Math.atan2(p2.y - p.y, p2.x - p.x)
        };
    }

    function dashOf(samples) {
        const segs = [];
        let i = 0;
        while (i < samples.length - 1) {
            const hit = !!(samples[i].hit || samples[i + 1].hit);
            let len = 0;
            while (i < samples.length - 1 && !!(samples[i].hit || samples[i + 1].hit) === hit) {
                len += samples[i + 1].d - samples[i].d;
                i += 1;
            }
            segs.push({ hit: hit, len: Math.max(0.2, len) });
        }
        if (!segs.length) return "0 1";
        const parts = [];
        if (!segs[0].hit) parts.push(0);
        segs.forEach(seg => parts.push(seg.len));
        if (parts.length % 2 === 1) parts.push(0);
        return parts.join(" ");
    }

    function arrowShape(x, y, ang) {
        const tipX = x + Math.cos(ang) * 8;
        const tipY = y + Math.sin(ang) * 8;
        const bx = x - Math.cos(ang) * 7;
        const by = y - Math.sin(ang) * 7;
        const px = Math.cos(ang + Math.PI / 2) * 5.5;
        const py = Math.sin(ang + Math.PI / 2) * 5.5;
        return tipX + "," + tipY + " " + (bx + px) + "," + (by + py) + " " + (bx - px) + "," + (by - py);
    }

    function placeArrows(path, len) {
        const nodes = [];
        if (len < 56) return nodes;
        for (let d = 30; d < len - 12; d += 48) {
            const p = path.getPointAtLength(d);
            const p2 = path.getPointAtLength(Math.min(len, d + 8));
            const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
            const poly = el("polygon", { points: arrowShape(p.x, p.y, ang), class: "arrow" });
            arrowsG.appendChild(poly);
            nodes.push(poly);
        }
        return nodes;
    }

    function badgeAt(path, len, n) {
        const p = path.getPointAtLength(0);
        const p2 = path.getPointAtLength(Math.min(len, 14));
        const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
        let x = p.x - Math.cos(ang) * 18;
        let y = p.y - Math.sin(ang) * 18;
        x = Math.max(16, Math.min(204, x));
        y = Math.max(16, Math.min(284, y));
        const g = el("g", { class: "badge" });
        g.appendChild(el("circle", { cx: x, cy: y, r: 13 }));
        const text = el("text", { x: x, y: y, "text-anchor": "middle", "dominant-baseline": "central" });
        text.textContent = String(n);
        g.appendChild(text);
        numbersG.appendChild(g);
        return g;
    }

    function separateBadges() {
        const badges = [...numbersG.querySelectorAll(".badge")];
        const circles = badges.map(node => node.querySelector("circle"));
        for (let i = 0; i < circles.length; i++) {
            for (let j = 0; j < i; j++) {
                const x2 = Number(circles[j].getAttribute("cx"));
                const y2 = Number(circles[j].getAttribute("cy"));
                let x1 = Number(circles[i].getAttribute("cx"));
                let y1 = Number(circles[i].getAttribute("cy"));
                const dx = x1 - x2;
                const dy = y1 - y2;
                const dist = Math.hypot(dx, dy);
                if (dist >= 30) continue;
                const ux = dist < 1 ? 0 : dx / dist;
                const uy = dist < 1 ? 1 : dy / dist;
                x1 = Math.max(16, Math.min(204, x2 + ux * 32));
                y1 = Math.max(16, Math.min(284, y2 + uy * 32));
                circles[i].setAttribute("cx", x1);
                circles[i].setAttribute("cy", y1);
                const text = badges[i].querySelector("text");
                text.setAttribute("x", x1);
                text.setAttribute("y", y1);
            }
        }
    }

    function currentLetter() {
        return letters[index];
    }

    function strokeList() {
        const letter = currentLetter();
        return upper ? letter.upperStrokes : letter.lowerStrokes;
    }

    function render() {
        stopDemo();
        celebrated = false;
        bravo.hidden = true;
        nextBtn.classList.remove("ready");
        clearGroup(guidesG);
        clearGroup(progressG);
        clearGroup(arrowsG);
        clearGroup(numbersG);
        clearGroup(inkG);
        inkPath = null;
        lastPoint = null;
        strokes = strokeList().map((d, i) => {
            const guide = el("path", { d: d, class: "guide" });
            guidesG.appendChild(guide);
            const samples = samplePath(guide);
            const len = guide.getTotalLength();
            const prog = el("path", { d: d, class: "progress" });
            prog.setAttribute("stroke-dasharray", dashOf(samples.length ? samples : [{ d: 0, hit: false }, { d: 1, hit: false }]));
            progressG.appendChild(prog);
            return {
                path: guide,
                prog: prog,
                samples: samples,
                arrows: placeArrows(guide, len),
                badge: badgeAt(guide, Math.max(len, 1), i + 1)
            };
        });
        separateBadges();
        const letter = currentLetter();
        caseUpper.textContent = letter.upper;
        caseLower.textContent = letter.lower;
        caseUpper.classList.toggle("on", upper);
        caseLower.classList.toggle("on", !upper);
        caseUpper.setAttribute("aria-pressed", upper ? "true" : "false");
        caseLower.setAttribute("aria-pressed", upper ? "false" : "true");
        picker.querySelectorAll("button").forEach((btn, i) => {
            btn.classList.toggle("on", i === index);
        });
        const currentBtn = picker.querySelector("button.on");
        if (currentBtn) currentBtn.scrollIntoView({ inline: "center", block: "nearest" });
        svg.setAttribute("aria-label", "Навиштани ҳарфи " + (upper ? letter.upper : letter.lower));
        refresh(true);
    }

    function coverage() {
        let hit = 0;
        let total = 0;
        strokes.forEach(stroke => {
            stroke.samples.forEach(pt => {
                total += 1;
                if (pt.hit) hit += 1;
            });
        });
        return { hit: hit, total: total, ratio: total ? hit / total : 0 };
    }

    function refresh(initial) {
        let active = -1;
        strokes.forEach((stroke, i) => {
            const count = stroke.samples.length;
            const got = stroke.samples.filter(pt => pt.hit).length;
            const ratio = count ? got / count : 1;
            if (stroke.samples.length > 1) {
                stroke.prog.setAttribute("stroke-dasharray", dashOf(stroke.samples));
            }
            const done = ratio >= 0.7;
            if (!done && active < 0) active = i;
            stroke.badge.classList.toggle("done", done);
            stroke.badge.classList.toggle("active", i === active);
            stroke.path.classList.toggle("done", done);
            stroke.path.classList.toggle("active", i === active && !done);
            stroke.arrows.forEach(node => {
                node.classList.toggle("done", done);
                node.classList.toggle("active", i === active && !done);
            });
        });
        const stats = coverage();
        const pct = Math.round(stats.ratio * 100);
        meter.style.width = pct + "%";
        if (stats.ratio >= PASS) {
            statusEl.textContent = "Офарин! Ҳарф тайёр шуд";
            statusEl.classList.add("ok");
            nextBtn.classList.add("ready");
            bravo.hidden = false;
            if (!celebrated && !initial) {
                celebrated = true;
                chime();
            }
            if (initial) celebrated = true;
        } else {
            statusEl.classList.remove("ok");
            bravo.hidden = true;
            nextBtn.classList.remove("ready");
            celebrated = false;
            if (active < 0) statusEl.textContent = "Аз рақами 1 сар кунед";
            else statusEl.textContent = "Хати " + (active + 1) + "-умро аз рӯи тирча нависед";
        }
    }

    function pointFromEvent(e) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: 0, y: 0 };
        const p = pt.matrixTransform(ctm.inverse());
        return { x: p.x, y: p.y };
    }

    function markPoint(x, y) {
        let changed = false;
        strokes.forEach(stroke => {
            stroke.samples.forEach(pt => {
                if (pt.hit) return;
                if ((pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y) <= HIT * HIT) {
                    pt.hit = true;
                    changed = true;
                }
            });
        });
        return changed;
    }

    function markSegment(x0, y0, x1, y1) {
        const dist = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.max(1, Math.ceil(dist / 4));
        let changed = false;
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            if (markPoint(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) changed = true;
        }
        if (changed) refresh(false);
    }

    function startInk(x, y) {
        inkPath = el("path", { class: "ink", d: "M " + x + " " + y });
        inkG.appendChild(inkPath);
        lastPoint = { x: x, y: y };
        markSegment(x, y, x, y);
    }

    function extendInk(x, y) {
        if (!inkPath || !lastPoint) return;
        inkPath.setAttribute("d", inkPath.getAttribute("d") + " L " + x + " " + y);
        markSegment(lastPoint.x, lastPoint.y, x, y);
        lastPoint = { x: x, y: y };
    }

    function onDown(e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (activePointer != null) return;
        e.preventDefault();
        activePointer = e.pointerId;
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
        stopDemo();
        const p = pointFromEvent(e);
        startInk(p.x, p.y);
    }

    function onMove(e) {
        if (e.pointerId !== activePointer) return;
        e.preventDefault();
        const p = pointFromEvent(e);
        extendInk(p.x, p.y);
    }

    function onUp(e) {
        if (e.pointerId !== activePointer) return;
        activePointer = null;
        lastPoint = null;
        try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    }

    svg.addEventListener("pointerdown", onDown, { passive: false });
    svg.addEventListener("pointermove", onMove, { passive: false });
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    svg.addEventListener("contextmenu", e => e.preventDefault());

    function stopDemo() {
        demoToken += 1;
        clearGroup(demoLayer);
    }

    function playDemo() {
        stopDemo();
        const token = demoToken;
        const paths = strokes.map(stroke => stroke.path);
        let i = 0;

        function run() {
            if (token !== demoToken) return;
            if (i >= paths.length) return;
            const path = paths[i];
            const len = path.getTotalLength() || 1;
            const dur = Math.max(650, Math.min(1500, len * 5));
            const ghost = el("path", { class: "ghost-stroke", d: path.getAttribute("d") });
            ghost.style.strokeDasharray = "0 " + len;
            demoLayer.appendChild(ghost);
            const finger = el("circle", { class: "finger", r: 10, cx: 0, cy: 0 });
            demoLayer.appendChild(finger);
            const t0 = performance.now();
            function frame(now) {
                if (token !== demoToken) return;
                const t = Math.min(1, (now - t0) / dur);
                const shown = len * t;
                ghost.style.strokeDasharray = shown + " " + len;
                const p = path.getPointAtLength(shown);
                finger.setAttribute("cx", p.x);
                finger.setAttribute("cy", p.y);
                if (t < 1) requestAnimationFrame(frame);
                else {
                    ghost.remove();
                    finger.remove();
                    i += 1;
                    run();
                }
            }
            requestAnimationFrame(frame);
        }
        run();
    }

    function chime() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            if (!audioCtx) audioCtx = new Ctx();
            const ctx = audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        } catch (err) { /* sound is optional */ }
    }

    function setIndex(next) {
        index = (next + letters.length) % letters.length;
        render();
    }

    function setCase(isUpper) {
        if (upper === isUpper) return;
        upper = isUpper;
        render();
    }

    letters.forEach((letter, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = letter.upper;
        btn.addEventListener("click", () => setIndex(i));
        picker.appendChild(btn);
    });

    document.getElementById("clear").addEventListener("click", render);
    document.getElementById("demo").addEventListener("click", playDemo);
    document.getElementById("prev").addEventListener("click", () => setIndex(index - 1));
    document.getElementById("next").addEventListener("click", () => setIndex(index + 1));
    caseUpper.addEventListener("click", () => setCase(true));
    caseLower.addEventListener("click", () => setCase(false));

    drawRules();
    render();
})();
