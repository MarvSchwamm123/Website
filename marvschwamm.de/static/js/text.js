let lang = "en";

let langData = {};


// =========================
// LANGUAGE INIT
// =========================

try {

    lang =
        localStorage.getItem("lang") || "en";

} catch {

    lang = "en";

}


// =========================
// LOAD LANGUAGE
// =========================

async function loadLanguage(language) {

    console.log(
        "Lade Sprache:",
        language
    );


    lang = language;


    try {

        localStorage.setItem(
            "lang",
            language
        );

    } catch (error) {

        console.error(
            "Language konnte nicht gespeichert werden:",
            error
        );

    }


    try {

        const response =
            await fetch(
                `/static/languages/${language}.json`
            );


        if (!response.ok) {

            throw new Error(
                "Language-Datei konnte nicht geladen werden"
            );

        }


        langData =
            await response.json();


        updateTexts();


        console.log(
            "Sprache geladen:",
            language
        );


    } catch (error) {

        console.error(
            "Language load failed:",
            error
        );

    }

}


// =========================
// UPDATE TEXTS
// =========================

function updateTexts() {

    console.log("TEXT UPDATED");


    setText(
        "settings-sidebar-language",
        "🌍 " + t("language")
    );

    setText(
        "settings-body-language",
        "🌍 " + t("language")
    );


    setText(
        "settings-sidebar-theme",
        "🎨 " + t("theme")
    );

    setText(
        "settings-body-theme",
        "🎨 " + t("theme")
    );


    setText(
        "settings-sidebar-account",
        "⚙️ " + t("account")
    );

    setText(
        "settings-body-account",
        "⚙️ " + t("account")
    );


    setText(
        "settings-header",
        "⚙️ " + t("settings")
    );


    setText(
        "title",
        t("title")
    );


    setText(
        "aboutme-title",
        t("aboutme_title")
    );

    setText(
        "aboutme-text",
        t("aboutme_text")
    );

    setText(
        "aboutme-content",
        t("aboutme_content")
    );

}


// =========================
// SET TEXT
// =========================

function setText(id, text) {

    const element =
        document.getElementById(id);


    if (element) {

        element.innerText = text;

    }

}


// =========================
// TRANSLATION
// =========================

function t(key) {

    return langData[key] || key;

}