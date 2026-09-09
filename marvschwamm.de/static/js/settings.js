let images = [];


// =========================
// INIT
// =========================

window.addEventListener("DOMContentLoaded", () => {

    // =========================
    // SETTINGS
    // =========================

    const settingsBtn =
        document.getElementById("settings-btn");

    const settingsPanel =
        document.getElementById("settings-panel");

    const settingsOverlay =
        document.getElementById("settings-overlay");


    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {

            settingsPanel.style.display = "block";
            settingsOverlay.classList.add("active");

        });
    }


    if (settingsOverlay) {
        settingsOverlay.addEventListener("click", () => {

            settingsPanel.style.display = "none";
            settingsOverlay.classList.remove("active");

        });
    }


    // =========================
    // DRAGGING
    // =========================

    setupDrag(
        document.getElementById("settings-panel"),
        document.getElementById("settings-header")
    );

    setupDrag(
        document.getElementById("registration-panel"),
        document.getElementById("registration-header")
    );

    setupDrag(
        document.getElementById("login-panel"),
        document.getElementById("login-header")
    );


    // =========================
    // SPRACHE
    // =========================

    const savedLanguage =
        localStorage.getItem("lang") || "en";

    loadLanguage(savedLanguage||"en");


    // =========================
    // BILDER
    // =========================

    loadLanguage(savedLanguage);
    loadImages();
    checkLogin();


    // =========================
    // REGISTRIERUNG
    // =========================

    const registrationForm =
        document.getElementById("registration-form");


    if (registrationForm) {

        console.log("Registrierungsformular gefunden!");

        registrationForm.addEventListener("submit", async (event) => {

            event.preventDefault();
            event.stopPropagation();

            console.log("REGISTRIERUNG SUBMIT!");

            const username =
                document
                    .getElementById("registration-username")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("registration-email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("registration-password")
                    .value;

            const passwordConfirm =
                document
                    .getElementById("registration-password-confirm")
                    .value;


            if (password !== passwordConfirm) {

                alert("Die Passwörter stimmen nicht überein.");

                return;
            }


            try {

                console.log("Sende an /api/register...");

                const response =
                    await fetch("/api/register", {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            username: username,
                            email: email,
                            password: password
                        })

                    });


                console.log(
                    "HTTP Status:",
                    response.status
                );


                const data =
                    await response.json();


                console.log(
                    "FastAPI Antwort:",
                    data
                );


                if (!response.ok) {

                    alert(
                        data.detail ||
                        "Registrierung fehlgeschlagen."
                    );

                    return;
                }


                alert("Account erfolgreich erstellt!");


                registrationForm.reset();

                closeRegistrationPanel();

            }

            catch (error) {

                console.error(
                    "Registrierungsfehler:",
                    error
                );

                alert(
                    "Der Server ist nicht erreichbar."
                );

            }

        });

    }

    else {

        console.error(
            "REGISTRIERUNGSFORMULAR NICHT GEFUNDEN!"
        );

    }

    const loginForm = document.getElementById("login-form");

    console.log("LOGIN FORM:", loginForm);

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            console.log("LOGIN WURDE ABGESCHICKT");

            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;

            console.log("EMAIL:", email);

            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            console.log("API ANTWORT:", response.status);
            const data = await response.json();
            console.log("API DATA:", data);

            if (!response.ok) {
                alert(data.detail || "Login fehlgeschlagen.");
                return;
            }

            console.log("LOGIN ERFOLGREICH");

            // Login-Fenster schließen
            closeLoginPanel();

            // Login-Status aktualisieren
            await checkLogin();

            // Seite neu laden
            window.location.reload();
        });
    }

});


// =========================
// TABS
// =========================

function showTab(tabName) {

    console.log("Tab:", tabName);


    // Alle Tabs holen

    const languageTab =
        document.getElementById("language-tab");

    const themeTab =
        document.getElementById("theme-tab");

    const accountTab =
        document.getElementById("account-tab");


    // ALLE Tabs verstecken

    if (languageTab) {
        languageTab.style.display = "none";
    }

    if (themeTab) {
        themeTab.style.display = "none";
    }

    if (accountTab) {
        accountTab.style.display = "none";
    }


    // NUR gewünschten Tab anzeigen

    if (tabName === "language" && languageTab) {
        languageTab.style.display = "block";
    }

    if (tabName === "theme" && themeTab) {
        themeTab.style.display = "block";
    }

    if (tabName === "account" && accountTab) {
        accountTab.style.display = "block";
    }


    // Sidebar Active-Status

    const categories =
        document.querySelectorAll(
            "#settings-sidebar .category"
        );

    categories.forEach(category => {
        category.classList.remove("active");
    });


    const selectedCategory =
        document.getElementById(
            "settings-sidebar-" + tabName
        );

    if (selectedCategory) {
        selectedCategory.classList.add("active");
    }

}


