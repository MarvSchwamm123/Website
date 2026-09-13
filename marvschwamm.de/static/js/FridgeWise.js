document.addEventListener("DOMContentLoaded", async () => {

    // =========================================================
    // DOM ELEMENTS
    // =========================================================

    const foodModal = document.getElementById("food-modal");
    const foodModalClose = document.getElementById("food-modal-close");

    const addFoodButton = document.getElementById("add-food-btn");
    const receiptButton = document.getElementById("receipt-btn");

    const ingredientSearch = document.getElementById("ingredient-search");
    const ingredientResults = document.getElementById("ingredient-results");

    const selectedIngredient = document.getElementById("selected-ingredient");
    const foodDetails = document.getElementById("food-details");

    const foodAmount = document.getElementById("food-amount");
    const foodDate = document.getElementById("food-date");

    const saveFoodButton = document.getElementById("save-food-btn");

    const foodCount = document.getElementById("food-count");
    const soonCount = document.getElementById("soon-count");


    // =========================================================
    // STATE
    // =========================================================

    let foods = [];

    let ingredients = [];

    let selectedFood = null;


    // =========================================================
    // LOAD INGREDIENTS
    // =========================================================
    //
    // Die Zutaten kommen jetzt aus MongoDB.
    //
    // GET /api/ingredients
    //
    // Beispiel:
    //
    // {
    //     "_id": "6aa231c1ef4f071120fd1461",
    //     "name": "Apfel",
    //     "category": "Obst",
    //     "icon": "🍎",
    //     "aliases": ["Äpfel"]
    // }
    //

    async function loadIngredients() {

        try {

            const response = await fetch(
                "/api/ingredients",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Zutaten konnten nicht geladen werden."
                );
            }


            ingredients = await response.json();


            console.log(
                "Zutaten geladen:",
                ingredients
            );


        } catch (error) {

            console.error(
                "Fehler beim Laden der Zutaten:",
                error
            );

            ingredients = [];
        }
    }


    // =========================================================
    // LOAD FOODS
    // =========================================================

    async function loadFoods() {

        try {

            const response = await fetch(
                "/api/foods",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


            if (!response.ok) {

                if (response.status === 401) {

                    console.warn(
                        "Nicht eingeloggt."
                    );

                    foods = [];

                    renderFoods();

                    return;
                }


                throw new Error(
                    "Lebensmittel konnten nicht geladen werden."
                );
            }


            foods = await response.json();


            console.log(
                "Lebensmittel geladen:",
                foods
            );


            renderFoods();


        } catch (error) {

            console.error(
                "Fehler beim Laden der Lebensmittel:",
                error
            );
        }
    }


    // =========================================================
    // OPEN FOOD MODAL
    // =========================================================

    function openFoodModal() {

        if (!foodModal) {
            return;
        }


        foodModal.classList.remove("hidden");


        resetFoodModal();


        if (ingredientSearch) {
            ingredientSearch.focus();
        }
    }


    // =========================================================
    // CLOSE FOOD MODAL
    // =========================================================

    function closeFoodModal() {

        if (!foodModal) {
            return;
        }


        foodModal.classList.add("hidden");


        resetFoodModal();
    }


    // =========================================================
    // RESET FOOD MODAL
    // =========================================================

    function resetFoodModal() {

        selectedFood = null;


        if (ingredientSearch) {
            ingredientSearch.value = "";
        }


        if (ingredientResults) {
            ingredientResults.innerHTML = "";
        }


        if (selectedIngredient) {

            selectedIngredient.innerHTML = "";

            selectedIngredient.classList.add(
                "hidden"
            );
        }


        if (foodDetails) {
            foodDetails.classList.add("hidden");
        }


        if (foodAmount) {
            foodAmount.value = "";
        }


        if (foodDate) {
            foodDate.value = "";
        }
    }


    // =========================================================
    // INGREDIENT SEARCH
    // =========================================================

    function searchIngredients() {

        if (!ingredientSearch || !ingredientResults) {
            return;
        }


        const query =
            ingredientSearch.value
                .trim()
                .toLowerCase();


        ingredientResults.innerHTML = "";


        if (!query) {
            return;
        }


        const results =
            ingredients.filter(ingredient => {

                const name =
                    String(
                        ingredient.name || ""
                    ).toLowerCase();


                const aliases =
                    Array.isArray(
                        ingredient.aliases
                    )
                        ? ingredient.aliases
                        : [];


                const aliasMatch =
                    aliases.some(alias =>
                        String(alias)
                            .toLowerCase()
                            .includes(query)
                    );


                return (
                    name.includes(query) ||
                    aliasMatch
                );
            });


        if (results.length === 0) {

            ingredientResults.innerHTML = `
                <div class="empty-state">
                    Keine passende Zutat gefunden.
                </div>
            `;

            return;
        }


        results.forEach(ingredient => {

            const result =
                document.createElement("div");


            result.className =
                "ingredient-result";


            result.innerHTML = `

                <div class="ingredient-result-icon">
                    ${escapeHTML(
                        ingredient.icon || "🥕"
                    )}
                </div>

                <div class="ingredient-result-info">

                    <strong>
                        ${escapeHTML(
                            ingredient.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            ingredient.category || ""
                        )}
                    </span>

                </div>

            `;


            result.addEventListener(
                "click",
                () => {
                    selectIngredient(ingredient);
                }
            );


            ingredientResults.appendChild(
                result
            );
        });
    }


    // =========================================================
    // SELECT INGREDIENT
    // =========================================================

    function selectIngredient(ingredient) {

        selectedFood = ingredient;


        if (ingredientResults) {
            ingredientResults.innerHTML = "";
        }


        if (ingredientSearch) {
            ingredientSearch.value = "";
        }


        if (selectedIngredient) {

            selectedIngredient.innerHTML = `

                <div class="selected-ingredient-icon">
                    ${escapeHTML(
                        ingredient.icon || "🥕"
                    )}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(
                            ingredient.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            ingredient.category || ""
                        )}
                    </span>

                </div>

                <button
                    type="button"
                    class="change-ingredient"
                >
                    Ändern
                </button>

            `;


            selectedIngredient.classList.remove(
                "hidden"
            );


            const changeButton =
                selectedIngredient.querySelector(
                    ".change-ingredient"
                );


            if (changeButton) {

                changeButton.addEventListener(
                    "click",
                    () => {

                        selectedFood = null;


                        selectedIngredient.innerHTML = "";

                        selectedIngredient.classList.add(
                            "hidden"
                        );


                        foodDetails.classList.add(
                            "hidden"
                        );


                        ingredientSearch.focus();
                    }
                );
            }
        }


        if (foodDetails) {
            foodDetails.classList.remove(
                "hidden"
            );
        }
    }


    // =========================================================
    // SAVE FOOD
    // =========================================================

    async function saveFood() {

        if (!selectedFood) {

            alert(
                "Bitte zuerst eine Zutat auswählen."
            );

            return;
        }


        const amount =
            foodAmount.value.trim();


        const expiryDate =
            foodDate.value;


        if (!amount) {

            alert(
                "Bitte eine Menge eingeben."
            );

            return;
        }


        if (!expiryDate) {

            alert(
                "Bitte ein Haltbarkeitsdatum auswählen."
            );

            return;
        }


        // -----------------------------------------------------
        // Menge auswerten
        // -----------------------------------------------------

        let numericAmount =
            parseFloat(amount);


        let unit = "Stück";


        if (Number.isNaN(numericAmount)) {

            numericAmount = 1;

            unit = amount;
        }


        // -----------------------------------------------------
        // Daten für FastAPI
        // -----------------------------------------------------

        const foodData = {

            // MongoDB-ID der ausgewählten Zutat
            ingredient_id: selectedFood._id,

            amount: numericAmount,

            unit: unit,

            expiry_date: expiryDate,

            price: null,

            purchase_date: null,

            source: "manual"
        };


        console.log(
            "Sende Lebensmittel:",
            foodData
        );


        try {

            saveFoodButton.disabled = true;

            saveFoodButton.textContent =
                "Speichern...";


            const response =
                await fetch(
                    "/api/foods",
                    {
                        method: "POST",

                        credentials: "include",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                foodData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.detail ||
                    "Lebensmittel konnte nicht gespeichert werden."
                );

                return;
            }


            console.log(
                "Lebensmittel gespeichert:",
                data
            );


            // -------------------------------------------------
            // Modal schließen
            // -------------------------------------------------

            closeFoodModal();


            // -------------------------------------------------
            // Daten erneut aus MongoDB laden
            // -------------------------------------------------

            await loadFoods();


        } catch (error) {

            console.error(
                "Fehler beim Speichern:",
                error
            );


            alert(
                "Beim Speichern ist ein Fehler aufgetreten."
            );


        } finally {

            saveFoodButton.disabled = false;

            saveFoodButton.textContent =
                "Lebensmittel speichern";
        }
    }


    // =========================================================
    // DELETE FOOD
    // =========================================================

    async function deleteFood(foodId) {

        if (!foodId) {
            return;
        }


        const confirmed =
            confirm(
                "Möchtest du dieses Lebensmittel wirklich löschen?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/foods/${encodeURIComponent(foodId)}`,
                    {
                        method: "DELETE",
                        credentials: "include"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.detail ||
                    "Lebensmittel konnte nicht gelöscht werden."
                );

                return;
            }


            await loadFoods();


        } catch (error) {

            console.error(
                "Fehler beim Löschen:",
                error
            );


            alert(
                "Beim Löschen ist ein Fehler aufgetreten."
            );
        }
    }


    // =========================================================
    // EXPIRY STATUS
    // =========================================================

    function getExpiryStatus(expiryDate) {

        if (!expiryDate) {

            return {
                className: "good",
                text: "Kein Datum"
            };
        }


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        const expiry =
            new Date(
                expiryDate + "T00:00:00"
            );


        expiry.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            Math.round(
                (expiry - today) /
                (1000 * 60 * 60 * 24)
            );


        if (difference < 0) {

            return {
                className: "today",
                text: "Abgelaufen"
            };
        }


        if (difference === 0) {

            return {
                className: "today",
                text: "Heute"
            };
        }


        if (difference <= 3) {

            return {
                className: "soon",

                text:
                    `Noch ${difference} ${
                        difference === 1
                            ? "Tag"
                            : "Tage"
                    }`
            };
        }


        return {

            className: "good",

            text:
                `Noch ${difference} ${
                    difference === 1
                        ? "Tag"
                        : "Tage"
                }`
        };
    }


    // =========================================================
    // FORMAT DATE
    // =========================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "Kein Datum";
        }


        const date =
            new Date(
                dateString + "T00:00:00"
            );


        return date.toLocaleDateString(
            "de-DE"
        );
    }


    // =========================================================
    // RENDER FOODS
    // =========================================================

    function renderFoods() {

        const headers =
            document.querySelectorAll(
                ".card-header"
            );


        let fridgeHeader = null;


        headers.forEach(header => {

            const heading =
                header.querySelector("h2");


            if (
                heading &&
                heading.textContent.includes(
                    "Mein Kühlschrank"
                )
            ) {

                fridgeHeader = header;
            }
        });


        if (!fridgeHeader) {
            return;
        }


        let foodList =
            document.getElementById(
                "food-list"
            );


        if (!foodList) {

            foodList =
                document.createElement(
                    "div"
                );


            foodList.id =
                "food-list";


            fridgeHeader.insertAdjacentElement(
                "afterend",
                foodList
            );
        }


        // -----------------------------------------------------
        // Sortieren:
        // frühestes Ablaufdatum zuerst
        // -----------------------------------------------------

        const sortedFoods =
            [...foods].sort(
                (a, b) => {

                    return (
                        new Date(
                            a.expiry_date
                        ) -
                        new Date(
                            b.expiry_date
                        )
                    );
                }
            );


        foodList.innerHTML = "";


        if (sortedFoods.length === 0) {

            foodList.innerHTML = `

                <div class="empty-state">

                    🥕 Dein Kühlschrank ist noch leer.

                    <br>

                    <span>
                        Füge dein erstes Lebensmittel hinzu.
                    </span>

                </div>

            `;


            updateStats();

            return;
        }


        sortedFoods.forEach(food => {

            const status =
                getExpiryStatus(
                    food.expiry_date
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "food-item";


            item.innerHTML = `

                <div class="food-icon">

                    ${escapeHTML(
                        food.icon || "🥕"
                    )}

                </div>


                <div class="food-info">

                    <strong>
                        ${escapeHTML(
                            food.name ||
                            "Unbekannte Zutat"
                        )}
                    </strong>


                    <span>

                        ${escapeHTML(
                            String(
                                food.amount
                            )
                        )}

                        ${escapeHTML(
                            food.unit || ""
                        )}

                        · Haltbar bis

                        ${formatDate(
                            food.expiry_date
                        )}

                    </span>

                </div>


                <div
                    class="food-status ${status.className}"
                >
                    ${escapeHTML(
                        status.text
                    )}
                </div>


                <button
                    class="delete-food"
                    type="button"
                    title="Lebensmittel löschen"
                >
                    ×
                </button>

            `;


            const deleteButton =
                item.querySelector(
                    ".delete-food"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => {
                        deleteFood(
                            food._id
                        );
                    }
                );
            }


            foodList.appendChild(
                item
            );
        });


        updateStats();
    }


    // =========================================================
    // UPDATE STATISTICS
    // =========================================================

    function updateStats() {

        if (foodCount) {

            foodCount.textContent =
                foods.length;
        }


        if (soonCount) {

            const soonFoods =
                foods.filter(food => {

                    const status =
                        getExpiryStatus(
                            food.expiry_date
                        );


                    return (
                        status.className ===
                            "soon" ||

                        status.className ===
                            "today"
                    );
                });


            soonCount.textContent =
                soonFoods.length;
        }
    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHTML(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );
    }


    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    if (addFoodButton) {

        addFoodButton.addEventListener(
            "click",
            openFoodModal
        );
    }


    if (foodModalClose) {

        foodModalClose.addEventListener(
            "click",
            closeFoodModal
        );
    }


    if (foodModal) {

        foodModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    foodModal
                ) {

                    closeFoodModal();
                }
            }
        );
    }


    if (ingredientSearch) {

        ingredientSearch.addEventListener(
            "input",
            searchIngredients
        );
    }


    if (saveFoodButton) {

        saveFoodButton.addEventListener(
            "click",
            saveFood
        );
    }


    // ---------------------------------------------------------
    // Kassenzettel
    // ---------------------------------------------------------

    if (receiptButton) {

        receiptButton.addEventListener(
            "click",
            () => {

                alert(
                    "Die Kassenzettel-Funktion kommt als Nächstes."
                );
            }
        );
    }


    // =========================================================
    // ESC = MODAL SCHLIESSEN
    // =========================================================

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                foodModal &&
                !foodModal.classList.contains(
                    "hidden"
                )
            ) {

                closeFoodModal();
            }
        }
    );


    // =========================================================
    // START
    // =========================================================

    // Zuerst Zutaten aus MongoDB laden.
    await loadIngredients();

    // Danach Lebensmittel laden.
    await loadFoods();

});