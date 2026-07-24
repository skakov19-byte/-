// screens/farmHarvest.js — логика сбора урожая для экрана «Ферма» (вынесено из farm.js)

const HARVEST_SHAKE_MS = 350; // должно совпадать с длительностью анимации .harvest-shake в CSS

const FarmHarvest = {
    // Собирает урожай с одной готовой клетки: считает случайное событие,
    // кладёт урожай в инвентарь и освобождает клетку. Возвращает null, если клетка не готова
    harvestPlot(index) {
        const state = GameState.data;
        const plot = state.farm.plots[index];
        if (!plot || !plot.ready) return null;

        const crop = Economy.CROPS[plot.type];
        let amount = crop.yieldAmount;
        let event = null;

        const roll = Math.random();
        if (roll < Economy.HARVEST_EVENT_CHANCE / 2) {
            amount = Math.round(amount * Economy.GOLDEN_MULTIPLIER);
            event = 'golden';
        } else if (roll < Economy.HARVEST_EVENT_CHANCE) {
            amount = Math.max(0, Math.round(amount * Economy.PEST_MULTIPLIER));
            event = 'pest';
        }

        state.inventory[plot.type] = (state.inventory[plot.type] || 0) + amount;
        state.farm.plots[index] = null;

        return { type: plot.type, amount, event };
    },

    // Запускает встряску клетки и падение плода, возвращает центр клетки для частиц/текста
    playHarvestFx(index) {
        const cellEl = document.querySelector(`.farm-cell[data-index="${index}"]`);
        if (!cellEl) return null;

        const plot = GameState.data.farm.plots[index];
        const crop = Economy.CROPS[plot.type];
        const rect = cellEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        cellEl.classList.add('harvest-shake');
        Particles.fruitDrop(centerX, centerY, crop.readyEmoji);

        return { centerX, centerY };
    },

    // Сбор урожая кликом по одной готовой клетке — сначала встряска, затем сама уборка
    harvestOne(index) {
        const plot = GameState.data.farm.plots[index];
        if (!plot || !plot.ready) return;

        Audio_.click();
        const fx = this.playHarvestFx(index);

        setTimeout(() => {
            const result = this.harvestPlot(index);
            if (!result) return;

            if (fx) {
                const crop = Economy.CROPS[result.type];
                UI.showFloatingText(`+${result.amount} ${crop.readyEmoji}`, fx.centerX, fx.centerY, '#F9A825');
            }

            if (result.event === 'golden') UI.showToast('✨ Золотой урожай!');
            if (result.event === 'pest') UI.showToast('🐛 Вредители подпортили урожай');

            FarmScreen.renderGrid();
        }, HARVEST_SHAKE_MS);
    },

    // Собирает урожай со всех готовых клеток разом — сначала встряска у каждой, потом сбор
    harvestAll() {
        const readyIndexes = GameState.data.farm.plots
            .map((plot, index) => (plot && plot.ready ? index : -1))
            .filter((index) => index !== -1);

        if (readyIndexes.length === 0) {
            UI.showToast('Нечего собирать — растения ещё не готовы');
            return;
        }

        Audio_.click();
        readyIndexes.forEach((index) => this.playHarvestFx(index));

        setTimeout(() => {
            const totals = {};
            let goldenCount = 0;
            let pestsCount = 0;

            readyIndexes.forEach((index) => {
                const result = this.harvestPlot(index);
                if (!result) return;
                totals[result.type] = (totals[result.type] || 0) + result.amount;
                if (result.event === 'golden') goldenCount++;
                if (result.event === 'pest') pestsCount++;
            });

            const summary = Object.entries(totals)
                .map(([key, amount]) => `+${amount} ${Economy.CROPS[key].readyEmoji}`)
                .join('  ');
            UI.showToast(`Собрано: ${summary}`);
            if (goldenCount > 0) UI.showToast(`✨ Золотой урожай! (x${goldenCount})`);
            if (pestsCount > 0) UI.showToast(`🐛 Вредители попортили урожай (x${pestsCount})`);

            FarmScreen.renderGrid();
        }, HARVEST_SHAKE_MS);
    }
};