// =========================
// LOGIN
// =========================

function openLoginPanel() {

    console.log("openLoginPanel()");

    const loginPanel =
        document.getElementById("login-panel");

    const registrationPanel =
        document.getElementById("registration-panel");


    if (!loginPanel) {

        console.error(
            "FEHLER: login-panel nicht gefunden!"
        );

        return;
    }


    // Registrierung schließen

    if (registrationPanel) {
        registrationPanel.style.display = "none";
    }


    // Login öffnen

    loginPanel.style.display = "block";

}


function closeLoginPanel() {

    const loginPanel =
        document.getElementById("login-panel");

    if (loginPanel) {
        loginPanel.style.display = "none";
    }

}


// =========================
// REGISTRIERUNG
// =========================

function openRegistrationPanel() {

    console.log("openRegistrationPanel()");

    const registrationPanel =
        document.getElementById("registration-panel");

    const loginPanel =
        document.getElementById("login-panel");


    if (!registrationPanel) {

        console.error(
            "FEHLER: registration-panel nicht gefunden!"
        );

        return;
    }


    // Login schließen

    if (loginPanel) {
        loginPanel.style.display = "none";
    }


    // Registrierung öffnen

    registrationPanel.style.display = "block";

}


function closeRegistrationPanel() {

    const registrationPanel =
        document.getElementById("registration-panel");

    if (registrationPanel) {
        registrationPanel.style.display = "none";
    }

}


// =========================
// DRAG
// =========================

function setupDrag(panel, header) {

    if (!panel || !header) {
        return;
    }


    let dragging = false;

    let offsetX = 0;
    let offsetY = 0;


    header.addEventListener("mousedown", (event) => {

        dragging = true;

        const rect =
            panel.getBoundingClientRect();


        offsetX =
            event.clientX - rect.left;

        offsetY =
            event.clientY - rect.top;


        panel.style.left =
            rect.left + "px";

        panel.style.top =
            rect.top + "px";

        panel.style.transform =
            "none";

    });


    document.addEventListener("mousemove", (event) => {

        if (!dragging) {
            return;
        }


        panel.style.left =
            (event.clientX - offsetX) + "px";

        panel.style.top =
            (event.clientY - offsetY) + "px";

    });


    document.addEventListener("mouseup", () => {
        dragging = false;
    });

}


// =========================
// BACKGROUND
// =========================

async function loadImages() {

    try {

        const response =
            await fetch("/api/images");

        images =
            await response.json();


        if (!images || images.length === 0) {
            return;
        }


        nextImage();

        setInterval(
            nextImage,
            6000
        );


    } catch (error) {

        console.error(
            "Image load failed:",
            error
        );

    }

}


function nextImage() {

    const bg =
        document.getElementById("bg");


    if (!bg || !images.length) {
        return;
    }


    const index =
        Math.floor(
            Math.random() * images.length
        );


    bg.style.backgroundImage =
        `url('${images[index]}')`;

    bg.style.backgroundSize =
        "cover";

    bg.style.backgroundPosition =
        "center";

}

async function checkLogin() {
    try {
        const response = await fetch("/api/me", {
            credentials: "include"
        });

        const data = await response.json();

        const status = document.getElementById("account-status");

        if (!data.logged_in) {
            console.log("Kein Benutzer angemeldet.");

            if (status) {
                status.textContent = "Nicht angemeldet";
            }

            return;
        }

        console.log("Angemeldet als:", data.username);
        console.log("Rank:", data.rank);
        console.log("Features:", data.allowed_features);

        if (status) {
            status.textContent = `Angemeldet als ${data.username}`;
        }

    } catch (error) {
        console.error("Fehler beim Prüfen der Session:", error);
    }
}