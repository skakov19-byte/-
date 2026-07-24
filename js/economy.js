// economy.js — константы и формулы экономики: культуры, апгрейды, цены

const Economy = {
    // Стартовые условия игрока (см. Промт → «Стартовые условия»)
    START_BUCKET_MAX: 10,
    START_PLOTS: 3,
    MAX_PLOTS: 12,
    START_PUMP_LEVEL: 1,

    // Культуры: рост теперь не по таймеру, а по кликам полива.
    // clicksToGrow — сколько раз нужно полить, чтобы созрело; waterCost — вода за ОДИН клик полива.
    // Оба числа выведены из исходного баланса: clicksToGrow = round(старый growTime / 10),
    // waterCost — прежняя разовая стоимость полива, теперь применяется на каждый клик.
    CROPS: {
        carrot: {
            name: 'Морковь', clicksToGrow: 3, waterCost: 2, yieldAmount: 3, sellPrice: 3,
            sproutEmoji: '🌱', readyEmoji: '🥕', readyImage: 'assets/images/plants/carrot-ready.png'
        },
        wheat: {
            name: 'Пшеница', clicksToGrow: 6, waterCost: 3, yieldAmount: 5, sellPrice: 2,
            sproutEmoji: '🌱', readyEmoji: '🌾', readyImage: 'assets/images/plants/wheat-ready.png'
        },
        apple: {
            name: 'Яблоня', clicksToGrow: 12, waterCost: 10, yieldAmount: 10, sellPrice: 5,
            sproutEmoji: '🌱', readyEmoji: '🍎', readyImage: 'assets/images/plants/apple-tree-ready.png'
        }
    },

    // Случайные события при сборе урожая
    HARVEST_EVENT_CHANCE: 0.10, // суммарный шанс срабатывания события (делится поровну между золотым урожаем и вредителями)
    GOLDEN_MULTIPLIER: 2,
    PEST_MULTIPLIER: 0.7,

    // Апгрейды: базовая цена и множитель на уровень (цена = база * 1.15^уровень)
    UPGRADES: {
        pump: { name: 'Насос', image: 'assets/images/upgrades/pump.png', base: 10, description: '+1 воды за клик' },
        container: { name: 'Тара', image: 'assets/images/upgrades/barrel.png', base: 25, description: '+10 к макс. объёму тары' },
        fertilizer: { name: 'Удобрение', image: 'assets/images/upgrades/fertilizer.png', base: 50, description: '-10% кликов до созревания (мин. 1)' },
        plot: { name: 'Грядка', image: 'assets/images/objects/plot-empty.png', base: 100, description: '+1 клетка на ферме' },
        autoWater: { name: 'Авто-полив', image: 'assets/images/upgrades/watering-can.png', base: 500, description: '-1 воды на полив (мин. 1)' }
    },

    UPGRADE_GROWTH_RATE: 1.15,

    // Стоимость апгрейда на заданном уровне
    upgradeCost(upgradeKey, level) {
        const base = this.UPGRADES[upgradeKey].base;
        return Math.round(base * Math.pow(this.UPGRADE_GROWTH_RATE, level));
    }
};
