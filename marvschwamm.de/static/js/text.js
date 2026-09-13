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

/* =========================
   🍎 APP SIDEBAR
   Magnetic Text Effect
========================= */

const sidebar = document.getElementById("app-sidebar");
const items = document.querySelectorAll(".sidebar-item");


/*
   Maximale Bewegung des Textes
*/
const MAX_MOVE = 8;


/*
   Wie weit die Maus entfernt sein darf,
   damit der Effekt sichtbar wird.
*/
const INFLUENCE_RADIUS = 180;


sidebar.addEventListener("mousemove", (event) => {

    items.forEach(item => {

        const label =
            item.querySelector(".sidebar-label");

        const rect =
            label.getBoundingClientRect();


        /*
           Mittelpunkt des Textes
        */

        const textX =
            rect.left + rect.width / 2;

        const textY =
            rect.top + rect.height / 2;


        /*
           Abstand Maus → Text
        */

        const dx =
            event.clientX - textX;

        const dy =
            event.clientY - textY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /*
           Stärke des Effekts
        */

        let strength =
            1 - (distance / INFLUENCE_RADIUS);

        strength = Math.max(
            0,
            Math.min(1, strength)
        );


        /*
           Bewegung nur horizontal.

           Dadurch wandert der Text
           leicht zur Maus, ohne nach oben
           oder unten zu springen.
        */

        let moveX = 0;

        if (distance > 0) {

            moveX =
                (dx / distance)
                * MAX_MOVE
                * strength;
        }


        /*
           Text bewegen
        */

        label.style.transform =
            `translate3d(${moveX}px, 0, 0)`;

    });

});


/*
   Maus verlässt die Sidebar
*/

sidebar.addEventListener("mouseleave", () => {

    items.forEach(item => {

        const label =
            item.querySelector(".sidebar-label");

        label.style.transform =
            "translate3d(0, 0, 0)";
    });

});