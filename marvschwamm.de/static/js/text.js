lang = "en"

localStorage.setItem("lang") = lang

let langData = {};

loadLanguage(localStorage.getItem("lang"));

console.log("TEXT.JS GELADEN");

function updateTexts() {
    console.log("TEXT Updated")

    setText("settings-sidebar-language", "🌍 " + t("language"));
    setText("settings-body-language", "🌍 " + t("language"));

    setText("settings-sidebar-theme", "🎨 " + t("theme"));
    setText("settings-body-theme", "🎨 " + t("theme"));

    setText("settings-header", "⚙️ " + t("settings"));

    setText("title", t("title"));

    setText("aboutme-title", t("aboutme_title"));
    setText("aboutme-text", t("aboutme_text"));
    setText("aboutme-content", t("aboutme_content"));
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    }
}

async function loadLanguage(lang) {
    console.log("Lade Sprache:", lang);
    localStorage.setItem("lang", lang);
    const res = await fetch(`/static/languages/${localStorage.getItem("lang")}.json`);
    langData = await res.json();

    updateTexts();
    console.log("GANZE JSON:");
    console.log(Object.keys(langData));

    console.log("aboutme_content:", langData.aboutme_content);
}

function t(key) {
    return langData[key] || ("KEY NOT FOUND: " + key);
}