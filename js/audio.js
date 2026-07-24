// audio.js — процедурные звуки через Web Audio API (без внешних файлов)

const Audio_ = {
    ctx: null,

    // AudioContext создаётся лениво по первому пользовательскому клику
    // (браузеры блокируют автозапуск звука до жеста пользователя)
    getContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    },

    // Короткий тон с экспоненциальным затуханием громкости
    playTone({ frequency, duration, type = 'sine', volume = 0.2 }) {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    },

    // Лёгкий тактильный клик — для навигации и общих действий
    click() {
        this.playTone({ frequency: 700, duration: 0.06, type: 'square', volume: 0.07 });
    },

    // Плеск воды — колодец и полив грядок
    splash() {
        const ctx = this.getContext();
        const duration = 0.15;

        // Шумовой буфер с затуханием даёт естественный «плеск» лучше, чем чистый тон
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + duration);
    },

    // Звон монет — продажа урожая, покупка апгрейда
    coins() {
        const notes = [880, 1175, 1568];
        notes.forEach((frequency, i) => {
            setTimeout(() => {
                this.playTone({ frequency, duration: 0.12, type: 'triangle', volume: 0.1 });
            }, i * 45);
        });
    },

    // Короткое «дзынь» — момент, когда летящая монета долетает до счётчика
    ding() {
        this.playTone({ frequency: 1760, duration: 0.08, type: 'sine', volume: 0.09 });
    }
};
