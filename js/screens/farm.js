// screens/farm.js — Экран 2: Ферма (выращивание)
// Рост управляется кликами полива, а не таймером: см. формулу в economy.js (Economy.CROPS)

const FarmScreen = {
    lastStage: {}, // index -> последняя показанная "культура-стадия", чтобы ловить смену для pop-анимации

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
    },

    renderGrid() {
        const grid = document.getElementById('farmGrid');
        if (!grid) return;

        const { plots, unlockedPlots } = GameState.data.farm;
        grid.innerHTML = plots
            .map((plot, index) => this.renderCell(plot, index, index < unlockedPlots))
            .join('');

        grid.querySelectorAll('.farm-cell').forEach((cellEl) => {
            cellEl.addEventListener('click', () => this.onCellClick(Number(cellEl.dataset.index)));
        });

        const readyCount = plots.filter((p) => p && p.ready).length;
        const harvestBtn = document.getElementById('harvestAllBtn');
        if (harvestBtn) harvestBtn.disabled = readyCount === 0;
    },

    renderCell(plot, index, unlocked) {
        if (!unlocked) {
            delete this.lastStage[index];
            return `<div class="farm-cell locked" data-index="${index}"><span class="lock-icon">🔒</span></div>`;
        }

        if (!plot) {
            delete this.lastStage[index];
            return `
                <div class="farm-cell plot empty" data-index="${index}">
                    <img src="assets/images/objects/plot-empty.png" alt="Грядка" class="plot-image" loading="lazy">
                </div>
            `;
        }

        const crop = Economy.CROPS[plot.type];
        let stage;
        let stateClass;

        if (plot.ready) {
            stage = 3;
            stateClass = 'ready';
        } else {
            const progress = plot.clicksGiven / plot.clicksNeeded;
            stage = progress < 0.5 ? 1 : 2;
            stateClass = plot.clicksGiven === 0 ? 'needs-water' : 'growing';
        }

        // Плавный pop (scale + fade) только когда стадия реально сменилась
        const stageKey = `${plot.type}-${stage}`;
        const popClass = this.lastStage[index] !== stageKey ? 'plant-pop' : '';
        this.lastStage[index] = stageKey;

        const plantSrc = stage === 3 ? crop.readyImage : 'assets/images/plants/seedling.png';

        return `
            <div class="farm-cell plot stage-${stage} ${stateClass}" data-index="${index}">
                <img src="assets/images/objects/plot-empty.png" alt="Грядка" class="plot-image" loading="lazy">
                <img src="${plantSrc}" alt="${crop.name}" class="plant-image ${popClass}" loading="lazy">
                ${!plot.ready ? `<span class="water-hint">${plot.clicksGiven}/${plot.clicksNeeded} 💧</span>` : ''}
            </div>
        `;
    },

    onCellClick(index) {
        const state = GameState.data;
        if (index >= state.farm.unlockedPlots) return;

        const plot = state.farm.plots[index];
        if (!plot) {
            this.openPlantMenu(index);
            return;
        }

        if (plot.ready) {
            FarmHarvest.harvestOne(index);
            return;
        }

        this.waterPlot(index);
    },

    openPlantMenu(index) {
        const optionsHtml = Object.entries(Economy.CROPS)
            .map(
                ([key, crop]) => `
                <button class="btn plant-option" data-crop="${key}">
                    <span>${crop.sproutEmoji} ${crop.name}</span>
                    <small>${crop.clicksToGrow} поливов · ${crop.waterCost} 💧/полив · урожай ${crop.yieldAmount} шт</small>
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
                this.plant(index, btn.dataset.crop);
                close();
            });
        });
    },

    // Сажает выбранную культуру в клетку (число кликов до роста уже учитывает удобрение)
    plant(index, cropKey) {
        const state = GameState.data;
        const crop = Economy.CROPS[cropKey];
        const fertilizerLevel = state.upgrades.fertilizer;
        const clicksNeeded = Math.max(1, Math.round(crop.clicksToGrow * Math.pow(0.9, fertilizerLevel)));

        state.farm.plots[index] = {
            type: cropKey,
            clicksGiven: 0,
            clicksNeeded,
            ready: false
        };

        this.renderGrid();
    },

    // Один клик полива: тратит воду и продвигает рост на 1 клик из clicksNeeded
    waterPlot(index) {
        const state = GameState.data;
        const plot = state.farm.plots[index];
        const crop = Economy.CROPS[plot.type];
        const waterCost = Math.max(1, crop.waterCost - state.upgrades.autoWater);

        if (state.water < waterCost) {
            UI.showToast(`Не хватает воды 💧 (нужно ${waterCost})`);
            return;
        }

        state.water -= waterCost;
        plot.clicksGiven += 1;
        if (plot.clicksGiven >= plot.clicksNeeded) {
            plot.ready = true;
        }

        Audio_.splash();
        Main.renderHeader();
        this.renderGrid();
    }
};
