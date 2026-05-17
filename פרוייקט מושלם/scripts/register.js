document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name    = document.getElementById("playerName").value.trim();
    const pass    = document.getElementById("password").value;
    const confirm = document.getElementById("passwordConfirm").value;

    if (!name) { alert("יש להכניס שם משתמש"); return; }
    if (pass.length < 3) { alert("הסיסמה חייבת להכיל לפחות 3 תווים"); return; }
    if (pass !== confirm) { alert("הסיסמאות אינן תואמות"); return; }

    const players = JSON.parse(localStorage.getItem("players")) || [];

   const exists = players.find(p => p.name === name);
if (exists) {
    alert("שם משתמש תפוס. אנא בחר שם אחר או היכנס.");
    return;
}
    // שם + סיסמה שונה = שחקן חדש לגמרי – מותר
    const newPlayer = {
        id:       Date.now(),   // מזהה ייחודי לכל שחקן
        name:     name,
        password: pass,
        role:     "player"
    };
    players.push(newPlayer);
    localStorage.setItem("players", JSON.stringify(players));

    // שמירת user עם id ייחודי
    localStorage.setItem("user", JSON.stringify({ id: newPlayer.id, name, role: "player" }));
    alert("נרשמת בהצלחה! מתחילים לשחק 🦕");
    window.location.href = "../docs/game.html";
});
