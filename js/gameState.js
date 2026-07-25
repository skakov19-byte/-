// gameState.js — состояние игры: структура данных, сохранение и загрузка в localStorage

const SAVE_KEY = 'happyFarmSave';
const AUTOSAVE_INTERVAL_MS = 10000;

// Создаёт свежее стартовое состояние новой игры
function createDefaultState() {
    return {
        coins: 0,
        water: 0, // общий запас воды в бочке — тратится на полив грядок
        playerLevel: 1,
        totalXP: 0,
        well: {
            bucket: 0, // текущая вода в таре у колодца
            bucketMax: Economy.START_BUCKET_MAX
        },
        farm: {
            unlockedPlots: Economy.START_PLOTS,
            // null — пустая клетка, иначе { type, plantedAt, readyAt, totalMs }.
            // Готовность — Date.now() >= readyAt (см. GameState.isPlotReady); totalMs — исходное время
            // созревания (фиксируется при посадке), клики ускорения сдвигают readyAt раньше
            plots: new Array(Economy.MAX_PLOTS).fill(null)
        },
        inventory: Object.fromEntries(Object.keys(Economy.CROPS).map((key) => [key, 0])),
        // Купленные в Магазине семена — тратятся по одному при посадке на грядку
        seeds: Object.fromEntries(Object.keys(Economy.CROPS).map((key) => [key, 0])),
        market: {
            prices: Object.fromEntries(Object.entries(Economy.CROPS).map(([key, crop]) => [key, crop.sellPrice])),
            lastPriceUpdate: Date.now()
        },
        upgrades: {
            pump: Economy.START_PUMP_LEVEL,
            container: 0,
            fertilizer: 0,
            autoWater: 0
        },
        lastSaveTime: Date.now()
    };
}

// Дополняет загруженное сохранение полями из дефолта, которых в нём ещё нет
// (защита от поломки старых сохранений при добавлении новых полей на будущих шагах)
function mergeDefaults(target, defaults) {
    for (const key in defaults) {
        const defaultValue = defaults[key];
        if (target[key] === undefined) {
            target[key] = defaultValue;
        } else if (
            typeof defaultValue === 'object' &&
            defaultValue !== null &&
            !Array.isArray(defaultValue)
        ) {
            target[key] = mergeDefaults(target[key] || {}, defaultValue);
        }
    }
    return target;
}

const GameState = {
    data: null,
    autosaveTimer: null,

    // Загружает сохранение (или создаёт новое) и запускает автосейв
    init() {
        this.data = this.load() || createDefaultState();
        this.recalcDerived();
        this.startAutosave();
        window.addEventListener('beforeunload', () => this.save());
    },

    // Пересчитывает производные значения (макс. тары, кол-во грядок).
    // Грядки открываются уровнем игрока (Economy.PLOT_UNLOCK_LEVELS); Math.max — подстраховка от старых
    // сохранений, где грядки были куплены за монеты ещё до перехода на систему уровней — никогда не отнимаем
    recalcDerived() {
        this.data.well.bucketMax = Economy.START_BUCKET_MAX + 10 * this.data.upgrades.container;
        this.data.farm.unlockedPlots = Math.max(
            this.data.farm.unlockedPlots,
            Economy.plotsForLevel(this.data.playerLevel)
        );

        // На случай старых сохранений: если MAX_PLOTS увеличили после релиза,
        // молча дополняем массив пустыми клетками (никогда не обрезаем — не теряем посаженное)
        while (this.data.farm.plots.length < Economy.MAX_PLOTS) {
            this.data.farm.plots.push(null);
        }
    },

    // Читает сохранение из localStorage. Возвращает null, если сохранения нет или оно повреждено
    load() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return mergeDefaults(parsed, createDefaultState());
        } catch (e) {
            console.error('Сохранение повреждено, начинаю новую игру', e);
            return null;
        }
    },

    save() {
        this.data.lastSaveTime = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    },

    // Готовность грядки считается по времени (plot.readyAt), а не по сохранённому флагу —
    // поэтому офлайн-рост работает «бесплатно»: реальное время само подводит растение к готовности
    isPlotReady(plot) {
        return !!plot && Date.now() >= plot.readyAt;
    },

    // Начисляет опыт и пересчитывает уровень игрока.
    // Возвращает { leveledUp, newLevel } — вызывающий код решает, показывать ли уведомление
    gainXP(amount) {
        this.data.totalXP += amount;
        const newLevel = Economy.levelForXP(this.data.totalXP);

        if (newLevel > this.data.playerLevel) {
            this.data.playerLevel = newLevel;
            this.recalcDerived(); // сразу открываем новые грядки, если уровень их даёт
            return { leveledUp: true, newLevel };
        }
        return { leveledUp: false };
    },

    // Полный сброс прогресса (для отладки)
    reset() {
        localStorage.removeItem(SAVE_KEY);
        this.data = createDefaultState();
    },

    startAutosave() {
        if (this.autosaveTimer) clearInterval(this.autosaveTimer);
        this.autosaveTimer = setInterval(() => this.save(), AUTOSAVE_INTERVAL_MS);
    }
};
