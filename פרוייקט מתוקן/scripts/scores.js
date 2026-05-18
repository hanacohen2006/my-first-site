const list = document.querySelector("#scoresList");
const scores = JSON.parse(localStorage.getItem("scores")) || [];

// מיון מהגבוה לנמוך
scores.sort((a, b) => b.bestScore - a.bestScore);

function render() {
    list.innerHTML = "";

    scores.forEach((s, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${s.name} - ${s.bestScore}`;
        list.appendChild(li);
    });
}

render();