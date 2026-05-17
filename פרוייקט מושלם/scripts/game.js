document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = "../pages/login.html"; }

    let gameEnded    = false;
    const BOARD_SIZE = 20;
    let firstMove    = true;
    let resetCount   = 0;
    let spinCount    = 0;
    let direction    = null;
    let currentWord  = "";
    let startCell    = null;
    let clockRule    = "";
    let time         = 60;
    let score        = 0;
    let anchorCell   = null;
    let placedLetters     = [];
    let roundFinished     = false;
    let currentRackLetters = [];
    let initialRack  = null;

    const bgMusic   = document.getElementById("bgMusic");
    const winSound  = document.getElementById("winSound");
    const loseSound = document.getElementById("loseSound");
    const clockSound = document.getElementById("clockSound");
    const enterSound = document.getElementById("enterSound");
    document.body.addEventListener("pointerdown", () => {
    if (enterSound) { enterSound.load(); }
    }, { once: true });
    
    const playerBadge = document.getElementById("playerBadge");
    if (playerBadge) {
        playerBadge.innerHTML =
            `<span>👤</span><span class="badge-name">${user.name}</span>`;
    }
    const playerTopEl = document.querySelector("#player");
    if (playerTopEl) playerTopEl.textContent = `שחקן: ${user.name}`;

    document.body.addEventListener("click", () => {
        if (!bgMusic) return;
        bgMusic.volume = 0.3;
        bgMusic.loop   = true;
        bgMusic.play().catch(() => {});
    }, { once: true });

    const boardEl = document.querySelector("#board");
    const rackEl  = document.querySelector("#rack");
    const clockEl = document.querySelector("#clockRule");
    const wordEl  = document.querySelector("#word");
    const timerEl = document.querySelector("#timer");

    let scoreEl = document.querySelector("#score");
    if (!scoreEl) {
        scoreEl = document.createElement("div");
        scoreEl.id = "score";
        scoreEl.textContent = "ניקוד: 0";
        document.body.appendChild(scoreEl);
    }

    const letters = "אבגדהוזחטיכךלמםנןסעפףצץקרשת";

    function resetMoveState() {
        startCell     = null;
        placedLetters = [];
        currentWord   = "";
        direction     = null;
        firstMove     = true;
    }

    const canvas = document.getElementById("clockCanvas");
    const ctx    = canvas.getContext("2d");
    const CX = 100, CY = 100, R = 90;
    const STEP = Math.PI / 2;

    const SECTIONS = [
        { label: "תחילה", color: "#1e3a8a", highlight: "#3b82f6", text: "#93c5fd" },
        { label: "אמצע",  color: "#4c1d95", highlight: "#7c3aed", text: "#c4b5fd" },
        { label: "סוף",   color: "#831843", highlight: "#db2777", text: "#fbcfe8" },
        { label: "חופשי", color: "#064e3b", highlight: "#059669", text: "#6ee7b7" },
    ];

    function sectionMidAngle(i) {
        return -Math.PI / 2 + i * STEP + STEP / 2;
    }

    function indexOfLabel(label) {
        return SECTIONS.findIndex(s => s.label === label);
    }

    function drawClockBase(activeIndex) {
        ctx.clearRect(0, 0, 200, 200);

        const glow = ctx.createRadialGradient(CX, CY, R - 4, CX, CY, R + 12);
        glow.addColorStop(0, "rgba(99,102,241,0.55)");
        glow.addColorStop(1, "rgba(99,102,241,0)");
        ctx.beginPath();
        ctx.arc(CX, CY, R + 12, 0, 2 * Math.PI);
        ctx.fillStyle = glow;
        ctx.fill();

        SECTIONS.forEach((sec, i) => {
            const startA = -Math.PI / 2 + i * STEP;
            const endA   = startA + STEP;
            const active = (i === activeIndex);

            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.arc(CX, CY, R, startA, endA);
            ctx.closePath();
            if (active) {
                const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
                g.addColorStop(0, sec.highlight + "cc");
                g.addColorStop(1, sec.highlight);
                ctx.fillStyle = g;
            } else {
                ctx.fillStyle = sec.color;
            }
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(CX + R * Math.cos(startA), CY + R * Math.sin(startA));
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth   = 1.5;
            ctx.stroke();

            const midA = startA + STEP / 2;
            const tx   = CX + 56 * Math.cos(midA);
            const ty   = CY + 56 * Math.sin(midA);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.font          = active ? "bold 13px Arial" : "12px Arial";
            ctx.fillStyle     = active ? "#ffffff" : sec.text;
            ctx.textAlign     = "center";
            ctx.textBaseline  = "middle";
            ctx.fillText(sec.label, 0, 0);
            ctx.restore();
        });

        const cg = ctx.createRadialGradient(CX - 8, CY - 8, 1, CX, CY, 16);
        cg.addColorStop(0, "#e0e7ff");
        cg.addColorStop(1, "#6366f1");
        ctx.beginPath();
        ctx.arc(CX, CY, 13, 0, 2 * Math.PI);
        ctx.fillStyle   = cg;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, R, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(165,180,252,0.55)";
        ctx.lineWidth   = 2;
        ctx.stroke();
    }

    function drawHand(angle) {
        const len = R - 14;
        const ex  = CX + len * Math.cos(angle);
        const ey  = CY + len * Math.sin(angle);

        ctx.save();
        ctx.shadowColor = "rgba(99,102,241,0.85)";
        ctx.shadowBlur  = 10;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#e0e7ff";
        ctx.lineWidth   = 4;
        ctx.lineCap     = "round";
        ctx.stroke();

        const al = 11, aa = 0.38;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - al * Math.cos(angle - aa), ey - al * Math.sin(angle - aa));
        ctx.lineTo(ex - al * Math.cos(angle + aa), ey - al * Math.sin(angle + aa));
        ctx.closePath();
        ctx.fillStyle = "#a5b4fc";
        ctx.fill();

        ctx.restore();

        ctx.beginPath();
        ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    let handAnimId      = null;
    let currentHandAngle = -Math.PI / 2;

    function spinHandTo(targetIndex, onDone) {
        if (handAnimId) cancelAnimationFrame(handAnimId);

        // זווית היעד המדויקת – אמצע המגזר הנכון
        const targetAngle = sectionMidAngle(targetIndex);
        const spinDur     = 2000;

        // מחשבים כמה לסובב: תמיד 2 סיבובים שלמים + ה-delta החיובי עד למטרה
        // נורמל currentHandAngle לטווח -π..π לפני החישוב
        const fromAngle = currentHandAngle;
        let delta = targetAngle - (fromAngle % (2 * Math.PI));
        delta = ((delta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (delta < 0.001) delta = 2 * Math.PI; // מינימום סיבוב שלם אם כבר שם
        const totalDelta = 2 * Math.PI * 2 + delta;

        const startTime = performance.now();

        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

        function frame(now) {
            const t     = Math.min((now - startTime) / spinDur, 1);
            const ease  = easeOutCubic(t);
            const angle = fromAngle + totalDelta * ease;

            // מגזר חי לפי הזווית הנוכחית
            const norm      = ((angle + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
            const liveIndex = Math.floor(norm / STEP) % 4;

            drawClockBase(liveIndex);
            drawHand(angle);

            if (t < 1) {
                handAnimId = requestAnimationFrame(frame);
            } else {
                // עוצרים בדיוק על הזווית הנכונה – ציור סופי מדויק
                currentHandAngle = targetAngle;
                drawClockBase(targetIndex);
                drawHand(targetAngle);
                if (onDone) onDone();
            }
        }

        handAnimId = requestAnimationFrame(frame);
    }

    /* ── ניקוי לוח והחלפת מילה כל 4 סיבובים ────────────── */
    async function clearBoardAndReplaceWord() {
        // מנקים את כל תוכן הלוח
        document.querySelectorAll(".cell").forEach(cell => {
            cell.textContent = "";
            cell.classList.remove("startWord", "anchor", "placed");
        });
        // מניחים מילה חדשה
        const word = await getRandomHebrewWord();
        placeWord(word);
    }

    /* ── randomClock – בוחר מיקום ואז מסובב מחוג אליו ─── */
    function randomClock() {
        spinCount++;

        // כל 10 סיבובים – מחליפים את אותיות המעמד בדיוק בכמות שנשארה
        if (spinCount % 10 === 0) {
            replaceRackLetters();
        }

        const positions = ["תחילה", "אמצע", "סוף", "חופשי"];
        clockRule = positions[Math.floor(Math.random() * positions.length)];
        if (clockEl) clockEl.textContent = clockRule;

        anchorCell    = null;
        roundFinished = false;

        if (clockSound) {
            clockSound.currentTime = 0;
            clockSound.volume = 0.6;
            clockSound.play().catch(() => {});
        }

        // כל 10 סיבובים – מחליפים אותיות במעמד (בדיוק כמספר שנשאר)
        if (spinCount % 10 === 0) replaceRackLetters();

        // כל 4 סיבובים – מנקים לוח ומחליפים מילה
        if (spinCount % 4 === 0) {
            clearBoardAndReplaceWord().then(() => {
                const targetIdx = indexOfLabel(clockRule);
                spinHandTo(targetIdx, () => { highlightAnchor(); });
            });
        } else {
            const targetIdx = indexOfLabel(clockRule);
            spinHandTo(targetIdx, () => { highlightAnchor(); });
        }
    }

    /* ── בדיקה אם תא מוקף לחלוטין (לאורך ורוחב בלבד) ──── */
    function isCellSurrounded(cell) {
        const r = +cell.dataset.row;
        const c = +cell.dataset.col;
        const neighbors = [
            document.querySelector(`[data-row='${r}'][data-col='${c + 1}']`),
            document.querySelector(`[data-row='${r}'][data-col='${c - 1}']`),
            document.querySelector(`[data-row='${r + 1}'][data-col='${c}']`),
            document.querySelector(`[data-row='${r - 1}'][data-col='${c}']`),
        ];
        // תא מוקף אם כל שכניו (שקיימים בלוח) מכילים אות
        return neighbors.every(n => !n || n.textContent.trim() !== "");
    }

    /* ── anchor cell ────────────────────────────────────── */
    function getAnchorCell() {
        const finalLetters = ["ך", "ם", "ן", "ף", "ץ"];
        const wordCells = [...document.querySelectorAll(".startWord")]
            .filter(c => c && c.textContent && !finalLetters.includes(c.textContent))
            .sort((a, b) => +a.dataset.col - +b.dataset.col);

        if (!wordCells.length) return null;

        // מועמד לפי חוק השעון
        let preferred = null;
        if (clockRule === "תחילה") preferred = wordCells[0];
        else if (clockRule === "סוף")   preferred = wordCells[wordCells.length - 1];
        else if (clockRule === "אמצע")  preferred = wordCells[Math.floor(wordCells.length / 2)];
        else if (clockRule === "חופשי") preferred = wordCells[Math.floor(Math.random() * wordCells.length)];
        else preferred = wordCells[0];

        // אם המועמד המועדף פנוי – נחזיר אותו
        if (preferred && !isCellSurrounded(preferred)) return preferred;

        // אחרת – נחפש תא אחר במילה שאינו מוקף
        const fallback = wordCells.find(c => !isCellSurrounded(c));
        return fallback || null; // אם כולם מוקפים נחזיר null (לא נבחר anchor)
    }

    function highlightAnchor() {
        document.querySelectorAll(".cell").forEach(c => c.classList.remove("anchor"));
        anchorCell = getAnchorCell();
        // אם לא נמצא תא פנוי – לא מסמנים כלום עד לחילוף
        if (anchorCell) {
            anchorCell.classList.add("anchor");
        }
        updateWord();
    }

    /* ── בדיקת מילה בעברית ──────────────────────────────── */
    async function checkWordHebrew(word) {
        try {
            const url = `https://he.wiktionary.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(word.trim())}&origin=*`;
            const res  = await fetch(url);
            const data = await res.json();
            const page = Object.values(data.query?.pages)[0];
            return !(page.missing === "" || page.pageid === undefined);
        } catch { return false; }
    }

    async function getRandomHebrewWord() {
        const words = ["תרמיל","הלל","בית","מים","כדור","חתול","שלום","ילד","ספר","שולחן"];
        return words[Math.floor(Math.random() * words.length)];
    }

    /* ── לוח ─────────────────────────────────────────────── */
    function createBoard() {
        boardEl.innerHTML = "";
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardEl.appendChild(cell);
            }
        }
    }

    function placeWord(word) {
        const row   = Math.floor(BOARD_SIZE / 2);
        const start = Math.floor(BOARD_SIZE / 2 - word.length / 2);
        word.split("").forEach((l, i) => {
            const cell = document.querySelector(`[data-row='${row}'][data-col='${start + i}']`);
            if (cell) { cell.textContent = l; cell.classList.add("startWord"); }
        });
    }

    async function initBoardWord() {
        const word = await getRandomHebrewWord();
        placeWord(word);
    }

    /* ── מגש אותיות ─────────────────────────────────────── */
    function createRack() {
        rackEl.innerHTML = "";
        if (!initialRack) {
            initialRack = Array(10).fill(0).map(() =>
                letters[Math.floor(Math.random() * letters.length)]
            );
        }
        currentRackLetters = [...initialRack];
        currentRackLetters.forEach((l, i) => {
            const d = document.createElement("div");
            d.textContent = l; d.className = "letter";
            d.draggable = true; d.dataset.id = i;
            rackEl.appendChild(d);
        });
        enableDragDrop();
    }

    /* ── Drag & Drop ─────────────────────────────────────── */
    function enableDragDrop() {
        document.querySelectorAll(".letter").forEach(l => {
           l.ondragstart = e => {
           e.dataTransfer.setData("text", l.textContent);
           e.dataTransfer.setData("id",   l.dataset.id);
           if (enterSound) { enterSound.currentTime = 0; enterSound.play().catch(() => {}); }
               };
        });

        document.querySelectorAll(".cell").forEach(cell => {
            cell.ondragover = e => e.preventDefault();
            cell.ondrop = e => {
                if (roundFinished) return;
                // אם אין anchor (כל המילה מוקפת) – לא מאפשרים הנחה
                if (!anchorCell) return;
                const letter = e.dataTransfer.getData("text");
                const id     = e.dataTransfer.getData("id");

                if (!startCell) {
                    if (!isValidFirstNeighbor(cell)) return;
                    if (cell.textContent) return;
                    cell.textContent = letter;
                    if (enterSound) { enterSound.currentTime = 0; enterSound.play().catch(() => {}); }

                    startCell        = cell;
                    placedLetters    = [{ cell, letter, rackId: id }];
                    direction        = null;
                    firstMove        = true;
                    removeRackTile(id);
                    updateWord();
                    return;
                }

                if (firstMove && placedLetters.length === 1) {
                    const first = placedLetters[0].cell;
                    const fr = +first.dataset.row, fc = +first.dataset.col;
                    const cr = +cell.dataset.row,  cc = +cell.dataset.col;
                    const dr = Math.abs(cr - fr),   dc = Math.abs(cc - fc);
                    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                        direction = dr === 0 ? (cc > fc ? "row-right" : "row-left")
                                             : (cr > fr ? "col-down"  : "col-up");
                        firstMove = false;
                    } else return;
                }

                const last = placedLetters[placedLetters.length - 1].cell;
                const lr = +last.dataset.row, lc = +last.dataset.col;
                const cr = +cell.dataset.row, cc = +cell.dataset.col;
                if (direction === "row-right" && (cr !== lr || cc !== lc + 1)) return;
                if (direction === "row-left"  && (cr !== lr || cc !== lc - 1)) return;
                if (direction === "col-down"  && (cc !== lc || cr !== lr + 1)) return;
                if (direction === "col-up"    && (cc !== lc || cr !== lr - 1)) return;
                if (cell.textContent) return;

                cell.textContent = letter;
                placedLetters.push({ cell, letter, rackId: id });
                startCell = cell;
                removeRackTile(id);
                updateWord();
            };
        });
    }

    function removeRackTile(id) {
        const el = document.querySelector(`#rack [data-id='${id}']`);
        if (el) el.remove();
    }

    function updateWord() {
        if (!anchorCell) { wordEl.textContent = ""; return; }
        currentWord = anchorCell.textContent + placedLetters.map(p => p.letter).join("");
        wordEl.textContent = currentWord;
    }

    /* ── בדיקת מילה ─────────────────────────────────────── */
    async function checkWord() {
        if (roundFinished || !startCell) return;
        speakWord(currentWord);
        const exists = await checkWordHebrew(currentWord);

        if (exists) {
            if (winSound) { winSound.pause(); winSound.currentTime = 0; winSound.play().catch(() => {}); }
            showWinPopup();
            setTimeout(() => { if (bgMusic) bgMusic.play().catch(() => {}); }, 500);
            score += currentWord.length * 10;
            scoreEl.textContent = "ניקוד: " + score;
            roundFinished = true;
            time = 60;
            timerEl.textContent = time;
            randomClock();
            resetMoveState();
            checkIfRackEmpty();
        } else {
            if (loseSound) { loseSound.currentTime = 0; loseSound.volume = 1; loseSound.play().catch(() => {}); }
            showFailPopup();
            returnLettersToRack();
            enableDragDrop();
            resetMoveState();
        }
    }

    document.querySelector("#submit").onclick = checkWord;

    /* ── טיימר ───────────────────────────────────────────── */
    setInterval(() => {
        if (gameEnded) return;
        time--;
        timerEl.textContent = time;
        if (time <= 0) {
            returnLettersToRack();
            enableDragDrop();
            time = 60;
            timerEl.textContent = time;
            resetCount++;
            randomClock();
            resetMoveState();
        }
    }, 1000);

    /* ── שכן תקין ────────────────────────────────────────── */
    function isValidFirstNeighbor(cell) {
        if (!anchorCell) return false;
        const r = +anchorCell.dataset.row, c = +anchorCell.dataset.col;
        return [
            document.querySelector(`[data-row='${r}'][data-col='${c + 1}']`),
            document.querySelector(`[data-row='${r}'][data-col='${c - 1}']`),
            document.querySelector(`[data-row='${r + 1}'][data-col='${c}']`),
            document.querySelector(`[data-row='${r - 1}'][data-col='${c}']`)
        ].some(n => n === cell) && !cell.textContent;
    }

    /* ── החזרת אותיות ────────────────────────────────────── */
    function returnLettersToRack() {
        [...placedLetters].forEach(({ cell, letter, rackId }) => {
            cell.textContent = "";
            cell.classList.remove("placed");
            if (!document.querySelector(`#rack [data-id='${rackId}']`)) {
                const div = document.createElement("div");
                div.textContent = letter; div.className = "letter";
                div.draggable = true; div.dataset.id = rackId;
                rackEl.appendChild(div);
            }
        });
        resetMoveState();
    }

    function speakWord(word) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang  = "he-IL";
        u.rate  = 0.85;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
    }

    /* ── פופאפים ─────────────────────────────────────────── */
    function showWinPopup() {
        const p = document.getElementById("winPopup");
        if (!p) return;
        p.classList.add("show");
        setTimeout(() => p.classList.remove("show"), 2000);
    }
    function showFailPopup() {
        const p = document.getElementById("failPopup");
        if (!p) return;
        p.classList.add("show");
        setTimeout(() => p.classList.remove("show"), 2000);
    }

    /* ── החלפת כל אותיות המגש ────────────────────────────── */
    function replaceRackLetters() {
        const newLetters = Array.from(document.querySelectorAll("#rack .letter"))
            .map(() => letters[Math.floor(Math.random() * letters.length)]);
        rackEl.innerHTML = "";
        newLetters.forEach((l, i) => {
            const div = document.createElement("div");
            div.textContent = l; div.className = "letter";
            div.draggable = true; div.dataset.id = i;
            rackEl.appendChild(div);
        });
        enableDragDrop();
    }

    /* ── מסך סיום ────────────────────────────────────────── */
    function showEndScreen() {
        gameEnded = true;
        if (winSound) { winSound.currentTime = 0; winSound.volume = 1; winSound.play().catch(() => {}); }
        saveScore(user.name, score);
        scoreEl.textContent = "ניקוד סופי: " + score;
        const screen = document.getElementById("endScreen");
        if (screen) screen.classList.add("show");
    }

    function checkIfRackEmpty() {
        if (document.querySelectorAll("#rack .letter").length === 0 ||
            currentRackLetters.length === 0) showEndScreen();
    }

    

    function saveScore(name, newScore) {
        let scores = JSON.parse(localStorage.getItem("scores")) || [];
        // מחפשים לפי id ייחודי של השחקן – לא לפי שם
        const playerId = user.id || name.trim();
        let player = scores.find(p => p.id === playerId);
        if (player) { if (newScore > player.bestScore) player.bestScore = newScore; }
        else         { scores.push({ id: playerId, name: name.trim(), bestScore: newScore }); }
        localStorage.setItem("scores", JSON.stringify(scores));
    }

    /* ══════════════════════════════════════════════════════
       ✦  יהלומים מנצנצים  ✦
       ══════════════════════════════════════════════════════ */
    function createDiamondLayer() {
        let layer = document.getElementById("diamondLayer");
        if (!layer) {
            layer = document.createElement("div");
            layer.id = "diamondLayer";
            document.body.appendChild(layer);
        }
        const sizes = ["sm", "md", "lg"];
        const COUNT = 28;
        for (let i = 0; i < COUNT; i++) {
            const d  = document.createElement("div");
            d.className = `diamond ${sizes[Math.floor(Math.random() * sizes.length)]}`;
            d.style.left = Math.random() * 100 + "vw";
            const dur   = 4 + Math.random() * 7;
            d.style.animationDuration = dur + "s";
            d.style.animationDelay   = -(Math.random() * dur) + "s";
            layer.appendChild(d);
        }
    }

    /* ── אתחול ────────────────────────────────────────────── */
    createBoard();
    initBoardWord().then(() => {
        createRack();
        createDiamondLayer();
        randomClock();
        if (bgMusic) { bgMusic.volume = 0.3; bgMusic.play().catch(() => {}); }
    });

    window.addEventListener("beforeunload", () => {
        if (!gameEnded && score > 0) saveScore(user.name, score);
    });
});
