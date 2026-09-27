/*
==========================================================
    КАЛЬКУЛЯТОР СЕМЕЙНОГО БЮДЖЕТА
==========================================================

    Все данные сохраняются в localStorage браузера.

    Валюта:
    Российский рубль — ₽

    Внешние библиотеки не используются.

    Основные возможности:
    - добавление доходов;
    - добавление расходов;
    - категории расходов;
    - расчёт остатка;
    - расчёт процента накоплений;
    - цель накоплений;
    - диаграмма расходов;
    - финансовый анализ;
    - удаление операций;
    - сохранение данных;
    - экспорт JSON;
    - импорт JSON;
    - очистка данных;
    - переключение светлой и тёмной темы.

==========================================================
*/


/* =========================================
   ДАННЫЕ
========================================= */

let transactions = JSON.parse(
    localStorage.getItem("familyBudgetTransactions") || "[]"
);

let goal = JSON.parse(
    localStorage.getItem("familyBudgetGoal") || "null"
);


/* =========================================
   ФОРМАТИРОВАНИЕ ДЕНЕГ
========================================= */

function formatMoney(value) {

    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value || 0);

}


/* =========================================
   ФОРМАТИРОВАНИЕ ДАТЫ
========================================= */

function formatDate(date) {

    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleDateString("ru-RU");
}


/* =========================================
   СОХРАНЕНИЕ
========================================= */

function saveTransactions() {

    localStorage.setItem(
        "familyBudgetTransactions",
        JSON.stringify(transactions)
    );
}


function saveGoalToStorage() {

    localStorage.setItem(
        "familyBudgetGoal",
        JSON.stringify(goal)
    );
}


/* =========================================
   ПОДСЧЁТ ДОХОДОВ
========================================= */

function getIncome() {

    return transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount), 0);
}


/* =========================================
   ПОДСЧЁТ РАСХОДОВ
========================================= */

function getExpenses() {

    return transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);
}


/* =========================================
   ДОБАВЛЕНИЕ ДОХОДА
========================================= */

document
    .getElementById("incomeForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.getElementById("incomeName").value.trim();

        const amount =
            Number(document.getElementById("incomeAmount").value);

        const date =
            document.getElementById("incomeDate").value;

        if (!name || amount <= 0 || !date) {
            showToast("Заполните все поля");
            return;
        }

        transactions.push({
            id: Date.now(),
            type: "income",
            name,
            amount,
            date
        });

        saveTransactions();

        this.reset();

        setToday();

        updateUI();

        showToast("Доход добавлен");
    });


/* =========================================
   ДОБАВЛЕНИЕ РАСХОДА
========================================= */

document
    .getElementById("expenseForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.getElementById("expenseName").value.trim();

        const amount =
            Number(document.getElementById("expenseAmount").value);

        const category =
            document.getElementById("expenseCategory").value;

        const date =
            document.getElementById("expenseDate").value;

        if (!name || amount <= 0 || !date) {
            showToast("Заполните все поля");
            return;
        }

        transactions.push({
            id: Date.now(),
            type: "expense",
            name,
            amount,
            category,
            date
        });

        saveTransactions();

        this.reset();

        setToday();

        updateUI();

        showToast("Расход добавлен");
    });


/* =========================================
   УДАЛЕНИЕ ОПЕРАЦИИ
========================================= */

function deleteTransaction(id) {

    transactions =
        transactions.filter(item => item.id !== id);

    saveTransactions();

    updateUI();

    showToast("Операция удалена");
}


/* =========================================
   ОТРИСОВКА ОПЕРАЦИЙ
========================================= */

function renderTransactions() {

    const container =
        document.getElementById("transactionList");

    if (transactions.length === 0) {

        container.innerHTML = `
            <div class="empty">
                Пока нет операций
            </div>
        `;

        return;
    }

    const sorted =
        [...transactions].sort(
            (a, b) =>
                new Date(b.date) - new Date(a.date)
        );

    container.innerHTML =
        sorted.map(item => {

            const isIncome =
                item.type === "income";

            return `
                <div class="transaction ${isIncome ? "income" : "expense"}">

                    <div class="transaction-info">

                        <div class="transaction-name">
                            ${escapeHtml(item.name)}
                        </div>

                        <div class="transaction-meta">
                            ${isIncome
                                ? "Доход"
                                : escapeHtml(item.category || "Расход")
                            }
                            · ${formatDate(item.date)}
                        </div>

                    </div>

                    <div class="transaction-amount">
                        ${isIncome ? "+" : "-"}
                        ${formatMoney(item.amount)}
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${item.id})"
                        title="Удалить">
                        ×
                    </button>

                </div>
            `;

        }).join("");
}


