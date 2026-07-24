// screens/well.js — Экран 1: Колодец (добыча воды)

const WellScreen = {
    render() {
        const el = document.getElementById('screen-well');
        el.innerHTML = `
            <div class="well-wrap screen-content">
                <div class="bucket-indicator">
                    <span class="bucket-icon">💧</span>
                    <span id="bucketValue">0 / 10</span>
                </div>

                <div id="wellBtn" class="well-container" role="button" tabindex="0" aria-label="Набрать воду">
                    <img src="assets/images/objects/well.png" alt="Колодец" class="well-image" loading="lazy">
                </div>

                <p class="well-hint">Нажимай на колодец, чтобы набрать воду</p>

                <div class="well-actions">
                    <button id="pourBtn" class="btn btn-earth">Вылить в бочку 🛢️</button>
                    <button id="goFarmBtn" class="btn">Перейти на ферму 🌱</button>
                </div>
            </div>
        `;
        this.bind();
        this.updateBucketDisplay();
    },

    bind() {
        document.getElementById('wellBtn').addEventListener('click', (e) => this.onWellClick(e));
        document.getElementById('pourBtn').addEventListener('click', () => this.onPour());
        document.getElementById('goFarmBtn').addEventListener('click', () => Main.showScreen('farm'));
    },

    // Клик по колодцу: набирает воду в тару с учётом уровня насоса
    onWellClick() {
        const state = GameState.data;
        const pumpPower = state.upgrades.pump;
        const before = state.well.bucket;
        state.well.bucket = Math.min(state.well.bucketMax, before + pumpPower);
        const gained = state.well.bucket - before;

        this.playSplashAnim();
        Audio_.splash();

        const btn = document.getElementById('wellBtn');
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        Particles.waterSplash(centerX, centerY);

        if (gained > 0) {
            UI.showFloatingText(`+${gained} 💧`, centerX, rect.top, '#0288D1');
        } else {
            UI.showToast('Тара полна! Вылей воду в бочку 🛢️');
        }

        this.updateBucketDisplay();
    },

    // Переносит воду из тары в общий запас (бочку)
    onPour() {
        const state = GameState.data;
        if (state.well.bucket <= 0) {
            UI.showToast('В таре нет воды');
            return;
        }
        state.water += state.well.bucket;
        UI.showToast(`+${state.well.bucket} 💧 перелито в общий запас`);
        state.well.bucket = 0;

        this.updateBucketDisplay();
        Main.renderHeader();
    },

    playSplashAnim() {
        const btn = document.getElementById('wellBtn');
        btn.classList.remove('active');
        void btn.offsetWidth; // сброс анимации, чтобы она могла запуститься повторно
        btn.classList.add('active');
    },

    updateBucketDisplay() {
        const { bucket, bucketMax } = GameState.data.well;
        const valueEl = document.getElementById('bucketValue');
        if (valueEl) valueEl.textContent = `${bucket} / ${bucketMax}`;

        const pourBtn = document.getElementById('pourBtn');
        if (pourBtn) pourBtn.disabled = bucket <= 0;
    }
};
