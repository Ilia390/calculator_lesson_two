/*
==========================================================
    Светлая и тёмная тема
==========================================================

    Выбор темы общий для лендинга и калькулятора.
    Сохраняется в localStorage под ключом familyBudgetTheme.
==========================================================
*/

const THEME_STORAGE_KEY = "familyBudgetTheme";

function isDarkTheme() {

    return document.documentElement.classList.contains("theme-dark");
}

function applyTheme(theme) {

    const isDark = theme === "dark";

    document.documentElement.classList.toggle(
        "theme-dark",
        isDark
    );

    localStorage.setItem(
        THEME_STORAGE_KEY,
        isDark ? "dark" : "light"
    );

    const button =
        document.getElementById("themeToggle");

    if (button) {

        button.textContent = isDark ? "☀️" : "🌙";

        button.title =
            isDark
                ? "Включить светлую тему"
                : "Включить тёмную тему";
    }

    /* Диаграмма есть только на странице калькулятора */
    if (
        typeof drawChart === "function" &&
        document.getElementById("expenseChart")
    ) {
        drawChart();
    }
}

function toggleTheme() {

    applyTheme(
        isDarkTheme() ? "light" : "dark"
    );
}

function restoreTheme() {

    const savedTheme =
        localStorage.getItem(THEME_STORAGE_KEY) || "light";

    applyTheme(savedTheme);
}

restoreTheme();
