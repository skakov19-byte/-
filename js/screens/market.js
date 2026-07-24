// screens/market.js — Экран 3: Рынок (продажа урожая, динамические цены)

const PRICE_UPDATE_INTERVAL_MS = 60000;
const PRICE_VARIANCE = 0.3; // ±30% от базовой цены

const MarketScreen = {
    priceTimer: null,
    selected: new Set(),

    render() {
        const el = document.getElementById('screen-market');
        el.innerHTML = `
            <div class="market-wrap screen-content">
                <div class="market-list" id="marketList"></div>
                <div class="market-actions">
                    <button id="sellSelectedBtn" class="btn btn-secondary">Продать выбранное</button>
                    <button id="sellAllBtn" class="btn">Продать всё 💰</button>
                </div>
                <button id="upgradesBtn" class="btn btn-earth">Улучшения 🛠️</button>
            </div>
        `;

        document.getElementById('sellAllBtn').addEventListener('click', () => this.sellAll());
        document.getElementById('sellSelectedBtn').addEventListener('click', () => this.sellSelected());
        document.getElementById('upgradesBtn').addEventListener('click', () => this.openUpgrades());

        this.renderList();
        this.priceTick(); // сразу учитываем время, прошедшее пока игра была закрыта
        this.startPriceLoop();
    },

    // Раз в секунду проверяет, не пора ли обновить цены (раз в 60 сек)
    startPriceLoop() {
        if (this.priceTimer) return;
        this.priceTimer = setInterval(() => this.priceTick(), 1000);
    },

    priceTick() {
        const market = GameState.data.market;
        if (Date.now() - market.lastPriceUpdate >= PRICE_UPDATE_INTERVAL_MS) {
            this.rollPrices();
            market.lastPriceUpdate = Date.now();
            if (Main.currentScreen === 'market') this.renderList();
        }
    },

    // Пересчитывает цены каждой культуры в диапазоне ±30% от базовой цены
    rollPrices() {
        const market = GameState.data.market;
        Object.entries(Economy.CROPS).forEach(([key, crop]) => {
            const variance = (Math.random() * 2 - 1) * PRICE_VARIANCE;
            market.prices[key] = Math.max(1, Math.round(crop.sellPrice * (1 + variance)));
        });
    },

    renderList() {
        const list = document.getElementById('marketList');
        if (!list) return;

        const state = GameState.data;
        list.innerHTML = Object.entries(Economy.CROPS)
            .map(([key, crop]) => {
                const qty = state.inventory[key] || 0;
                const price = state.market.prices[key];
                const trend = price > crop.sellPrice ? 'up' : price < crop.sellPrice ? 'down' : '';
                const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';
                const checked = this.selected.has(key) ? 'checked' : '';

                return `
                    <label class="market-item ${qty === 0 ? 'empty' : ''}">
                        <input type="checkbox" class="market-checkbox" data-crop="${key}" ${qty === 0 ? 'disabled' : ''} ${checked}>
                        <img src="${crop.readyImage}" alt="${crop.name}" class="market-icon" loading="lazy">
                        <span class="market-info">
                            <span class="market-name">${crop.name}</span>
                            <span class="market-qty">×${qty}</span>
                        </span>
                        <span class="market-price">
                            ${price} <img src="assets/images/objects/coin.png" alt="монеты" class="coin-icon-inline" loading="lazy">
                            <span class="price-trend ${trend}">${trendIcon}</span>
                        </span>
                    </label>
                `;
            })
            .join('');

        list.querySelectorAll('.market-checkbox').forEach((cb) => {
            cb.addEventListener('change', () => {
                const key = cb.dataset.crop;
                if (cb.checked) this.selected.add(key);
                else this.selected.delete(key);
            });
        });
    },

    sellAll() {
        const state = GameState.data;
        let total = 0;

        Object.keys(Economy.CROPS).forEach((key) => {
            const qty = state.inventory[key];
            if (qty > 0) {
                total += qty * state.market.prices[key];
                state.inventory[key] = 0;
            }
        });

        if (total === 0) {
            UI.showToast('Нечего продавать');
            return;
        }

        this.completeSale(total, document.getElementById('sellAllBtn'));
    },

    sellSelected() {
        const state = GameState.data;
        if (this.selected.size === 0) {
            UI.showToast('Ничего не выбрано');
            return;
        }

        let total = 0;
        this.selected.forEach((key) => {
            const qty = state.inventory[key];
            if (qty > 0) {
                total += qty * state.market.prices[key];
                state.inventory[key] = 0;
            }
        });

        if (total === 0) {
            UI.showToast('Нечего продавать');
            return;
        }

        this.completeSale(total, document.getElementById('sellSelectedBtn'));
    },

    completeSale(total, sourceEl) {
        GameState.data.coins += total;
        this.selected.clear();

        Audio_.coins();
        UI.showToast(`Продано на +${total} 🪙`);

        if (sourceEl) {
            const rect = sourceEl.getBoundingClientRect();
            UI.showFloatingText(`+${total} 🪙`, rect.left + rect.width / 2, rect.top, '#F9A825');
            const particleCount = Math.min(15, Math.max(10, Math.round(total / 3)));
            Particles.coinBurst(sourceEl, particleCount);
        }

        Main.renderHeader();
        this.renderList();
    },

    // Открывает магазин апгрейдов
    openUpgrades() {
        UI.openModal(this.renderUpgradesHtml());
        this.bindUpgradeButtons();
    },

    renderUpgradesHtml() {
        const state = GameState.data;

        const rows = Object.entries(Economy.UPGRADES)
            .map(([key, cfg]) => {
                const level = state.upgrades[key];
                const cost = Economy.upgradeCost(key, level);
                const maxed = key === 'plot' && state.farm.unlockedPlots >= Economy.MAX_PLOTS;
                const disabled = maxed || state.coins < cost;

                return `
                    <div class="upgrade-row">
                        <img src="${cfg.image}" alt="${cfg.name}" class="upgrade-icon" loading="lazy">
                        <div class="upgrade-info">
                            <div class="upgrade-name">${cfg.name} <span class="upgrade-level">ур. ${level}</span></div>
                            <div class="upgrade-desc">${cfg.description}</div>
                        </div>
                        <button class="btn upgrade-buy" data-key="${key}" ${disabled ? 'disabled' : ''}>
                            ${maxed ? 'Макс.' : `${cost} <img src="assets/images/objects/coin.png" alt="монеты" class="coin-icon-inline">`}
                        </button>
                    </div>
                `;
            })
            .join('');

        return `
            <h3>Улучшения 🛠️</h3>
            <div class="upgrade-list">${rows}</div>
        `;
    },

    bindUpgradeButtons() {
        document.querySelectorAll('.upgrade-buy').forEach((btn) => {
            btn.addEventListener('click', () => this.buyUpgrade(btn.dataset.key));
        });
    },

    buyUpgrade(key) {
        const state = GameState.data;
        const level = state.upgrades[key];
        const cost = Economy.upgradeCost(key, level);

        if (key === 'plot' && state.farm.unlockedPlots >= Economy.MAX_PLOTS) {
            UI.showToast('Все грядки уже открыты');
            return;
        }
        if (state.coins < cost) {
            UI.showToast('Не хватает монет 🪙');
            return;
        }

        state.coins -= cost;
        state.upgrades[key] += 1;
        GameState.recalcDerived();

        Audio_.coins();
        UI.showToast(`Куплено: ${Economy.UPGRADES[key].name} (ур. ${state.upgrades[key]})`);
        Main.renderHeader();

        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = this.renderUpgradesHtml();
            this.bindUpgradeButtons();
        }
    }
};
