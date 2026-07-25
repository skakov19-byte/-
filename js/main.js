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

        // Рост грядок завязан на абсолютные timestamp'ы (plot.readyAt), поэтому офлайн-прогресс
        // на ферме досчитывать не нужно — он уже учтён первым же рендером. Тост — просто приветствие
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
            MarketScreen.renderShopList();
        }
    },

    renderHeader() {
        document.getElementById('coinsValue').textContent = GameState.data.coins;
        document.getElementById('waterValue').textContent = GameState.data.water;

        const state = GameState.data;
        const level = state.playerLevel;
        const currentThreshold = Economy.LEVEL_THRESHOLDS[level - 1];
        const nextThreshold = Economy.LEVEL_THRESHOLDS[level]; // undefined на максимальном уровне

        document.getElementById('playerLevelValue').textContent = level;

        const xpFill = document.getElementById('xpFill');
        const xpText = document.getElementById('xpText');

        if (nextThreshold === undefined) {
            xpFill.style.width = '100%';
            xpText.textContent = 'MAX';
        } else {
            const progress = (state.totalXP - currentThreshold) / (nextThreshold - currentThreshold);
            xpFill.style.width = `${Math.round(progress * 100)}%`;
            xpText.textContent = `${state.totalXP - currentThreshold}/${nextThreshold - currentThreshold} XP`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Main.init());
