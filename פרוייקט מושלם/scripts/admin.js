// ── אבטחה ──────────────────────────────────────────────────────────────────
const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "admin") {
    alert("אין הרשאה – יש להתחבר כמנהל");
    window.location.href = "../pages/login.html";
}

// ── אתחול ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderTable();
    updateStats();
});

// ── קריאת שחקנים ──────────────────────────────────────────────────────────
function getScores() {
    return JSON.parse(localStorage.getItem("scores")) || [];
}

// ── עדכון כרטיסי סטטיסטיקה ────────────────────────────────────────────────
function updateStats() {
    const scores = getScores();
    document.getElementById("statPlayers").textContent = scores.length;

    if (scores.length === 0) {
        document.getElementById("statTopScore").textContent = 0;
        document.getElementById("statAvg").textContent = 0;
        return;
    }

    const top = Math.max(...scores.map(s => s.bestScore));
    const avg = Math.round(scores.reduce((s, p) => s + p.bestScore, 0) / scores.length);

    document.getElementById("statTopScore").textContent = top;
    document.getElementById("statAvg").textContent = avg;
}

// ── ציור הטבלה ─────────────────────────────────────────────────────────────
function renderTable(filter = "") {
    const tbody = document.getElementById("playersBody");
    const emptyMsg = document.getElementById("emptyMsg");
    let scores = getScores();

    scores.sort((a, b) => b.bestScore - a.bestScore);

    if (filter) {
        scores = scores.filter(s => s.name.includes(filter));
    }

    tbody.innerHTML = "";

    if (scores.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    scores.forEach((s, i) => {
        const tr = document.createElement("tr");
        tr.className = i < 3 ? `rank-${i + 1}` : "";
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td style="color:#1d4ed8;font-weight:bold">${s.bestScore}</td>
            <td>
                <button class="btn-delete" onclick="deletePlayer(${s.id})">🗑️ מחק</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateStats();
}

// ── סינון חיפוש ────────────────────────────────────────────────────────────
function filterTable() {
    const val = document.getElementById("searchInput").value.trim();
    renderTable(val);
}

// ── מחיקת שחקן ─────────────────────────────────────────────────────────────
function deletePlayer(id) {
    if (!confirm("למחוק את השחקן?")) return;

    let scores = getScores();
    scores = scores.filter(p => p.id !== id);
    localStorage.setItem("scores", JSON.stringify(scores));

    renderTable(document.getElementById("searchInput").value.trim());
}

// ── ניקוי כל הנתונים ───────────────────────────────────────────────────────
function clearAll() {
    if (!confirm("למחוק את כל השחקנים? פעולה זו אינה הפיכה!")) return;
    localStorage.removeItem("scores");
    renderTable();
    updateStats();
}