const header = document.getElementById("settings-header");

let images = [];
let currentLang = "en";
loadLanguage('en');

let settingsOpen = false;
/*
header.addEventListener("mousedown", (e) => {
    dragging = true;

    const rect = panel.getBoundingClientRect();

    panel.style.transform = "none";

    panel.style.left = rect.left + "px";
    panel.style.top = rect.top + "px";

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
});

document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    windowEl.style.left = (e.clientX - offsetX) + "px";
    windowEl.style.top = (e.clientY - offsetY) + "px";
});

document.addEventListener("mouseup", () => {
    dragging = false;
});
*/
// =========================
// 🚀 INIT (ALLES HIER DRIN!)
// =========================
window.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("settings-btn");
    const panel = document.getElementById("settings-panel");
    const overlay = document.getElementById("settings-overlay");

    const cats = document.querySelectorAll(".category");
    const tabs = document.querySelectorAll(".tab");

    // -------------------------
    // BUTTON OPEN / CLOSE
    // -------------------------
    btn.addEventListener("click", () => {
        panel.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
        panel.classList.remove("active");
        overlay.classList.remove("active");
    });

    // -------------------------
    // TABS
    // -------------------------
    cats.forEach(cat => {
        cat.addEventListener("click", () => {

            const tabId = cat.dataset.tab;

            cats.forEach(c => c.classList.remove("active"));
            cat.classList.add("active");

            tabs.forEach(t => t.classList.remove("active"));

            const target = document.getElementById(tabId);
            if (target) target.classList.add("active");
        });
    });

    // -------------------------
    // DRAG
    // -------------------------
    setupDrag();

    // -------------------------
    // START
    // -------------------------
    const saved = localStorage.getItem("lang") || "de";
    loadLanguage(saved);
    loadImages();
});

// =========================
// 🌍 LANGUAGE
// =========================

function returnText() {
    return "hello world";
}

async function loadLanguage(lang) {
    try {
        const res = await fetch(`/static/languages/${lang}.json`);
        const data = await res.json();

        document.getElementById("title").innerText = data.title;

        localStorage.setItem("lang", lang);
        currentLang = lang;
    } catch (err) {
        console.error("Language load failed:", err);
    }
}

// =========================
// 🖼 BACKGROUND (STABIL)
// =========================
async function loadImages() {
    try {
        const res = await fetch("/api/images");
        images = await res.json();

        console.log("Images geladen:", images);

        if (!images || images.length === 0) {
            console.warn("Keine Bilder gefunden!");
            return;
        }

        nextImage();
        setInterval(nextImage, 6000);

    } catch (err) {
        console.error("Image load failed:", err);
    }
}

function nextImage() {
    const bg = document.getElementById("bg");

    if (!bg) {
        console.error("#bg NICHT gefunden!");
        return;
    }

    if (!images || images.length === 0) {
        console.warn("Images noch leer");
        return;
    }

    const i = Math.floor(Math.random() * images.length);

    const url = images[i];

    console.log("Set background:", url);

    bg.style.backgroundImage = `url('${url}')`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
}

// =========================
// 🪟 DRAG WINDOW
// =========================
function setupDrag() {
    const panel = document.getElementById("settings-panel");
    const header = document.getElementById("settings-header");

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {

        const rect = panel.getBoundingClientRect();

        console.log("Maus:", e.clientX, e.clientY);
        console.log("Fenster:", rect.left, rect.top);
        console.log("Offset:", e.clientX - rect.left, e.clientY - rect.top);

        dragging = true;

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        console.log(
            e.clientX - offsetX,
            e.clientY - offsetY
        )

        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        dragging = false;
    });
}

function showTab(tab) {

    document.getElementById("language-tab").style.display = "none";
    document.getElementById("theme-tab").style.display = "none";

    document.getElementById(tab + "-tab").style.display = "block";

    document.querySelectorAll(".category").forEach(cat => {
        cat.classList.remove("active");
    });

    event.target.classList.add("active");
}

function pressOnSettingsWindow() {
    if (settingsOpen) {
        document.getElementById("settings-panel").style.display = "none";
        settingsOpen = false;
    } else {
        document.getElementById("settings-panel").style.display = "block";
        settingsOpen = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("settings-btn")
        .addEventListener("click", pressOnSettingsWindow);

    document.getElementById("settings-overlay")
        .addEventListener("click", pressOnSettingsWindow);
});