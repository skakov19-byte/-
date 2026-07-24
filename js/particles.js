// particles.js — частицы для визуальной "сочности": брызги воды, монеты, падающие плоды

const MAX_PARTICLES = 50;

const Particles = {
    activeCount: 0,
    layer: null,

    getLayer() {
        if (!this.layer) this.layer = document.getElementById('particleLayer');
        return this.layer;
    },

    // Общий лимит одновременных частиц — бережём FPS
    spawn(el) {
        if (this.activeCount >= MAX_PARTICLES) return false;
        this.getLayer().appendChild(el);
        this.activeCount++;
        return true;
    },

    release(el) {
        el.remove();
        this.activeCount--;
    },

    // Брызги воды от точки клика по колодцу — разлетаются в случайных направлениях
    waterSplash(x, y) {
        const count = 5 + Math.floor(Math.random() * 6); // 5-10

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 24 + Math.random() * 36;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 18; // лёгкий уклон вверх

            const drop = document.createElement('div');
            drop.className = 'particle particle-water';
            drop.style.left = x + 'px';
            drop.style.top = y + 'px';
            drop.style.setProperty('--dx', dx + 'px');
            drop.style.setProperty('--dy', dy + 'px');

            if (!this.spawn(drop)) continue;
            setTimeout(() => this.release(drop), 500);
        }
    },

    // Плод, падающий вниз и исчезающий — при сборе урожая
    fruitDrop(x, y, emoji) {
        const el = document.createElement('div');
        el.className = 'particle particle-fruit';
        el.textContent = emoji;
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        if (!this.spawn(el)) return;
        setTimeout(() => this.release(el), 500);
    },

    // Золотые монеты летят от источника (кнопки продажи) к счётчику в шапке по параболе
    coinBurst(fromEl, count) {
        const targetEl = document.getElementById('coinsStat');
        if (!fromEl || !targetEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = targetEl.getBoundingClientRect();
        const startX = fromRect.left + fromRect.width / 2;
        const startY = fromRect.top + fromRect.height / 2;
        const endX = toRect.left + toRect.width / 2;
        const endY = toRect.top + toRect.height / 2;

        const total = Math.min(count, 15);
        for (let i = 0; i < total; i++) {
            const isLast = i === total - 1;
            setTimeout(() => this.flyCoin(startX, startY, endX, endY, isLast), i * 30);
        }
    },

    flyCoin(startX, startY, endX, endY, playDing) {
        const coin = document.createElement('div');
        coin.className = 'particle particle-coin';
        coin.innerHTML = '<img src="assets/images/objects/coin.png" alt="" class="coin-icon-inline">';

        // изгиб параболы: контрольная точка выше и чуть в сторону от прямой линии
        const midX = (startX + endX) / 2 + (Math.random() * 50 - 25);
        const midY = Math.min(startY, endY) - 50 - Math.random() * 30;
        coin.style.offsetPath = `path('M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}')`;

        if (!this.spawn(coin)) return;

        let arrived = false;
        const onArrive = () => {
            if (arrived) return; // защита от двойного срабатывания (animationend + подстраховка)
            arrived = true;
            clearTimeout(fallbackId);
            this.release(coin);
            if (playDing) Audio_.ding();
        };
        coin.addEventListener('animationend', onArrive, { once: true });
        // подстраховка на случай, если animationend не сработает (например, экран сменился)
        const fallbackId = setTimeout(onArrive, 650);
    }
};
