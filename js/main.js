// main.js — инициализация игры, навигация по экранам, главный цикл

const Main = {
    currentScreen: 'well',

    init() {
        GameState.init();
        // Запоминаем время последнего сохранения ДО того, как автосейв его перезапишет —
        // это и есть длительность отсутствия игрока
        const offlineSeconds = Math.max(0, (Date.now() - GameState.data.lastSaveTime) / 1000);

        this.bindNav();
        this.renderHeader();

        WellScreen.render();
        FarmScreen.render();
        MarketScreen.render();

        this.showScreen('well');

        // Рост растений теперь идёт только от кликов полива, а не от времени,
        // поэтому «пока вас не было» больше нечего досчитывать на ферме —
        // просто приветствуем игрока, если отсутствие было заметным
        this.reportOfflineProgress(offlineSeconds);
    },

    reportOfflineProgress(offlineSeconds) {
        if (offlineSeconds < 30) return; // не спамим тостом при обычной перезагрузке страницы

        const minutes = Math.floor(offlineSeconds / 60);
        const timeLabel = minutes > 0 ? `${minutes} мин` : `${Math.round(offlineSeconds)} сек`;
        UI.showToast(`С возвращением! Вас не было ${timeLabel}`);
    },

    bindNav() {
        document.querySelectorAll('.nav-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                Audio_.click();
                this.showScreen(btn.dataset.screen);
            });
        });
    },

    showScreen(name) {
        this.currentScreen = name;

        document.querySelectorAll('.screen').forEach((el) => {
            el.classList.toggle('active', el.id === `screen-${name}`);
        });

        document.querySelectorAll('.nav-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.screen === name);
        });

        // Подстраховка: состояние могло измениться (апгрейды, рост растений, тик цен),
        // пока экран был скрыт — обновляем его сразу при переходе, не дожидаясь таймера
        if (name === 'well') {
            WellScreen.updateBucketDisplay();
        }
        if (name === 'farm') {
            FarmScreen.renderGrid();
        }
        if (name === 'market') {
            MarketScreen.renderList();
        }
    },

    renderHeader() {
        document.getElementById('coinsValue').textContent = GameState.data.coins;
        document.getElementById('waterValue').textContent = GameState.data.water;
    }
};

document.addEventListener('DOMContentLoaded', () => Main.init());
