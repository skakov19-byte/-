// economy.js — константы и формулы экономики: культуры, апгрейды, цены

const Economy = {
    // Стартовые условия игрока (см. Промт → «Стартовые условия»)
    START_BUCKET_MAX: 10,
    START_PLOTS: 1,
    MAX_PLOTS: 9,
    START_PUMP_LEVEL: 1,

    // Грядки открываются уровнем игрока, а не покупкой за монеты: индекс i → уровень,
    // на котором становится доступна (i+1)-я грядка (см. таблицу баланса в promt6.md)
    PLOT_UNLOCK_LEVELS: [1, 2, 3, 5, 7, 9, 11, 13, 14],

    // Сколько грядок открыто на данном уровне игрока
    plotsForLevel(level) {
        return this.PLOT_UNLOCK_LEVELS.filter((lvl) => level >= lvl).length;
    },

    // Уровень, на котором откроется грядка с данным индексом (0-based)
    plotUnlockLevel(plotIndex) {
        return this.PLOT_UNLOCK_LEVELS[plotIndex] ?? Infinity;
    },

    // Культуры растут сами по времени (growTime, в секундах, с учётом удобрения — см. farm.js).
    // Клик по растущей грядке — необязательное ускорение (одинаковое для всех культур, см.
    // BOOST_WATER_COST/BOOST_PERCENT ниже): тратит воду, но опыта не даёт.
    // unlockLevel — уровень игрока, на котором семя появляется в Магазине (см. LEVEL_THRESHOLDS).
    // seedCost — цена одного семени в Магазине; xpYield — опыт за один сбор урожая с этой культуры.
    // seedCost растёт строго по редкости (в порядке unlockLevel) и подобран вместе с yieldAmount
    // так, чтобы продажа урожая ВСЕГДА была в плюс — даже в худшем случае: минимальная цена
    // на рынке (sellPrice * (1 - PRICE_VARIANCE), см. market.js) СОВПАВШая с событием
    // «вредители» (yieldAmount * PEST_MULTIPLIER, см. ниже). Если меняете yieldAmount/sellPrice —
    // пересчитайте seedCost так, чтобы это условие и порядок по редкости не сломались.
    CROPS: {
        carrot: {
            name: 'Морковь', growTime: 30, yieldAmount: 4, sellPrice: 3,
            unlockLevel: 1, seedCost: 3, xpYield: 2,
            sproutEmoji: '🌱', readyEmoji: '🥕',
            stageImages: [
                'assets/images/plants/carrot/stage-1.png',
                'assets/images/plants/carrot/stage-2.png',
                'assets/images/plants/carrot/stage-3.png'
            ],
            readyImage: 'assets/images/plants/carrot/stage-3.png'
        },
        wheat: {
            name: 'Пшеница', growTime: 60, yieldAmount: 7, sellPrice: 2,
            unlockLevel: 3, seedCost: 4, xpYield: 3,
            sproutEmoji: '🌱', readyEmoji: '🌾',
            stageImages: [
                'assets/images/plants/wheat/stage-1.png',
                'assets/images/plants/wheat/stage-2.png',
                'assets/images/plants/wheat/stage-3.png'
            ],
            readyImage: 'assets/images/plants/wheat/stage-3.png'
        },
        apple: {
            name: 'Яблоня', growTime: 120, yieldAmount: 12, sellPrice: 5,
            unlockLevel: 5, seedCost: 7, xpYield: 6,
            sproutEmoji: '🌱', readyEmoji: '🍎',
            stageImages: [
                'assets/images/plants/apple-tree/stage-1.png',
                'assets/images/plants/apple-tree/stage-2.png',
                'assets/images/plants/apple-tree/stage-3.png'
            ],
            readyImage: 'assets/images/plants/apple-tree/stage-3.png'
        },
        cucumber: {
            name: 'Огурец', growTime: 60, yieldAmount: 6, sellPrice: 4,
            unlockLevel: 7, seedCost: 10, xpYield: 5,
            sproutEmoji: '🌱', readyEmoji: '🥒',
            stageImages: [
                'assets/images/plants/cucumber/stage-1.png',
                'assets/images/plants/cucumber/stage-2.png',
                'assets/images/plants/cucumber/stage-3.png'
            ],
            readyImage: 'assets/images/plants/cucumber/stage-3.png'
        },
        tomato: {
            name: 'Помидор', growTime: 90, yieldAmount: 5, sellPrice: 6,
            unlockLevel: 9, seedCost: 13, xpYield: 8,
            sproutEmoji: '🌱', readyEmoji: '🍅',
            stageImages: [
                'assets/images/plants/tomato/stage-1.png',
                'assets/images/plants/tomato/stage-2.png',
                'assets/images/plants/tomato/stage-3.png'
            ],
            readyImage: 'assets/images/plants/tomato/stage-3.png'
        },
        pear: {
            name: 'Груша', growTime: 240, yieldAmount: 8, sellPrice: 5,
            unlockLevel: 11, seedCost: 19, xpYield: 15,
            sproutEmoji: '🌱', readyEmoji: '🍐',
            stageImages: [
                'assets/images/plants/pear/stage-1.png',
                'assets/images/plants/pear/stage-2.png',
                'assets/images/plants/pear/stage-3.png'
            ],
            readyImage: 'assets/images/plants/pear/stage-3.png'
        },
        watermelon: {
            name: 'Арбуз', growTime: 480, yieldAmount: 4, sellPrice: 25,
            unlockLevel: 13, seedCost: 35, xpYield: 30,
            sproutEmoji: '🌱', readyEmoji: '🍉',
            stageImages: [
                'assets/images/plants/watermelon/stage-1.png',
                'assets/images/plants/watermelon/stage-2.png',
                'assets/images/plants/watermelon/stage-3.png'
            ],
            readyImage: 'assets/images/plants/watermelon/stage-3.png'
        },
        pumpkin: {
            name: 'Тыква', growTime: 720, yieldAmount: 3, sellPrice: 40,
            unlockLevel: 14, seedCost: 48, xpYield: 45,
            sproutEmoji: '🌱', readyEmoji: '🎃',
            stageImages: [
                'assets/images/plants/pumpkin/stage-1.png',
                'assets/images/plants/pumpkin/stage-2.png',
                'assets/images/plants/pumpkin/stage-3.png'
            ],
            readyImage: 'assets/images/plants/pumpkin/stage-3.png'
        }
    },

    // Пороги суммарного опыта для уровней 1..15: XP_на_уровень = 150 * (level-1)^2, накопительно.
    // ~17 часов активной игры до максимума при среднем темпе ~150 XP/мин
    LEVEL_THRESHOLDS: [0, 150, 750, 2100, 4500, 8250, 13650, 21000, 30600, 42750, 57750, 75900, 97500, 122850, 152250],

    // Уровень игрока по накопленному опыту
    levelForXP(xp) {
        for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= this.LEVEL_THRESHOLDS[i]) return i + 1;
        }
        return 1;
    },

    // Уровни, на которых открывается конкретный (некоммерческий) апгрейд — для текста в уведомлении о новом уровне.
    // Насос и удобрение можно качать бесконечно за монеты и без этого гейта — эти три отмечают начало доступности.
    UPGRADE_UNLOCK_LEVELS: {
        container: 4,
        autoWater: 6,
        fertilizer: 8
    },

    // Всё, что открывается именно на этом уровне (растения, грядка, апгрейд) — для уведомления о новом уровне
    unlocksForLevel(level) {
        const unlocks = [];

        Object.values(this.CROPS).forEach((crop) => {
            if (crop.unlockLevel === level) {
                unlocks.push({ type: 'plant', label: crop.name, emoji: crop.readyEmoji });
            }
        });

        const plotIndex = this.PLOT_UNLOCK_LEVELS.indexOf(level);
        if (plotIndex !== -1 && plotIndex > 0) { // индекс 0 — стартовая грядка, это не «разблокировка»
            unlocks.push({ type: 'plot', label: `Грядка №${plotIndex + 1}`, emoji: '🟫' });
        }

        Object.entries(this.UPGRADE_UNLOCK_LEVELS).forEach(([key, lvl]) => {
            if (lvl === level) {
                unlocks.push({ type: 'upgrade', label: this.UPGRADES[key].name, emoji: '🛠️' });
            }
        });

        return unlocks;
    },

    // Случайные события при сборе урожая
    HARVEST_EVENT_CHANCE: 0.10, // суммарный шанс срабатывания события (делится поровну между золотым урожаем и вредителями)
    GOLDEN_MULTIPLIER: 2,
    PEST_MULTIPLIER: 0.7,

    // Клик по растущей грядке: тратит фиксированную (не зависящую от культуры) стоимость воды
    // и снимает BOOST_PERCENT от полного времени созревания этой культуры (см. FarmScreen.boostPlot)
    BOOST_WATER_COST: 1,
    BOOST_PERCENT: 0.01,

    // Человекочитаемая длительность в секундах: "45с" или "2м 5с"
    formatDuration(totalSeconds) {
        const seconds = Math.max(0, Math.ceil(totalSeconds));
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s}с`;
        return s === 0 ? `${m}м` : `${m}м ${s}с`;
    },

    // Апгрейды: базовая цена и множитель на уровень (цена = база * 1.15^уровень).
    // Грядки больше не покупаются за монеты — их количество зависит только от уровня игрока (см. PLOT_UNLOCK_LEVELS)
    UPGRADES: {
        pump: { name: 'Насос', image: 'assets/images/upgrades/pump.png', base: 10, description: '+1 воды за клик' },
        container: { name: 'Тара', image: 'assets/images/upgrades/barrel.png', base: 25, description: '+10 к макс. объёму тары' },
        fertilizer: { name: 'Удобрение', image: 'assets/images/upgrades/fertilizer.png', base: 50, description: '-10% времени созревания (мин. 1с)' },
        autoWater: { name: 'Авто-полив', image: 'assets/images/upgrades/watering-can.png', base: 500, description: '-1 воды за клик ускорения (мин. 0)' }
    },

    UPGRADE_GROWTH_RATE: 1.15,

    // Стоимость апгрейда на заданном уровне
    upgradeCost(upgradeKey, level) {
        const base = this.UPGRADES[upgradeKey].base;
        return Math.round(base * Math.pow(this.UPGRADE_GROWTH_RATE, level));
    }
};
