// ══ דובי קופץ – לוגיקת אינטראקציה (דף הבית) ═══════════════

const BEAR_MSGS = [
    "יאהו! 🎉",
    "כיף! 🎈",
    "בואו נשחק! 🃏",
    "הידד! ⭐",
    "ממ... 🍯",
    "יאי! 🦕",
    "פעם נוספת! 🔄",
    "כוכב! ✨",
    "מגניב! 😄",
    "בלון! 🎈",
    "!WOW 🌟",
    "מה מחכים? 🚀"
];

let bearMsgIdx = 0;

function bop() {
    const bear = document.querySelector(".bear-svg");
    const p    = document.getElementById("bearMsg");

    bear.style.animationName = "none";
    void bear.offsetWidth;
    bear.style.animationName = "";

    p.style.animation = "none";
    void p.offsetWidth;
    p.textContent     = BEAR_MSGS[bearMsgIdx++ % BEAR_MSGS.length];
    p.style.animation = "bearMsgFade 0.3s ease both";
}
