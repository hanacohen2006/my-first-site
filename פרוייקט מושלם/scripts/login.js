document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("playerName").value.trim();
    const pass = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!name) { alert("יש להכניס שם משתמש"); return; }

    // ── מנהל ───────────────────────────────────────────────
    if (role === "admin") {
        if (pass !== "1234") { alert("סיסמה שגויה"); return; }
        localStorage.setItem("user", JSON.stringify({ id: "admin", name, role: "admin" }));
        window.location.href = "../pages/scores.html";
        return;
    }

    // ── שחקן – מחפשים לפי שם + סיסמה ─────────────────────
    const players = JSON.parse(localStorage.getItem("players")) || [];

    // שם קיים?
    const byName = players.filter(p => p.name === name);
    if (byName.length === 0) {
        alert("שם משתמש לא נמצא. אנא הירשם תחילה.");
        return;
    }

    // שם + סיסמה תואמים?
    const match = byName.find(p => p.password === pass);
    if (!match) {
        alert("סיסמה שגויה.");
        return;
    }

    // כניסה מוצלחת – שומרים עם ה-id הייחודי של השחקן
    localStorage.setItem("user", JSON.stringify({ id: match.id, name: match.name, role: "player" }));
    window.location.href = "../pages/game.html";
});