/* =========================================
   КАТЕГОРИИ
========================================= */

function renderCategories() {

    const container =
        document.getElementById("categories");

    const expenses =
        transactions.filter(
            item => item.type === "expense"
        );

    if (expenses.length === 0) {

        container.innerHTML = `
            <div class="empty">
                Пока нет расходов
            </div>
        `;

        return;
    }

    const total =
        getExpenses();

    const categories = {};

    expenses.forEach(item => {

        if (!categories[item.category]) {
            categories[item.category] = 0;
        }

        categories[item.category] += Number(item.amount);
    });

    const sorted =
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);

    container.innerHTML =
        sorted.map(([category, amount]) => {

            const percent =
                total > 0
                    ? (amount / total) * 100
                    : 0;

            return `
                <div class="category-item">

                    <div class="category-header">

                        <span>
                            ${escapeHtml(category)}
                        </span>

                        <strong>
                            ${formatMoney(amount)}
                        </strong>

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar"
                            style="width:${percent}%">
                        </div>

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================
   ДИАГРАММА
========================================= */

function drawChart() {

    const canvas =
        document.getElementById("expenseChart");

    if (!canvas) {
        return;
    }

    const ctx =
        canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const expenses =
        transactions.filter(
            item => item.type === "expense"
        );

    if (expenses.length === 0) {

        ctx.font = "16px Arial";
        ctx.fillStyle = isDarkTheme() ? "#94a3b8" : "#6b7280";
        ctx.textAlign = "center";

        ctx.fillText(
            "Нет данных",
            canvas.width / 2,
            canvas.height / 2
        );

        return;
    }

    const categories = {};

    expenses.forEach(item => {

        categories[item.category] =
            (categories[item.category] || 0)
            + Number(item.amount);

    });

    const values =
        Object.entries(categories);

    const total =
        values.reduce(
            (sum, item) => sum + item[1],
            0
        );

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 105;

    const colors = [
        "#2563eb",
        "#16a34a",
        "#dc2626",
        "#f59e0b",
        "#7c3aed",
        "#0891b2",
        "#db2777",
        "#65a30d",
        "#ea580c",
        "#4f46e5",
        "#64748b"
    ];

    let startAngle = -Math.PI / 2;

    values.forEach((item, index) => {

        const slice =
            (item[1] / total) * Math.PI * 2;

        ctx.beginPath();

        ctx.moveTo(centerX, centerY);

        ctx.arc(
            centerX,
            centerY,
            radius,
            startAngle,
            startAngle + slice
        );

        ctx.closePath();

        ctx.fillStyle =
            colors[index % colors.length];

        ctx.fill();

        startAngle += slice;
    });

    /* Отверстие в центре */

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        55,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = isDarkTheme() ? "#1e2937" : "#ffffff";

    ctx.fill();

    /* Текст */

    ctx.fillStyle = isDarkTheme() ? "#e5e7eb" : "#111827";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        formatMoney(total),
        centerX,
        centerY + 6
    );
}


/* =========================================
   ЦЕЛЬ НАКОПЛЕНИЙ
========================================= */

function saveGoal() {

    const amount =
        Number(
            document.getElementById("goalAmount").value
        );

    const name =
        document.getElementById("goalName").value.trim();

    if (amount <= 0) {

        showToast(
            "Введите сумму цели"
        );

        return;
    }

    goal = {
        amount,
        name: name || "Цель накоплений"
    };

    saveGoalToStorage();

    renderGoal();

    showToast("Цель сохранена");
}


function renderGoal() {

    const title =
        document.getElementById("goalTitle");

    const progressText =
        document.getElementById("goalProgressText");

    const progress =
        document.getElementById("goalProgress");

    if (!goal) {

        title.textContent =
            "Цель не установлена";

        progressText.textContent =
            "0 ₽ / 0 ₽";

        progress.style.width =
            "0%";

        return;
    }

    const balance =
        Math.max(0, getIncome() - getExpenses());

    const percent =
        Math.min(
            100,
            (balance / goal.amount) * 100
        );

    title.textContent =
        goal.name;

    progressText.textContent =
        `${formatMoney(balance)} / ${formatMoney(goal.amount)}`;

    progress.style.width =
        `${percent}%`;
}


/* =========================================
   ФИНАНСОВЫЙ АНАЛИЗ
========================================= */

function renderFinancialStatus() {

    const element =
        document.getElementById("financialStatus");

    const income =
        getIncome();

    const expenses =
        getExpenses();

    const balance =
        income - expenses;

    if (income === 0 && expenses === 0) {

        element.className =
            "status-box";

        element.innerHTML =
            `
                <div class="status-title">
                    Начните вести бюджет
                </div>
                Добавьте свои доходы и расходы,
                чтобы увидеть финансовую картину.
            `;

        return;
    }

    if (balance < 0) {

        element.className =
            "status-box bad";

        element.innerHTML =
            `
                <div class="status-title">
                    ⚠️ Расходы превышают доходы
                </div>
                Сейчас ваши расходы больше доходов
                на ${formatMoney(Math.abs(balance))}.
                Стоит обратить внимание на самые крупные категории расходов.
            `;

        return;
    }

    const savingPercent =
        income > 0
            ? (balance / income) * 100
            : 0;

    if (savingPercent >= 20) {

        element.className =
            "status-box good";

        element.innerHTML =
            `
                <div class="status-title">
                    ✅ Хороший уровень накоплений
                </div>
                После расходов остаётся
                ${formatMoney(balance)},
                то есть ${savingPercent.toFixed(1)}%
                от доходов.
            `;

        return;
    }

    if (savingPercent >= 10) {

        element.className =
            "status-box warning";

        element.innerHTML =
            `
                <div class="status-title">
                    👍 Есть возможность для накоплений
                </div>
                После расходов остаётся
                ${formatMoney(balance)},
                то есть ${savingPercent.toFixed(1)}%
                от доходов.
            `;

        return;
    }

    element.className =
        "status-box warning";

    element.innerHTML =
        `
            <div class="status-title">
                💡 Небольшой финансовый запас
            </div>
            После расходов остаётся
            ${formatMoney(balance)},
            или ${savingPercent.toFixed(1)}%
            от доходов.
        `;
}


/* =========================================
   ОБНОВЛЕНИЕ ОСНОВНЫХ ПОКАЗАТЕЛЕЙ
========================================= */

function updateSummary() {

    const income =
        getIncome();

    const expenses =
        getExpenses();

    const balance =
        income - expenses;

    const savingPercent =
        income > 0
            ? Math.max(0, (balance / income) * 100)
            : 0;

    document.getElementById(
        "totalIncome"
    ).textContent =
        formatMoney(income);

    document.getElementById(
        "totalExpenses"
    ).textContent =
        formatMoney(expenses);

    document.getElementById(
        "balance"
    ).textContent =
        formatMoney(balance);

    document.getElementById(
        "savingPercent"
    ).textContent =
        `${savingPercent.toFixed(1)}%`;
}


/* =========================================
   ОБЩЕЕ ОБНОВЛЕНИЕ
========================================= */

function updateUI() {

    updateSummary();

    renderTransactions();

    renderCategories();

    drawChart();

    renderGoal();

    renderFinancialStatus();
}


/* =========================================
   ОЧИСТКА ВСЕХ ДАННЫХ
========================================= */

function clearAll() {

    if (
        !confirm(
            "Вы действительно хотите удалить все доходы, расходы и цель накоплений?"
        )
    ) {
        return;
    }

    transactions = [];

    goal = null;

    localStorage.removeItem(
        "familyBudgetTransactions"
    );

    localStorage.removeItem(
        "familyBudgetGoal"
    );

    updateUI();

    showToast("Все данные удалены");
}


/* =========================================
   ЭКСПОРТ
========================================= */

function exportData() {

    const data = {
        transactions,
        goal,
        exportDate: new Date().toISOString()
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "семейный-бюджет.json";

    link.click();

    URL.revokeObjectURL(url);

    showToast("Данные экспортированы");
}


/* =========================================
   ИМПОРТ
========================================= */

function importData(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = function(e) {

        try {

            const data =
                JSON.parse(e.target.result);

            if (
                !Array.isArray(
                    data.transactions
                )
            ) {
                throw new Error(
                    "Неверный формат файла"
                );
            }

            transactions =
                data.transactions;

            goal =
                data.goal || null;

            saveTransactions();

            saveGoalToStorage();

            updateUI();

            showToast(
                "Данные успешно импортированы"
            );

        } catch (error) {

            showToast(
                "Ошибка при импорте файла"
            );

        }

    };

    reader.readAsText(file);

    event.target.value = "";
}


/* =========================================
   УВЕДОМЛЕНИЯ
========================================= */

let toastTimer;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);
}


/* =========================================
   ЗАЩИТА HTML
========================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   УСТАНОВКА СЕГОДНЯШНЕЙ ДАТЫ
========================================= */

function setToday() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    document.getElementById(
        "incomeDate"
    ).value = today;

    document.getElementById(
        "expenseDate"
    ).value = today;
}


/* Тема подключается из js/theme.js */


/* =========================================
   ЗАПУСК
========================================= */

restoreTheme();

setToday();

if (goal) {

    document.getElementById(
        "goalAmount"
    ).value = goal.amount;

    document.getElementById(
        "goalName"
    ).value = goal.name;
}

updateUI();