// gameState.js — состояние игры: структура данных, сохранение и загрузка в localStorage

const SAVE_KEY = 'happyFarmSave';
const AUTOSAVE_INTERVAL_MS = 10000;

// Создаёт свежее стартовое состояние новой игры
function createDefaultState() {
    return {
        coins: 0,
        water: 0, // общий запас воды в бочке — тратится на полив грядок
        well: {
            bucket: 0, // текущая вода в таре у колодца
            bucketMax: Economy.START_BUCKET_MAX
        },
        farm: {
            unlockedPlots: Economy.START_PLOTS,
            // null — пустая клетка, иначе { type, clicksGiven, clicksNeeded, ready }
            plots: new Array(Economy.MAX_PLOTS).fill(null)
        },
        inventory: {
            carrot: 0,
            wheat: 0,
            apple: 0
        },
        market: {
            prices: {
                carrot: Economy.CROPS.carrot.sellPrice,
                wheat: Economy.CROPS.wheat.sellPrice,
                apple: Economy.CROPS.apple.sellPrice
            },
            lastPriceUpdate: Date.now()
        },
        upgrades: {
            pump: Economy.START_PUMP_LEVEL,
            container: 0,
            fertilizer: 0,
            plot: 0,
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

    // Пересчитывает производные от апгрейдов значения (макс. тары, кол-во грядок).
    // Уровни апгрейдов — источник истины; этот метод синхронизирует с ними кэш в state
    recalcDerived() {
        this.data.well.bucketMax = Economy.START_BUCKET_MAX + 10 * this.data.upgrades.container;
        this.data.farm.unlockedPlots = Math.min(
            Economy.MAX_PLOTS,
            Economy.START_PLOTS + this.data.upgrades.plot
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
