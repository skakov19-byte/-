// screens/farm.js — Экран 2: Ферма (выращивание)
// Рост идёт сам по времени (Economy.CROPS[].growTime). Клик по растущей грядке — необязательное
// ускорение: тратит воду, как раньше, но не даёт опыта; см. boostPlot()

const FARM_TICK_MS = 1000; // как часто перерисовывать грядки, чтобы обратный отсчёт шёл вживую

const FarmScreen = {
    lastStage: {}, // index -> последняя показанная "культура-стадия", чтобы ловить смену для pop-анимации
    lastUnlockedPlots: null, // предыдущее число открытых грядок — чтобы проиграть анимацию только у новых
    tickTimer: null,

    render() {
        const el = document.getElementById('screen-farm');
        el.innerHTML = `
            <div class="farm-wrap screen-content">
                <div class="farm-grid" id="farmGrid"></div>
                <button id="harvestAllBtn" class="btn">${SvgBasket.render()} Собрать всё</button>
            </div>
        `;
        document.getElementById('harvestAllBtn').addEventListener('click', () => FarmHarvest.harvestAll());

        this.renderGrid();
        this.startTicker();
    },

    // Раз в секунду обновляет обратный отсчёт на растущих грядках, пока открыт экран «Ферма»
    startTicker() {
        if (this.tickTimer) return;
        this.tickTimer = setInterval(() => {
            if (Main.currentScreen === 'farm') this.renderGrid();
        }, FARM_TICK_MS);
    },

    renderGrid() {
        const grid = document.getElementById('farmGrid');
        if (!grid) return;

        const { plots, unlockedPlots } = GameState.data.farm;

        // Грядки, открывшиеся с прошлого рендера, получают анимацию появления
        const previousUnlocked = this.lastUnlockedPlots ?? unlockedPlots;
        this.lastUnlockedPlots = unlockedPlots;

        grid.innerHTML = plots
            .map((plot, index) => this.renderCell(plot, index, index < unlockedPlots, index >= previousUnlocked && index < unlockedPlots))
            .join('');

        grid.querySelectorAll('.farm-cell').forEach((cellEl) => {
            cellEl.addEventListener('click', () => this.onCellClick(Number(cellEl.dataset.index)));
        });

        const readyCount = plots.filter((p) => GameState.isPlotReady(p)).length;
        const harvestBtn = document.getElementById('harvestAllBtn');
        if (harvestBtn) harvestBtn.disabled = readyCount === 0;
    },

    renderCell(plot, index, unlocked, justUnlocked) {
        if (!unlocked) {
            delete this.lastStage[index];
            return `
                <div class="farm-cell locked" data-index="${index}">
                    <span class="lock-icon">🔒</span>
                    <span class="unlock-requirement">Ур. ${Economy.plotUnlockLevel(index)}</span>
                </div>
            `;
        }

        if (!plot) {
            delete this.lastStage[index];
            return `
                <div class="farm-cell plot empty ${justUnlocked ? 'plot-unlocking' : ''}" data-index="${index}">
                    <img src="assets/images/objects/plot-empty.png" alt="Грядка" class="plot-image" loading="lazy">
                </div>
            `;
        }

        const crop = Economy.CROPS[plot.type];
        const ready = GameState.isPlotReady(plot);
        let stage;
        let stateClass;
        let remainingMs = 0;

        if (ready) {
            stage = 3;
            stateClass = 'ready';
        } else {
            // Знаменатель — ТЕКУЩЕЕ (уже сокращённое кликами) окно, а не исходный plot.totalMs,
            // чтобы прогресс-бар корректно скакал вперёд сразу при ускорении, а не только со временем
            const currentWindowMs = Math.max(1, plot.readyAt - plot.plantedAt);
            remainingMs = Math.max(0, plot.readyAt - Date.now());
            const progress = 1 - remainingMs / currentWindowMs;
            stage = progress < 0.5 ? 1 : 2;
            stateClass = 'growing';
        }

        // Плавный pop (scale + fade) только когда стадия реально сменилась
        const stageKey = `${plot.type}-${stage}`;
        const popClass = this.lastStage[index] !== stageKey ? 'plant-pop' : '';
        this.lastStage[index] = stageKey;

        const plantSrc = crop.stageImages[stage - 1];

        return `
            <div class="farm-cell plot stage-${stage} ${stateClass}" data-index="${index}">
                <img src="assets/images/objects/plot-empty.png" alt="Грядка" class="plot-image" loading="lazy">
                <img src="${plantSrc}" alt="${crop.name}" class="plant-image ${popClass}" loading="lazy">
                ${!ready ? `<span class="water-hint">⏳${Economy.formatDuration(remainingMs / 1000)}</span>` : ''}
            </div>
        `;
    },

    onCellClick(index) {
        const state = GameState.data;
        if (index >= state.farm.unlockedPlots) {
            UI.showToast(`Грядка откроется на уровне ${Economy.plotUnlockLevel(index)}`);
            return;
        }

        const plot = state.farm.plots[index];
        if (!plot) {
            this.openSeedPicker(index);
            return;
        }

        if (GameState.isPlotReady(plot)) {
            FarmHarvest.harvestOne(index);
            return;
        }

        this.boostPlot(index);
    },

    // Мини-список семян, которые реально есть в инвентаре — семена покупаются в Магазине (вкладка Рынок)
    openSeedPicker(index) {
        const seeds = GameState.data.seeds;
        const owned = Object.entries(Economy.CROPS).filter(([key]) => seeds[key] > 0);

        if (owned.length === 0) {
            UI.showToast('Нет семян — купите в Магазине 🛒');
            return;
        }

        const optionsHtml = owned
            .map(
                ([key, crop]) => `
                <button class="btn plant-option" data-crop="${key}">
                    <span>${crop.sproutEmoji} ${crop.name}</span>
                    <small>×${seeds[key]} семян · ⏳ ${Economy.formatDuration(crop.growTime)}</small>
                </button>
            `
            )
            .join('');

        const close = UI.openModal(`
            <h3>Что посадить?</h3>
            <div class="plant-menu">${optionsHtml}</div>
        `);

        document.querySelectorAll('.plant-option').forEach((btn) => {
            btn.addEventListener('click', () => {
                Audio_.click();
                this.plantFromSeed(index, btn.dataset.crop);
                close();
            });
        });
    },

    // Сажает семя из инвентаря: время созревания уже учитывает удобрение,
    // дальше растение растёт само по времени — поливать для роста не обязательно
    plantFromSeed(index, cropKey) {
        const state = GameState.data;
        if (!state.seeds[cropKey]) return; // подстраховка от повторного клика по уже закрытой модалке

        const crop = Economy.CROPS[cropKey];
        const fertilizerLevel = state.upgrades.fertilizer;
        const growTimeMs = Math.max(1000, Math.round(crop.growTime * Math.pow(0.9, fertilizerLevel) * 1000));
        const now = Date.now();

        state.seeds[cropKey] -= 1;
        state.farm.plots[index] = {
            type: cropKey,
            plantedAt: now,
            readyAt: now + growTimeMs,
            totalMs: growTimeMs // неизменный «якорь» полного времени созревания — от него считаются % за клики
        };

        this.renderGrid();
    },

    // Необязательное ускорение растущей грядки: тратит фиксированную воду, но не даёт опыта.
    // Каждый клик снимает Economy.BOOST_PERCENT от полного времени созревания (plot.totalMs)
    boostPlot(index) {
        const state = GameState.data;
        const plot = state.farm.plots[index];
        const waterCost = Math.max(0, Economy.BOOST_WATER_COST - state.upgrades.autoWater);

        if (state.water < waterCost) {
            UI.showToast(`Не хватает воды 💧 (нужно ${waterCost})`);
            return;
        }

        state.water -= waterCost;
        plot.readyAt -= Math.round(plot.totalMs * Economy.BOOST_PERCENT);

        Audio_.splash();
        Main.renderHeader();
        this.renderGrid();
    }
};
